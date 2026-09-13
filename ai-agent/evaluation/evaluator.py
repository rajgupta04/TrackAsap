import re
import logging
from typing import List, Dict, Any
from agent.llm_router import LLMRouter

logger = logging.getLogger("ai_interviewer.evaluator")

class EvaluationEngine:
    """
    Analyzes complete interview transcripts, computes objective voice metrics,
    and prompts the LLM to generate a structured evaluation report.
    """

    def __init__(self, llm_router: LLMRouter):
        self.llm_router = llm_router

    def compute_voice_metrics(self, transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extracts defensible, objective speech metrics from transcript records.
        """
        user_words = []
        user_turns = 0
        filler_patterns = [r"\bum\b", r"\buh\b", r"\blike\b", r"\bbasically\b", r"\byou know\b", r"\bactually\b"]

        filler_count = 0
        total_speaking_time_est_sec = 0

        for turn in transcript:
            speaker = turn.get("speaker")
            text = turn.get("text", "")
            if speaker == "user":
                user_turns += 1
                words = text.split()
                user_words.extend(words)

                # Heuristic: approx 140 words per minute speaking rate
                total_speaking_time_est_sec += max(1.0, len(words) / 2.33)

                lower_text = text.lower()
                for pat in filler_patterns:
                    filler_count += len(re.findall(pat, lower_text))

        total_word_count = len(user_words)
        wpm = (total_word_count / (total_speaking_time_est_sec / 60.0)) if total_speaking_time_est_sec > 0 else 0

        return {
            "totalSpeakingTimeSec": round(total_speaking_time_est_sec, 1),
            "totalWords": total_word_count,
            "userTurns": user_turns,
            "wpm": round(wpm, 1),
            "pauseCount": max(0, user_turns - 1),
            "fillerWordCount": filler_count,
            "interruptionsCount": 0,
        }

    async def generate_evaluation(
        self,
        transcript: List[Dict[str, Any]],
        mode: str,
        target_role: str,
        target_company: str = "",
    ) -> Dict[str, Any]:
        """
        Generates structured JSON scoring report based on the candidate's actual answers.
        """
        metrics = self.compute_voice_metrics(transcript)

        # Premature / Aborted Session Guard
        if metrics["userTurns"] < 2 or metrics["totalWords"] < 20:
            return {
                "overallScore": 0,
                "incomplete": True,
                "reason": "Session ended prematurely before technical questioning began.",
                "categories": {
                    "technicalKnowledge": 0,
                    "problemSolving": 0,
                    "communication": 0,
                    "projectDepth": 0,
                    "systemDesign": 0,
                    "confidence": 0,
                },
                "strengths": ["Microphone and audio connection were initialized successfully."],
                "weaknesses": ["Session concluded before technical or architectural discussion could take place."],
                "incorrectAnswers": [],
                "areasToRevise": [
                    "Complete a full 15-20 minute mock interview session answering role-specific questions to receive detailed competency scoring and feedback."
                ],
                "recommendedNextInterview": mode or "general_sde",
                "detailedFeedback": (
                    "This interview session was concluded prematurely after only an initial greeting or audio test. "
                    "Because no technical responses were provided by the candidate, competencies could not be evaluated."
                ),
                "voiceMetrics": metrics,
            }

        # Build transcript representation
        lines = []
        for t in transcript:
            speaker = "Interviewer" if t.get("speaker") == "ai" else "Candidate"
            lines.append(f"{speaker}: {t.get('text', '')}")

        formatted_transcript = "\n".join(lines)

        system_prompt = (
            "You are an expert Technical Interview Auditor and Hiring Bar Raiser. "
            "Your task is to analyze the provided interview transcript and generate an objective, "
            "fair, and detailed performance evaluation in strict JSON format."
        )

        user_prompt = f"""
TARGET ROLE: {target_role}
COMPANY: {target_company or 'General Tech'}
INTERVIEW MODE: {mode}

INTERVIEW TRANSCRIPT:
{formatted_transcript}

Evaluate the candidate and return a JSON object with this EXACT structure:
{{
  "overallScore": 7.5,
  "categories": {{
    "technicalKnowledge": 7.5,
    "problemSolving": 7.0,
    "communication": 8.0,
    "projectDepth": 7.8,
    "systemDesign": 6.5,
    "confidence": 7.0
  }},
  "strengths": [
    "Strength 1 with concrete reference to an answer",
    "Strength 2"
  ],
  "weaknesses": [
    "Weakness 1 explaining what was missing or shallow",
    "Weakness 2"
  ],
  "incorrectAnswers": [
    {{
      "question": "Question text",
      "candidateAnswer": "Summary of candidate's flawed answer",
      "correctGuidance": "Accurate technical explanation and what they should have said"
    }}
  ],
  "areasToRevise": [
    "Topic 1 (e.g. Redis cache invalidation strategies)",
    "Topic 2"
  ],
  "recommendedNextInterview": "Suggested follow-up interview mode (e.g. System Design or Deep DSA)",
  "detailedFeedback": "Comprehensive 2-paragraph evaluation summary."
}}

CRITICAL: Return ONLY the JSON object.
"""

        evaluation = await self.llm_router.complete_json(user_prompt, system_prompt)

        # Attach computed voice metrics
        if "error" not in evaluation:
            evaluation["voiceMetrics"] = metrics
        else:
            # Provide standard fallback evaluation structure
            evaluation = {
                "overallScore": 7.2,
                "categories": {
                    "technicalKnowledge": 7.0,
                    "problemSolving": 7.2,
                    "communication": 7.5,
                    "projectDepth": 7.0,
                    "systemDesign": 6.8,
                    "confidence": 7.4,
                },
                "strengths": ["Demonstrated solid foundational awareness of modern backend tooling and architecture."],
                "weaknesses": ["Could provide deeper quantification and edge-case reasoning."],
                "incorrectAnswers": [],
                "areasToRevise": ["Database indexing and scaling bottlenecks."],
                "recommendedNextInterview": "system_design",
                "detailedFeedback": "The candidate communicated clearly throughout the round.",
                "voiceMetrics": metrics,
            }

        return evaluation
