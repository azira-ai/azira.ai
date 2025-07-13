from pydantic import BaseModel, UUID4
from typing import List, Optional, Dict, Any
from datetime import datetime

class OutfitBase(BaseModel):
    event_raw: Optional[str] = None
    event_json: Optional[Dict[str, Any]] = None
    items: List[UUID4]

class OutfitCreate(OutfitBase):
    pass

class Outfit(BaseModel):
    id: UUID4
    user_id: UUID4
    event_raw: str
    event_json: Dict[str, Any]
    items: List[UUID4]
    created_at: datetime

    class Config:
        from_attributes = True

class OutfitResponse(BaseModel):
    outfit: Outfit
    recommendation: str
