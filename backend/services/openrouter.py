import httpx
import os
from typing import Dict, Any

# OpenRouter API configuration
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_api_key():
    """Get API key from environment - called at runtime, not import time"""
    return os.getenv("OPENROUTER_API_KEY")

#need this here because we call from env.local in the root directory.    

# Using Gemini 2.5 Flash via OpenRouter
MODEL = "google/gemini-2.5-flash"


async def evaluate_answer(user_answer: str, question: str, ideal_answer: str = None) -> Dict[str, Any]:
    """
    Evaluate a user's answer to a technical interview question using Gemini.

    Args:
        user_answer: The user's spoken/written answer
        question: The interview question that was asked
        ideal_answer: Optional ideal answer for comparison

    Returns:
        Dict with:
            - score: int (0-5)
            - feedback: str (detailed feedback)
            - strengths: list of strengths
            - improvements: list of areas to improve
    """

    # Build the evaluation prompt
    prompt = f"""You are a friendly technical interviewer having a conversation with a candidate. Evaluate their answer in a direct, concise tone that stays encouraging without filler. Use friendly second-person language (use "you" and "your" throughout) and keep the mood conversational, like you're cheerleading the candidate through their growth, while also being honest about inaccuracies or missing concepts.

Question: {question}

Their Answer: {user_answer}
"""

    if ideal_answer:
        prompt += f"\nIdeal Answer Reference: {ideal_answer}"

    prompt += """

Provide feedback in the following JSON format:
{
    "score": <0-5>,
    "feedback": "<up to 1 short sentence that states the key observation, no filler or cheerleading, use 'you' and 'your'>",
    "strengths": ["<what you did well - use 'you'>", "<another strength>"],
    "improvements": ["<what you could improve - use 'you'>", "<another area>"]
}

IMPORTANT:
- Speak directly to the candidate with "you" and "your" (never generalize as "the user").
- Keep the tone energetic, conversational, and encouraging—think of a supportive interviewer who celebrates wins and coachingly nudges toward growth. Avoid filler words like "really", "just", "kind of", or overly verbose transitions.
- The `feedback` field should be lively, use short enthusiastic sentences, and link to the strengths/improvements that follow.
- Each `strengths` and `improvements` entry must be grounded in what the candidate actually said; if they explicitly don't know the answer, note that rather than inventing extra positives.
- Mention why a strength matters and why an improvement will help the interview outcome so candidates understand the stakes.
- Refer to the ideal answer when it clarifies why the improvement matters or why a strength is notable.
- Challenge any unrealistic or incorrect claims directly but kindly; explain why they would hurt a technical interview score while still being encouraging.
- Limit `strengths` and `improvements` to the top two most meaningful points each to keep the feedback concise.
- Do not start entries with bullet characters like `*`, `-`, or `•`; return clean sentences or fragments instead.
- Use the score guide below:
  5: Excellent! Complete answer with good examples
  4: Great answer, just minor details missing
  3: Good start, but missing some key points
  2: You're on the right track, but fundamental gaps
  1: Let's work on understanding this better
  0: Not quite right, let's review this topic

Return ONLY the JSON, no other text."""

    try:
        api_key = get_api_key()
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8000",  # Optional but recommended
                    "X-Title": "Interview Coach"  # Optional but recommended
                },
                json={
                    "model": MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )

            response.raise_for_status()
            result = response.json()

            # Extract the AI's response
            ai_response = result["choices"][0]["message"]["content"]

            # Parse the JSON response
            import json
            import re

            # Sometimes Gemini wraps JSON in code blocks, so clean it up
            # Remove markdown code blocks if present
            cleaned_response = re.sub(r'```json\s*|\s*```', '', ai_response).strip()

            try:
                evaluation = json.loads(cleaned_response)
            except json.JSONDecodeError:
                # If still can't parse, return a default structure
                print(f"Could not parse response: {ai_response}")
                evaluation = {
                    "score": 3,
                    "feedback": ai_response,
                    "strengths": ["Response received"],
                    "improvements": ["AI returned unexpected format"]
                }

            return evaluation

    except httpx.HTTPError as e:
        print(f"HTTP error occurred: {e}")
        raise
    except json.JSONDecodeError as e:
        print(f"Failed to parse AI response: {e}")
        print(f"Raw response: {ai_response}")
        raise
    except Exception as e:
        print(f"Error calling OpenRouter API: {e}")
        raise


async def test_openrouter_connection() -> Dict[str, Any]:
    """
    Simple test function to verify OpenRouter API is working.
    """
    try:
        api_key = get_api_key()
        if not api_key:
            return {
                "status": "error",
                "error": "OPENROUTER_API_KEY not found in environment variables"
            }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": "Say 'Hello from Gemini!' in exactly those words."
                        }
                    ],
                    "max_tokens": 50
                }
            )

            response.raise_for_status()
            result = response.json()

            return {
                "status": "success",
                "model": MODEL,
                "response": result["choices"][0]["message"]["content"]
            }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
