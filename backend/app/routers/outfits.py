from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user
from app.schemas.outfit import OutfitCreate, Outfit
from app.services.recommendation_service import RecommendationService
from typing import List

router = APIRouter()

@router.post("/", response_model=Outfit)
async def create_outfit(
    outfit: OutfitCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    db_outfit = await recommendation_service.generate_outfit(user_id, outfit.event_raw, outfit.event_json)
    return db_outfit

@router.get("/", response_model=List[Outfit])
async def get_outfits(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Outfit).filter_by(user_id=user_id))
    return result.scalars().all()