import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExternalAlert(Base):
    """
    Persistent store for worldwide disaster intelligence alerts (GDACS and future global feeds).
    Deduplicated uniquely by (source, external_id).
    """
    __tablename__ = "external_alerts"

    id = Column(String(64), primary_key=True, default=lambda: f"ext-{str(uuid.uuid4())[:8]}")
    source = Column(String(32), nullable=False, index=True, default="GDACS")
    external_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(32), nullable=False, index=True)  # EARTHQUAKE, FLOOD, TROPICAL_CYCLONE, VOLCANIC_ACTIVITY, WILDFIRE, DROUGHT, STORM, TSUNAMI, LANDSLIDE, OTHER
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    country = Column(String(128), nullable=True, index=True)
    countries = Column(Text, nullable=True)  # Comma-separated list of affected countries
    location_name = Column(String(255), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    severity = Column(String(16), nullable=False, default="MEDIUM", index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    alert_level = Column(String(16), nullable=True)  # Red, Orange, Green
    alert_score = Column(Float, nullable=True)
    population_affected_est = Column(String(64), nullable=True)
    
    published_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    source_url = Column(String(512), nullable=True)
    
    status = Column(String(32), nullable=False, default="NEW", index=True)  # NEW, REVIEWED, VALIDATED, REJECTED, CONVERTED_TO_INCIDENT, EXPIRED
    converted_incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    raw_data = Column(Text, nullable=True)  # JSON serialized source payload
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship to canonical incident if converted
    converted_incident = relationship("Incident", foreign_keys=[converted_incident_id], lazy="joined")

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_external_alert_source_ext_id"),
    )
