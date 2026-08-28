from datetime import datetime
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.external_alert import ExternalAlert
from app.services.external_ingestion_service import global_ingestion_service
from app.routers.auth import get_current_authority

router = APIRouter(prefix="/external-alerts", tags=["Worldwide External Disaster Intelligence"])

class ExternalAlertResponse(BaseModel):
    id: str
    source: str
    external_id: str
    event_type: str
    title: str
    description: Optional[str] = None
    country: Optional[str] = None
    countries: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str
    alert_level: Optional[str] = None
    alert_score: Optional[float] = None
    population_affected_est: Optional[str] = None
    published_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    source_url: Optional[str] = None
    status: str
    converted_incident_id: Optional[str] = None
    created_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None

class ExternalAlertDetailResponse(ExternalAlertResponse):
    raw_data: Optional[str] = None

class ExternalAlertStatusUpdate(BaseModel):
    status: str = Field(..., description="REVIEWED, VALIDATED, REJECTED, EXPIRED")
    notes: Optional[str] = Field(None, description="Optional authority review notes")

class IngestionStatusResponse(BaseModel):
    source: str
    status: str
    last_successful_sync: Optional[str] = None
    last_attempted_sync: Optional[str] = None
    events_fetched: int
    new_alerts: int
    updated_alerts: int
    last_error: Optional[str] = None

@router.get("", response_model=List[ExternalAlertResponse])
def list_external_alerts(
    event_type: Optional[str] = Query(None, description="Filter by event type (e.g. EARTHQUAKE, FLOOD)"),
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    status: Optional[str] = Query(None, description="Filter by status (NEW, REVIEWED, VALIDATED, REJECTED, CONVERTED_TO_INCIDENT)"),
    country: Optional[str] = Query(None, description="Filter by country name"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns paginated list of worldwide external disaster alerts.
    """
    query = db.query(ExternalAlert)

    if event_type:
        query = query.filter(ExternalAlert.event_type.ilike(f"%{event_type.strip()}%"))
    if severity:
        query = query.filter(ExternalAlert.severity == severity.strip().upper())
    if status:
        query = query.filter(ExternalAlert.status == status.strip().upper())
    if country:
        query = query.filter(ExternalAlert.country.ilike(f"%{country.strip()}%"))

    query = query.order_by(desc(ExternalAlert.published_at), desc(ExternalAlert.created_at))
    return query.offset(offset).limit(limit).all()

@router.get("/ingestion-status", response_model=IngestionStatusResponse)
def get_ingestion_status():
    """
    Returns current health, connection state, and last sync timestamp for GDACS ingestion.
    """
    return global_ingestion_service.get_status()

@router.post("/ingest", response_model=IngestionStatusResponse)
def trigger_manual_ingest(
    db: Session = Depends(get_db)
):
    """
    Authority on-demand trigger to fetch and ingest fresh global disaster alerts from GDACS immediately.
    """
    return global_ingestion_service.run_ingestion(db=db)

@router.get("/{alert_id}", response_model=ExternalAlertDetailResponse)
def get_external_alert_detail(
    alert_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns full dossier of a specific external alert including raw audit data.
    """
    alert = db.query(ExternalAlert).filter(ExternalAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"External alert with ID '{alert_id}' not found.",
        )
    return alert

@router.post("/{alert_id}/status", response_model=ExternalAlertResponse)
def update_alert_status(
    alert_id: str,
    payload: ExternalAlertStatusUpdate,
    authority: dict = Depends(get_current_authority),
    db: Session = Depends(get_db),
):
    """
    Authority review action: Mark alert as REVIEWED, VALIDATED, or REJECTED.
    """
    alert = db.query(ExternalAlert).filter(ExternalAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"External alert with ID '{alert_id}' not found.",
        )

    clean_status = payload.status.strip().upper()
    if clean_status not in ["REVIEWED", "VALIDATED", "REJECTED", "EXPIRED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target status '{payload.status}'. Must be REVIEWED, VALIDATED, REJECTED, or EXPIRED.",
        )

    alert.status = clean_status
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/convert-to-incident")
def convert_to_incident(
    alert_id: str,
    authority: dict = Depends(get_current_authority),
    db: Session = Depends(get_db),
):
    """
    Authority-Controlled Conversion:
    Converts an external alert into a canonical active Incident.
    Guards against double-conversion (HTTP 409).
    Never automatically dispatches resources.
    """
    created_incident = global_ingestion_service.convert_alert_to_incident(
        db=db,
        alert_id=alert_id,
        authority_user=authority
    )
    return {
        "status": "CONVERTED",
        "message": f"External alert '{alert_id}' successfully converted to {created_incident.title}.",
        "incident_id": created_incident.id,
        "incident_title": created_incident.title,
        "severity": created_incident.severity,
        "location": created_incident.location_name,
    }
