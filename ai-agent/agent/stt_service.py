import io
import logging
from typing import Optional
from .config import Config

logger = logging.getLogger("ai_interviewer.stt")

class STTService:
    """
    Speech-to-Text service using Groq Whisper API (whisper-large-v3).
    Includes an offline fallback for testing.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or Config.GROQ_API_KEY
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info("Groq STT (Whisper Large V3) initialized.")
            except Exception as e:
                logger.warning(f"Could not initialize Groq STT client: {e}")

    def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "audio.wav") -> str:
        """
        Transcribes raw audio bytes into text using Groq's fast Whisper API.
        """
        if not audio_bytes:
            return ""

        if self.client:
            try:
                audio_file = io.BytesIO(audio_bytes)
                audio_file.name = filename

                transcription = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model=Config.GROQ_STT_MODEL,
                    language="en",
                    temperature=0.0,
                    response_format="text",
                )
                return str(transcription).strip()
            except Exception as e:
                logger.error(f"Groq STT transcription error: {e}")
                return ""

        # Mock fallback for offline local testing
        logger.info("Mock STT processing audio chunk.")
        return "I built TrackAsap using Node.js and MongoDB with JWT authentication."
