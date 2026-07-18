# backend/app/models/marksheet.py

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class MarksheetRecord(Base):
    __tablename__ = "marksheet_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)  # e.g., Semester 1, 2, 3...
    subject_name = Column(String, nullable=False)
    subject_code = Column(String, nullable=True)
    
    # Performance Data
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, default=100.0)
    percentage = Column(Float, nullable=False)
    grade = Column(String, nullable=True)
    
    # AI Analysis Flags
    is_failed = Column(Boolean, default=False)
    needs_focus = Column(Boolean, default=False) # Marked True if marks are below a certain threshold (e.g., < 60%)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="marksheets")