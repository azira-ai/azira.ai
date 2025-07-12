from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: UUID4
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
