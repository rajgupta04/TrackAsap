import json
import logging
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from .config import Config

logger = logging.getLogger("ai_interviewer.llm_router")

class LLMRouter:
    """
    Intelligent LLM Router with automatic failover between Groq (Llama 3.3 70B)
    and Gemini (Gemini 2.0 Flash). Also includes an offline mock adapter.
    """

    def __init__(self, groq_api_key: Optional[str] = None, gemini_api_key: Optional[str] = None):
        self.groq_api_key = groq_api_key if groq_api_key is not None else Config.GROQ_API_KEY
        self.gemini_api_key = gemini_api_key if gemini_api_key is not None else Config.GEMINI_API_KEY
        
        self.groq_client = None
        self.gemini_model = None
        
        self.groq_rate_limited_until = 0.0
        self.active_provider = "mock"

        self._init_clients()

    def _init_clients(self):
        # 1. Initialize Groq client
        if self.groq_api_key:
            try:
                from groq import AsyncGroq
                self.groq_client = AsyncGroq(api_key=self.groq_api_key)
                self.active_provider = "groq"
                logger.info("Initialized Groq client as primary LLM provider.")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

        # 2. Initialize Gemini client
        if self.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel(Config.GEMINI_LLM_MODEL)
                if not self.groq_client:
                    self.active_provider = "gemini"
                logger.info("Initialized Gemini client as fallback/primary LLM provider.")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini client: {e}")

        if not self.groq_client and not self.gemini_model:
            logger.warning("No API keys found for Groq or Gemini. Operating in OFFLINE MOCK MODE.")
            self.active_provider = "mock"

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response tokens. First tries Groq. If rate-limited or failed,
        smoothly falls back to Gemini without failing the user's interview turn.
        """
        now = asyncio.get_event_loop().time()

        # Try Groq if available and not on cooldown
        if self.groq_client and now > self.groq_rate_limited_until:
            try:
                groq_messages = [{"role": "system", "content": system_prompt}] + messages
                stream = await self.groq_client.chat.completions.create(
                    model=Config.GROQ_LLM_MODEL,
                    messages=groq_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield delta
                return
            except Exception as e:
                error_msg = str(e).lower()
                if "rate limit" in error_msg or "429" in error_msg:
                    logger.warning("Groq rate limit hit. Falling back to Gemini for 60 seconds.")
                    self.groq_rate_limited_until = now + 60.0
                else:
                    logger.error(f"Groq generation error: {e}")

        # Fallback to Gemini
        if self.gemini_model:
            try:
                # Format conversation for Gemini
                prompt_parts = [f"System Instruction:\n{system_prompt}\n\nConversation History:"]
                for msg in messages:
                    role = "Interviewer (You)" if msg["role"] == "assistant" else "Candidate"
                    prompt_parts.append(f"{role}: {msg['content']}")
                prompt_parts.append("Interviewer (You):")

                full_prompt = "\n".join(prompt_parts)
                response = self.gemini_model.generate_content(full_prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                logger.error(f"Gemini fallback failed: {e}")

        # Offline Mock Fallback
        mock_response = (
            "Thank you for sharing that. You explained the core logic clearly. "
            "Could you walk me through the time and space complexity of your approach, "
            "and how you would handle potential edge cases or scaling bottlenecks?"
        )
        for word in mock_response.split(" "):
            yield word + " "
            await asyncio.sleep(0.04)

    async def complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.5,
    ) -> str:
        """Non-streaming completion for internal planning or evaluation."""
        full_text = []
        async for chunk in self.stream_chat(messages, system_prompt, temperature=temperature):
            full_text.append(chunk)
        return "".join(full_text).strip()

    async def complete_json(self, prompt: str, system_prompt: str) -> Dict[str, Any]:
        """
        Request structured JSON response. Tries Groq, then Gemini, then parses JSON cleanly.
        """
        messages = [{"role": "user", "content": prompt}]
        json_instruction = (
            system_prompt + "\n\nCRITICAL: Respond with ONLY a valid JSON object. "
            "Do NOT include markdown backticks (```json), commentary, or extra text."
        )

        response_text = await self.complete(messages, json_instruction, temperature=0.2)
        
        # Clean any accidental markdown fence
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse JSON from LLM: {e}. Raw: {response_text}")
            return {
                "error": "JSON parse failed",
                "raw_text": response_text,
            }
