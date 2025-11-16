from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import os
import base64
from io import BytesIO

from services.openrouter import test_openrouter_connection, evaluate_answer
from services.elevenlabs import test_elevenlabs_connection, text_to_speech
from services.supabase import test_supabase_connection, get_questions, get_question_by_id
from models.requests import EvaluateAnswerRequest, CheckAnswerRequest
from models.questions import Question, QuestionResponse
from typing import List, Optional



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

# Test OpenRouter connection
@app.get("/api/test-openrouter")
async def test_openrouter():
    """Test if OpenRouter API (Gemini) is working"""
    result = await test_openrouter_connection()
    return result

# Test ElevenLabs connection
@app.get("/api/test-elevenlabs")
async def test_elevenlabs():
    """Test if ElevenLabs API (text-to-speech) is working"""
    result = await test_elevenlabs_connection()
    return result

# Main endpoint: Evaluate user's answer
@app.post("/api/evaluate-answer")
async def evaluate_user_answer(request: EvaluateAnswerRequest):
    """
    Evaluate a user's answer to an interview question.

    Returns:
        - score: 0-5
        - feedback: text feedback
        - strengths: list of strengths
        - improvements: list of improvements
        - audio_base64: base64-encoded audio of the feedback
    """
    try:
        # Step 1: Evaluate the answer with Gemini
        evaluation = await evaluate_answer(
            user_answer=request.user_answer,
            question=request.question,
            ideal_answer=request.ideal_answer
        )

        # Step 2: Generate voice feedback with ElevenLabs
        audio_bytes = await text_to_speech(evaluation["feedback"])

        # Convert audio to base64 for easy JSON transmission
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

        # Step 3: Return everything
        return {
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "strengths": evaluation.get("strengths", []),
            "improvements": evaluation.get("improvements", []),
            "audio_base64": audio_base64,
            "audio_size_bytes": len(audio_bytes)
        }

    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to evaluate answer"
        }

# Test Supabase connection
@app.get("/api/test-supabase")
async def test_supabase():
    """Test if Supabase database connection is working"""
    result = await test_supabase_connection()
    return result

# Get multiple choice questions
@app.get("/api/questions", response_model=List[QuestionResponse])
async def get_all_questions(
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
    subtopic: Optional[str] = None,
    limit: Optional[int] = None
):
    """
    Fetch multiple choice questions with optional filters.

    Query Parameters:
        - difficulty: Filter by difficulty ("easy", "medium", "hard")
        - topic: Filter by topic (e.g., "Pointers & Memory")
        - subtopic: Filter by subtopic (e.g., "memory", "heap")
        - limit: Maximum number of questions to return

    Returns:
        List of questions (WITHOUT correct_option to prevent cheating)
    """
    try:
        questions = await get_questions(
            difficulty=difficulty,
            topic=topic,
            subtopic=subtopic,
            limit=limit
        )

        # Remove correct_option from response for security
        questions_without_answer = [
            {k: v for k, v in q.items() if k != "correct_option"}
            for q in questions
        ]

        return questions_without_answer

    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to fetch questions"
        }

# Get single question by ID
@app.get("/api/questions/{question_id}")
async def get_single_question(question_id: str):
    """
    Fetch a single question by its ID.

    Returns:
        Question object (WITHOUT correct_option to prevent cheating)
    """
    try:
        question = await get_question_by_id(question_id)

        if not question:
            return {
                "error": "Question not found",
                "message": f"No question found with ID: {question_id}"
            }

        # Remove correct_option from response for security
        question_without_answer = {k: v for k, v in question.items() if k != "correct_option"}

        return question_without_answer

    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to fetch question"
        }

# Check if a multiple choice answer is correct
@app.post("/api/check-answer")
async def check_answer(request: CheckAnswerRequest):
    """
    Check if a multiple choice answer is correct.

    Args:
        request: Contains question_id and selected_option (A, B, C, or D)

    Returns:
        - correct: boolean
        - correct_option: the correct answer (only if user was wrong)
        - message: feedback message
    """
    try:
        # Fetch the question with the correct answer
        question = await get_question_by_id(request.question_id)

        if not question:
            return {
                "error": "Question not found",
                "message": f"No question found with ID: {request.question_id}"
            }

        # Check if the answer is correct
        is_correct = question["correct_option"].upper() == request.selected_option.upper()

        if is_correct:
            return {
                "correct": True,
                "message": "Correct! Well done!"
            }
        else:
            return {
                "correct": False,
                "correct_option": question["correct_option"],
                "message": f"Incorrect. The correct answer was {question['correct_option']}."
            }

    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to check answer"
        }
