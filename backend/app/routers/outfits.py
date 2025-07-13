from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user
from app.schemas.outfit import OutfitCreate, Outfit, OutfitResponse
from app.schemas.outfit import OutfitResponse, Outfit, OutfitCreate as OutfitSchema, OutfitRequest, CustomOutfit, CustomOutfitRequest, CustomOutfitResponse
from app.services.recommendation_service import RecommendationService
from typing import List
from app.models.outfit import Outfit as OutfitModel, CustomOutfit as CustomOutfitModel
from fastapi import HTTPException  # Adicione no topo, se ainda não tiver
from app.dependencies import get_current_user_full
from app.services.recommendation.hybrid import HybridRecommendationService
from app.services.recommendation.user_only import UserOnlyRecommendationService


router = APIRouter()

@router.post("/", response_model=OutfitResponse)
async def create_outfit(
    outfit: OutfitRequest,
    user: dict = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    gender = user["metadata"].get("gender", "unspecified")
    
    if outfit.mode == "user_only":
        service = UserOnlyRecommendationService(db)
    else:
        service = HybridRecommendationService(db)
    

    result = await service.generate_outfit(user["id"], outfit.event_raw, outfit.event_json, gender)

    if "error" in result: 
        raise HTTPException(status_code=400, detail=result["error"])
    
    if "outfit" not in result:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao gerar o outfit"))

    db_outfit_orm = result["outfit"]
    recommendation_text = result.get("recommendation", "Não foi possível gerar uma recomendação detalhada no momento.")
    
    db_outfit = Outfit.from_orm(db_outfit_orm)
    
    # adiciona também a tabela CustomOutfitModel
    custom_outfit = CustomOutfitModel(
        user_id=user["id"],
        generated_by="system",  
        items=db_outfit.items
    )
    
    db.add(custom_outfit)
    await db.commit()
    await db.refresh(custom_outfit)

    
    return OutfitResponse(outfit=db_outfit, recommendation=recommendation_text)


@router.post("/custom", response_model=CustomOutfitResponse)
async def create_custom_outfit(
    outfit: CustomOutfitRequest, 
    use_id: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
): 
    if not outfit.items:
        raise HTTPException(status_code=400, detail="A lista de itens não pode estar vazia.")

    db_outfit = CustomOutfitModel(
        user_id=use_id,
        generated_by="user",  
        items=outfit.items
    )

    db.add(db_outfit)
    await db.commit()
    await db.refresh(db_outfit)

    custom_outfit = CustomOutfit.from_orm(db_outfit)
    
    return CustomOutfitResponse(outfit=custom_outfit)
    

@router.get("/", response_model=List[Outfit])
async def get_outfits(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OutfitModel).filter_by(user_id=user_id))
    return result.scalars().all()


@router.get("/custom", response_model=List[CustomOutfit])
async def get_custom_outfits(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CustomOutfitModel).filter_by(user_id=user_id))
    return result.scalars().all()