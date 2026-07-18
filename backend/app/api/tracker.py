from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from app.services.time_analyzer import TimeAnalyzerService
from app.models.study_log import StudyLog
from app.models.marksheet import MarksheetRecord
from app.database import get_db

router = APIRouter()
analyzer_service = TimeAnalyzerService()

class StudyLogCreate(BaseModel):
    subject_name: str
    topic_name: str
    start_time: datetime
    end_time: datetime

@router.get("/subjects")
async def get_student_subjects(user_id: int = 1, db: Session = Depends(get_db)):
    """Returns distinct subject names from student's uploaded marksheet."""
    records = db.query(MarksheetRecord.subject_name, MarksheetRecord.semester)\
                .filter(MarksheetRecord.user_id == user_id)\
                .distinct()\
                .order_by(MarksheetRecord.semester, MarksheetRecord.subject_name)\
                .all()

    if not records:
        return {"subjects": [], "message": "No marksheet uploaded yet. Please upload your marksheet first."}

    return {
        "subjects": [
            {"subject_name": r.subject_name, "semester": r.semester}
            for r in records
        ]
    }

@router.post("/log", status_code=status.HTTP_201_CREATED)
async def create_study_entry(payload: StudyLogCreate, user_id: int = 1, db: Session = Depends(get_db)):
    """Logs an active student study session into the database."""
    duration = (payload.end_time - payload.start_time).total_seconds() / 60
    if duration <= 0:
        raise HTTPException(status_code=400, detail="End time must be after start time.")

    try:
        new_log = StudyLog(
            user_id=user_id,
            subject_name=payload.subject_name,
            topic_name=payload.topic_name,
            start_time=payload.start_time,
            end_time=payload.end_time,
            duration_minutes=duration,
            day_of_week=payload.start_time.strftime("%A"),
            hour_of_day=payload.start_time.hour
        )
        db.add(new_log)
        db.commit()
        return {"status": "success", "minutes_logged": round(duration, 2)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/dashboard")
async def get_time_dashboard_metrics(user_id: int = 1, db: Session = Depends(get_db)):
    """Retrieves processed time trends and alignment alerts."""
    return analyzer_service.get_advanced_time_analytics(user_id, db)