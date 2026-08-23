from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.incident import Incident
from app.schemas.report import (
    ReportCreate,
    ReportResponse,
    ReportListResponse,
    ReportType,
    ReportUpdate,
)
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("", response_model=ReportListResponse)
def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    report_type: Optional[ReportType] = Query(None),
    incident_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List operational and debrief reports with optional filtering."""
    return report_service.get_reports(
        db,
        skip=skip,
        limit=limit,
        report_type=report_type,
        incident_id=incident_id,
    )

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Retrieve a single report by ID."""
    report = report_service.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found.",
        )
    return report_service.to_report_response(report)

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    """Create a new report linked to an incident or general system log."""
    if payload.incident_id:
        incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incident with ID '{payload.incident_id}' does not exist.",
            )
    
    report = report_service.create_report(db, payload)
    return report_service.to_report_response(report)

@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(report_id: str, payload: ReportUpdate, db: Session = Depends(get_db)):
    """Update report operational lifecycle status (PENDING -> ONGOING -> COMPLETED)."""
    report = report_service.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found.",
        )
    if payload.status is not None:
        report.status = payload.status
    if payload.title is not None:
        report.title = payload.title
    if payload.summary is not None:
        report.summary = payload.summary
    if payload.metrics_summary is not None:
        report.metrics_summary = payload.metrics_summary
    
    db.commit()
    db.refresh(report)
    return report_service.to_report_response(report)

@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: str, db: Session = Depends(get_db)):
    """Generate and stream a professional ReportLab PDF for a report."""
    report = report_service.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found.",
        )

    pdf_bytes = report_service.generate_report_pdf(db, report)
    filename = f"report_{report.id}_{report.report_type.lower()}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{report_id}", status_code=status.HTTP_200_OK)
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
):
    """
    Permanently deletes an operational report / SITREP dossier.
    """
    from app.models.report import Report
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found.",
        )
    db.delete(report)
    db.commit()
    return {"status": "SUCCESS", "message": f"Report '{report_id}' deleted successfully."}
