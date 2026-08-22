from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class OperationCreate(BaseModel):
    incident_id: str = Field(..., description="Target canonical incident ID")
    resource_id: str = Field(..., description="Dispatched resource ID")
    authorized_by: str = Field("Authority Command (Level 5)", description="Authorizing authority officer")
    operation_type: str = Field(..., description="e.g. Swift-Water Evacuation, Medical Triage, Drone Recon")
    destination_location: str = Field(..., description="Deployment sector or address")
    mission_objective: str = Field(..., description="Operational mission briefing/objective")
    status: Optional[str] = Field("DISPATCHED", description="AUTHORIZED, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED")
    dispatched_time: Optional[str] = Field(None, description="Time of dispatch")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion timestamp or ETA")
    notes: Optional[str] = Field(None, description="Initial deployment instructions")

class OperationUpdate(BaseModel):
    status: Optional[str] = Field(None, description="AUTHORIZED, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED")
    field_updates_log: Optional[str] = Field(None, description="Field update telemetry message")
    estimated_completion: Optional[str] = None
    notes: Optional[str] = None

class OperationResponse(BaseModel):
    id: str
    incident_id: str
    incident_title: Optional[str] = None
    resource_id: str
    resource_name: str
    resource_category: str
    operation_type: str
    status: str
    destination_location: str
    authorized_by: str
    mission_objective: str
    dispatched_time: str
    estimated_completion: Optional[str] = None
    field_updates_log: Optional[str] = None
    created_at: str
    updated_at: str

class OperationListResponse(BaseModel):
    items: List[OperationResponse]
    total: int
