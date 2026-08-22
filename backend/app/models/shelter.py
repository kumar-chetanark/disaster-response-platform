import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime
from app.core.database import Base

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=False)
    total_capacity = Column(Integer, nullable=False, default=500)
    current_occupancy = Column(Integer, nullable=False, default=0)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
