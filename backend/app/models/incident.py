import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    disaster_type = Column(String(50), nullable=False, index=True) # cyclone, flood, earthquake, infrastructure, fire
    severity = Column(String(20), nullable=False, default="MEDIUM", index=True) # CRITICAL, HIGH, MEDIUM, LOW
    priority_level = Column(String(20), nullable=False, default="Level 2") # Level 1, Level 2, Level 3
    status = Column(String(20), nullable=False, default="ACTIVE", index=True) # ACTIVE, MONITORING, RESOLVED
    
    # Spatial / Location Attributes
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=False)
    sector = Column(String(50), nullable=True)
    
    # Impact Assessments
    affected_population = Column(String(50), nullable=True)
    affected_area_sq_km = Column(Float, nullable=True)
    resource_coverage_pct = Column(Integer, default=80)
    is_field_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sources = relationship("IncidentSource", back_populates="incident", cascade="all, delete-orphan")
    citizen_reports = relationship("CitizenReport", back_populates="incident")
    assessments = relationship("Assessment", back_populates="incident")
    operations = relationship("Operation", back_populates="incident")
    alerts = relationship("Alert", back_populates="incident")
    reports = relationship("Report", back_populates="incident")
