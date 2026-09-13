import asyncio
import pytest
from agent.llm_router import LLMRouter
from evaluation.evaluator import EvaluationEngine

def test_voice_metrics_computation():
    router = LLMRouter()
    engine = EvaluationEngine(router)

    sample_transcript = [
        {"speaker": "ai", "text": "Can you explain how you handle authentication in TrackAsap?"},
        {
            "speaker": "user",
            "text": "Um, so basically we use JWT tokens stored in localStorage. Like, when the user logs in, the backend signs a payload.",
        },
        {"speaker": "ai", "text": "What happens if a token is compromised?"},
        {
            "speaker": "user",
            "text": "Actually, we implement short expiry times and, uh, token blacklisting in Redis.",
        },
    ]

    metrics = engine.compute_voice_metrics(sample_transcript)
    assert metrics["fillerWordCount"] >= 3  # "um", "basically", "like", "actually", "uh"
    assert metrics["totalSpeakingTimeSec"] > 0
    assert metrics["wpm"] > 0
    assert metrics["pauseCount"] == 1

def test_evaluation_generation_fallback():
    async def _run():
        router = LLMRouter()
        engine = EvaluationEngine(router)

        sample_transcript = [
            {"speaker": "ai", "text": "What is the difference between SQL and NoSQL?"},
            {"speaker": "user", "text": "SQL uses fixed schemas and ACID transactions, whereas NoSQL offers flexible document schemas and horizontal scaling."},
        ]

        result = await engine.generate_evaluation(
            transcript=sample_transcript,
            mode="backend_interview",
            target_role="Backend Engineer",
            target_company="Google",
        )

        assert "overallScore" in result
        assert "categories" in result
        assert "strengths" in result
        assert "weaknesses" in result
        assert "voiceMetrics" in result

    asyncio.run(_run())
