
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user_full

router = APIRouter()

@router.get("/me")
async def get_current_user(user: dict = Depends(get_current_user_full)):
    return {
        "id": user["id"],
        "email": user["email"],
        "metadata": user.get("metadata", {}),
    }
