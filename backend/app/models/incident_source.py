import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class IncidentSource(Base):
    """
    Corroboration source ledger:
    Citizen reports, meteorological radar bulletins, news alerts, satellite pings,
    and field assessments contributing to a single canonical incident.
    """
    __tablename__ = "incident_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source_type = Column(String(50), nullable=False) # CITIZEN, WEATHER, NEWS, GOVERNMENT, FIELD_ASSESSMENT, SATELLITE
    source_label = Column(String(255), nullable=False)
    channel_badge = Column(String(50), nullable=True) # CELL_SMS, IVR_VOICE, WEB_APP, IMD_METEO, GOV_BULLETIN, MEDIA_INTEL
    confidence_score = Column(Float, default=90.0)
    summary = Column(Text, nullable=False)
    raw_content = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    incident = relationship("Incident", back_populates="sources")
