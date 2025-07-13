from fastapi import APIRouter, UploadFile, File, HTTPException
from rembg import remove
from app.services.supabase_service import upload_to_supabase
import uuid
from io import BytesIO

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/remove-background/")
async def remove_background_and_upload(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        output = remove(contents)  # Remove fundo
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar imagem: {e}")

    # Gerar nome único para o arquivo
    filename = f"{uuid.uuid4()}.png"
    
    # Upload para o Supabase
    try:
        url = upload_to_supabase(filename, output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao subir para Supabase: {e}")

    return {"url": url}
