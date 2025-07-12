
from app.config import settings
import httpx
import json

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"

    async def analyze_image(self, img_url: str):
        prompt = """
        Analyze the clothing item in the provided image. Return a JSON object with the following structure:
        {
            "clothe_type": "string",
            "color": "string",
            "characteristics": ["string"],
            "style": "string"
        }
        Example:
        {
            "clothe_type": "Hoodie",
            "color": "Two-tone grey",
            "characteristics": ["Hooded", "Full-zip front closure", "Long sleeves", "Ribbed cuffs and hem", "Soft, possibly fleece-lined fabric", "Casual"],
            "style": "Casual, athletic, comfortable"
        }
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url,
                headers={"Content-Type": "application/json"},
                params={"key": self.api_key},
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt},
                                {"inline_data": {"mime_type": "image/jpeg", "data": img_url}}
                            ]
                        }
                    ]
                }
            )
            response.raise_for_status()
            result = response.json()
            return json.loads(result["candidates"][0]["content"]["parts"][0]["text"])