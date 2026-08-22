import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Assessment(Base):
    """
    Generalized Field Assessment Model:
    Supports Drone, Helicopter, Land Vehicle, Water Boat, and Field Recon.
    """
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    assessment_mode = Column(String(50), nullable=False, default="Aerial — Drone") # Drone, Helicopter, Land Team, Water Team
    mission_type = Column(String(100), nullable=False, default="Area Scan / Survey")
    asset_id = Column(String(100), nullable=True)
    asset_name = Column(String(255), nullable=False)
    
    assessment_time = Column(String(50), nullable=True)
    weather_conditions = Column(String(255), nullable=True)
    area_surveyed = Column(String(255), nullable=False)
    hazards_detected = Column(Text, nullable=True) # JSON or comma-separated list
    
    structures_damaged_count = Column(Integer, default=0)
    road_accessibility_status = Column(String(100), nullable=False, default="Passable") # Clear, Blocked, Impassable
    people_observed = Column(String(255), nullable=True)
    recommended_resources = Column(Text, nullable=True)
    evacuation_route_status = Column(String(100), default="Compromised") # Clear, Compromised
    
    operator_observations = Column(Text, nullable=True)
    confidence_score = Column(Float, default=90.0)
    media_file_urls = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    incident = relationship("Incident", back_populates="assessments")
