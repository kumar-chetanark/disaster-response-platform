from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ReportCreate(BaseModel):
    incident_id: Optional[str] = Field(None, description="Optional canonical incident ID linked to this report")
    report_type: str = Field(..., description="Report type: SITREP, AFTER_ACTION, DAMAGE_ASSESSMENT, RESOURCE_AUDIT")
    title: str = Field(..., description="Official report title")
    author: str = Field(..., description="Reporting officer or command authority")
    summary: str = Field(..., description="Narrative summary and executive overview")
    metrics_summary: Optional[str] = Field(None, description="Key metrics or JSON-encoded metrics summary")
    tags: Optional[str] = Field(None, description="Comma-separated category tags")

class ReportResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    incident_title: Optional[str] = None
    report_type: str
    title: str
    author: str
    summary: str
    metrics_summary: Optional[str] = None
    tags: Optional[str] = None
    created_at: str

class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
