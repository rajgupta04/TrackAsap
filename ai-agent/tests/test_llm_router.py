import asyncio
import pytest
from agent.llm_router import LLMRouter

def test_llm_router_mock_stream():
    async def _run():
        router = LLMRouter()
        assert router.active_provider == "mock"

        messages = [{"role": "user", "content": "Hello!"}]
        system_prompt = "You are an interviewer."

        chunks = []
        async for token in router.stream_chat(messages, system_prompt):
            chunks.append(token)

        assert len(chunks) > 0
        full_text = "".join(chunks)
        assert len(full_text) > 10

    asyncio.run(_run())

def test_llm_router_mock_complete_json():
    async def _run():
        router = LLMRouter()
        prompt = "Evaluate candidate"
        system_prompt = "Return valid JSON"

        result = await router.complete_json(prompt, system_prompt)
        assert isinstance(result, dict)

    asyncio.run(_run())
