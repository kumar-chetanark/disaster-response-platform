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

@router.get("/{incident_id}/confidence")
def get_incident_confidence(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Deterministic Multi-Source Corroboration & Confidence Scoring Endpoint:
    Returns explainable breakdown of evidence sources (Citizen, Gov, Recon, Weather, News)
    and contradiction telemetry.
    """
    from app.services.confidence_service import calculate_incident_confidence
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return calculate_incident_confidence(db=db, incident=inc)

@router.post("/{incident_id}/evidence/contradiction")
def add_incident_contradiction(
    incident_id: str,
    reason: str = Query(..., description="Details of conflicting/contradictory field report"),
    source_label: str = Query("Conflicting Field Intelligence", description="Source description"),
    authority: dict = Depends(get_current_authority),
    db: Session = Depends(get_db),
):
    """
    Records a verified contradictory field report against an incident.
    Affects confidence score deterministically without overwriting earlier evidence.
    """
    from app.models.incident_source import IncidentSource
    from datetime import datetime, timezone
    import uuid

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    
    now = datetime.now(timezone.utc)
    contra_source = IncidentSource(
        id=str(uuid.uuid4()),
        incident_id=inc.id,
        source_type="CONTRADICTION",
        source_label=source_label,
        channel_badge="FIELD_CONFLICT",
        confidence_score=50.0,
        summary=f"CONTRADICTORY EVIDENCE: {reason}",
        raw_content=f"Reported by: {authority.get('name', 'Authority')} | Conflict: {reason}",
        is_contradiction=True,
        contradiction_reason=reason,
        created_at=now,
    )
    db.add(contra_source)
    db.commit()
    return {"status": "SUCCESS", "message": "Contradictory evidence registered."}

@router.get("/{incident_id}/requirements")
def get_incident_requirements(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Deterministic Resource Requirements Engine Endpoint:
    Returns required capabilities, priority levels, and reasons for an incident.
    """
    from app.services.allocation_engine import get_incident_resource_requirements
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return get_incident_resource_requirements(inc)

@router.get("/{incident_id}/operations")
def get_incident_operations(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns all operational tracks associated with a specific incident.
    """
    from app.services.operation_service import list_operations
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return list_operations(db=db, incident_id=incident_id)
