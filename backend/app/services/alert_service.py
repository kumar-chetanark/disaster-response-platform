from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertListResponse, AlertReviewUpdate

def to_alert_response(alert: Alert) -> AlertResponse:
    inc_title = alert.incident.title if alert.incident else "Central Command Network"
    time_display = alert.alert_time or (alert.created_at.strftime("%I:%M %p") if alert.created_at else "Just now")
    return AlertResponse(
        id=alert.id,
        incident_id=alert.incident_id,
        incident_title=inc_title,
        category=alert.category,
        source=alert.source,
        location=alert.location,
        message=alert.message,
        severity=alert.severity.lower(),
        is_reviewed=bool(alert.is_reviewed_by_authority),
        alert_time=time_display,
        created_at=alert.created_at.strftime("%I:%M %p") if alert.created_at else "Just now",
    )

def get_alerts_list(
    db: Session,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    incident_id: Optional[str] = None,
    is_reviewed: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> AlertListResponse:
    query = db.query(Alert)

    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity.ilike(severity))

    if category and category.upper() != "ALL":
        query = query.filter(Alert.category.ilike(category))

    if incident_id:
        query = query.filter(Alert.incident_id == incident_id)

    if is_reviewed is not None:
        query = query.filter(Alert.is_reviewed_by_authority == is_reviewed)

    total = query.count()
    offset = (page - 1) * page_size
    alerts = query.order_by(desc(Alert.created_at)).offset(offset).limit(page_size).all()

    unreviewed_count = db.query(Alert).filter(Alert.is_reviewed_by_authority == False).count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return AlertListResponse(
        items=[to_alert_response(a) for a in alerts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        unreviewed_count=unreviewed_count,
    )

def review_alert(db: Session, alert_id: str, review_in: AlertReviewUpdate) -> Optional[AlertResponse]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    alert.is_reviewed_by_authority = review_in.is_reviewed
    db.commit()
    db.refresh(alert)
    return to_alert_response(alert)
