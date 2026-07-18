from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pandas as pd
from app.models.study_log import StudyLog
from app.models.marksheet import MarksheetRecord

class TimeAnalyzerService:

    def get_advanced_time_analytics(self, user_id: int, db: Session) -> Dict[str, Any]:
        logs = db.query(StudyLog).filter(StudyLog.user_id == user_id).all()

        if not logs:
            # Even with no logs, still check alignment alerts against marksheet
            alignment_alerts = self._check_time_alignment_with_needs(user_id, {}, db)
            empty = self._generate_empty_state_payload()
            empty["alignment_alerts"] = alignment_alerts
            return empty

        df = pd.DataFrame([{
            "subject": log.subject_name,
            "topic": log.topic_name,
            "duration": log.duration_minutes,
            "day": log.day_of_week,
            "hour": log.hour_of_day,
            "date": log.start_time
        } for log in logs])

        total_time_minutes = float(df["duration"].sum())

        subject_groups = df.groupby("subject")["duration"].sum().to_dict()
        topic_groups = df.groupby(["subject", "topic"])["duration"].sum().reset_index()
        topic_breakdown = [
            {
                "subject": row["subject"],
                "topic": row["topic"],
                "total_minutes": float(row["duration"]),
                "percentage_of_total": round((row["duration"] / total_time_minutes) * 100, 2)
            }
            for _, row in topic_groups.iterrows()
        ]

        df["time_slot"] = df["hour"].apply(self._bucket_hour_to_slot)
        slot_counts = df.groupby("time_slot")["duration"].sum()
        preferred_slots = {
            slot: float(slot_counts.get(slot, 0.0))
            for slot in ["Morning", "Afternoon", "Evening", "Night"]
        }
        peak_slot = max(preferred_slots, key=preferred_slots.get) if total_time_minutes > 0 else "None"

        today = datetime.utcnow().date()
        past_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        df["date_only"] = df["date"].apply(
            lambda x: x.date() if isinstance(x, datetime) else pd.to_datetime(x).date()
        )

        weekly_chart = []
        for d in past_7_days:
            day_mask = df["date_only"] == d
            daily_minutes = float(df[day_mask]["duration"].sum()) if day_mask.any() else 0.0
            weekly_chart.append({
                "date": d.strftime("%A (%b %d)"),
                "hours": round(daily_minutes / 60, 2)
            })

        alignment_alerts = self._check_time_alignment_with_needs(user_id, subject_groups, db)

        return {
            "summary": {
                "total_study_time_hours": round(total_time_minutes / 60, 2),
                "active_days_tracked": int(df["date_only"].nunique()),
                "peak_productivity_slot": peak_slot
            },
            "preferred_study_slots": preferred_slots,
            "weekly_timeline_chart": weekly_chart,
            "subject_time_distribution": {k: round(v / 60, 2) for k, v in subject_groups.items()},
            "topic_granular_breakdown": sorted(topic_breakdown, key=lambda x: x["total_minutes"], reverse=True),
            "alignment_alerts": alignment_alerts
        }

    def _bucket_hour_to_slot(self, hour: int) -> str:
        if 5 <= hour < 12:
            return "Morning"
        elif 12 <= hour < 17:
            return "Afternoon"
        elif 17 <= hour < 21:
            return "Evening"
        else:
            return "Night"

    def _check_time_alignment_with_needs(
        self, user_id: int, subject_hours: Dict[str, float], db: Session
    ) -> List[Dict[str, Any]]:
        alerts = []

        # Get DISTINCT subject names only — one alert per subject, not per DB row
        raw_records = db.query(MarksheetRecord).filter(
            MarksheetRecord.user_id == user_id
        ).all()

        # Deduplicate: keep worst status per subject name
        subject_status: Dict[str, Dict] = {}
        for rec in raw_records:
            name = rec.subject_name
            if name not in subject_status:
                subject_status[name] = {"is_failed": rec.is_failed, "needs_focus": rec.needs_focus}
            else:
                # Escalate severity if a worse record exists
                if rec.is_failed:
                    subject_status[name]["is_failed"] = True
                if rec.needs_focus:
                    subject_status[name]["needs_focus"] = True

        for subject_name, status in subject_status.items():
            # Convert subject_hours (keyed by subject name, value in minutes) to hours
            minutes_spent = subject_hours.get(subject_name, 0.0)
            hours_spent = round(minutes_spent / 60, 1)

            if status["is_failed"] and hours_spent < 5.0:
                alerts.append({
                    "subject": subject_name,
                    "severity": "CRITICAL",
                    "message": f"🚨 {subject_name}: You failed this subject and have only logged {hours_spent}h. Target at least 5h this week."
                })
            elif status["needs_focus"] and hours_spent < 2.0:
                alerts.append({
                    "subject": subject_name,
                    "severity": "WARNING",
                    "message": f"⚡ {subject_name}: Only {hours_spent}h logged. This subject needs more attention — aim for 2h minimum."
                })

        # Sort: critical first, then warnings
        alerts.sort(key=lambda x: 0 if x["severity"] == "CRITICAL" else 1)

        # Cap at 10 alerts max to avoid flooding the UI
        return alerts[:10]

    def _generate_empty_state_payload(self) -> Dict[str, Any]:
        return {
            "summary": {
                "total_study_time_hours": 0,
                "active_days_tracked": 0,
                "peak_productivity_slot": "None"
            },
            "preferred_study_slots": {"Morning": 0, "Afternoon": 0, "Evening": 0, "Night": 0},
            "weekly_timeline_chart": [],
            "subject_time_distribution": {},
            "topic_granular_breakdown": [],
            "alignment_alerts": []
        }