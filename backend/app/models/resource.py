import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # medical, police_army, rescue, aerial, water, land, shelter, supplies
    status = Column(String(50), nullable=False, default="AVAILABLE", index=True) # AVAILABLE, IN OPERATION, DISPATCHED, MAINTENANCE, UNAVAILABLE
    
    base_location = Column(String(255), nullable=False, index=True)
    personnel_count = Column(Integer, default=0)
    equipment_details = Column(Text, nullable=True)
    
    # Specific category attributes
    shelter_capacity = Column(Integer, nullable=True)
    shelter_occupied = Column(Integer, nullable=True)
    supplies_food_days = Column(Integer, nullable=True)
    supplies_food_people = Column(Integer, nullable=True)
    supplies_medicine_count = Column(Integer, nullable=True)
    supplies_clothing_count = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    operations = relationship("Operation", back_populates="resource")
    allocations = relationship("ResourceAllocation", back_populates="resource")
