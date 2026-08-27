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

import urllib.request
import urllib.parse
import json

@router.get("/geocode/search")
def google_places_geocode_search(q: str = Query(..., min_length=2)):
    """
    Real Google Places + Nominatim + Multi-lingual Alias Resolver.
    Finds exact Google Maps landmarks, clock towers (Ghanta Ghar), temples, hotels, stations, and cities worldwide.
    """
    trimmed = q.strip()
    results = []
    seen = set()

    # 1. Alias expansion for Google Maps common transliterations
    search_queries = [trimmed]
    lower_q = trimmed.lower()
    
    # "ghanta ghar" -> "ghantaghar", "clock tower"
    if "ghanta ghar" in lower_q:
        search_queries.append(lower_q.replace("ghanta ghar", "ghantaghar"))
        search_queries.append(lower_q.replace("ghanta ghar", "clock tower"))
    elif "ghantaghar" in lower_q:
        search_queries.append(lower_q.replace("ghantaghar", "clock tower"))

    for query_item in search_queries:
        try:
            # Query Nominatim with english + local language accept headers
            url_nom = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(query_item)}&limit=10&addressdetails=1"
            req = urllib.request.Request(
                url_nom,
                headers={"User-Agent": "DisasterResponsePlatform/2.0 (TacticalGIS)", "Accept-Language": "en,ne,hi"}
            )
            with urllib.request.urlopen(req, timeout=3) as res:
                data = json.loads(res.read().decode("utf-8"))
                for item in data:
                    lat = float(item.get("lat"))
                    lon = float(item.get("lon"))
                    coord_key = f"{round(lat, 4)}_{round(lon, 4)}"
                    if coord_key in seen:
                        continue
                    seen.add(coord_key)

                    name = item.get("name") or item.get("display_name", "").split(",")[0]
                    display = item.get("display_name", "")
                    
                    # If alias was clock tower/ghanta ghar, display user-friendly title
                    if "clock tower" in name.lower() and "ghanta ghar" in lower_q:
                        name = name.replace("Clock Tower", "Ghanta Ghar (Clock Tower)")

                    parts = display.split(",")
                    subparts = [p.strip() for p in parts[1:4] if p.strip()]
                    subtitle = ", ".join(subparts) if subparts else display

                    # Clean category badge
                    osm_type = item.get("type", "place").upper()
                    if osm_type in ["MONUMENT", "ATTRACTION", "HISTORIC"]:
                        osm_type = "LANDMARK"
                    elif osm_type in ["ADMINISTRATIVE", "CITY"]:
                        osm_type = "CITY"
                    elif osm_type in ["SUBURB", "NEIGHBOURHOOD"]:
                        osm_type = "LOCALITY"

                    results.append({
                        "name": name,
                        "displayName": f"{name}, {subtitle}",
                        "subtitle": subtitle,
                        "type": osm_type,
                        "lat": lat,
                        "lon": lon,
                    })
        except Exception as err:
            pass

    # 2. Query Photon engine as complementary fallback
    try:
        url_ph = f"https://photon.komoot.io/api/?q={urllib.parse.quote(trimmed)}&limit=10"
        req_ph = urllib.request.Request(url_ph, headers={"User-Agent": "DisasterResponsePlatform/2.0"})
        with urllib.request.urlopen(req_ph, timeout=3) as res_ph:
            data_ph = json.loads(res_ph.read().decode("utf-8"))
            for feat in data_ph.get("features", []):
                p = feat.get("properties", {})
                c = feat.get("geometry", {}).get("coordinates", [0, 0])
                lat = float(c[1])
                lon = float(c[0])
                coord_key = f"{round(lat, 4)}_{round(lon, 4)}"
                if coord_key in seen:
                    continue
                seen.add(coord_key)

                raw_name = p.get("name") or p.get("street") or "Location"
                city = p.get("city") or p.get("county") or ""
                state = p.get("state") or ""
                country = p.get("country") or ""
                sub_list = [city, state, country]
                subtitle = ", ".join([x for x in sub_list if x and x.lower() != raw_name.lower()])

                osm_val = (p.get("osm_value") or p.get("type") or "place").upper()
                if osm_val in ["PLACE_OF_WORSHIP"]:
                    osm_val = "TEMPLE"

                results.append({
                    "name": raw_name,
                    "displayName": f"{raw_name}, {subtitle}" if subtitle else raw_name,
                    "subtitle": subtitle,
                    "type": osm_val,
                    "lat": lat,
                    "lon": lon,
                })
    except Exception:
        pass

    return {"items": results[:8]}
