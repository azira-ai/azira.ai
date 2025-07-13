from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class OutfitAnalytics(Base):
    __tablename__ = "outfit_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    outfit_id = Column(UUID(as_uuid=True), ForeignKey("outfits.id"), nullable=False)
    
    # Métricas de performance
    generation_time = Column(Float, nullable=True)  # Tempo de geração em segundos
    confidence_score = Column(Float, nullable=True)  # Score de confiança da IA
    validation_score = Column(Float, nullable=True)  # Score de validação
    strategy_used = Column(String, nullable=True)  # Estratégia usada para gerar
    
    # Análise de contexto
    event_context = Column(JSON, nullable=True)
    user_preferences_used = Column(JSON, nullable=True)
    item_scores = Column(JSON, nullable=True)
    
    # Resultados
    color_harmony_score = Column(Float, nullable=True)
    style_compatibility_score = Column(Float, nullable=True)
    trend_alignment_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    user = relationship("User", back_populates="outfit_analytics")
    outfit = relationship("Outfit", back_populates="analytics")