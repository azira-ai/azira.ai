from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.dependencies import get_db, get_current_user
from app.models.item import Item
from app.schemas.item import ItemCreate, Item
from app.services.gemini_service import GeminiService
from app.services.recommendation_service import RecommendationService
from app.config import settings
import httpx
from typing import List
import uuid

router = APIRouter()

async def upload_to_supabase_storage(file: UploadFile, user_id: str) -> str:
    """Upload file to Supabase Storage and return the public URL."""
    file_name = f"{user_id}/{uuid.uuid4()}_{file.filename}"
    async with httpx.AsyncClient() as client:
        # Upload file to Supabase Storage
        response = await client.post(
            f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{file_name}",
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                "Content-Type": file.content_type
            },
            content=await file.read()
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image to Supabase Storage"
            )
        
        # Get public URL for the uploaded file
        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{file_name}"
        return public_url

@router.post("/", response_model=Item)
async def create_item(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type")
    
    # Upload image to Supabase Storage
    img_url = await upload_to_supabase_storage(file, user_id)
    
    # Analyze image with Gemini
    gemini_service = GeminiService()
    analysis = await gemini_service.analyze_image(img_url)
    
    item_data = ItemCreate(
        name=analysis.get("clothe_type"),
        type=analysis.get("clothe_type"),
        color=analysis.get("color"),
        state="new",  # Default state
        season=["all"],  # Default season
        img_url=img_url,
        for_sale=False
    )
    
    db_item = Item(**item_data.dict(), user_id=user_id, embedding=[0.0] * 1536)  # Temporary embedding
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    
    # Update item embedding
    recommendation_service = RecommendationService(db)
    await recommendation_service.update_item_embedding(
        db_item.id,
        {
            "type": db_item.type,
            "color": db_item.color,
            "style": analysis.get("style", "casual"),
            "season": db_item.season
        }
    )
    
    return db_item

@router.get("/", response_model=List[Item])
async def get_items(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).filter_by(user_id=user_id))
    return result.scalars().all()