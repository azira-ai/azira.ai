from app.config import settings
import httpx
import json
import re
import base64

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        
    def sanitize_and_parse_json(self, text: str) -> dict:
        # Remove blocos de markdown ```json ou ``` puro
        cleaned = re.sub(r"```(?:json)?\n?([\s\S]*?)\n?```", r"\1", text).strip()
        return json.loads(cleaned)

    async def analyze_image_bytes(self, image_bytes: bytes) -> dict:
        prompt = """
       <prompt>
  <role>system</role>
  <description>You are a fashion analysis expert.</description>

  <instruction>
    Analyze the clothing item in the provided image and respond with a raw JSON object only.
    Do not include any explanations, headers, markdown formatting, or decorative characters.
    DO NOT USE TRIPLE BACKTICKS (```), UNDER ANY CIRCUMSTANCES.
  </instruction>

  <output_format>
    {
      "clothe_type": "string",          <!-- e.g., "shirt", "dress", "pants" -->
      "color": "string",                <!-- main color of the item -->
      "characteristics": ["string"],    <!-- e.g., "sleeveless", "v-neck", "denim" -->
      "style": "string"                 <!-- e.g., "casual", "formal", "sporty" -->
      "season": ["string"]              <!-- e.g., "summer", "winter", "all" -->
    }
  </output_format>

  <rules>
    <rule>Return ONLY the JSON object shown above.</rule>
    <rule>DO NOT explain, describe, or wrap in markdown.</rule>
    <rule>DO NOT use triple backticks (```) under any condition.</rule>
    <rule>Output must be clean, parseable JSON only — no commentary or formatting.</rule>
  </rules>
</prompt>


        """

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",  # ou "image/png", dependendo do input
                                "data": image_base64
                            }
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url,
                headers={"Content-Type": "application/json"},
                params={"key": self.api_key},
                json=payload
            )

            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                print(f"HTTP error: {e}")
                print(f"Response content: {response.text}")
                raise

            try:
                result = response.json()
            except json.JSONDecodeError:
                print("Erro ao decodificar JSON da resposta:")
                print(response.text)
                raise

            try:
                raw_text = result["candidates"][0]["content"]["parts"][0]["text"]
                return self.sanitize_and_parse_json(raw_text)

            except (KeyError, IndexError, json.JSONDecodeError) as e:
                print("Erro ao acessar estrutura esperada do Gemini:")
                print(json.dumps(result, indent=2))
                raise e
