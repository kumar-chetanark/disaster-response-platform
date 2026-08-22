from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class AssessmentDraftCreate(BaseModel):
    incident_id: str = Field(..., description="Target canonical incident ID")
    assessment_mode: str = Field(..., description="Drone, Helicopter, Land Vehicle, Water Vehicle, Field Team")
    mission_type: str = Field(..., description="Area Scan / Survey, Damage Assessment, Search & Rescue Support, Resource Delivery, Evacuation / Route Assessment, Communication / Observation")
    asset_id: Optional[str] = Field(None, description="Identifier of deployed asset")
    asset_name: str = Field(..., description="Name of deployed asset / team")
    assessment_time: Optional[str] = Field(None, description="Time of assessment")
    weather_conditions: Optional[str] = Field(None, description="Local weather conditions")
    area_surveyed: str = Field(..., description="Surveyed sector or perimeter")
    hazards_detected: Optional[str] = Field(None, description="Comma-separated or formatted detected hazards")
    structures_damaged_count: Optional[int] = Field(0, description="Count of damaged buildings/structures")
    road_accessibility_status: Optional[str] = Field("Open", description="Open, Flooded, Blocked / Debris, Partially Passable")
    people_observed: Optional[str] = Field(None, description="Civilians observed (e.g. 15 on rooftop)")
    recommended_resources: Optional[str] = Field(None, description="Field recommended assets")
    evacuation_route_status: Optional[str] = Field("Clear", description="Clear, Compromised, Impassable")
    operator_observations: Optional[str] = Field(None, description="Narrative field notes")
    confidence_score: Optional[float] = Field(90.0, description="Telemetry confidence score 0-100")
    media_file_urls: Optional[str] = Field(None, description="Evidence media URLs or references")

class AssessmentUpdate(BaseModel):
    weather_conditions: Optional[str] = None
    hazards_detected: Optional[str] = None
    structures_damaged_count: Optional[int] = None
    road_accessibility_status: Optional[str] = None
    people_observed: Optional[str] = None
    recommended_resources: Optional[str] = None
    evacuation_route_status: Optional[str] = None
    operator_observations: Optional[str] = None
    confidence_score: Optional[float] = None
    media_file_urls: Optional[str] = None

class AssessmentResponse(BaseModel):
    id: str
    incident_id: str
    incident_title: Optional[str] = None
    assessment_mode: str
    mission_type: str
    asset_id: Optional[str] = None
    asset_name: str
    assessment_time: Optional[str] = None
    weather_conditions: Optional[str] = None
    area_surveyed: str
    hazards_detected: Optional[str] = None
    structures_damaged_count: int
    road_accessibility_status: str
    people_observed: Optional[str] = None
    recommended_resources: Optional[str] = None
    evacuation_route_status: str
    operator_observations: Optional[str] = None
    confidence_score: float
    media_file_urls: Optional[str] = None
    submitted_at: str

class AssessmentSubmitResponse(BaseModel):
    assessment: AssessmentResponse
    incident_id: str
    updated_severity: str
    updated_priority: str
    resource_coverage_pct: int
    is_field_verified: bool
    recalculated_advisories_count: int
    message: str
