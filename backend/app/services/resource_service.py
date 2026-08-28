import uuid
import math
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse, ResourceListResponse
from app.services.matching_service import haversine_distance_km

def to_resource_response(res: Resource, distance_km: Optional[float] = None) -> ResourceResponse:
    return ResourceResponse(
        id=res.id,
        name=res.name,
        type=res.type or "Squad",
        category=res.category,
        status=res.status,
        base_location=res.base_location,
        resource_center_id=res.resource_center_id,
        latitude=res.latitude,
        longitude=res.longitude,
        capabilities=res.capabilities,
        capacity=res.capacity,
        operating_range=res.operating_range,
        vehicle_registration=res.vehicle_registration,
        assigned_incident_id=res.assigned_incident_id,
        assigned_operation_id=res.assigned_operation_id,
        personnel_count=res.personnel_count or 0,
        equipment_details=res.equipment_details,
        distance_km=distance_km,
        shelter_capacity=res.shelter_capacity,
        shelter_occupied=res.shelter_occupied,
        supplies_food_days=res.supplies_food_days,
        supplies_food_people=res.supplies_food_people,
        supplies_medicine_count=res.supplies_medicine_count,
        supplies_clothing_count=res.supplies_clothing_count,
    )

def get_resources_list(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
) -> ResourceListResponse:
    query = db.query(Resource)
    if category and category.lower() != "all":
        query = query.filter(Resource.category == category.lower())
    if status and status.upper() != "ALL":
        query = query.filter(Resource.status == status.upper())
    if location and location.strip():
        query = query.filter(Resource.base_location.ilike(f"%{location.strip()}%"))

    items = query.all()
    
    all_res = db.query(Resource).all()
    breakdown: Dict[str, int] = {}
    for r in all_res:
        breakdown[r.category] = breakdown.get(r.category, 0) + 1

    return ResourceListResponse(
        items=[to_resource_response(r) for r in items],
        total=len(items),
        categories_breakdown=breakdown,
    )

def create_resource(db: Session, res_in: ResourceCreate) -> ResourceResponse:
    res = Resource(
        id=f"res-{res_in.category[:3]}-{str(uuid.uuid4())[:4]}",
        name=res_in.name,
        type=res_in.type or "Squad",
        category=res_in.category.lower(),
        status=res_in.status.upper(),
        base_location=res_in.base_location,
        resource_center_id=res_in.resource_center_id,
        latitude=res_in.latitude,
        longitude=res_in.longitude,
        capabilities=res_in.capabilities,
        capacity=res_in.capacity,
        operating_range=res_in.operating_range,
        vehicle_registration=res_in.vehicle_registration,
        personnel_count=res_in.personnel_count or 0,
        equipment_details=res_in.equipment_details,
        shelter_capacity=res_in.shelter_capacity,
        shelter_occupied=res_in.shelter_occupied,
        supplies_food_days=res_in.supplies_food_days,
        supplies_food_people=res_in.supplies_food_people,
        supplies_medicine_count=res_in.supplies_medicine_count,
        supplies_clothing_count=res_in.supplies_clothing_count,
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return to_resource_response(res)

def update_resource(db: Session, resource_id: str, res_in: ResourceUpdate) -> Optional[ResourceResponse]:
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        return None

    if res_in.name is not None:
        res.name = res_in.name
    if res_in.type is not None:
        res.type = res_in.type
    if res_in.resource_center_id is not None:
        res.resource_center_id = res_in.resource_center_id
    if res_in.status is not None:
        res.status = res_in.status.upper()
    if res_in.latitude is not None:
        res.latitude = res_in.latitude
    if res_in.longitude is not None:
        res.longitude = res_in.longitude
    if res_in.capabilities is not None:
        res.capabilities = res_in.capabilities
    if res_in.capacity is not None:
        res.capacity = res_in.capacity
    if res_in.operating_range is not None:
        res.operating_range = res_in.operating_range
    if res_in.vehicle_registration is not None:
        res.vehicle_registration = res_in.vehicle_registration
    if res_in.assigned_incident_id is not None:
        res.assigned_incident_id = res_in.assigned_incident_id
    if res_in.assigned_operation_id is not None:
        res.assigned_operation_id = res_in.assigned_operation_id
    if res_in.personnel_count is not None:
        res.personnel_count = res_in.personnel_count
    if res_in.equipment_details is not None:
        res.equipment_details = res_in.equipment_details
    if res_in.shelter_capacity is not None:
        res.shelter_capacity = res_in.shelter_capacity
    if res_in.shelter_occupied is not None:
        res.shelter_occupied = res_in.shelter_occupied
    if res_in.supplies_food_days is not None:
        res.supplies_food_days = res_in.supplies_food_days
    if res_in.supplies_food_people is not None:
        res.supplies_food_people = res_in.supplies_food_people
    if res_in.supplies_medicine_count is not None:
        res.supplies_medicine_count = res_in.supplies_medicine_count
    if res_in.supplies_clothing_count is not None:
        res.supplies_clothing_count = res_in.supplies_clothing_count

    db.commit()
    db.refresh(res)
    return to_resource_response(res)

def get_nearby_resources(
    db: Session,
    location_name: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    category: Optional[str] = None,
    max_distance_km: float = 50.0,
) -> List[ResourceResponse]:
    target_lat = latitude if latitude is not None else 23.3441
    target_lon = longitude if longitude is not None else 85.3096
    
    query = db.query(Resource)
    if category and category.lower() != "all":
        query = query.filter(Resource.category == category.lower())
    
    all_resources = query.all()
    results = []

    for res in all_resources:
        if res.latitude is not None and res.longitude is not None:
            dist = round(haversine_distance_km(target_lat, target_lon, res.latitude, res.longitude), 1)
            if dist <= max_distance_km:
                results.append((dist, to_resource_response(res, distance_km=dist)))
        elif location_name and location_name.lower() in res.base_location.lower():
            results.append((0.0, to_resource_response(res, distance_km=0.0)))

    results.sort(key=lambda x: x[0])
    return [r[1] for r in results]
