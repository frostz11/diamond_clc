from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db  
from .routes import router
from .models import LoginLogDB

# Create the FastAPI app
app = FastAPI(
    title="Diamond Calculator API",
    description="API for calculating diamond prices and managing login logs",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

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

# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return {
        "status": "error",
        "message": str(exc),
        "type": type(exc).__name__
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    # Clean up resources if needed
    pass

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )