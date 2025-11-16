import os
from typing import List, Dict, Any, Optional
import random
import uuid
from supabase import create_client

# Supabase client initialization
_supabase_client: Any = None


def get_supabase_client():
    """Get Supabase client - initialized at runtime, not import time"""
    global _supabase_client

    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

        _supabase_client = create_client(url, key)

    return _supabase_client


async def get_questions(
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
    subtopic: Optional[str] = None,
    limit: Optional[int] = None,
    randomize: bool = False
) -> List[Dict[str, Any]]:
    """
    Fetch questions from Supabase with optional filters.

    Args:
        difficulty: Filter by difficulty ("easy", "medium", "hard")
        topic: Filter by topic (e.g., "Pointers & Memory")
        subtopic: Filter by subtopic (e.g., "memory", "heap")
        limit: Maximum number of questions to return

    Returns:
        List of question dictionaries
    """
    try:
        client = get_supabase_client()
        query = client.table("questions").select("*")

        # Apply filters if provided
        if difficulty:
            query = query.eq("difficulty", difficulty)

        if topic:
            query = query.eq("topic", topic)

        if subtopic:
            query = query.eq("subtopic", subtopic)

        if not randomize and limit:
            query = query.limit(limit)

        # Execute query
        response = query.execute()

        questions = response.data or []
        normalized: List[Dict[str, Any]] = []

        for row in questions:
            normalized.append({
                'id': row.get('id') or str(uuid.uuid4()),
                'question_text': row.get('question_text'),
                'option_a': row.get('option_a') or row.get('option_a_text'),
                'option_b': row.get('option_b') or row.get('option_b_text'),
                'option_c': row.get('option_c') or row.get('option_c_text'),
                'option_d': row.get('option_d') or row.get('option_d_text'),
                'correct_option': row.get('correct_option'),
                'difficulty': row.get('difficulty'),
                'topic': row.get('topic'),
                'subtopic': row.get('subtopic'),
            })

        # Randomize if requested
        if randomize:
            random.shuffle(normalized)
            if limit:
                normalized = normalized[:limit]

        return normalized

    except Exception as e:
        print(f"Error fetching questions from Supabase: {e}")
        raise

async def get_deep_questions(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: Optional[int] = None,
    randomize: bool = True
) -> List[Dict[str, Any]]:
    """
    Fetch deep question prompts (open-ended) from Supabase.

    Args:
        topic: Filter by topic
        difficulty: Filter by difficulty
        limit: Maximum number of questions to return
        randomize: Whether to randomize the order (default True)
    """
    try:
        client = get_supabase_client()
        query = client.table("deep_questions").select("*")

        if topic:
            query = query.eq("topic", topic)
        if difficulty:
            query = query.eq("difficulty", difficulty)
        if not randomize and limit:
            query = query.limit(limit)

        response = query.execute()
        questions = response.data or []
        normalized: List[Dict[str, Any]] = []

        for row in questions:
            normalized.append({
                "id": row.get("id") or str(uuid.uuid4()),
                "prompt": row.get("prompt"),
                "topic": row.get("topic"),
                "difficulty": row.get("difficulty"),
                "rubric_points": row.get("rubric_points") or [],
            })

        # Randomize if requested
        if randomize:
            random.shuffle(normalized)
            if limit:
                normalized = normalized[:limit]

        return normalized

    except Exception as e:
        print(f"Error fetching questions from Supabase: {e}")
        raise


async def get_question_by_id(question_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single question by its ID.

    Args:
        question_id: UUID of the question

    Returns:
        Question dictionary or None if not found
    """
    try:
        client = get_supabase_client()
        response = client.table("questions").select("*").eq("id", question_id).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    except Exception as e:
        print(f"Error fetching question by ID from Supabase: {e}")
        raise


async def test_supabase_connection() -> Dict[str, Any]:
    """
    Test Supabase connection by fetching one question.

    Returns:
        Status dictionary with connection info
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")

        if not url or not key:
            return {
                "status": "error",
                "error": "SUPABASE_URL or SUPABASE_KEY not found in environment variables"
            }

        client = get_supabase_client()

        # Try to fetch one question as a test
        response = client.table("questions").select("*").limit(1).execute()

        return {
            "status": "success",
            "message": "Supabase connection successful!",
            "supabase_url": url,
            "questions_count": len(response.data),
            "sample_question": response.data[0] if response.data else None
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
