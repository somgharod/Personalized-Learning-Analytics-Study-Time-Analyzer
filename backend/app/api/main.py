from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import marksheet, analytics, tracker, auth 

# --- CRITICAL ADDITION FOR DATABASE COHERENCE ---
from app.models.base import Base
from app.api.marksheet import engine
# Ensures SQLite/PostgreSQL initializes tables across the modular code schemas
Base.metadata.create_all(bind=engine)
# ------------------------------------------------

def create_app() -> FastAPI:
    """
    Application factory pattern to configure and initialize the FastAPI instance.
    """
    app = FastAPI(
        title="Personalized Study Analyzer API",
        version="1.0.0"
    )

    # Configure CORS Middleware Rules
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust this to specific domains (e.g., ["http://localhost:3000"]) in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount all API Routes safely onto the app instance using factory injection
    app.include_router(
        auth.router, 
        prefix=f"{settings.API_V1_STR}/auth", 
        tags=["Security Authorization"]
    )
    
    app.include_router(
        marksheet.router, 
        prefix=f"{settings.API_V1_STR}/marksheet", 
        tags=["Marksheet Engine"]
    )
    
    app.include_router(
        analytics.router, 
        prefix=f"{settings.API_V1_STR}/analytics", 
        tags=["Insights & Analytics"]
    )
    
    app.include_router(
        tracker.router, 
        prefix=f"{settings.API_V1_STR}/tracker", 
        tags=["Time Tracker"]
    )

    @app.get("/")
    def read_root():
        return {
            "status": "online", 
            "message": "Academic Processing Core Framework Active"
        }

    return app

# Instantiate the application for the Uvicorn worker process to find (e.g., uvicorn app.main:app)
app = create_app()