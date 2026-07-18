# backend/app/config.py

import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "Personalized Study Analyzer and Time Manager"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "SUPER_SECRET_PROJECT_DEVELOPMENT_KEY_XYZ_123"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./study_analyzer.db"
    )

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

    OCR_ENGINE: str = os.getenv("OCR_ENGINE", "tesseract")

    # Groq API Key
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()