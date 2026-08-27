from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime, timezone

def get_utc_now():
    return datetime.now(timezone.utc)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, default="Squad")  # e.g. Squad, Ambulance, UAV Drone, Rescue Helicopter, Boat, Shelter, Supply Depot
    category = Column(String, nullable=False, index=True)  # rescue, medical, aerial, water, land, shelter, supplies, police_army
    status = Column(String, default="AVAILABLE", index=True)  # AVAILABLE, ASSIGNED, DISPATCHED, EN_ROUTE, ON_SCENE, UNAVAILABLE, MAINTENANCE
    base_location = Column(String, nullable=False)
    
    # Precise GPS Positioning for Map & Proximity Dispatch
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Core Capabilities & Capacity
    capabilities = Column(String, nullable=True)  # Comma-separated: e.g. "Water Rescue, Swift-water Search, Evacuation"
    capacity = Column(Integer, nullable=True)  # Evacuation/patient capacity (e.g. 20 people, 4 patients)
    operating_range = Column(String, nullable=True)  # e.g. "45 km", "60 min flight time"
    vehicle_registration = Column(String, nullable=True)  # e.g. "KA-04-NDRF-104"

    # Direct Incident / Operation Linking
    assigned_incident_id = Column(String, nullable=True, index=True)
    assigned_operation_id = Column(String, nullable=True, index=True)

    # Personnel & Equipment
    personnel_count = Column(Integer, default=0)
    equipment_details = Column(String, nullable=True)

    # Specific Shelter Capacity Metrics
    shelter_capacity = Column(Integer, nullable=True)
    shelter_occupied = Column(Integer, default=0, nullable=True)

    # Relief Supplies & Stockpile Tracking
    supplies_food_days = Column(Integer, nullable=True)
    supplies_food_people = Column(Integer, nullable=True)
    supplies_medicine_count = Column(Integer, nullable=True)
    supplies_clothing_count = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    operations = relationship("Operation", back_populates="resource", cascade="all, delete-orphan")
    allocations = relationship("ResourceAllocation", back_populates="resource", cascade="all, delete-orphan")
