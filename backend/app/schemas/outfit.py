from pydantic import BaseModel, UUID4
from typing import List, Optional, Dict
from datetime import datetime

class OutfitBase(BaseModel):
    event_raw: Optional[str] = None
    event_json: Optional[Dict] = None
    items: List[UUID4]

class OutfitCreate(OutfitBase):
    pass

class Outfit(OutfitBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime

    class Config:
        orm_mode = True