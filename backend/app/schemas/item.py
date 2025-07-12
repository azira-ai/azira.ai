from pydantic import BaseModel, UUID4
from typing import List, Optional

class ItemBase(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    state: Optional[str] = None
    season: Optional[List[str]] = None
    img_url: str
    for_sale: bool = False
    price: Optional[float] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: UUID4
    user_id: UUID4
    created_at: str

    model_config = {
        "from_attributes": True
    }