from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse, ReportListResponse
from app.services.report_service import (
    list_reports,
    get_report_by_id,
    create_report,
    generate_report_pdf,
    to_report_response,
)

router = APIRouter(prefix="/reports", tags=["Operational Reports & After-Action Debriefs"])

@router.get("", response_model=ReportListResponse)
def get_reports(
    incident_id: Optional[str] = Query(None, description="Filter reports by linked canonical incident ID"),
    report_type: Optional[str] = Query(None, description="Filter by report type: SITREP, AFTER_ACTION, DAMAGE_ASSESSMENT, RESOURCE_AUDIT"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Returns paginated list of operational reports and historical after-action debrief dossiers.
    """
    return list_reports(
        db=db,
        incident_id=incident_id,
        report_type=report_type,
        page=page,
        page_size=page_size,
    )

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves full details of an operational report dossier.
    """
    r = get_report_by_id(db=db, report_id=report_id)
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found.",
        )
    return to_report_response(r)

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_operational_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
):
    """
    Creates a new operational situation report or after-action debrief dossier.
    Validates referenced canonical incident ID.
    """
    try:
        return create_report(db=db, report_in=report_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    db: Session = Depends(get_db),
):
    """
    Generates and returns an official PDF binary dossier for the specified report,
    including canonical incident data, multi-channel corroborating sources, field recon,
    operational dispatches, resource advisories, and early warning telemetry alerts.
    """
    pdf_bytes = generate_report_pdf(db=db, report_id=report_id)
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found.",
        )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="report_{report_id}.pdf"'
        },
    )
