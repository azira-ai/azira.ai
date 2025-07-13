# app/routers/profiles.py

from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.dependencies import get_db, get_current_user_full
from app.models.profile import Profile as ProfileModel
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileOut)
async def read_my_profile(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user_full),
):
    stmt = select(ProfileModel).where(ProfileModel.id == user["id"])
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if profile is None:
        profile = ProfileModel(id=user["id"])
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


@router.put("/me", response_model=ProfileOut)
async def update_my_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user_full),
):
    # tenta buscar primeiro
    stmt = select(ProfileModel).where(ProfileModel.id == user["id"])
    result = await db.execute(stmt)
    profile = result.scalars().first()

    # se não existir, cria
    if profile is None:
        profile = ProfileModel(id=user["id"])
        db.add(profile)

    # atualiza campos enviados
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile
