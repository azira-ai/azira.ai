from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    preferred_colors = Column(JSON, nullable=True)
    preferred_styles = Column(JSON, nullable=True)
    preferred_formality = Column(String, nullable=True)
    avoided_combinations = Column(JSON, nullable=True)
    favorite_items = Column(JSON, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)