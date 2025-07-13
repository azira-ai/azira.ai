from sqlalchemy import Column, UUID, Text, ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime
from sqlalchemy.orm import relationship

Base = declarative_base()

feedbacks = relationship("OutfitFeedback", back_populates="outfit")
analytics = relationship("OutfitAnalytics", back_populates="outfit")

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    event_raw = Column(Text)
    event_json = Column(JSONB)
    items = Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
class CustomOutfit(Base):
    __tablename__ = "custom_outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    items = Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    generated_by = Column(Text, nullable=True)  # Optional field to track generation method
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)