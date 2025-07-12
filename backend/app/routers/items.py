
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.dependencies import get_db, get_current_user
from app.models.item import Item as ItemModel  # modelo SQLAlchemy
from app.schemas.item import ItemCreate, Item  # Pydantic
from app.services.gemini_service import GeminiService
from app.config import settings
import httpx
from typing import List
import uuid

router = APIRouter()

async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    file_key = f"{user_id}/{uuid.uuid4()}_{file.filename}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{file_key}",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Content-Type": file.content_type
                },
                content=await file.read()
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Upload failed: {response.text}"
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{file_key}"
    return public_url

@router.post("/", response_model=Item)
async def create_item(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type")
    
    # Lê conteúdo da imagem uma vez
    image_bytes = await file.read()

    # Upload image to Supabase Storage
    file.file.seek(0)  # Reset buffer para upload
    img_url = await upload_image(file, user_id)
    print("image uploaded to Supabase:", img_url)
    
    # Analyze image with Gemini using bytes
    gemini_service = GeminiService()
    analysis = await gemini_service.analyze_image_bytes(image_bytes)
    
    item_data = ItemCreate(
        name=analysis.get("clothe_type"),
        type=analysis.get("clothe_type"),
        characteristics=analysis.get("characteristics"),
        style=analysis.get("style"),
        color=analysis.get("color"),
        state="new",
        season=analysis.get("season", []),
        img_url=img_url,
        for_sale=False
    )
    
    db_item = ItemModel(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        created_at=datetime.now(timezone.utc),
        **item_data.dict()
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    
    return db_item

@router.get("/", response_model=List[Item])
async def get_items(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).filter_by(user_id=user_id))
    return result.scalars().all()
