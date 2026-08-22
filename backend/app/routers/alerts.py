from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.alert import AlertResponse, AlertListResponse, AlertReviewUpdate
from app.services.alert_service import get_alerts_list, review_alert

router = APIRouter(prefix="/alerts", tags=["Alerts and Early Warnings"])

@router.get("", response_model=AlertListResponse)
def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, warning, info"),
    category: Optional[str] = Query(None, description="Filter by category: METEO, CIVIL, INFRASTRUCTURE, MEDICAL, GOVERNMENT"),
    incident_id: Optional[str] = Query(None, description="Filter by canonical incident ID"),
    is_reviewed: Optional[bool] = Query(None, description="Filter by reviewed status (true/false)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Returns paginated proactive telemetry alerts persisted in the central database.
    """
    return get_alerts_list(
        db=db,
        severity=severity,
        category=category,
        incident_id=incident_id,
        is_reviewed=is_reviewed,
        page=page,
        page_size=page_size,
    )

@router.patch("/{alert_id}/review", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    review_in: Optional[AlertReviewUpdate] = None,
    db: Session = Depends(get_db),
):
    """
    Authority action: Marks an alert as reviewed / acknowledged.
    """
    review_data = review_in or AlertReviewUpdate(is_reviewed=True)
    updated = review_alert(db=db, alert_id=alert_id, review_in=review_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found.",
        )
    return updated
