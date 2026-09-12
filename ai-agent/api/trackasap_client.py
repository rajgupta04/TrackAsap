import logging
import aiohttp
from typing import Dict, Any, Optional
from agent.config import Config

logger = logging.getLogger("ai_interviewer.api_client")

class TrackAsapClient:
    """
    Async HTTP client for communicating with the TrackAsap Node.js backend.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or Config.TRACKASAP_API_URL).rstrip("/")

    def _headers(self, auth_token: str) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        return headers

    async def get_session(self, session_id: str, auth_token: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/interview/session/{session_id}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self._headers(auth_token)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("session")
                    logger.error(f"Failed to fetch session {session_id}: HTTP {resp.status}")
        except Exception as e:
            logger.error(f"Network error fetching session: {e}")
        return None

    async def get_user_context(self, auth_token: str) -> Dict[str, Any]:
        url = f"{self.base_url}/interview/user-context"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self._headers(auth_token)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("context", {})
        except Exception as e:
            logger.error(f"Network error fetching user context: {e}")
        return {}

    async def append_transcript_turn(
        self,
        session_id: str,
        speaker: str,
        text: str,
        section: str,
        auth_token: str,
    ) -> bool:
        url = f"{self.base_url}/interview/session/{session_id}/transcript"
        payload = {
            "speaker": speaker,
            "text": text,
            "timestamp": int(aiohttp.helpers.get_running_loop().time() * 1000),
            "section": section,
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=self._headers(auth_token)) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"Failed to append transcript turn: {e}")
            return False

    async def submit_evaluation(
        self,
        session_id: str,
        evaluation: Dict[str, Any],
        auth_token: str,
    ) -> bool:
        url = f"{self.base_url}/interview/session/{session_id}/evaluation"
        payload = {"evaluation": evaluation}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=self._headers(auth_token)) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"Failed to submit evaluation: {e}")
            return False
