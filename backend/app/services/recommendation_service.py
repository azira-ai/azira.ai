
from sqlalchemy.ext.asyncio import AsyncSession
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
        self.gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

    async def generate_outfit(self, user_id: UUID, event_raw: str, event_json: dict):
        # Fetch all items for the user
        result = await self.db.execute(select(Item).filter_by(user_id=user_id))
        items = result.scalars().all()

        # Prepare items for LLM
        item_descriptions = [
            {
                "id": str(item.id),
                "type": item.type,
                "color": item.color,
                "state": item.state,
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
        await db.commit()
        await self.db.refresh(db_outfit)
        return db_outfit

    async def _get_trendy_outfit(self, event_text: str, items: list):
        """Query Gemini for a trendy outfit based on available items."""
        prompt = f"""
        You are a fashion expert with knowledge of 2025 fashion trends. The user is attending an event described as: "{event_text}".
        Here are the available clothing items in their closet:
        {json.dumps(items, indent=2)}

        Based on current fashion trends (e.g., popular colors, styles, and combinations for 2025), recommend a cohesive outfit by selecting up to 5 item IDs from the provided list. Ensure the outfit is stylish, appropriate for the event, and follows trend guidelines (e.g., color coordination, seasonal appropriateness). Return a JSON array of item IDs, like ["id1", "id2", ...].

        Example trends for 2025:
        - Bold monochromatic looks are in.
        - Sustainable fabrics like organic cotton are popular.
        - Oversized blazers paired with fitted bottoms for smart casual.
        - Vibrant colors like coral and emerald are trending for summer events.

        If no suitable items are available, return an empty array [].
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.gemini_api_url,
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
            try:
                outfit_ids = json.loads(result["candidates"][0]["content"]["parts"][0]["text"])
                return outfit_ids
            except (KeyError, json.JSONDecodeError):
                return []  # Fallback to empty array if LLM response is invalid
