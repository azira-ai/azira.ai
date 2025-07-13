# app/models/outfit_feedback.py
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class OutfitFeedback(Base):
    __tablename__ = "outfit_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    outfit_id = Column(UUID(as_uuid=True), ForeignKey("outfits.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    user = relationship("User", back_populates="outfit_feedbacks")
    outfit = relationship("Outfit", back_populates="feedbacks")
