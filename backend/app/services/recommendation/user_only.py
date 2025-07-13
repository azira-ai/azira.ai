from sqlalchemy.future import select
from uuid import UUID
import httpx
import json
import logging
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from app.models.item import Item
from app.models.outfit import Outfit
from app.models.user_preference import UserPreference
from app.models.outfit_feedback import OutfitFeedback
from app.schemas.outfit import OutfitCreate
from app.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from .helper import GeminiService  # você pode mover Gemini para um helper geral

class UserOnlyRecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = GeminiService(settings.GEMINI_API_KEY)
        self.trend_colors_2025 = ["sage green", "warm terracotta", "indigo blue", "soft beige", "deep burgundy"]
        self.trend_styles_2025 = ["oversized controlled", "vintage modern", "colorful minimalism", "texture mixing"]
        
    async def _get_outfit_items_full(self, outfit_ids: List[str]) -> List[Item]:
        try:
            uuid_ids = [UUID(id_) for id_ in outfit_ids]
            stmt = select(Item).filter(Item.id.in_(uuid_ids))
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logging.error(f"[RecommendationBase] Failed to fetch outfit items: {e}")
            return []

    async def _save_outfit(self, user_id: UUID, event_raw: str, event_json: dict, outfit_ids: List[str]) -> Outfit:
        try:
            outfit_data = OutfitCreate(
                event_raw=event_raw,
                event_json=event_json,
                items=[UUID(id_) for id_ in outfit_ids]
            )
            db_outfit = Outfit(**outfit_data.dict(), user_id=user_id)
            self.db.add(db_outfit)
            await self.db.commit()
            await self.db.refresh(db_outfit)
            return db_outfit
        except Exception as e:
            logging.error(f"[RecommendationBase] Failed to save outfit: {e}")
            raise

    async def generate_outfit(self, user_id: UUID, event_raw: str, event_json: dict, gender: str) -> Dict:
        try:
            stmt = select(Item).filter_by(user_id=user_id)
            result = await self.db.execute(stmt)
            items = result.scalars().all()

            if not items:
                return {"error": "No wardrobe items found."}

            event_context = await self._analyze_event_context(event_raw, event_json)
            item_descriptions = self._prepare_item_descriptions(items)
            scored_items = await self._score_items(event_context, item_descriptions, gender)
            categories = self._group_by_category(scored_items)

            outfit = self._assemble_best_outfit(categories)
            if not outfit:
                return {"error": "Could not generate a complete outfit."}

            db_outfit = await self._save_outfit(user_id, event_raw, event_json, outfit)

            return {
                "outfit": db_outfit,
                "items": await self._get_outfit_items_full(outfit),
                "recommendation": "Outfit generated using only your wardrobe items.",
                "is_optimal": False
            }
        except Exception as e:
            logging.error(f"[UserOnlyRecommendation] Failed: {e}")
            return {"error": "Internal error while generating outfit."}

    def _prepare_item_descriptions(self, items: List[Item]) -> List[Dict]:
        return [
            {
                "id": str(item.id),
                "category": item.category,
                "type": item.type,
                "color": item.color,
                "style": item.style,
                "season": item.season,
                "state": item.state,
            } for item in items
        ]

    async def _score_items(self, context: dict, items: List[dict], gender: str) -> List[Dict]:
        prompt = f"""
        Você é um assistente de moda. Avalie as peças abaixo com base no evento descrito e dê uma nota de 0 a 10 para cada.

        Contexto do evento:
        {json.dumps(context)}

        Gênero do usuário: {gender}

        Peças:
        {json.dumps(items)}

        Responda APENAS com um JSON válido:
        {{
          "scores": [
            {{"id": "uuid", "score": 8.3, "category": "TOP"}},
            ...
          ]
        }}
        """
        try:
            response = await self.llm.send_prompt(prompt)
            match = re.search(r'{.*}', response, re.DOTALL)
            if match:
                return json.loads(match.group(0)).get("scores", [])
        except Exception as e:
            logging.error(f"[UserOnlyScore] Erro: {e}")
        return []

    def _group_by_category(self, scored: List[Dict]) -> Dict[str, List[str]]:
        grouped = {"TOP": [], "BOTTOM": [], "SHOES": []}
        for s in sorted(scored, key=lambda x: x["score"], reverse=True):
            cat = s["category"].upper()
            if cat in grouped and len(grouped[cat]) < 1:
                grouped[cat].append(s["id"])
        return grouped

    def _assemble_best_outfit(self, grouped: Dict[str, List[str]]) -> Optional[List[str]]:
        if all(grouped[cat] for cat in ["TOP", "BOTTOM", "SHOES"]):
            return [grouped["TOP"][0], grouped["BOTTOM"][0], grouped["SHOES"][0]]
        return None

    async def _get_outfit_items_full(self, outfit_ids: List[str]) -> List[Item]:
        try:
            uuid_ids = [UUID(id_) for id_ in outfit_ids]
            stmt = select(Item).filter(Item.id.in_(uuid_ids))
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logging.error(f"Erro ao buscar peças do outfit: {e}")
            return []

    async def _analyze_event_context(self, event_raw: str, event_json: dict) -> Dict:
        prompt = f"""
        Analise o seguinte evento e extraia as seguintes informações:
        - Formalidade
        - Ambiente
        - Clima sugerido
        - Tipo do evento

        Evento:
        {event_raw}
        Detalhes:
        {json.dumps(event_json)}

        Responda com um JSON:
        {{"formalidade": "casual", "ambiente": "indoor", "clima_sugerido": "ameno", "tipo_evento": "social"}}
        """
        try:
            response = await self.llm.send_prompt(prompt)
            match = re.search(r'{.*}', response, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            logging.error(f"Erro no contexto do evento: {e}")
        return {
            "formalidade": "casual",
            "ambiente": "indoor",
            "clima_sugerido": "ameno",
            "tipo_evento": "desconhecido"
        }

    async def _save_outfit(self, user_id: UUID, event_raw: str, event_json: dict, outfit_ids: List[str]) -> Outfit:
        outfit_data = OutfitCreate(
            event_raw=event_raw,
            event_json=event_json,
            items=[UUID(id_) for id_ in outfit_ids]
        )
        db_outfit = Outfit(**outfit_data.dict(), user_id=user_id)
        self.db.add(db_outfit)
        await self.db.commit()
        await self.db.refresh(db_outfit)
        return db_outfit
