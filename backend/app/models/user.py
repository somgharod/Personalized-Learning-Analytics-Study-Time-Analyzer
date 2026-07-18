# backend/app/models/user.py

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base  # Assuming a shared declarative base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    marksheets = relationship("MarksheetRecord", back_populates="student", cascade="all, delete-orphan")
    study_logs = relationship("StudyLog", back_populates="student", cascade="all, delete-orphan")