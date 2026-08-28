from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.citizen_report import CitizenReportCreate, CitizenReportResponse
from app.services.citizen_service import process_citizen_report

router = APIRouter(prefix="/citizen-reports", tags=["Citizen Reports"])

@router.post("", response_model=CitizenReportResponse, status_code=status.HTTP_201_CREATED)
def submit_citizen_report(
    report_in: CitizenReportCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a public emergency citizen report:
    - Validates intake parameters.
    - Matches with active canonical incidents via geographic & textual deduplication.
    - Attaches as a corroborating source without creating duplicates.
    - Escalates severity if trapped individuals or immediate danger are flagged.
    """
    try:
        return process_citizen_report(db=db, report_in=report_in)
    except ValueError as ve:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process citizen emergency report: {str(e)}"
        )
