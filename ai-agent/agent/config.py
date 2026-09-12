import os
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

class Config:
    # LiveKit credentials
    LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

    # API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # LLM Settings
    GROQ_LLM_MODEL = os.getenv("GROQ_LLM_MODEL", "qwen/qwen3.8-27b")
    GROQ_STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
    GEMINI_LLM_MODEL = os.getenv("GEMINI_LLM_MODEL", "gemini-3.6-flash")

    # TrackAsap Backend
    TRACKASAP_API_URL = os.getenv("TRACKASAP_API_URL", "http://localhost:5000/api")

    # Kokoro TTS
    KOKORO_VOICE = os.getenv("KOKORO_VOICE", "af_bella")
    KOKORO_SPEED = float(os.getenv("KOKORO_SPEED", "1.05"))

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.GROQ_API_KEY or cls.GEMINI_API_KEY)
