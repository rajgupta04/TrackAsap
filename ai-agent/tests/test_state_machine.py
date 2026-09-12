import pytest
from interview.state_machine import InterviewStateMachine

def test_state_machine_initialization():
    sm = InterviewStateMachine(
        mode="backend_interview",
        difficulty="hard",
        target_role="Senior Backend Engineer",
        target_company="Stripe",
    )
    assert sm.mode == "backend_interview"
    assert sm.current_section == "intro"
    assert sm.difficulty_score == 0.8
    assert sm.target_role == "Senior Backend Engineer"
    assert sm.target_company == "Stripe"
    assert not sm.is_finished

def test_turn_recording_and_claim_extraction():
    sm = InterviewStateMachine(mode="general_sde")
    sm.record_turn("ai", "Tell me about a challenging backend system you built.")
    assert len(sm.conversation_history) == 1
    assert sm.conversation_history[0]["role"] == "assistant"

    sm.record_turn(
        "user",
        "In TrackAsap, I designed a real-time event pipeline using Redis caching, Kafka message streams, and MongoDB."
    )
    assert len(sm.conversation_history) == 2
    assert sm.conversation_history[1]["role"] == "user"
    assert "redis" in sm.technical_claims
    assert "kafka" in sm.technical_claims
    assert "mongodb" in sm.technical_claims

def test_difficulty_adaptation():
    sm = InterviewStateMachine(mode="general_sde", difficulty="medium")
    initial_diff = sm.difficulty_score

    # Candidate provides deep, comprehensive explanation (>60 words)
    long_answer = (
        "We chose MongoDB because our problem sheets and user checklists have dynamic schemas "
        "that change frequently across different coding topics. However, for real-time task sync "
        "we introduced Redis write-through caching to avoid hitting the primary database on every single "
        "checkbox toggle. We also implemented database indexes on the user ID and completion timestamp "
        "which dropped query latency by eighty percent under heavy load during daily study sessions."
    )
    sm.record_turn("user", long_answer)
    assert sm.difficulty_score > initial_diff

def test_prompt_generation_with_context():
    user_context = {
        "userName": "Alex",
        "dsaStats": {
            "totalSolved": 120,
            "easySolved": 50,
            "mediumSolved": 60,
            "hardSolved": 10,
        },
    }
    sm = InterviewStateMachine(
        mode="general_sde",
        user_context=user_context,
        target_role="Full Stack Developer",
    )
    sm.technical_claims.append("redis")
    prompt = sm.build_system_prompt()
    assert "Full Stack Developer" in prompt
    assert "redis" in prompt
    assert "Solved 120 DSA problems" in prompt
