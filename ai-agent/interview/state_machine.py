import time
from typing import List, Dict, Any, Optional
from .modes import get_mode_config

class InterviewStateMachine:
    """
    Adaptive Interview State Machine that manages interview progression,
    dynamically adjusts difficulty based on candidate responses, and compiles
    personalized context for the LLM.
    """

    def __init__(
        self,
        mode: str = "general_sde",
        difficulty: str = "medium",
        target_role: str = "Software Development Engineer",
        target_company: str = "",
        resume_text: str = "",
        job_description: str = "",
        duration_minutes: int = 20,
        user_context: Optional[Dict[str, Any]] = None,
    ):
        self.mode = mode
        self.config = get_mode_config(mode)
        self.sections = self.config.get("sections", ["intro", "technical", "wrap_up"])
        self.current_section_idx = 0
        
        # Difficulty calibration (0.0 to 1.0)
        base_diff_map = {"easy": 0.3, "medium": 0.5, "hard": 0.8}
        self.difficulty_score = base_diff_map.get(difficulty.lower(), 0.5)

        self.target_role = target_role
        self.target_company = target_company
        self.resume_text = resume_text
        self.job_description = job_description
        self.duration_minutes = duration_minutes
        self.user_context = user_context or {}

        # Conversation tracking
        self.conversation_history: List[Dict[str, str]] = []
        self.technical_claims: List[str] = []
        self.questions_asked_in_section = 0
        self.start_time = time.time()

    @property
    def current_section(self) -> str:
        if self.current_section_idx < len(self.sections):
            return self.sections[self.current_section_idx]
        return "wrap_up"

    @property
    def elapsed_minutes(self) -> float:
        return (time.time() - self.start_time) / 60.0

    @property
    def is_finished(self) -> bool:
        return self.current_section_idx >= len(self.sections) or self.elapsed_minutes >= self.duration_minutes

    def record_turn(self, speaker: str, text: str):
        """Records an utterance turn and extracts claims if candidate spoke."""
        role = "assistant" if speaker == "ai" else "user"
        self.conversation_history.append({"role": role, "content": text})

        if speaker == "user":
            self.questions_asked_in_section += 1
            self._extract_claims_heuristic(text)
            self._adapt_difficulty(text)
            self._check_section_progression()

    def _extract_claims_heuristic(self, text: str):
        """Simple keyword detection to flag technologies candidate claims to have used."""
        keywords = [
            "redis", "kafka", "rabbitmq", "mongodb", "postgresql", "mysql", "docker",
            "kubernetes", "aws", "graphql", "websockets", "jwt", "elasticsearch",
            "microservices", "sharding", "acid", "b-tree"
        ]
        lower_text = text.lower()
        for kw in keywords:
            if kw in lower_text and kw not in self.technical_claims:
                self.technical_claims.append(kw)

    def _adapt_difficulty(self, answer_text: str):
        """
        Adapts difficulty score dynamically based on answer depth.
        Answers with detailed architectural reasoning bump difficulty up.
        Very short or evasive answers decrease difficulty or trigger clarification.
        """
        words = len(answer_text.split())
        if words > 60:
            # Substantial answer
            self.difficulty_score = min(1.0, self.difficulty_score + 0.05)
        elif words < 15:
            # Brief or hesitant answer
            self.difficulty_score = max(0.2, self.difficulty_score - 0.05)

    def _check_section_progression(self):
        """
        Advances to next interview section after adequate questions or time pacing.
        """
        max_questions_per_section = 3 if self.current_section != "intro" else 1
        time_per_section = self.duration_minutes / max(len(self.sections), 1)

        time_spent_in_section = self.elapsed_minutes

        if (
            self.questions_asked_in_section >= max_questions_per_section
            or time_spent_in_section > (self.current_section_idx + 1) * time_per_section
        ):
            if self.current_section_idx < len(self.sections) - 1:
                self.current_section_idx += 1
                self.questions_asked_in_section = 0

    def build_system_prompt(self) -> str:
        """
        Builds the live prompt containing interviewer persona, section objective,
        candidate background, TrackAsap progress context, and technical claims.
        """
        base_prompt = self.config.get("system_prompt", "")
        
        context_parts = [
            base_prompt,
            f"\n--- INTERVIEW STATUS ---",
            f"Current Section: {self.current_section.upper()}",
            f"Target Role: {self.target_role}",
            f"Difficulty Level: {self.difficulty_score:.1f} / 1.0",
        ]

        if self.target_company:
            context_parts.append(f"Target Company: {self.target_company}")

        if self.technical_claims:
            claims_str = ", ".join(self.technical_claims[-5:])
            context_parts.append(f"Technologies Candidate Mentioned: {claims_str} (Feel free to probe these!)")

        # Inject TrackAsap user data if present
        if self.user_context:
            dsa_stats = self.user_context.get("dsaStats", {})
            if dsa_stats.get("totalSolved", 0) > 0:
                context_parts.append(
                    f"Candidate TrackAsap Stats: Solved {dsa_stats.get('totalSolved')} DSA problems "
                    f"(Easy: {dsa_stats.get('easySolved')}, Med: {dsa_stats.get('mediumSolved')}, Hard: {dsa_stats.get('hardSolved')})."
                )

        if self.resume_text:
            context_parts.append(f"\nCandidate Resume Highlights:\n{self.resume_text[:1200]}")

        if self.job_description:
            context_parts.append(f"\nJob Description Requirements:\n{self.job_description[:1000]}")

        context_parts.append(
            "\nSECTION INSTRUCTION:\n"
            f"We are currently in the '{self.current_section}' phase. "
            "Ask exactly ONE direct, natural interview question. Keep it concise so it is easy to hear and digest over voice."
        )

        return "\n".join(context_parts)
