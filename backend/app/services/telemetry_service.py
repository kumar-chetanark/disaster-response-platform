from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.incident import Incident
from app.models.operation import Operation
from app.models.resource import Resource

def get_incident_operational_telemetry(db: Session, incident_id: str) -> Dict[str, Any]:
    """
    Deterministic Live Operational Telemetry Engine:
    Computes real-time situational metrics strictly from persisted database records:
    - Active vs Completed Operations
    - Resource status distribution (Available, Assigned, En Route, On Scene)
    - Operation status breakdown
    - Latest operations and resource location states
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return None

    now = datetime.now(timezone.utc)
    
    # 1. Fetch all operations linked to this incident
    ops = db.query(Operation).filter(Operation.incident_id == incident_id).order_by(desc(Operation.created_at)).all()
    
    active_states = {"ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION", "IN TRANSIT"}
    completed_states = {"COMPLETED"}
    cancelled_states = {"CANCELLED", "RECALLED"}

    active_ops = [op for op in ops if op.state in active_states]
    completed_ops = [op for op in ops if op.state in completed_states]
    
    state_breakdown = {}
    for op in ops:
        state_breakdown[op.state] = state_breakdown.get(op.state, 0) + 1

    # 2. Derive resource status breakdown for assigned/active resources
    assigned_count = sum(1 for op in ops if op.state == "ASSIGNED")
    dispatched_count = sum(1 for op in ops if op.state == "DISPATCHED")
    en_route_count = sum(1 for op in ops if op.state in {"EN_ROUTE", "IN TRANSIT"})
    on_scene_count = sum(1 for op in ops if op.state in {"ON_SCENE", "IN_PROGRESS", "IN OPERATION"})

    # 3. Fetch all system resources for contextual resource counts
    all_resources = db.query(Resource).all()
    available_resources_count = sum(1 for r in all_resources if r.status == "AVAILABLE")
    
    # 4. Prepare latest operations list
    latest_operations = []
    for op in ops[:10]:
        latest_operations.append({
            "id": op.id,
            "operation_type": op.operation_type,
            "resource_id": op.resource_id,
            "resource_name": op.resource.name if op.resource else "Resource Squad",
            "resource_category": op.resource.category if op.resource else "rescue",
            "status": op.state,
            "destination_location": op.destination_location,
            "dispatched_time": op.dispatched_time,
            "authorized_by": op.authorized_by,
            "mission_objective": op.mission_objective,
            "last_update": op.updated_at.strftime("%I:%M %p") if op.updated_at else (op.created_at.strftime("%I:%M %p") if op.created_at else "Just now")
        })

    # 5. Prepare latest resource location / status states
    latest_resource_states = []
    for op in active_ops:
        res = op.resource
        if res:
            latest_resource_states.append({
                "resource_id": res.id,
                "name": res.name,
                "category": res.category,
                "status": op.state,
                "latitude": getattr(res, "latitude", None),
                "longitude": getattr(res, "longitude", None),
                "current_operation_id": op.id,
                "last_updated": (res.updated_at or res.created_at or now).strftime("%I:%M %p")
            })

    return {
        "incident_id": inc.id,
        "incident_title": inc.title,
        "generated_at": now.strftime("%I:%M:%S %p UTC"),
        "active_operation_count": len(active_ops),
        "completed_operation_count": len(completed_ops),
        "resource_count": len(all_resources),
        "resources_available": available_resources_count,
        "resources_assigned": assigned_count,
        "resources_en_route": en_route_count + dispatched_count,
        "resources_on_scene": on_scene_count,
        "operation_state_breakdown": state_breakdown,
        "latest_operations": latest_operations,
        "latest_resource_states": latest_resource_states,
    }
