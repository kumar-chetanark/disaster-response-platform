import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.core.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False) # food, medicine, clothing, power, shelter_supplies
    quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(50), nullable=False, default="units")
    storage_location = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
