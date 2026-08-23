from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class IncidentSourceSchema(BaseModel):
    id: str
    source_type: str
    source_label: str
    channel_badge: Optional[str] = None
    confidence_score: float
    summary: str
    raw_content: Optional[str] = None
    created_at: str

class CitizenReportSchema(BaseModel):
    id: str
    location_text: str
    disaster_type: str
    description: str
    is_people_trapped: bool
    is_immediate_danger: bool
    affected_people_estimate: Optional[str] = None
    citizen_contact: Optional[str] = None
    status: str
    created_at: str

class AssessmentSchema(BaseModel):
    id: str
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
    submitted_at: str

class ResourceAdvisorySchema(BaseModel):
    id: str
    resource_id: str
    resource_name: str
    resource_category: str
    status: str
    match_score: int
    travel_time_est: Optional[str] = None
    reason: str

class OperationTrackSchema(BaseModel):
    id: str
    resource_id: str
    resource_name: str
    operation_type: str
    state: str
    destination_location: str
    dispatched_time: str
    estimated_completion: Optional[str] = None
    mission_objective: str

class TimelineEventSchema(BaseModel):
    id: str
    timestamp: str
    title: str
    description: str
    event_type: str

class IncidentListItemSchema(BaseModel):
    id: str
    title: str
    category: str
    type: str
    location: str
    sector: Optional[str] = None
    impact: str
    severity: str
    status: str
    priority_level: str
    affected_population_est: Optional[str] = None
    affected_area_sq_km: Optional[float] = None
    resource_coverage: str
    is_field_verified: bool
    last_updated: str
    time_reported: str
    total_sources_count: int
    source_counts: Dict[str, int]

class IncidentDetailSchema(IncidentListItemSchema):
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sources: List[IncidentSourceSchema] = []
    citizen_reports: List[CitizenReportSchema] = []
    assessments: List[AssessmentSchema] = []
    allocated_resources: List[OperationTrackSchema] = []
    recommended_resources: List[ResourceAdvisorySchema] = []
    associated_operations: List[str] = []
    timeline: List[TimelineEventSchema] = []

class IncidentListResponse(BaseModel):
    items: List[IncidentListItemSchema]
    total: int
    page: int
    page_size: int
    total_pages: int

class IncidentStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Target status: PENDING, ACTIVE, MONITORING, RESOLVED")
    notes: Optional[str] = Field(None, description="Optional verification or resolution notes")
