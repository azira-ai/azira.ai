# app/routers/upload_router.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.config import settings
import httpx
import uuid
from pathlib import Path as _Path

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/image", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Sanitize filename: keep only extension
    ext = _Path(file.filename).suffix
    file_key = f"{user_id}/{uuid.uuid4()}{ext}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{file_key}",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Content-Type": file.content_type
                },
                content=await file.read()
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

    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{file_key}"
    return {"url": public_url, "filename": file_key}
