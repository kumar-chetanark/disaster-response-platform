from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.incident import Incident
from app.models.resource import Resource
from app.models.operation import Operation
from app.services.allocation_engine import haversine_distance_km, calculate_priority_score
from app.services.confidence_service import calculate_incident_confidence

def get_incident_geospatial_context(db: Session, incident_id: str) -> Optional[Dict[str, Any]]:
    """
    Deterministic Geospatial Command Center Service (Phase 9):
    Synthesizes geographic positions, distance calculations, active missions,
    and squad operational readiness strictly from real persisted database records.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return None

    inc_lat = inc.latitude
    inc_lon = inc.longitude
    inc_has_coords = inc_lat is not None and inc_lon is not None

    prio_data = calculate_priority_score(inc)
    conf_data = calculate_incident_confidence(db=db, incident=inc)

    # 1. Fetch Operations linked to this incident
    ops = db.query(Operation).filter(Operation.incident_id == incident_id).order_by(desc(Operation.created_at)).all()
    active_states = {"ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION", "IN TRANSIT"}
    active_ops = [op for op in ops if op.state in active_states]

    # Map operations
    geospatial_operations = []
    for op in active_ops:
        res = op.resource
        res_lat = res.latitude if res else None
        res_lon = res.longitude if res else None

        dist_to_inc = None
        if inc_has_coords and res_lat is not None and res_lon is not None:
            dist_to_inc = haversine_distance_km(res_lat, res_lon, inc_lat, inc_lon)

        geospatial_operations.append({
            "operation_id": op.id,
            "resource_id": op.resource_id,
            "resource_name": res.name if res else "Tactical Asset",
            "resource_category": res.category if res else "rescue",
            "status": op.state,
            "destination_location": op.destination_location,
            "destination_latitude": inc_lat,
            "destination_longitude": inc_lon,
            "mission_objective": op.mission_objective,
            "authorized_by": op.authorized_by,
            "dispatched_time": op.dispatched_time,
            "resource_latitude": res_lat,
            "resource_longitude": res_lon,
            "distance_to_incident_km": dist_to_inc,
        })

    # 2. Fetch Relevant Resources (Assigned to this incident/active operations OR Available)
    all_resources = db.query(Resource).all()
    linked_res_ids = {op.resource_id for op in ops}

    relevant_resources = [
        r for r in all_resources
        if r.id in linked_res_ids or r.status == "AVAILABLE"
    ]

    mapped_resources_count = 0
    geospatial_resources = []
    avail_count = 0

    for r in relevant_resources:
        if r.status == "AVAILABLE":
            avail_count += 1

        r_lat = r.latitude
        r_lon = r.longitude
        r_has_coords = r_lat is not None and r_lon is not None
        if r_has_coords:
            mapped_resources_count += 1

        dist = None
        if inc_has_coords and r_has_coords:
            dist = haversine_distance_km(r_lat, r_lon, inc_lat, inc_lon)

        # Operational status on this incident
        op_for_res = next((op for op in active_ops if op.resource_id == r.id), None)
        active_state = op_for_res.state if op_for_res else r.status

        geospatial_resources.append({
            "resource_id": r.id,
            "name": r.name,
            "category": r.category,
            "status": r.status,
            "operational_state": active_state,
            "base_location": r.base_location,
            "latitude": r_lat,
            "longitude": r_lon,
            "coordinates_available": r_has_coords,
            "distance_to_incident_km": dist,
            "assigned_incident_id": r.assigned_incident_id,
            "assigned_operation_id": op_for_res.id if op_for_res else r.assigned_operation_id,
            "personnel_count": r.personnel_count or 0,
            "last_updated": r.updated_at.strftime("%I:%M %p") if r.updated_at else "Earlier",
        })

    return {
        "incident": {
            "incident_id": inc.id,
            "title": inc.title,
            "status": inc.status,
            "severity": inc.severity,
            "priority_level": inc.priority_level,
            "priority_score": prio_data.get("priority_score", 0),
            "confidence_score": conf_data.get("confidence_score", 0),
            "confidence_level": conf_data.get("confidence_level", "LOW"),
            "location_name": inc.location_name,
            "latitude": inc_lat,
            "longitude": inc_lon,
            "coordinates_available": inc_has_coords,
        },
        "resources": geospatial_resources,
        "operations": geospatial_operations,
        "map_summary": {
            "incident_coordinates_available": inc_has_coords,
            "mapped_resources_count": mapped_resources_count,
            "total_resources_count": len(geospatial_resources),
            "active_operations_count": len(active_ops),
            "available_resources_count": avail_count,
        }
    }
