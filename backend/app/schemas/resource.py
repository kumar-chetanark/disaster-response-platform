from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Resource unit name")
    category: str = Field(..., description="medical, police_army, rescue, aerial, water, land, shelter, supplies")
    status: str = Field("AVAILABLE", description="AVAILABLE, IN OPERATION, DISPATCHED, MAINTENANCE, UNAVAILABLE")
    base_location: str = Field(..., description="Base base/hub location name")
    latitude: Optional[float] = Field(None, description="Base GPS Latitude")
    longitude: Optional[float] = Field(None, description="Base GPS Longitude")
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
    status: Optional[str] = None
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
    category: str
    status: str
    base_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
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
