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
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    facility_type = Column(String(50), default="Shelter")
    resource_center_id = Column(String(50), nullable=True, index=True) # 'Shelter' or 'Hospital'
    
    available_beds = Column(Integer, default=100)
    emergency_beds = Column(Integer, default=30)
    icu_beds = Column(Integer, default=10)
    doctors_count = Column(Integer, default=5)
    nurses_count = Column(Integer, default=12)
    water_litres = Column(Integer, default=5000)
    food_person_days = Column(Integer, default=2000)
    medicine_days_stock = Column(Integer, default=7)
    
    created_at = Column(DateTime, default=datetime.utcnow)
