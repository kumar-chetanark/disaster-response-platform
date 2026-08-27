from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Resource unit name")
    type: Optional[str] = Field("Squad", description="Squad, Ambulance, UAV Drone, Helicopter, Boat, Shelter")
    category: str = Field(..., description="rescue, medical, aerial, water, land, shelter, supplies, police_army")
    status: str = Field("AVAILABLE", description="AVAILABLE, ASSIGNED, DISPATCHED, EN_ROUTE, ON_SCENE, UNAVAILABLE, MAINTENANCE")
    base_location: str = Field(..., description="Base hub or district location name")
    latitude: Optional[float] = Field(None, description="Base GPS Latitude")
    longitude: Optional[float] = Field(None, description="Base GPS Longitude")
    
    capabilities: Optional[str] = Field(None, description="Comma-separated capabilities: Water Rescue, Trauma Care, Aerial Recon")
    capacity: Optional[int] = Field(None, description="Transport / Evacuation capacity count")
    operating_range: Optional[str] = Field(None, description="Operating range or flight endurance")
    vehicle_registration: Optional[str] = Field(None, description="Vehicle ID / callsign")

    personnel_count: Optional[int] = Field(0, description="Number of personnel")
    equipment_details: Optional[str] = Field(None, description="Description of equipment")
    
    # Specific shelter & stockpile fields
    shelter_capacity: Optional[int] = Field(None, description="Total shelter bed capacity")
    shelter_occupied: Optional[int] = Field(None, description="Occupied beds count")
    supplies_food_days: Optional[int] = Field(None, description="Estimated days of food remaining")
    supplies_food_people: Optional[int] = Field(None, description="Number of people supported with food")
    supplies_medicine_count: Optional[int] = Field(None, description="Available medical unit count")
    supplies_clothing_count: Optional[int] = Field(None, description="Available clothing kit count")

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capabilities: Optional[str] = None
    capacity: Optional[int] = None
    operating_range: Optional[str] = None
    vehicle_registration: Optional[str] = None
    assigned_incident_id: Optional[str] = None
    assigned_operation_id: Optional[str] = None
    personnel_count: Optional[int] = None
    equipment_details: Optional[str] = None
    shelter_capacity: Optional[int] = None
    shelter_occupied: Optional[int] = None
    supplies_food_days: Optional[int] = None
    supplies_food_people: Optional[int] = None
    supplies_medicine_count: Optional[int] = None
    supplies_clothing_count: Optional[int] = None

class ResourceResponse(BaseModel):
    id: str
    name: str
    type: Optional[str] = "Squad"
    category: str
    status: str
    base_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capabilities: Optional[str] = None
    capacity: Optional[int] = None
    operating_range: Optional[str] = None
    vehicle_registration: Optional[str] = None
    assigned_incident_id: Optional[str] = None
    assigned_operation_id: Optional[str] = None
    personnel_count: int
    equipment_details: Optional[str] = None
    distance_km: Optional[float] = None
    
    # Shelter & stockpile attributes
    shelter_capacity: Optional[int] = None
    shelter_occupied: Optional[int] = None
    supplies_food_days: Optional[int] = None
    supplies_food_people: Optional[int] = None
    supplies_medicine_count: Optional[int] = None
    supplies_clothing_count: Optional[int] = None

class ResourceListResponse(BaseModel):
    items: List[ResourceResponse]
    total: int
    categories_breakdown: Dict[str, int]
