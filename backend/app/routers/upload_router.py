from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.config import settings
import httpx
import uuid

router = APIRouter()

@router.post("/upload-image")
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
    return {"url": public_url, "filename": file_key}
