# app/schemas/profile.py

from pydantic import BaseModel, UUID4
from datetime import date

class ProfileBase(BaseModel):
    full_name: str | None = None
    instagram: str | None = None
    profile_picture: str | None = None
    bio: str | None = None
    date_of_birth: date | None = None
    phone: str | None = None
    gender: str | None = None

class ProfileUpdate(ProfileBase):
    """Para PUT /profiles/me — todos campos opcionais."""
    pass

class ProfileOut(ProfileBase):
    """Para GET /profiles/me — inclui o id."""
    id: UUID4

    class Config:
        from_attributes = True
