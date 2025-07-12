from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from sqlalchemy.future import select
from app.models.item import Item
from app.models.outfit import Outfit
from app.schemas.outfit import OutfitCreate
from app.config import settings
from uuid import UUID
import httpx
import json

class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_api_url = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent"

    async def generate_outfit(self, user_id: UUID, event_raw: str, event_json: dict):
        # Generate embedding for event description
        event_embedding = await self._get_event_embedding(event_raw)
        
        # Query for relevant items using vector similarity
        query = text("""
            SELECT id, name, type, color, state, season, img_url, for_sale, price, created_at
            FROM items
            WHERE user_id = :user_id
            ORDER BY embedding <-> :event_embedding
            LIMIT 10
        """)
        result = await self.db.execute(query, {"user_id": user_id, "event_embedding": event_embedding})
        items = result.fetchall()

        # Prepare items for LLM
        item_descriptions = [
            {
                "id": str(item.id),
                "type": item.type,
                "color": item.color,
                "style": item.state,  # Assuming state reflects condition; adjust if needed
                "season": item.season
            }
            for item in items
        ]

        # Query LLM for trendy outfit recommendation
        outfit_items = await self._get_trendy_outfit(event_raw, item_descriptions)
        
        # Create outfit
        outfit = OutfitCreate(
            event_raw=event_raw,
            event_json=event_json,
            items=[UUID(item_id) for item_id in outfit_items]
        )
        db_outfit = Outfit(**outfit.dict(), user_id=user_id)
        self.db.add(db_outfit)
        await self.db.commit()
        await self.db.refresh(db_outfit)
        return db_outfit

    async def _get_event_embedding(self, event_text: str):
        """Generate embedding for event description using Gemini."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.embedding_api_url,
                headers={"Content-Type": "application/json"},
                params={"key": settings.GEMINI_API_KEY},
                json={"content": {"parts": [{"text": event_text}]}}
            )
            response.raise_for_status()
            embedding = response.json()["embedding"]["values"]
            return embedding

    async def _get_trendy_outfit(self, event_text: str, items: list):
        """Query Gemini for a trendy outfit based on available items."""
        prompt = f"""
        You are a fashion expert with knowledge of 2025 fashion trends. The user is attending an event described as: "{event_text}".
        Here are the available clothing items in their closet:
        {json.dumps(items, indent=2)}

        Based on current fashion trends (e.g., popular colors, styles, and combinations for 2025), recommend a cohesive outfit by selecting up to 5 item IDs from the provided list. Ensure the outfit is stylish, appropriate for the event, and follows trend guidelines (e.g., color coordination, seasonal appropriateness). Return a JSON array of item IDs, like ["id1", "id2", ...].

        Example trends for 2025 (adjust based on your knowledge):
        - Bold monochromatic looks are in.
        - Sustainable fabrics like organic cotton are popular.
        - Oversized blazers paired with fitted bottoms for smart casual.
        - Vibrant colors like coral and emerald are trending for summer events.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
                headers={"Content-Type": "application/json"},
                params={"key": settings.GEMINI_API_KEY},
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt}
                            ]
                        }
                    ]
                }
            )
            response.raise_for_status()
            result = response.json()
            outfit_ids = json.loads(result["candidates"][0]["content"]["parts"][0]["text"])
            return outfit_ids

    async def update_item_embedding(self, item_id: UUID, item_data: dict):
        """Update the embedding for an item based on its characteristics."""
        description = f"{item_data['type']} in {item_data['color']} color, style: {item_data.get('style', 'unknown')}, season: {', '.join(item_data.get('season', []))}"
        embedding = await self._get_event_embedding(description)
        await self.db.execute(
            text("UPDATE items SET embedding = :embedding WHERE id = :id"),
            {"embedding": embedding, "id": item_id}
        )
        await self.db.commit()