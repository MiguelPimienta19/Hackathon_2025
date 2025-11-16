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
    prompt = f"""You are an experienced technical interviewer evaluating a candidate's answer for HIGH STAKES interview preparation. This tool helps people land jobs worth $100K-$500K+, so your feedback must be exceptional quality - thorough, accurate, and genuinely educational.

Question: {question}

Their Answer: {user_answer}
"""

    if ideal_answer:
        prompt += f"\nIdeal/Expected Answer: {ideal_answer}"

    prompt += """

CRITICAL FIRST CHECK - "I DON'T KNOW" DETECTION:
Before anything else, check if the candidate said any of these:
- "I don't know"
- "I'm not sure"
- "I can't answer"
- "I don't understand"
- "Tell me"
- "Explain to me"
- Or any variation where they admit ignorance or ask YOU to explain

IF THEY ADMIT IGNORANCE OR ASK FOR TEACHING:
- Score: MUST be 0 or 1 (NO EXCEPTIONS)
- feedback: "Let's go over what you need to know about this topic."
- strengths: [] (empty - they gave no answer)
- improvements: TEACH THE COMPLETE ANSWER from scratch. This is pure teaching mode.

DO NOT give credit for saying "I don't know". DO NOT score above 1 if they explicitly admit they don't know.

CHAIN-OF-THOUGHT REASONING (after checking for "I don't know"):
1. Did they admit they don't know? If YES → Score 0-1 and teach
2. What did they actually say (analyze their specific words)?
3. What specific gaps, inaccuracies, or misunderstandings exist?
4. What score accurately reflects their understanding?
5. Plan educational feedback that will genuinely help them

Now provide comprehensive feedback in this JSON format:
{
    "score": <0-5>,
    "feedback": "<2-4 sentences explaining your score and what the answer demonstrates about their understanding>",
    "strengths": ["<specific strength with brief explanation>", "<another strength if applicable>"],
    "improvements": ["<specific improvement with explanation and teaching>", "<another improvement>"]
}

SCORING GUIDELINES - BE CRITICAL AND REALISTIC:
- 5: Perfect answer covering all key concepts with accurate details and good examples. Rare!
- 4: Strong answer with all major points covered, maybe 1 minor detail missing
- 3: Decent grasp but missing important concepts or has inaccuracies
- 2: Surface-level understanding, missing fundamental concepts
- 1: Significant misunderstanding or very incomplete
- 0: Wrong answer or demonstrates no understanding

FEEDBACK REQUIREMENTS BASED ON SCORE:

For scores 0-2 (LOW - Critical Teaching Opportunity):
This person needs to LEARN the concept. Your improvements section is their textbook.
- `feedback`: Be direct about the gap. "You're missing [X core concept]" or "Let's go over what you need to know about this."
- `improvements`: COMPREHENSIVE TEACHING MODE:
  * Explain the core concept from first principles
  * Break down the key components they need to understand
  * Include examples, analogies, or comparisons if helpful
  * Explain WHY this matters in interviews (interviewers look for X, Y, Z)
  * If there's a common misconception, address it
  * Aim for 2-4 detailed improvement points that actually teach
- `strengths`: Only include if there's genuine insight. Empty [] is fine for wrong answers.

For score 3 (MID - Gap Filling):
They have the foundation but missing pieces.
- `feedback`: "You got [X] right, but you're missing [Y critical concept]"
- `improvements`: TARGETED TEACHING:
  * Fill in the specific missing concepts with explanations
  * Connect to what they already said correctly
  * Explain how adding these details elevates the answer
  * 2-3 focused improvement points
- `strengths`: Acknowledge specific correct points (1-2 items)

For scores 4-5 (HIGH - Polish & Edge Cases):
Solid understanding, just refinement needed.
- `feedback`: Praise the strong grasp, note any minor gaps
- `improvements`: Advanced details, edge cases, or interview polish (1-2 items)
- `strengths`: Specific strong points (1-2 items)

QUALITY STANDARDS - REMEMBER THE STAKES:
- This person is preparing for interviews worth $100K-$500K salaries
- Your feedback could be the difference between passing and failing an interview
- Be THOROUGH on low scores - teach them properly
- Be HONEST - false confidence hurts them
- Use "you" and "your" throughout (never "the user")
- No bullet points (*/-/•) at the start of entries
- Each improvement should teach something concrete, not vague advice
- Challenge incorrect statements and explain exactly why they're wrong
- If they would fail an interview with this answer, make that clear

Return ONLY the JSON object, no other text."""

    try:
        api_key = get_api_key()
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")

        async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout for reasoning
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "Interview Coach - High Stakes Prep"
                },
                json={
                    "model": MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert technical interviewer providing high-quality, educational feedback. Take your time to think through your evaluation carefully before responding. Your feedback directly impacts someone's career trajectory."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.8,  # Slightly higher for more creative teaching explanations
                    "max_tokens": 3000  # Increased for comprehensive teaching with chain-of-thought
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

            # POST-PROCESSING: Override score if LLM clearly missed "I don't know"
            # Only check for explicit "I don't know" statements
            user_answer_lower = user_answer.lower().strip()
            print(f"[DEBUG] User answer (lowercased): '{user_answer_lower}'")
            print(f"[DEBUG] LLM gave score: {evaluation.get('score', 'N/A')}")

            explicit_dont_know = any(phrase in user_answer_lower for phrase in [
                "i don't know",
                "i do not know",
                "i dont know",
                "don't know how",
                "dont know how"
            ])

            print(f"[DEBUG] Detected 'I don't know'? {explicit_dont_know}")

            # If they explicitly said "I don't know" but got score > 1, override to 0
            if explicit_dont_know and evaluation.get("score", 0) > 1:
                print(f"[OVERRIDE] Detected 'I don't know' but LLM gave score {evaluation['score']}. Overriding to 0.")
                evaluation["score"] = 0
                # Update feedback to teaching mode
                evaluation["feedback"] = "Let's go over what you need to know about this topic."
                evaluation["strengths"] = []

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
