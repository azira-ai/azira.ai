import httpx
import logging
import json
import re

class GeminiService:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    async def send_prompt(self, prompt: str, max_retries: int = 3) -> str:
        """Envia prompt para o Gemini com retry automático"""
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
                    response = await client.post(
                        self.url,
                        headers={"Content-Type": "application/json"},
                        params={"key": self.api_key},
                        json={"contents": [{"parts": [{"text": prompt}]}]}
                    )
                    response.raise_for_status()
                    result = response.json()
                    parts = result.get("candidates", [])[0].get("content", {}).get("parts", [])
                    if parts and isinstance(parts[0], dict) and "text" in parts[0]:
                        return parts[0]["text"]
            except Exception as e:
                logging.error(f"[GeminiService] Tentativa {attempt + 1} falhou: {e}")
                if attempt == max_retries - 1:
                    raise
        return ""