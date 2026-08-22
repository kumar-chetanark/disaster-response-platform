from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.incident import IncidentListResponse, IncidentDetailSchema
from app.services.incident_service import get_incidents_list, get_incident_detail

router = APIRouter(prefix="/incidents", tags=["Incidents Registry"])

@router.get("", response_model=IncidentListResponse)
def list_incidents(
    search: Optional[str] = Query(None, description="Search by title, location, sector, ID"),
    severity: Optional[str] = Query(None, description="Filter by CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="Filter by ACTIVE, MONITORING, RESOLVED"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Returns paginated list of canonical disaster incidents with search and multi-criteria filters.
    """
    return get_incidents_list(
        db=db,
        search=search,
        severity=severity,
        status=status,
        page=page,
        page_size=page_size,
    )

@router.get("/{incident_id}", response_model=IncidentDetailSchema)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns complete incident dossier including:
    - Canonical information & geography
    - Corroborating source ledger (Citizen, News, Weather radar, Gov)
    - Field assessments (Drone, Helicopter, Land, Boat)
    - Allocated operations & active tracks
    - AI-recommended resource allocations
    - Incident progression timeline
    """
    incident = get_incident_detail(db=db, incident_id=incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return incident
