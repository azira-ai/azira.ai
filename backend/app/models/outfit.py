from sqlalchemy import Column, UUID, Text, ARRAY, JSONB, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    event_raw = Column(Text)
    event_json = Column(JSONB)
    items = Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)