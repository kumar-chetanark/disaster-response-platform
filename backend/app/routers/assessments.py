from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.assessment import (
    AssessmentDraftCreate,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentSubmitResponse,
)
from app.services.assessment_service import (
    create_assessment,
    get_assessment_by_id,
    update_assessment,
    submit_assessment_to_command,
)

router = APIRouter(prefix="/assessments", tags=["Generic Field Assessments"])

@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_field_assessment(
    a_in: AssessmentDraftCreate,
    db: Session = Depends(get_db),
):
    """
    Creates a new generic field assessment draft across any method:
    - Drone, Helicopter, Land Vehicle, Water Vehicle, Field Team
    Across any mission type:
    - Area Scan / Survey, Damage Assessment, Search & Rescue Support, Resource Delivery, Route Assessment, Communication
    """
    return create_assessment(db=db, a_in=a_in)

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves full field assessment record and telemetry.
    """
    a = get_assessment_by_id(db=db, assessment_id=assessment_id)
    if not a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID '{assessment_id}' not found.",
        )
    return a

@router.patch("/{assessment_id}", response_model=AssessmentResponse)
def modify_assessment(
    assessment_id: str,
    a_up: AssessmentUpdate,
    db: Session = Depends(get_db),
):
    """
    Updates field assessment parameters and telemetry.
    """
    updated = update_assessment(db=db, assessment_id=assessment_id, a_up=a_up)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID '{assessment_id}' not found.",
        )
    return updated

@router.post("/{assessment_id}/submit", response_model=AssessmentSubmitResponse)
def submit_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
):
    """
    SUBMIT TO COMMAND Action:
    1. Ingests assessment telemetry into canonical incident.
    2. Attaches new corroborating source.
    3. Deterministically recalculates incident severity & priority level.
    4. Deterministically recalculates type-matched resource allocations.
    """
    result = submit_assessment_to_command(db=db, assessment_id=assessment_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID '{assessment_id}' not found.",
        )
    return result
