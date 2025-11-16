from pydantic import BaseModel
from typing import Optional


class EvaluateAnswerRequest(BaseModel):
    """Request model for evaluating a user's answer"""
    question: str
    user_answer: str
    ideal_answer: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Explain how a hash table works and its time complexity",
                "user_answer": "A hash table uses a hash function to map keys to array indices. It provides O(1) average time complexity for lookups.",
                "ideal_answer": "A hash table uses a hash function to compute an index into an array of buckets. It handles collisions using chaining or open addressing. Average time complexity is O(1) for insert, delete, and lookup operations."
            }
        }


class CheckAnswerRequest(BaseModel):
    """Request model for checking a multiple choice answer"""
    question_id: str
    selected_option: str  # "A", "B", "C", or "D"

    class Config:
        json_schema_extra = {
            "example": {
                "question_id": "06f98ce1-4bcc-40f3-846-4b00c4a5341",
                "selected_option": "A"
            }
        }
