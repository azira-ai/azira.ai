from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user
from app.schemas.outfit import OutfitCreate, Outfit, OutfitResponse
from app.schemas.outfit import OutfitResponse, Outfit, OutfitCreate as OutfitSchema
from app.services.recommendation_service import RecommendationService
from typing import List
from app.models.outfit import Outfit as OutfitModel
from fastapi import HTTPException  # Adicione no topo, se ainda não tiver

router = APIRouter()

@router.post("/", response_model=OutfitResponse)
async def create_outfit(
    outfit: OutfitCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    result = await recommendation_service.generate_outfit(user_id, outfit.event_raw, outfit.event_json)

    if "error" in result or "outfit" not in result:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao gerar o outfit"))

    db_outfit_orm = result["outfit"]
    recommendation_text = result.get("recommendation", "Não foi possível gerar uma recomendação detalhada no momento.")
    
    db_outfit = Outfit.from_orm(db_outfit_orm)
    
    return OutfitResponse(outfit=db_outfit, recommendation=recommendation_text)


@router.get("/", response_model=List[Outfit])
async def get_outfits(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OutfitModel).filter_by(user_id=user_id))
    return result.scalars().all()

