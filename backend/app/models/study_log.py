# backend/app/models/study_log.py

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class StudyLog(Base):
    __tablename__ = "study_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Study details
    subject_name = Column(String, nullable=False)
    topic_name = Column(String, nullable=False)
    
    # Time Tracking
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Float, nullable=False)  # Calculated as (end_time - start_time)
    
    # Metadata for advanced ML analysis (e.g., clustering best time slots)
    day_of_week = Column(String, nullable=False)      # e.g., "Monday", "Tuesday"
    hour_of_day = Column(Integer, nullable=False)     # e.g., 14 (for 2 PM) to map preferred slots

    logged_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="study_logs")