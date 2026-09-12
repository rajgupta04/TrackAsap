import io
import logging
import numpy as np
from typing import Generator, Optional, Tuple
from .config import Config

logger = logging.getLogger("ai_interviewer.tts")

class TTSService:
    """
    Text-to-Speech service using Kokoro-82M on CPU via ONNX Runtime.
    Synthesizes natural, high-quality speech with low latency (~180ms TTFA).
    """

    def __init__(self, voice: Optional[str] = None, speed: Optional[float] = None):
        self.voice = voice or Config.KOKORO_VOICE
        self.speed = speed or Config.KOKORO_SPEED
        self.kokoro = None
        self.sample_rate = 24000

        self._init_kokoro()

    def _init_kokoro(self):
        try:
            import kokoro_onnx
            # Check for model files
            # Kokoro initializes with onnx model and voices.json
            self.kokoro = kokoro_onnx.Kokoro("kokoro-v0_19.onnx", "voices.json")
            logger.info("Kokoro ONNX TTS initialized successfully.")
        except Exception as e:
            logger.info(
                f"Kokoro model not found locally or library not installed ({e}). "
                "Using acoustic stream fallback for development/testing."
            )
            self.kokoro = None

    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        """
        Synthesizes text into raw float32/int16 PCM audio samples at 24kHz.
        """
        clean_text = text.strip()
        if not clean_text:
            return np.zeros(0, dtype=np.float32), self.sample_rate

        if self.kokoro:
            try:
                samples, sr = self.kokoro.create(
                    clean_text,
                    voice=self.voice,
                    speed=self.speed,
                    lang="en-us"
                )
                return samples, sr
            except Exception as e:
                logger.error(f"Kokoro synthesis failed: {e}")

        # Synthetic fallback audio (comfortable gentle tone for testing)
        duration_sec = min(max(len(clean_text) * 0.05, 0.5), 3.0)
        t = np.linspace(0, duration_sec, int(self.sample_rate * duration_sec), endpoint=False)
        # 440 Hz gentle sine tone with envelope
        samples = (0.1 * np.sin(2 * np.pi * 440 * t) * np.exp(-t * 1.5)).astype(np.float32)
        return samples, self.sample_rate

    def synthesize_to_wav_bytes(self, text: str) -> bytes:
        """Helper to get WAV format bytes for easy transport."""
        import soundfile as sf
        samples, sr = self.synthesize(text)
        buffer = io.BytesIO()
        sf.write(buffer, samples, sr, format="WAV", subtype="PCM_16")
        return buffer.getvalue()
