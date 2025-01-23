from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router  # Import your router from routes.py

# Initialize FastAPI app
app = FastAPI(title="Diamond Calculator API")

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default root route for the API
@app.get("/")
def read_root():
    return {"message": "Welcome to the Diamond Calculator API!"}

# Include the router with a prefix for API routes
app.include_router(router, prefix="/api")

# Run the app when executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
