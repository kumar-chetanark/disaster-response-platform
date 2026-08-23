from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.incident import Incident
from app.services.allocation_engine import (
    calculate_priority_score,
    compute_allocation_recommendations,
)

router = APIRouter(prefix="/allocations", tags=["Allocations & Recommendations"])

class PriorityScoreResponse(BaseModel):
    incident_id: str
    incident_title: str
    priority_score: float
    priority_level: str
    explanation: str
    breakdown: dict

class AllocationAdvisoryResponse(BaseModel):
    id: str
    incident_id: str
    incident_title: str
    incident_priority: float
    required_capability: str
    resource_id: Optional[str] = None
    resource_name: str
    resource_category: str
    personnel_count: Optional[int] = 0
    match_score: int
    travel_time_est: str
    reason: str
    explanation_breakdown: dict
    alternatives: List[str] = []
    scarcity_warning: bool = False
    unmet_demand: bool = False

@router.get("/recommendations", response_model=List[AllocationAdvisoryResponse])
def get_recommendations(
    incident_id: Optional[str] = Query(None, description="Optional incident ID filter"),
    db: Session = Depends(get_db)
):
    """
    Get deterministic capability-aware resource allocation recommendations.
    Dynamically accounts for incident priority ranks, capability requirements, and resource scarcity.
    """
    return compute_allocation_recommendations(db, incident_id=incident_id)

@router.get("/priority/{incident_id}", response_model=PriorityScoreResponse)
def get_incident_priority_score(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """
    Compute real-time explainable priority score for a specific incident.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    p_data = calculate_priority_score(inc)
    return {
        "incident_id": inc.id,
        "incident_title": inc.title,
        "priority_score": p_data["priority_score"],
        "priority_level": p_data["priority_level"],
        "explanation": p_data["explanation"],
        "breakdown": p_data["breakdown"],
    }
