# app/routers/items.py
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Path, Body
from pydantic import BaseModel, UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pathlib import Path as _Path
import uuid
import httpx
from rembg import remove

from app.dependencies import get_db, get_current_user
from app.models.item import Item as ItemModel
from app.schemas.item import ItemCreate, Item
from app.services.gemini_service import GeminiService
from app.config import settings

router = APIRouter()  # prefix("/items") set in main.py

# --- Schemas ---
class ItemUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    characteristics: Optional[List[str]] = None
    style: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    season: Optional[List[str]] = None
    img_url: Optional[str] = None
    for_sale: Optional[bool] = None
    price: Optional[float] = None

# --- Helpers ---
def _extract_supabase_path(public_url: str) -> str:
    prefix = (
        f"{settings.SUPABASE_URL}/storage/v1/object/public/"
        f"{settings.SUPABASE_STORAGE_BUCKET}/"
    )
    return public_url.replace(prefix, "")

async def _upload_bytes_to_supabase(
    image_bytes: bytes,
    user_id: str,
    filename: str,
) -> str:
    ext = _Path(filename).suffix or ".png"
    file_key = f"{user_id}/{uuid.uuid4()}{ext}"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.SUPABASE_URL}/storage/v1/object/"
                f"{settings.SUPABASE_STORAGE_BUCKET}/{file_key}",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Content-Type": "image/png",
                },
                content=image_bytes,
            )
            if resp.status_code not in (200, 201):
                raise HTTPException(
                    status_code=500,
                    detail=f"Upload failed: {resp.status_code} {resp.text}"
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    return (
        f"{settings.SUPABASE_URL}/storage/v1/object/public/"
        f"{settings.SUPABASE_STORAGE_BUCKET}/{file_key}"
    )

# --- Routes ---
@router.post("/", response_model=Item)
async def create_item(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Lê os bytes da imagem enviada
    image_bytes = await file.read()

    # Remove fundo da imagem
    try:
        image_without_bg = remove(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover fundo da imagem: {e}")

    # Faz upload da imagem sem fundo para o Supabase
    img_url = await _upload_bytes_to_supabase(image_without_bg, user_id, file.filename)

    # Analisa imagem sem fundo com Gemini
    gemini = GeminiService()
    analysis = await gemini.analyze_image_bytes(image_without_bg)

    payload = ItemCreate(
        name=analysis.get("clothe_type"),
        type=analysis.get("clothe_type"),
        characteristics=analysis.get("characteristics"),
        style=analysis.get("style"),
        color=analysis.get("color"),
        category=analysis.get("category"),
        state="new",
        season=analysis.get("season", []),
        img_url=img_url,
        for_sale=False,
    )

    db_item = ItemModel(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        created_at=datetime.now(timezone.utc),
        **payload.dict(),
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[Item])
async def get_items(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ItemModel).filter_by(user_id=user_id))
    return result.scalars().all()

@router.get("/{item_id}", response_model=Item)
async def get_item_by_id(
    item_id: UUID4 = Path(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemModel).where(
            ItemModel.id == item_id,
            ItemModel.user_id == user_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.patch("/{item_id}", response_model=Item)
async def update_item(
    item_id: UUID4 = Path(...),
    update: ItemUpdate = Body(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemModel).where(
            ItemModel.id == item_id,
            ItemModel.user_id == user_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in update.dict(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item

# Também aceita PUT para compatibilidade com clientes externos
@router.put("/{item_id}", response_model=Item)
async def update_item_put(
    item_id: UUID4 = Path(...),
    update: ItemUpdate = Body(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_item(item_id, update, user_id, db)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID4 = Path(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemModel).where(
            ItemModel.id == item_id,
            ItemModel.user_id == user_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    supa_path = _extract_supabase_path(item.img_url)
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{settings.SUPABASE_URL}/storage/v1/object/"
            f"{settings.SUPABASE_STORAGE_BUCKET}/{supa_path}",
            headers={"Authorization": f"Bearer {settings.SUPABASE_KEY}"}
        )
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail="Failed to delete image")

    await db.delete(item)
    await db.commit()


@router.get("/query/join", response_model=List[Item])
async def get_mine_and_paid_items(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ItemModel).filter_by(user_id=user_id))
    personal_items = result.scalars().all()
    
    paid_result = await db.execute(
        select(ItemModel).filter(
            ItemModel.for_sale == True,
            ItemModel.user_id != user_id
        )
    )
    
    paid_items = paid_result.scalars().all()
    
    items = personal_items + paid_items
    return items