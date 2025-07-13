
from sqlalchemy import Column, UUID, Text, ARRAY, Boolean, Numeric, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(Text)
    type = Column(Text)
    color = Column(Text)
    state = Column(Text)
    season = Column(ARRAY(Text))
    category = Column(Text)  
    img_url = Column(Text, nullable=False)
    for_sale = Column(Boolean, default=False)
    price = Column(Numeric)  # Constraint defined in SQL schema
    characteristics = Column(ARRAY(Text)) 
    style = Column(Text)                  
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
