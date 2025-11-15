from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="Interview Coach API",
    description="AI-powered technical interview practice backend",
    version="1.0.0"
)

# CORS middleware - allows mobile app to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific mobile app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": "Interview Coach API is running!",
        "status": "healthy",
        "version": "1.0.0"
    }

# Test endpoint to verify API is working
@app.get("/api/test")
def test_endpoint():
    return {
        "message": "API test successful!",
        "endpoints_available": [
            "GET /",
            "GET /api/test",
            "POST /api/voice-answer (coming soon)",
            "GET /api/questions (coming soon)"
        ]
    }
