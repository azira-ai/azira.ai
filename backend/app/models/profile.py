# app/models/profile.py
import uuid
from datetime import date
from sqlalchemy import Column, String, Date
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    full_name = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    phone = Column(String, nullable=True)
    gender = Column(String, nullable=True)
