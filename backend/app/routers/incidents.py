from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.incident import Incident
from app.schemas.incident import (
    IncidentListResponse,
    IncidentDetailSchema,
    IncidentStatusUpdateRequest,
    IncidentIntelligenceResponse,
    IncidentGeospatialResponse,
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

@router.get("/{incident_id}/operations/telemetry")
def get_incident_operations_telemetry(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Live Operational Command Center Telemetry Endpoint:
    Returns structured real-time operational response status, mission breakdowns,
    and resource states derived exclusively from real database records.
    """
    from app.models.operation import Operation
    from app.models.resource import Resource
    from datetime import datetime, timezone

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )

    ops = db.query(Operation).filter(Operation.incident_id == incident_id).all()
    all_resources = db.query(Resource).all()

    active_states = {"ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION", "IN TRANSIT"}
    active_ops = [op for op in ops if op.state in active_states]
    completed_ops = [op for op in ops if op.state == "COMPLETED"]

    # State breakdown
    breakdown = {}
    for op in ops:
        breakdown[op.state] = breakdown.get(op.state, 0) + 1

    # Resource categorization
    # A resource takes the state of its latest active operation on this incident
    assigned_res_ids = set()
    en_route_res_ids = set()
    on_scene_res_ids = set()

    for op in ops:
        if op.state == "ASSIGNED":
            assigned_res_ids.add(op.resource_id)
        elif op.state in {"DISPATCHED", "EN_ROUTE", "IN TRANSIT"}:
            en_route_res_ids.add(op.resource_id)
            assigned_res_ids.discard(op.resource_id)
        elif op.state in {"ON_SCENE", "IN_PROGRESS", "IN OPERATION"}:
            on_scene_res_ids.add(op.resource_id)
            assigned_res_ids.discard(op.resource_id)
            en_route_res_ids.discard(op.resource_id)
        elif op.state in {"COMPLETED", "RECALLED", "CANCELLED"}:
            assigned_res_ids.discard(op.resource_id)
            en_route_res_ids.discard(op.resource_id)
            on_scene_res_ids.discard(op.resource_id)

    avail_count = sum(1 for r in all_resources if r.status == "AVAILABLE")
    assigned_count = len(assigned_res_ids)
    en_route_count = len(en_route_res_ids)
    on_scene_count = len(on_scene_res_ids)

    # Latest operation representations
    latest_operations = []
    for op in sorted(ops, key=lambda x: x.created_at or datetime.min, reverse=True)[:10]:
        latest_operations.append({
            "operation_id": op.id,
            "resource_id": op.resource_id,
            "resource_name": op.resource.name if op.resource else "Resource Squad",
            "resource_category": op.resource.category if op.resource else "rescue",
            "status": op.state,
            "destination_location": op.destination_location,
            "authorized_by": op.authorized_by,
            "mission_objective": op.mission_objective,
            "dispatched_time": op.dispatched_time,
            "estimated_completion": op.estimated_completion,
            "field_updates": [u for u in (op.field_updates_log or "").split("\n") if u.strip()],
            "created_at": op.created_at.isoformat() if op.created_at else None,
            "updated_at": op.updated_at.isoformat() if op.updated_at else None,
        })

    # Latest resource states linked or available
    latest_resource_states = []
    linked_res_ids = {op.resource_id for op in ops}
    relevant_resources = [r for r in all_resources if r.id in linked_res_ids or r.status == "AVAILABLE"]
    for r in relevant_resources[:15]:
        latest_resource_states.append({
            "resource_id": r.id,
            "name": r.name,
            "category": r.category,
            "status": r.status,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "current_operation_id": r.assigned_operation_id,
            "last_updated": r.updated_at.strftime("%I:%M %p") if r.updated_at else "Earlier",
        })

    now = datetime.now(timezone.utc)

    return {
        "incident_id": inc.id,
        "incident_title": inc.title,
        "incident_status": inc.status,
        "generated_at": now.isoformat(),
        "active_operation_count": len(active_ops),
        "completed_operation_count": len(completed_ops),
        "resource_count": len(all_resources),
        "resources_available": avail_count,
        "resources_assigned": assigned_count,
        "resources_en_route": en_route_count,
        "resources_on_scene": on_scene_count,
        "operation_state_breakdown": breakdown,
        "latest_operations": latest_operations,
        "latest_resource_states": latest_resource_states,
    }

@router.get("/{incident_id}/intelligence", response_model=IncidentIntelligenceResponse)
def get_incident_intelligence_endpoint(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Unified Incident Intelligence & Decision Support Endpoint (Phase 8):
    Synthesizes situational summary, multi-source confidence, capability requirements,
    live telemetry, and explainable decision-support directives.
    """
    from app.services.incident_intelligence_service import get_incident_intelligence
    intelligence = get_incident_intelligence(db=db, incident_id=incident_id)
    if not intelligence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return intelligence


@router.get("/{incident_id}/geospatial", response_model=IncidentGeospatialResponse)
def get_incident_geospatial_endpoint(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Geospatial Command Center Endpoint (Phase 9):
    Returns real-time geospatial positioning, active missions, and distance matrices
    derived strictly from real persisted SQLite records.
    """
    from app.services.geospatial_service import get_incident_geospatial_context
    geospatial_context = get_incident_geospatial_context(db=db, incident_id=incident_id)
    if not geospatial_context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )
    return geospatial_context


@router.delete("/{incident_id}", status_code=status.HTTP_200_OK)
def delete_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    """
    Permanently deletes an incident from the disaster registry with cascade cleanup
    of citizen reports, incident sources, linked alerts, operations, and associated intelligence.
    """
    from app.models.incident import Incident
    from app.models.citizen_report import CitizenReport
    from app.models.incident_source import IncidentSource
    from app.models.alert import Alert
    from app.models.operation import Operation
    from app.models.resource import Resource

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )

    # Free up any attached resources
    operations = db.query(Operation).filter(Operation.incident_id == incident_id).all()
    for op in operations:
        if op.resource_id:
            res = db.query(Resource).filter(Resource.id == op.resource_id).first()
            if res:
                res.status = "AVAILABLE"
                res.assigned_incident_id = None
                res.assigned_operation_id = None
        db.delete(op)

    # Delete linked alerts, citizen reports, and sources
    db.query(Alert).filter(Alert.incident_id == incident_id).delete(synchronize_session=False)
    db.query(CitizenReport).filter(CitizenReport.incident_id == incident_id).delete(synchronize_session=False)
    db.query(IncidentSource).filter(IncidentSource.incident_id == incident_id).delete(synchronize_session=False)

    # Delete incident
    db.delete(inc)
    db.commit()

    return {"status": "SUCCESS", "message": f"Incident '{incident_id}' and all associated records deleted successfully."}
