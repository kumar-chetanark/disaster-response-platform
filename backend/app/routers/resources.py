from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from pydantic import BaseModel
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse, ResourceListResponse
from app.services.resource_service import (
    get_resources_list,
    create_resource,
    update_resource,
    get_nearby_resources,
)

router = APIRouter(prefix="/resources", tags=["Authority Resource Management"])

@router.get("", response_model=ResourceListResponse)
def list_resources(
    category: Optional[str] = Query(None, description="medical, police_army, rescue, aerial, water, land, shelter, supplies"),
    status: Optional[str] = Query(None, description="AVAILABLE, IN OPERATION, DISPATCHED, MAINTENANCE, UNAVAILABLE"),
    location: Optional[str] = Query(None, description="Base location name"),
    db: Session = Depends(get_db),
):
    """
    Returns complete emergency resource inventory categorized by operational capabilities.
    """
    return get_resources_list(db=db, category=category, status=status, location=location)

@router.get("/nearby", response_model=List[ResourceResponse])
def discover_nearby_resources(
    location: str = Query(..., description="Target disaster sector/location name"),
    latitude: Optional[float] = Query(None, description="Optional target GPS Latitude"),
    longitude: Optional[float] = Query(None, description="Optional target GPS Longitude"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    max_distance_km: float = Query(50.0, description="Radius search limit in km"),
    db: Session = Depends(get_db),
):
    """
    Location-First Resource Discovery:
    Discovers available and active resources sorted by proximity to the specified disaster sector.
    """
    return get_nearby_resources(
        db=db,
        location_name=location,
        latitude=latitude,
        longitude=longitude,
        category=category,
        max_distance_km=max_distance_km,
    )

@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def add_resource_unit(
    res_in: ResourceCreate,
    db: Session = Depends(get_db),
):
    """
    Authority action: Adds a new response unit or shelter facility into inventory.
    """
    return create_resource(db=db, res_in=res_in)

@router.patch("/{resource_id}", response_model=ResourceResponse)
def modify_resource_status(
    resource_id: str,
    res_in: ResourceUpdate,
    db: Session = Depends(get_db),
):
    """
    Authority action: Updates operational status (AVAILABLE, IN OPERATION), personnel count, or shelter occupancy.
    """
    updated = update_resource(db=db, resource_id=resource_id, res_in=res_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{resource_id}' not found.",
        )
    return updated

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_single_resource(
    resource_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns complete details of a specific resource unit.
    """
    from app.models.resource import Resource
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{resource_id}' not found.",
        )
    from app.services.resource_service import to_resource_response
    return to_resource_response(res)

class ResourceStatusPatch(BaseModel):
    status: str

@router.patch("/{resource_id}/status", response_model=ResourceResponse)
def patch_resource_status(
    resource_id: str,
    req: ResourceStatusPatch,
    db: Session = Depends(get_db),
):
    """
    Updates the operational status of a resource unit (e.g. AVAILABLE, IN OPERATION, MAINTENANCE).
    """
    updated = update_resource(db=db, resource_id=resource_id, res_in=ResourceUpdate(status=req.status))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{resource_id}' not found.",
        )
    return updated


@router.delete("/{resource_id}", status_code=status.HTTP_200_OK)
def delete_resource(
    resource_id: str,
    db: Session = Depends(get_db),
):
    """
    Permanently removes a resource unit from inventory.
    """
    from app.models.resource import Resource
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{resource_id}' not found.",
        )
    db.delete(res)
    db.commit()
    return {"status": "SUCCESS", "message": f"Resource '{resource_id}' removed from inventory."}
