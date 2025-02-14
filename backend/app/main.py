from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from sqlalchemy.orm import Session
from .database import engine, Base, get_db  
from .routes import router
from .models import LoginLogDB, LogActivityRequest  # Updated import
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Diamond Calculator API",
    description="API for calculating diamond prices and managing login logs",
    version="1.0.0"
)

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include the router with API prefix
app.include_router(
    router,
    prefix="/api",
    tags=["diamonds", "login"]
)

# Health check endpoint
@app.get("/", tags=["health"])
async def root():
    """
    Root endpoint for API health check
    """
    return {
        "status": "healthy",
        "message": "Diamond Calculator API is running",
        "version": "1.0.0"
    }

# Log activity endpoint with improved error handling
@app.post("/api/log-activity/", tags=["login"])
async def log_activity(request: LogActivityRequest, db: Session = Depends(get_db)):
    try:
        log = LoginLogDB(
            staff_id=request.staff_id,
            branch=request.branch,
            counter=request.counter,
            success=request.success,
            details=request.details
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        logger.info(f"Activity logged successfully for user {request.staff_id}")
        return {"message": "Activity logged successfully"}
    except Exception as e:
        logger.error(f"Failed to log activity: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log activity")

# Global Exception Handler with improved logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": str(exc),
            "type": type(exc).__name__,
        },
    )

# Startup event with improved logging
@app.on_event("startup")
async def startup_event():
    logger.info("Application is starting...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
        raise

# Shutdown event with improved logging
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")
    try:
        await engine.dispose()
        logger.info("Database connection closed successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # Changed to localhost for security
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )