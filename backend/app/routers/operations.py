from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.operation import OperationCreate, OperationUpdate, OperationResponse, OperationListResponse
from app.services.operation_service import (
    list_operations,
    get_operation_by_id,
    create_operation_dispatch,
    update_operation,
)

router = APIRouter(prefix="/operations", tags=["Operations and Resource Dispatch"])

@router.get("", response_model=OperationListResponse)
def get_operations(
    incident_id: Optional[str] = Query(None, description="Filter by target incident ID"),
    status: Optional[str] = Query(None, description="AUTHORIZED, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED"),
    db: Session = Depends(get_db),
):
    """
    Returns list of active and completed operational tracks.
    """
    return list_operations(db=db, incident_id=incident_id, status=status)

@router.get("/{operation_id}", response_model=OperationResponse)
def get_operation_detail(
    operation_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns complete details of a specific operational track.
    """
    op = get_operation_by_id(db=db, operation_id=operation_id)
    if not op:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID '{operation_id}' not found.",
        )
    return op

@router.post("", response_model=OperationResponse, status_code=status.HTTP_201_CREATED)
def dispatch_operation(
    op_in: OperationCreate,
    db: Session = Depends(get_db),
):
    """
    Authority Dispatch Action:
    - Creates a new active operational track.
    - Transitions resource status from AVAILABLE -> IN_OPERATION.
    - Broadcasts dispatch telemetry alert.
    """
    return create_operation_dispatch(db=db, op_in=op_in)

@router.patch("/{operation_id}", response_model=OperationResponse)
def update_operation_status(
    operation_id: str,
    op_update: OperationUpdate,
    db: Session = Depends(get_db),
):
    """
    Authority Update Action:
    - Modifies mission progress and updates field telemetry log.
    - If status changes to COMPLETED or CANCELLED, transitions resource status back to AVAILABLE.
    """
    updated = update_operation(db=db, operation_id=operation_id, op_update=op_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID '{operation_id}' not found.",
        )
    return updated

from pydantic import BaseModel, Field
from app.routers.auth import get_current_authority

class OperationStatusPatch(BaseModel):
    status: str = Field(..., description="ASSIGNED, DISPATCHED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED, RECALLED")
    field_update: Optional[str] = Field(None, description="Field situation message or telemetry report")

@router.patch("/{operation_id}/status", response_model=OperationResponse)
def patch_operation_status(
    operation_id: str,
    req: OperationStatusPatch,
    authority: dict = Depends(get_current_authority),
    db: Session = Depends(get_db),
):
    """
    Authority-Controlled Mission Status Machine Endpoint:
    Enforces deterministic state transitions (ASSIGNED -> DISPATCHED -> EN_ROUTE -> ON_SCENE -> COMPLETED / RECALLED / CANCELLED).
    Synchronizes attached resource availability atomically on completion/recall/cancel.
    """
    updated_op = update_operation(
        db=db,
        operation_id=operation_id,
        op_update=OperationUpdate(
            status=req.status,
            field_updates_log=req.field_update or f"Status transitioned to {req.status} by {authority.get('name', 'Authority')}"
        )
    )
    if not updated_op:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID '{operation_id}' not found.",
        )
    return updated_op


@router.delete("/{operation_id}", status_code=status.HTTP_200_OK)
def delete_operation(
    operation_id: str,
    db: Session = Depends(get_db),
):
    """
    Deletes an operational mission record and resets attached resource availability.
    """
    from app.models.operation import Operation
    from app.models.resource import Resource
    op = db.query(Operation).filter(Operation.id == operation_id).first()
    if not op:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID '{operation_id}' not found.",
        )
    if op.resource_id:
        res = db.query(Resource).filter(Resource.id == op.resource_id).first()
        if res:
            res.status = "AVAILABLE"
            res.assigned_incident_id = None
            res.assigned_operation_id = None
    db.delete(op)
    db.commit()
    return {"status": "SUCCESS", "message": f"Operation '{operation_id}' deleted and resource freed."}
