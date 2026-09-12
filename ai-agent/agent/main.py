import asyncio
import logging
import os
import sys
from typing import Optional

from .config import Config
from .llm_router import LLMRouter
from .stt_service import STTService
from .tts_service import TTSService
from interview.state_machine import InterviewStateMachine
from evaluation.evaluator import EvaluationEngine
from api.trackasap_client import TrackAsapClient

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("ai_interviewer.main")

class InterviewSessionOrchestrator:
    """
    Orchestrates a single live interview session:
    handles VAD -> STT -> State Machine -> Streaming LLM -> Streaming TTS -> Barge-in.
    """

    def __init__(
        self,
        session_id: str,
        room_name: str,
        mode: str = "general_sde",
        difficulty: str = "medium",
        target_role: str = "Software Development Engineer",
        target_company: str = "",
        resume_text: str = "",
        job_description: str = "",
        duration_minutes: int = 20,
        auth_token: str = "",
    ):
        self.session_id = session_id
        self.room_name = room_name
        self.auth_token = auth_token

        # Services
        self.llm_router = LLMRouter()
        self.stt_service = STTService()
        self.tts_service = TTSService()
        self.evaluator = EvaluationEngine(self.llm_router)
        self.api_client = TrackAsapClient()

        # State Machine
        self.state_machine = InterviewStateMachine(
            mode=mode,
            difficulty=difficulty,
            target_role=target_role,
            target_company=target_company,
            resume_text=resume_text,
            job_description=job_description,
            duration_minutes=duration_minutes,
        )

        self.is_ai_speaking = False
        self.interrupt_event = asyncio.Event()

    async def initialize_session(self):
        """Fetch user background context from TrackAsap backend and prepare introductory turn."""
        if self.auth_token:
            user_context = await self.api_client.get_user_context(self.auth_token)
            self.state_machine.user_context = user_context
            logger.info(f"Loaded TrackAsap context for candidate: {user_context.get('userName')}")

    async def generate_opening_question(self) -> str:
        """Generates the opening greeting and first question."""
        system_prompt = self.state_machine.build_system_prompt()
        initial_user_prompt = [
            {
                "role": "user",
                "content": "Hello, I am ready for the interview.",
            }
        ]

        logger.info(f"Generating opening question for mode: {self.state_machine.mode}")
        ai_response = await self.llm_router.complete(initial_user_prompt, system_prompt)
        
        # Record turn
        self.state_machine.record_turn("ai", ai_response)

        # Sync to TrackAsap backend
        if self.auth_token and self.session_id:
            await self.api_client.append_transcript_turn(
                self.session_id, "ai", ai_response, self.state_machine.current_section, self.auth_token
            )

        return ai_response

    async def handle_candidate_speech(self, audio_bytes: bytes) -> str:
        """
        Full pipeline turn:
        1. STT transcribes candidate speech (Groq Whisper)
        2. Records user turn in state machine
        3. Updates state and section progression
        4. Streams response from LLM (Groq Llama 3.3 70B / Gemini fallback)
        5. Synthesizes voice via Kokoro-82M on CPU
        """
        # 1. Transcribe
        transcript_text = self.stt_service.transcribe_audio_bytes(audio_bytes)
        if not transcript_text:
            logger.warning("Empty transcript received from STT.")
            return ""

        logger.info(f"Candidate said: {transcript_text}")
        self.state_machine.record_turn("user", transcript_text)

        if self.auth_token and self.session_id:
            await self.api_client.append_transcript_turn(
                self.session_id, "user", transcript_text, self.state_machine.current_section, self.auth_token
            )

        # 2. Check for barge-in / clear flag
        self.interrupt_event.clear()
        self.is_ai_speaking = True

        # 3. Stream AI response
        system_prompt = self.state_machine.build_system_prompt()
        ai_words = []

        try:
            async for token in self.llm_router.stream_chat(
                self.state_machine.conversation_history, system_prompt
            ):
                if self.interrupt_event.is_set():
                    logger.info("Barge-in triggered! AI speech generation stopped immediately.")
                    break
                ai_words.append(token)
        finally:
            self.is_ai_speaking = False

        full_ai_response = "".join(ai_words).strip()
        if full_ai_response:
            self.state_machine.record_turn("ai", full_ai_response)
            if self.auth_token and self.session_id:
                await self.api_client.append_transcript_turn(
                    self.session_id, "ai", full_ai_response, self.state_machine.current_section, self.auth_token
                )

        return full_ai_response

    def handle_barge_in(self):
        """Called when Silero VAD detects user speaking while AI is talking."""
        if self.is_ai_speaking:
            logger.info("Barge-in: User interrupted AI. Halting audio output.")
            self.interrupt_event.set()
            self.is_ai_speaking = False

    async def finalize_session(self) -> dict:
        """Concludes the interview, generates rubric evaluation report, and saves to TrackAsap DB."""
        logger.info(f"Finalizing session {self.session_id}. Generating comprehensive evaluation.")
        evaluation = await self.evaluator.generate_evaluation(
            transcript=self.state_machine.conversation_history,
            mode=self.state_machine.mode,
            target_role=self.state_machine.target_role,
            target_company=self.state_machine.target_company,
        )

        if self.auth_token and self.session_id:
            await self.api_client.submit_evaluation(self.session_id, evaluation, self.auth_token)
            logger.info(f"Submitted evaluation report to TrackAsap API successfully.")

        return evaluation


def run_livekit_worker():
    """
    LiveKit Agents entrypoint. Runs persistent worker listening for room job dispatches.
    """
    try:
        from livekit.agents import WorkerOptions, cli, JobContext
        logger.info("Starting LiveKit AI Interviewer Agent worker...")

        async def entrypoint(ctx: JobContext):
            logger.info(f"Connecting to room: {ctx.room.name}")
            await ctx.connect()

            orchestrator = InterviewSessionOrchestrator(
                session_id=ctx.room.name,
                room_name=ctx.room.name,
            )
            await orchestrator.initialize_session()
            opening = await orchestrator.generate_opening_question()
            logger.info(f"Interview started with opening question: {opening}")

        cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
    except ImportError:
        logger.warning("livekit-agents not installed in current environment. Running standalone server mode.")


if __name__ == "__main__":
    run_livekit_worker()
