import httpx
import os
from typing import Dict, Any

# ElevenLabs API configuration
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

def get_api_key():
    """Get API key from environment - called at runtime, not import time"""
    return os.getenv("ELEVENLABS_API_KEY")

def get_voice_id():
    """Get voice ID from environment, or use default"""
    return os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel voice


async def text_to_speech(text: str, voice_id: str = None) -> bytes:
    """
    Convert text to speech using ElevenLabs API.

    Args:
        text: The text to convert to speech
        voice_id: Optional voice ID (uses default if not provided)

    Returns:
        Audio bytes (MP3 format)
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not found in environment variables")

    if not voice_id:
        voice_id = get_voice_id()

    url = f"{ELEVENLABS_API_URL}/{voice_id}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                    "accept": "audio/mpeg"
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2",  # Faster model
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )

            response.raise_for_status()

            # Return the audio bytes
            return response.content

    except httpx.HTTPError as e:
        print(f"HTTP error occurred: {e}")
        raise
    except Exception as e:
        print(f"Error calling ElevenLabs API: {e}")
        raise


async def test_elevenlabs_connection() -> Dict[str, Any]:
    """
    Simple test function to verify ElevenLabs API is working.
    Returns metadata instead of audio bytes for testing.
    """
    try:
        api_key = get_api_key()
        if not api_key:
            return {
                "status": "error",
                "error": "ELEVENLABS_API_KEY not found in environment variables"
            }

        voice_id = get_voice_id()
        test_text = "Hello! This is a test of the ElevenLabs text to speech API."

        # Call the text-to-speech function
        audio_bytes = await text_to_speech(test_text, voice_id)

        return {
            "status": "success",
            "voice_id": voice_id,
            "audio_size_bytes": len(audio_bytes),
            "message": "ElevenLabs API is working! Audio generated successfully."
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
