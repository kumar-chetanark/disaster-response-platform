from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CitizenReportCreate(BaseModel):
    name: Optional[str] = Field(None, description="Optional citizen submitter name")
    contact_info: Optional[str] = Field(None, description="Optional phone number or email")
    disaster_type: str = Field(..., description="e.g. Cyclone, Flood, Fire, Earthquake, Landslide, Infrastructure")
    description: str = Field(..., min_length=5, description="Detailed account of the emergency")
    location: str = Field(..., min_length=2, description="Location description or landmark")
    latitude: Optional[float] = Field(None, description="GPS Latitude")
    longitude: Optional[float] = Field(None, description="GPS Longitude")
    reported_time: Optional[str] = Field(None, description="Client reported time string")
    image_url: Optional[str] = Field(None, description="Optional uploaded image or evidence URL")
    
    # Priority indicators
    is_people_trapped: Optional[bool] = Field(False, description="Flag if individuals are trapped")
    is_immediate_danger: Optional[bool] = Field(False, description="Flag if life-threatening danger exists")
    affected_people_estimate: Optional[str] = Field(None, description="Estimated number of affected civilians")

class CitizenReportResponse(BaseModel):
    report_id: str
    incident_id: str
    incident_title: str
    is_new_incident: bool
    status: str
    message: str
    submitted_at: str
