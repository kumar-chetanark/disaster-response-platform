from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.incident import Incident
from app.schemas.incident import (
    IncidentListResponse,
    IncidentDetailSchema,
    IncidentStatusUpdateRequest,
)
from app.services.incident_service import (
    get_incidents_list,
    get_incident_detail,
    update_incident_status,
)
from app.services.allocation_engine import analyze_incident
from app.routers.auth import get_current_authority

router = APIRouter(prefix="/incidents", tags=["Incidents Registry"])

@router.get("", response_model=IncidentListResponse)
def list_incidents(
    search: Optional[str] = Query(None, description="Search by title, location, sector, ID"),
    severity: Optional[str] = Query(None, description="Filter by CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="Filter by PENDING, ACTIVE, MONITORING, RESOLVED"),
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

@router.get("/{incident_id}/analysis")
def get_incident_analysis(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Deterministic Incident Analysis Endpoint:
    Evaluates real database fields and returns structured risk telemetry.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return analyze_incident(inc)

@router.get("/{incident_id}", response_model=IncidentDetailSchema)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns complete incident dossier including corroborating source ledger.
    """
    incident = get_incident_detail(db=db, incident_id=incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return incident

@router.patch("/{incident_id}/status", response_model=IncidentDetailSchema)
def patch_incident_status(
    incident_id: str,
    req: IncidentStatusUpdateRequest,
    authority: dict = Depends(get_current_authority),
    db: Session = Depends(get_db),
):
    """
    Authority-Controlled Incident Lifecycle Transition Endpoint:
    Enforces deterministic state transitions (PENDING -> ACTIVE/MONITORING -> RESOLVED).
    Records auditable authority attribution.
    """
    updated_inc = update_incident_status(
        db=db,
        incident_id=incident_id,
        target_status=req.status,
        authority_user=authority,
        notes=req.notes,
    )
    return get_incident_detail(db=db, incident_id=updated_inc.id)
