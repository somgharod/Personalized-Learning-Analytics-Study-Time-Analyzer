# backend/app/api/analytics.py
'''
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.recommendation_engine import RecommendationEngine
#from app.api.marksheet import get_db # Reusing our established DB session generator
from app.api.marksheet import get_db, SessionLocal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()
rec_engine = RecommendationEngine()

@router.get("/recommendations/{semester}")
async def get_semester_insights(
    semester: int,
    user_id: int = 1, # Mocking user context for validation
    db: Session = Depends(get_db)
):
    """Fetches custom recommendations, key topics, and action vectors for a specific semester."""
    try:
        insights = rec_engine.get_student_recommendations(user_id=user_id, semester=semester, db=db)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Analytics Engine error: {str(e)}")

        '''

from fastapi import APIRouter, Depends, HTTPException
#from sqlalchemy.orm import Session
#from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from sqlalchemy.orm import Session
from app.services.recommendation_engine import RecommendationEngine
from app.database import engine, get_db
# Define db session locally instead of importing from marksheet
#engine = create_engine(settings.DATABASE_URL)
#SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#def get_db():
 #   db = SessionLocal()
  ##     yield db
    #finally:
     #   db.close()

router = APIRouter()
rec_engine = RecommendationEngine()

@router.get("/recommendations/{semester}")
async def get_semester_insights(
    semester: int,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    try:
        insights = rec_engine.get_student_recommendations(user_id=user_id, semester=semester, db=db)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Analytics Engine error: {str(e)}")