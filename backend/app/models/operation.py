import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Operation(Base):
    """
    Operation record created exclusively upon Authority approval/dispatch.
    """
    __tablename__ = "operations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    operation_type = Column(String(100), nullable=False) # Rescue Team Mission, Route Clearance, Air Evacuation
    state = Column(String(50), nullable=False, default="DISPATCHED", index=True) # DISPATCHED, IN TRANSIT, IN OPERATION, COMPLETED
    
    destination_location = Column(String(255), nullable=False)
    authorized_by = Column(String(255), nullable=False) # Cmdr. J. Vance
    mission_objective = Column(Text, nullable=False)
    
    dispatched_time = Column(String(50), nullable=False)
    estimated_completion = Column(String(50), nullable=True)
    field_updates_log = Column(Text, nullable=True) # Multi-line timeline log
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="operations")
    resource = relationship("Resource", back_populates="operations")
