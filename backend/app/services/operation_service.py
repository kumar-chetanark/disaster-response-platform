import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status as http_status
from app.models.operation import Operation
from app.models.resource import Resource
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.alert import Alert
from app.schemas.operation import OperationCreate, OperationUpdate, OperationResponse, OperationListResponse

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

VALID_OPERATION_TRANSITIONS = {
    "ASSIGNED": {"DISPATCHED", "CANCELLED"},
    "DISPATCHED": {"EN_ROUTE", "ON_SCENE", "RECALLED", "CANCELLED"},
    "EN_ROUTE": {"ON_SCENE", "RECALLED", "CANCELLED"},
    "ON_SCENE": {"COMPLETED", "RECALLED"},
    "COMPLETED": set(),  # Terminal state
    "CANCELLED": set(),  # Terminal state
    "RECALLED": set(),   # Terminal state
}

def to_operation_response(op: Operation) -> OperationResponse:
    return OperationResponse(
        id=op.id,
        incident_id=op.incident_id,
        incident_title=op.incident.title if op.incident else "Disaster Command Target",
        resource_id=op.resource_id,
        resource_name=op.resource.name if op.resource else "Response Squad",
        resource_category=op.resource.category if op.resource else "rescue",
        operation_type=op.operation_type,
        status=op.state,
        destination_location=op.destination_location,
        authorized_by=op.authorized_by or "Authority Command (Level 5)",
        mission_objective=op.mission_objective,
        dispatched_time=op.dispatched_time,
        estimated_completion=op.estimated_completion,
        field_updates_log=op.field_updates_log,
        created_at=op.created_at.strftime("%I:%M %p") if op.created_at else "10:30 AM",
        updated_at=op.updated_at.strftime("%I:%M %p") if op.updated_at else "10:30 AM",
    )

def list_operations(
    db: Session,
    incident_id: Optional[str] = None,
    status: Optional[str] = None,
) -> OperationListResponse:
    query = db.query(Operation)
    if incident_id:
        query = query.filter(Operation.incident_id == incident_id)
    if status and status.upper() != "ALL":
        query = query.filter(Operation.state == status.upper())
    
    ops = query.order_by(desc(Operation.created_at)).all()
    return OperationListResponse(
        items=[to_operation_response(op) for op in ops],
        total=len(ops),
    )

def get_operation_by_id(db: Session, operation_id: str) -> Optional[OperationResponse]:
    op = db.query(Operation).filter(Operation.id == operation_id).first()
    if not op:
        return None
    return to_operation_response(op)

def create_operation_dispatch(
    db: Session,
    op_in: OperationCreate,
    authority_user: Optional[dict] = None
) -> OperationResponse:
    now = get_utc_now()
    time_str = op_in.dispatched_time or now.strftime("%I:%M %p")
    op_status = (op_in.status or "ASSIGNED").upper()

    # 1. Validate Incident exists
    incident = db.query(Incident).filter(Incident.id == op_in.incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{op_in.incident_id}' not found."
        )

    # 2. Validate Resource exists and guard against double-allocation
    resource = db.query(Resource).filter(Resource.id == op_in.resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{op_in.resource_id}' not found."
        )

    if resource.status != "AVAILABLE":
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Resource '{resource.name}' ({resource.id}) is not AVAILABLE (Current status: '{resource.status}'). Cannot be assigned to new mission."
        )

    # Check if resource already has an active operational deployment
    active_op = db.query(Operation).filter(
        Operation.resource_id == resource.id,
        Operation.state.in_(["ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION"])
    ).first()
    if active_op:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Resource '{resource.name}' is already deployed to active mission '{active_op.id}' for incident '{active_op.incident_id}'."
        )

    auth_name = (authority_user.get("name") if authority_user else None) or op_in.authorized_by or "Chetan Kumar"
    badge_id = (authority_user.get("badge_id") if authority_user else None) or "DISASTER-CMD-01"

    # 3. Create Operation record
    op_id = f"op-{str(uuid.uuid4())[:6]}"
    operation = Operation(
        id=op_id,
        incident_id=op_in.incident_id,
        resource_id=op_in.resource_id,
        operation_type=op_in.operation_type,
        state=op_status,
        destination_location=op_in.destination_location,
        authorized_by=f"{auth_name} ({badge_id})",
        mission_objective=op_in.mission_objective,
        dispatched_time=time_str,
        estimated_completion=op_in.estimated_completion or "45 min",
        field_updates_log=op_in.notes or f"Unit assigned to {op_in.destination_location}.",
        created_at=now,
        updated_at=now,
    )
    db.add(operation)

    # 4. State transition: Update Dispatched Resource status (AVAILABLE -> DEPLOYED / IN OPERATION)
    resource.status = "DEPLOYED" if op_status == "ASSIGNED" else "IN OPERATION"
    resource.updated_at = now

    # 5. Record auditable authority source entry on the incident
    audit_source = IncidentSource(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        source_type="GOVERNMENT",
        source_label=f"Operational Deployment: {auth_name} ({badge_id})",
        channel_badge="OP_DISPATCH",
        confidence_score=99.0,
        summary=f"Mission '{op_id}' created: {resource.name} assigned for {op_in.operation_type} at {op_in.destination_location}.",
        raw_content=f"OP_ID: {op_id} | RES_ID: {resource.id} | TYPE: {op_in.operation_type} | AUTH: {auth_name}",
        created_at=now,
    )
    db.add(audit_source)

    # 6. Create Operational Alert
    alert = Alert(
        id=str(uuid.uuid4()),
        incident_id=op_in.incident_id,
        category="CIVIL",
        source="Authority Dispatch Command",
        location=op_in.destination_location,
        message=f"[MISSION CREATED] {op_in.operation_type} assigned to {op_in.destination_location} ({resource.name}).",
        severity="info",
        alert_time=time_str,
        is_reviewed_by_authority=True,
        created_at=now,
    )
    db.add(alert)

    # 7. Update Incident timestamp
    incident.updated_at = now

    db.commit()
    db.refresh(operation)
    return to_operation_response(operation)

def update_operation(
    db: Session,
    operation_id: str,
    op_update: OperationUpdate,
    authority_user: Optional[dict] = None,
) -> OperationResponse:
    now = get_utc_now()
    op = db.query(Operation).filter(Operation.id == operation_id).first()
    if not op:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID '{operation_id}' not found."
        )

    if op_update.status:
        new_state = op_update.status.upper()
        current_state = op.state.upper()
        
        # If already in that state, return cleanly
        if current_state == new_state:
            return to_operation_response(op)

        allowed_targets = VALID_OPERATION_TRANSITIONS.get(current_state, set())
        # Map any legacy aliases
        if current_state in ["IN_PROGRESS", "IN OPERATION"]:
            allowed_targets = {"ON_SCENE", "COMPLETED", "RECALLED", "CANCELLED"}

        if new_state not in allowed_targets:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail=f"Invalid operation transition: Cannot move operation '{op.id}' from '{current_state}' to '{new_state}'."
            )

        op.state = new_state
        
        # State transition: When operation is completed, cancelled, or recalled -> Resource becomes AVAILABLE
        if new_state in ["COMPLETED", "CANCELLED", "RECALLED"]:
            if op.resource:
                op.resource.status = "AVAILABLE"
                op.resource.updated_at = now
        elif new_state in ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS"]:
            if op.resource:
                op.resource.status = "IN OPERATION"
                op.resource.updated_at = now

    if op_update.field_updates_log:
        op.field_updates_log = op_update.field_updates_log
    if op_update.estimated_completion:
        op.estimated_completion = op_update.estimated_completion

    op.updated_at = now
    if op.incident:
        op.incident.updated_at = now
    db.commit()
    db.refresh(op)
    return to_operation_response(op)
