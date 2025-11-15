from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env.local in project root
load_dotenv("../.env.local")

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

# Test endpoint to verify environment variables are loaded
@app.get("/api/env-test")
def env_test():
    return {
        "openrouter_key_loaded": bool(os.getenv("OPENROUTER_API_KEY")),
        "elevenlabs_key_loaded": bool(os.getenv("ELEVENLABS_API_KEY")),
        "supabase_url_loaded": bool(os.getenv("SUPABASE_URL")),
        "message": "Environment variables loaded successfully!" if os.getenv("OPENROUTER_API_KEY") else "Environment variables NOT loaded"
    }
