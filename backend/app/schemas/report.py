from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field

ReportType = Literal[
    "SITREP",
    "AFTER_ACTION",
    "RESOURCE_AUDIT",
    "CASUALTY_REPORT",
    "ASSESSMENT_SUMMARY",
]

ReportStatus = Literal["PENDING", "ONGOING", "COMPLETED"]

class ReportBase(BaseModel):
    incident_id: Optional[str] = None
    report_type: ReportType = "SITREP"
    title: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    summary: str
    metrics_summary: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[ReportStatus] = "PENDING"

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    metrics_summary: Optional[str] = None

class ReportResponse(ReportBase):
    id: str
    status: str = "PENDING"
    created_at: datetime
    incident_title: Optional[str] = None
    incident_location: Optional[str] = None

    class Config:
        from_attributes = True

class ReportListResponse(BaseModel):
    total: int
    items: List[ReportResponse]
