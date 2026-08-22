from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class AlertResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    incident_title: Optional[str] = None
    category: str
    source: str
    location: str
    message: str
    severity: str
    is_reviewed: bool
    alert_time: str
    created_at: str

class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    unreviewed_count: int

class AlertReviewUpdate(BaseModel):
    is_reviewed: bool = Field(True, description="Mark as reviewed / acknowledged by authority")
