# backend/app/services/recommendation_engine.py
import os
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.marksheet import MarksheetRecord
from groq import Groq
from app.config import settings

class RecommendationEngine:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY")) if settings.GROQ_API_KEY else None

    def get_student_recommendations(self, user_id: int, semester: int, db: Session) -> Dict[str, Any]:
        records = db.query(MarksheetRecord).filter(
            MarksheetRecord.user_id == user_id,
            MarksheetRecord.semester == semester
        ).all()

        if not records:
            return {
                "semester": semester,
                "status": "No records found",
                "metrics_overview": {
                    "total_subjects": 0,
                    "failed_count": 0,
                    "weak_count": 0,
                    "strong_count": 0
                },
                "categorized_breakdown": {
                    "critical_remedial_required": [],
                    "low_focus_areas": [],
                    "mastered_domains": []
                },
                "targeted_roadmap": []
            }

        failed_subjects = [r.subject_name for r in records if r.is_failed]
        weak_subjects   = [r.subject_name for r in records if r.needs_focus and not r.is_failed]
        strong_subjects = [r.subject_name for r in records if not r.needs_focus and not r.is_failed]

        if not failed_subjects and not weak_subjects:
            return {
                "semester": semester,
                "academic_standing": "Excellent",
                "metrics_overview": {
                    "total_subjects": len(records),
                    "failed_count": 0,
                    "weak_count": 0,
                    "strong_count": len(strong_subjects)
                },
                "categorized_breakdown": {
                    "critical_remedial_required": [],
                    "low_focus_areas": [],
                    "mastered_domains": strong_subjects
                },
                "targeted_roadmap": self._generate_excellence_tips(strong_subjects)
            }

        ai_insights = self._generate_ai_curriculum_guidance(failed_subjects, weak_subjects)

        return {
            "semester": semester,
            "academic_standing": "Action Required" if failed_subjects else "Needs Improvement",
            "metrics_overview": {
                "total_subjects": len(records),
                "failed_count": len(failed_subjects),
                "weak_count": len(weak_subjects),
                "strong_count": len(strong_subjects)
            },
            "categorized_breakdown": {
                "critical_remedial_required": failed_subjects,
                "low_focus_areas": weak_subjects,
                "mastered_domains": strong_subjects
            },
            "targeted_roadmap": ai_insights
        }

    def _generate_ai_curriculum_guidance(self, failed_subjects: List[str], weak_subjects: List[str]) -> List[Dict[str, Any]]:
        if not self.client:
            print("[Recommendation Engine] Groq client not available. Using fallback.")
            return self._get_fallback_recommendations(failed_subjects, weak_subjects)

        prompt = f"""
You are an expert academic counselor specializing in Savitribai Phule Pune University (SPPU), Pune, India.
You have deep knowledge of the SPPU syllabus for Computer Engineering (2019 Pattern).

A student needs help with specific subjects from their marksheet.

FAILED SUBJECTS (critical - need remedial help): {json.dumps(failed_subjects)}
WEAK SUBJECTS (passed but need improvement): {json.dumps(weak_subjects)}

For EACH subject listed above, return a JSON array where each object has exactly these fields:
- course_name: exact subject name as given
- status: "Critical Remedial" for failed subjects, "GPA Booster Focus" for weak subjects
- core_failure_insights: specific reason students struggle in THIS subject at SPPU (2-3 sentences)
- high_yield_scoring_topics: array of exactly 7 to 8 SPECIFIC topics from the ACTUAL SPPU 2019 pattern syllabus for this subject. These must be real Topic/chapter names from SPPU Computer Engineering curriculum. Order them by exam weightage — highest scoring first.
- tactical_advice: one very specific study tip mentioning SPPU exam structure (70-30 split, oral exams, term work, practical assessment, paper pattern etc.)

STRICT RULES:
1. Topics MUST come from real SPPU 2019 pattern Topics for that subject. Examples:
   - "Database Management Systems": Topic 1 Intro to DBMS, Topic 2 ER & Relational Model, Topic 3 SQL & Relational Algebra, Topic 4 Normalization, Topic 5 Transaction Management, Topic 6 Concurrency Control, Topic 7 Indexing & Query Optimization
   - "Machine Learning": Topic 1 Intro to ML & Python, Topic 2 Linear & Logistic Regression, Topic 3 SVM & Decision Trees, Topic 4 Clustering (K-Means, Hierarchical), Topic 5 Dimensionality Reduction (PCA), Topic 6 Neural Networks & Deep Learning, Topic 7 Model Evaluation & Deployment
   - "Computer Networks": Topic 1 Network Models & Topologies, Topic 2 Physical & Data Link Layer, Topic 3 Network Layer & IP Addressing, Topic 4 Transport Layer & TCP/UDP, Topic 5 Application Layer Protocols, Topic 6 Network Security, Topic 7 Wireless & Mobile Networks
   - "Data Structures": Topic 1 Introduction & Complexity, Topic 2 Arrays & Linked Lists, Topic 3 Stacks & Queues, Topic 4 Trees & Binary Search Trees, Topic 5 Graphs & Traversals, Topic 6 Sorting Algorithms, Topic 7 Hashing & File Structures
2. Give exactly 7-8 topics per subject — NEVER fewer than 7.
3. Topics must be ordered: highest scoring / most heavily weighted in SPPU exams first.
4. tactical_advice must mention SPPU-specific patterns: oral viva, term work marks, 70-30 internal-external split, or practical exam tips.
5. For lab/practical subjects, topics should be experiment names or practical tasks from SPPU lab manual.
6. Return ONLY a valid JSON array. No markdown, no explanation, no preamble, no trailing text.

Example of ONE object in the array:
{{
  "course_name": "DATABASE MANAGEMENT SYSTEMS",
  "status": "GPA Booster Focus",
  "core_failure_insights": "Students lose marks in normalization problems and SQL query writing due to weak relational algebra fundamentals. SPPU papers always have 2-3 mandatory normalization questions.",
  "high_yield_scoring_topics": [
    "Topic 3: SQL Queries, Views & Relational Algebra",
    "Topic 4: Normalization (1NF, 2NF, 3NF, BCNF)",
    "Topic 2: ER Diagram & Relational Schema Design",
    "Topic 5: Transaction Management & ACID Properties",
    "Topic 6: Concurrency Control (2PL, Timestamp)",
    "Topic 1: DBMS Architecture & Data Models",
    "Topic 7: Indexing, Hashing & Query Processing"
  ],
  "tactical_advice": "SPPU DBMS paper is 70 marks with mandatory questions from every Topic. Topic 3 SQL and Topic 4 Normalization together carry ~35 marks. Practice 15+ SQL queries and 8+ normalization problems. The oral exam tests ER diagram drawing and SQL execution — practice both on paper."
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an SPPU curriculum expert. Output only valid JSON arrays with detailed Topic-wise syllabus topics. Never output fewer than 7 topics per subject."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=4000
            )

            cleaned = response.choices[0].message.content.strip()

            # Strip markdown code fences if present
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines).strip()

            result = json.loads(cleaned)

            # Ensure it's a list
            if isinstance(result, dict):
                result = [result]

            return result

        except Exception as e:
            print(f"[Recommendation Engine] AI processing error: {str(e)}")
            return self._get_fallback_recommendations(failed_subjects, weak_subjects)

    def _generate_excellence_tips(self, strong_subjects: List[str]) -> List[Dict[str, Any]]:
        roadmap = []
        for subject in strong_subjects:
            roadmap.append({
                "course_name": subject,
                "status": "Mastered",
                "core_failure_insights": "",
                "high_yield_scoring_topics": [
                    "Advanced application projects",
                    "Competitive exam preparation",
                    "Research paper reading",
                    "Open source contribution",
                    "Peer tutoring"
                ],
                "tactical_advice": "Excellent performance! Consider building a project in this domain for your portfolio or helping peers to reinforce your knowledge."
            })
        return roadmap

    def _get_fallback_recommendations(self, failed_subjects: List[str], weak_subjects: List[str]) -> List[Dict[str, Any]]:
        roadmap = []

        for subject in failed_subjects:
            roadmap.append({
                "course_name": subject,
                "status": "Critical Remedial",
                "core_failure_insights": "Students often struggle with applying foundational concepts to exam problems. Focus on SPPU previous year question papers.",
                "high_yield_scoring_topics": [
                    "Topic 1: Core Fundamentals & Definitions",
                    "Topic 2: Key Algorithms & Problem Solving",
                    "Topic 3: Standard Diagrams & Architectures",
                    "Topic 4: Applied Numerical Problems",
                    "Topic 5: Previous Year Question Patterns",
                    "Topic 6: Short Notes & Important Definitions",
                    "Topic 7: Lab Manual Experiments"
                ],
                "tactical_advice": "Solve at least 5 SPPU previous year papers under timed conditions. Focus on Topic-wise weightage before your re-examination."
            })

        for subject in weak_subjects:
            roadmap.append({
                "course_name": subject,
                "status": "GPA Booster Focus",
                "core_failure_insights": "",
                "high_yield_scoring_topics": [
                    "Topic 1: High-Weightage Theory Topics",
                    "Topic 2: Diagram-Based Questions",
                    "Topic 3: Formula Derivations & Numericals",
                    "Topic 4: Case Studies & Applications",
                    "Topic 5: Short Answer Questions",
                    "Topic 6: Practical & Lab Components",
                    "Topic 7: SPPU Model Answer Papers"
                ],
                "tactical_advice": "Dedicate an extra 45-minute study slot daily for this subject. Focus on scoring in oral/practical components as they boost overall marks significantly in SPPU."
            })

        return roadmap