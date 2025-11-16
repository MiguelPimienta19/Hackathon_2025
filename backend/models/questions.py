from pydantic import BaseModel
from typing import Optional


class Question(BaseModel):
    """Model for a multiple choice question from Supabase"""
    id: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # "A", "B", "C", or "D"
    difficulty: str  # "easy", "medium", or "hard"
    topic: str
    subtopic: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "06f98ce1-4bcc-40f3-846-4b00c4a5341",
                "question_text": "What data structure uses LIFO order?",
                "option_a": "Stack",
                "option_b": "Queue",
                "option_c": "Heap",
                "option_d": "Graph",
                "correct_option": "A",
                "difficulty": "easy",
                "topic": "Algorithms & Data Structures",
                "subtopic": "data structures"
            }
        }


class QuestionResponse(BaseModel):
    """Model for question response (without correct answer for frontend)"""
    id: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: str
    topic: str
    subtopic: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "06f98ce1-4bcc-40f3-846-4b00c4a5341",
                "question_text": "What data structure uses LIFO order?",
                "option_a": "Stack",
                "option_b": "Queue",
                "option_c": "Heap",
                "option_d": "Graph",
                "difficulty": "easy",
                "topic": "Algorithms & Data Structures",
                "subtopic": "data structures"
            }
        }
