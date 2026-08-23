import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    report_type = Column(String(100), nullable=False) # Incident Debrief, Assessment Mission Report, Authority Decision Log
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    metrics_summary = Column(String(255), nullable=True)
    tags = Column(String(255), nullable=True) # comma separated
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, ONGOING, COMPLETED
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    incident = relationship("Incident", back_populates="reports")
