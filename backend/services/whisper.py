"""
Speech-to-text service using OpenAI Whisper API
"""
import os
import base64
import httpx
from io import BytesIO

def get_api_key():
    """Get API key from environment - called at runtime, not import time"""
    return os.getenv("OPENAI_API_KEY")

async def transcribe_audio(audio_base64: str) -> str:
    """
    Transcribe audio using OpenAI Whisper API.

    Args:
        audio_base64: Base64-encoded audio file (typically m4a from iOS)

    Returns:
        Transcribed text
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")

    try:
        print(f"[Whisper] Attempting to transcribe audio (base64 length: {len(audio_base64)})")

        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_base64)
        print(f"[Whisper] Decoded audio bytes: {len(audio_bytes)} bytes")

        # Create a file-like object
        audio_file = BytesIO(audio_bytes)
        audio_file.name = "audio.m4a"  # Whisper supports m4a, mp3, wav, etc.

        # Call OpenAI Whisper API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                },
                files={
                    "file": ("audio.m4a", audio_file, "audio/m4a"),
                },
                data={
                    "model": "whisper-1",
                }
            )

        print(f"[Whisper] API response status: {response.status_code}")

        if response.status_code != 200:
            error_text = response.text
            print(f"[Whisper] API error response: {error_text}")
            raise Exception(f"Whisper API error: {response.status_code} - {error_text}")

        result = response.json()
        transcribed_text = result.get("text", "")
        print(f"[Whisper] Transcription successful: {transcribed_text[:100]}...")
        return transcribed_text

    except Exception as e:
        print(f"[Whisper] Transcription failed with error: {str(e)}")
        raise Exception(f"Transcription failed: {str(e)}")


async def test_whisper_connection() -> dict:
    """Test if OpenAI Whisper API is accessible"""
    api_key = get_api_key()
    if not api_key:
        return {
            "status": "error",
            "message": "OPENAI_API_KEY not found in environment variables"
        }

    try:
        # Simple test - check if API key is valid
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={
                    "Authorization": f"Bearer {api_key}",
                }
            )

        if response.status_code == 200:
            return {
                "status": "success",
                "message": "OpenAI Whisper API connection successful!"
            }
        else:
            return {
                "status": "error",
                "message": f"OpenAI API returned status code: {response.status_code}"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}"
        }
