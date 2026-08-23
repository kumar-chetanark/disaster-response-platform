from app.routers.auth import get_current_authority
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.incident import Incident
from app.services.allocation_engine import (
    calculate_priority_score,
    compute_allocation_recommendations,
)

router = APIRouter(prefix="/allocations", tags=["Allocations & Recommendations"])

class PriorityScoreResponse(BaseModel):
    incident_id: str
    incident_title: str
    priority_score: float
    priority_level: str
    explanation: str
    breakdown: dict

class AllocationAdvisoryResponse(BaseModel):
    id: str
    incident_id: str
    incident_title: str
    incident_priority: float
    required_capability: str
    resource_id: Optional[str] = None
    resource_name: str
    resource_category: str
    personnel_count: Optional[int] = 0
    match_score: int
    travel_time_est: str
    reason: str
    explanation_breakdown: dict
    alternatives: List[str] = []
    scarcity_warning: bool = False
    unmet_demand: bool = False

@router.get("/recommendations", response_model=List[AllocationAdvisoryResponse])
def get_recommendations(
    incident_id: Optional[str] = Query(None, description="Optional incident ID filter"),
    db: Session = Depends(get_db)
):
    """
    Get deterministic capability-aware resource allocation recommendations.
    Dynamically accounts for incident priority ranks, capability requirements, and resource scarcity.
    """
    return compute_allocation_recommendations(db, incident_id=incident_id)

@router.get("/priority/{incident_id}", response_model=PriorityScoreResponse)
def get_incident_priority_score(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """
    Compute real-time explainable priority score for a specific incident.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    p_data = calculate_priority_score(inc)
    return {
        "incident_id": inc.id,
        "incident_title": inc.title,
        "priority_score": p_data["priority_score"],
        "priority_level": p_data["priority_level"],
        "explanation": p_data["explanation"],
        "breakdown": p_data["breakdown"],
    }

@router.post("/{recommendation_id}/approve")
def approve_allocation_recommendation(
    recommendation_id: str,
    incident_id: str = Query(..., description="Target incident ID"),
    resource_id: str = Query(..., description="Approved resource ID"),
    notes: Optional[str] = Query(None, description="Authority deployment notes"),
    authority: dict = Depends(get_current_authority),
    db: Session = Depends(get_db),
):
    """
    Authority-Controlled Resource Deployment Approval:
    1. Enforces resource availability and prevents double-allocation (HTTP 409).
    2. Atomically marks resource as ASSIGNED.
    3. Creates persistent operational track (Operation).
    4. Records auditable authority attribution.
    """
    from app.models.resource import Resource
    from app.models.incident import Incident
    from app.models.operation import Operation
    from app.models.incident_source import IncidentSource
    from app.models.alert import Alert
    from datetime import datetime, timezone
    import uuid

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )

    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{resource_id}' not found.",
        )

    # Server-Side Guard: Prevent Double-Allocation
    if res.status != "AVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Double-Allocation Conflict: Resource '{res.name}' is currently {res.status} and unavailable for new deployment.",
        )

    active_ops = db.query(Operation).filter(
        Operation.resource_id == res.id,
        Operation.state.in_(["ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION", "IN TRANSIT"])
    ).all()
    if active_ops:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Double-Allocation Conflict: Resource '{res.name}' is already assigned to active mission {active_ops[0].id}.",
        )

    now = datetime.now(timezone.utc)
    auth_name = authority.get("name") or authority.get("username") or "Command Authority"
    badge = authority.get("badge_id") or "DISASTER-CMD"

    # 1. Update resource status
    res.status = "ASSIGNED"
    res.assigned_incident_id = inc.id

    # 2. Create operational track
    op_id = f"op-{str(uuid.uuid4())[:6]}"
    new_op = Operation(
        id=op_id,
        incident_id=inc.id,
        resource_id=res.id,
        operation_type=f"{res.category.capitalize()} Deployment ({res.name})",
        state="ASSIGNED",
        destination_location=inc.location_name,
        authorized_by=f"{auth_name} ({badge})",
        mission_objective=notes or f"Deploy {res.name} to {inc.location_name} for {inc.disaster_type} response",
        dispatched_time=now.strftime("%I:%M %p"),
        estimated_completion="In Progress",
        field_updates_log=f"{now.strftime('%I:%M %p')}: Operation created and resource assigned by {auth_name}",
        created_at=now,
        updated_at=now,
    )
    db.add(new_op)
    res.assigned_operation_id = new_op.id

    # 3. Create auditable incident source event
    audit_source = IncidentSource(
        id=str(uuid.uuid4()),
        incident_id=inc.id,
        source_type="GOVERNMENT",
        source_label=f"Deployment Authorized: {auth_name}",
        channel_badge="GOV_DEPLOY",
        confidence_score=99.0,
        summary=f"Authorized deployment of {res.name} ({res.category}) under Mission #{op_id}. Objective: {new_op.mission_objective}",
        raw_content=f"AUTHORITY: {auth_name} | BADGE: {badge} | RES_ID: {res.id} | OP_ID: {op_id}",
        created_at=now,
    )
    db.add(audit_source)

    # 4. Broadcast high priority alert
    alert = Alert(
        id=str(uuid.uuid4()),
        incident_id=inc.id,
        category="CIVIL",
        source=f"Authority Dispatch ({badge})",
        location=inc.location_name,
        message=f"[MISSION CREATED #{op_id}] {res.name} assigned to {inc.title} at {inc.location_name}.",
        severity="info",
        alert_time=now.strftime("%I:%M %p"),
        is_reviewed_by_authority=True,
        created_at=now,
    )
    db.add(alert)

    db.commit()
    db.refresh(new_op)
    db.refresh(res)

    return {
        "status": "APPROVED",
        "operation_id": new_op.id,
        "incident_id": inc.id,
        "resource_id": res.id,
        "resource_name": res.name,
        "resource_status": res.status,
        "operation_status": new_op.state,
        "authorized_by": new_op.authorized_by,
        "timestamp": now.isoformat(),
    }
