import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    location_text = Column(String(255), nullable=False)
    disaster_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    
    is_people_trapped = Column(Boolean, default=False)
    is_immediate_danger = Column(Boolean, default=False)
    affected_people_estimate = Column(String(50), nullable=True)
    citizen_contact = Column(String(100), nullable=True)
    
    status = Column(String(50), default="INGESTED") # INGESTED, CORROBORATED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    incident = relationship("Incident", back_populates="citizen_reports")
