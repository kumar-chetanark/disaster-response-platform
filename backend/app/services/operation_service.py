import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.operation import Operation
from app.models.resource import Resource
from app.models.incident import Incident
from app.models.alert import Alert
from app.schemas.operation import OperationCreate, OperationUpdate, OperationResponse, OperationListResponse

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

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

def create_operation_dispatch(db: Session, op_in: OperationCreate) -> OperationResponse:
    now = get_utc_now()
    time_str = op_in.dispatched_time or now.strftime("%I:%M %p")
    op_status = (op_in.status or "DISPATCHED").upper()

    # 1. Create Operation record
    op_id = f"op-{str(uuid.uuid4())[:6]}"
    operation = Operation(
        id=op_id,
        incident_id=op_in.incident_id,
        resource_id=op_in.resource_id,
        operation_type=op_in.operation_type,
        state=op_status,
        destination_location=op_in.destination_location,
        authorized_by=op_in.authorized_by,
        mission_objective=op_in.mission_objective,
        dispatched_time=time_str,
        estimated_completion=op_in.estimated_completion or "45 min",
        field_updates_log=op_in.notes or f"Unit dispatched to {op_in.destination_location}.",
        created_at=now,
        updated_at=now,
    )
    db.add(operation)

    # 2. State transition: Update Dispatched Resource status (AVAILABLE -> IN OPERATION)
    resource = db.query(Resource).filter(Resource.id == op_in.resource_id).first()
    if resource:
        resource.status = "IN OPERATION"
        resource.updated_at = now

    # 3. Create Operational Alert
    alert = Alert(
        id=str(uuid.uuid4()),
        incident_id=op_in.incident_id,
        category="CIVIL",
        source="Authority Dispatch Command",
        location=op_in.destination_location,
        message=f"[OPERATION DISPATCHED] {op_in.operation_type} authorized for {op_in.destination_location} ({resource.name if resource else 'Unit'}).",
        severity="info",
        alert_time=time_str,
        is_reviewed_by_authority=True,
        created_at=now,
    )
    db.add(alert)

    db.commit()
    db.refresh(operation)
    return to_operation_response(operation)

def update_operation(db: Session, operation_id: str, op_update: OperationUpdate) -> Optional[OperationResponse]:
    now = get_utc_now()
    op = db.query(Operation).filter(Operation.id == operation_id).first()
    if not op:
        return None

    if op_update.status:
        new_state = op_update.status.upper()
        op.state = new_state
        
        # State transition: When operation is completed or cancelled -> Resource becomes AVAILABLE
        if new_state in ["COMPLETED", "CANCELLED"]:
            if op.resource:
                op.resource.status = "AVAILABLE"
                op.resource.updated_at = now
        elif new_state in ["DISPATCHED", "IN_PROGRESS"]:
            if op.resource:
                op.resource.status = "IN OPERATION"
                op.resource.updated_at = now

    if op_update.field_updates_log:
        op.field_updates_log = op_update.field_updates_log
    if op_update.estimated_completion:
        op.estimated_completion = op_update.estimated_completion

    op.updated_at = now
    db.commit()
    db.refresh(op)
    return to_operation_response(op)
