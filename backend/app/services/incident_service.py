from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.citizen_report import CitizenReport
from app.models.assessment import Assessment
from app.models.resource_allocation import ResourceAllocation
from app.models.operation import Operation
from app.models.resource import Resource
from app.schemas.incident import (
    IncidentListItemSchema,
    IncidentDetailSchema,
    IncidentListResponse,
    IncidentSourceSchema,
    CitizenReportSchema,
    AssessmentSchema,
    ResourceAdvisorySchema,
    OperationTrackSchema,
    TimelineEventSchema,
)

def format_time_ago(dt) -> str:
    if not dt:
        return "Just now"
    return dt.strftime("%I:%M %p")

def get_incidents_list(
    db: Session,
    search: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> IncidentListResponse:
    query = db.query(Incident)

    if severity and severity.upper() != "ALL":
        query = query.filter(Incident.severity == severity.upper())

    if status and status.upper() != "ALL":
        query = query.filter(Incident.status == status.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Incident.title.ilike(term),
                Incident.location_name.ilike(term),
                Incident.id.ilike(term),
                Incident.sector.ilike(term),
                Incident.disaster_type.ilike(term),
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    incidents = query.order_by(desc(Incident.updated_at)).offset(offset).limit(page_size).all()

    items: List[IncidentListItemSchema] = []
    for inc in incidents:
        sources = inc.sources or []
        citizen_count = len([s for s in sources if s.source_type == "CITIZEN"])
        news_count = len([s for s in sources if s.source_type == "NEWS"])
        gov_count = len([s for s in sources if s.source_type == "GOVERNMENT"])
        weather_count = len([s for s in sources if s.source_type == "WEATHER"])
        field_count = len([s for s in sources if s.source_type == "FIELD_ASSESSMENT"])

        items.append(
            IncidentListItemSchema(
                id=inc.id,
                title=inc.title,
                category=inc.disaster_type.capitalize(),
                type=inc.disaster_type.lower(),
                location=inc.location_name,
                sector=inc.sector or inc.location_name,
                impact=inc.description or f"Active {inc.disaster_type} emergency reported.",
                severity=inc.severity,
                status=inc.status,
                priority_level=inc.priority_level,
                affected_population_est=inc.affected_population or "Pending field census",
                affected_area_sq_km=inc.affected_area_sq_km or 50.0,
                resource_coverage=f"{inc.resource_coverage_pct}%",
                is_field_verified=inc.is_field_verified,
                last_updated=format_time_ago(inc.updated_at),
                time_reported=format_time_ago(inc.created_at),
                total_sources_count=len(sources),
                source_counts={
                    "citizenReports": citizen_count,
                    "newsReports": news_count,
                    "governmentReports": gov_count,
                    "weatherReports": weather_count,
                    "fieldAssessments": field_count,
                },
                latitude=inc.latitude,
                longitude=inc.longitude,
            )
        )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return IncidentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

def get_incident_detail(db: Session, incident_id: str) -> Optional[IncidentDetailSchema]:
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return None

    sources = inc.sources or []
    citizen_count = len([s for s in sources if s.source_type == "CITIZEN"])
    news_count = len([s for s in sources if s.source_type == "NEWS"])
    gov_count = len([s for s in sources if s.source_type == "GOVERNMENT"])
    weather_count = len([s for s in sources if s.source_type == "WEATHER"])
    field_count = len([s for s in sources if s.source_type == "FIELD_ASSESSMENT"])

    # 1. Corroborating sources
    source_items = [
        IncidentSourceSchema(
            id=s.id,
            source_type=s.source_type,
            source_label=s.source_label,
            channel_badge=s.channel_badge or s.source_type,
            confidence_score=s.confidence_score,
            summary=s.summary,
            raw_content=s.raw_content,
            created_at=s.created_at.strftime("%I:%M %p") if s.created_at else "10:15 AM",
        )
        for s in sources
    ]

    # 2. Citizen reports
    citizen_reports = [
        CitizenReportSchema(
            id=c.id,
            location_text=c.location_text,
            disaster_type=c.disaster_type,
            description=c.description,
            is_people_trapped=c.is_people_trapped,
            is_immediate_danger=c.is_immediate_danger,
            affected_people_estimate=c.affected_people_estimate,
            citizen_contact=c.citizen_contact,
            status=c.status,
            created_at=c.created_at.strftime("%I:%M %p") if c.created_at else "10:30 AM",
        )
        for c in (inc.citizen_reports or [])
    ]

    # 3. Field Assessments (Drone, Helicopter, Land, Water)
    assessments = [
        AssessmentSchema(
            id=a.id,
            assessment_mode=a.assessment_mode,
            mission_type=a.mission_type,
            asset_id=a.asset_id,
            asset_name=a.asset_name,
            assessment_time=a.assessment_time,
            weather_conditions=a.weather_conditions,
            area_surveyed=a.area_surveyed,
            hazards_detected=a.hazards_detected,
            structures_damaged_count=a.structures_damaged_count,
            road_accessibility_status=a.road_accessibility_status,
            people_observed=a.people_observed,
            recommended_resources=a.recommended_resources,
            evacuation_route_status=a.evacuation_route_status,
            operator_observations=a.operator_observations,
            confidence_score=a.confidence_score,
            submitted_at=a.submitted_at.strftime("%I:%M %p") if a.submitted_at else "10:35 AM",
        )
        for a in (inc.assessments or [])
    ]

    # 4. Operations
    operations = [
        OperationTrackSchema(
            id=op.id,
            resource_id=op.resource_id,
            resource_name=op.resource.name if op.resource else "Emergency Squad",
            operation_type=op.operation_type,
            state=op.state,
            destination_location=op.destination_location,
            dispatched_time=op.dispatched_time,
            estimated_completion=op.estimated_completion,
            mission_objective=op.mission_objective,
        )
        for op in (inc.operations or [])
    ]

    # 5. Recommendations
    allocations = (
        db.query(ResourceAllocation)
        .filter(ResourceAllocation.incident_id == inc.id)
        .all()
    )
    recommendations = [
        ResourceAdvisorySchema(
            id=ra.id,
            resource_id=ra.resource_id,
            resource_name=ra.resource.name if ra.resource else "Response Asset",
            resource_category=ra.resource.category if ra.resource else "general",
            status=ra.status,
            match_score=ra.match_score,
            travel_time_est=ra.travel_time_est,
            reason=ra.reason,
        )
        for ra in allocations
    ]

    # Resolve real dynamic recommendations from database if none stored
    if not recommendations:
        from app.services.allocation_engine import compute_allocation_recommendations
        live_recs = compute_allocation_recommendations(db=db, incident_id=inc.id)
        for lr in live_recs:
            if lr.get("resource_id"):
                recommendations.append(
                    ResourceAdvisorySchema(
                        id=lr["id"],
                        resource_id=lr["resource_id"],
                        resource_name=lr["resource_name"],
                        resource_category=lr["resource_category"],
                        status="RECOMMENDED",
                        match_score=lr["match_score"],
                        travel_time_est=lr["travel_time_est"],
                        reason=lr["reason"],
                    )
                )

    # 6. Progression Timeline
    timeline_events = [
        TimelineEventSchema(
            id=f"tl-{inc.id}-1",
            timestamp=inc.created_at.strftime("%I:%M %p") if inc.created_at else "10:15 AM",
            title=f"Incident Ingestion: {inc.title}",
            description=f"Canonical incident initialized via proactive early intelligence streams.",
            event_type="INGESTION",
        )
    ]

    for c in citizen_reports:
        timeline_events.append(
            TimelineEventSchema(
                id=f"tl-c-{c.id}",
                timestamp=c.created_at,
                title=f"Citizen Report Corroborated: #{c.id}",
                description=f"{c.description[:80]}... (Trapped: {'Yes' if c.is_people_trapped else 'No'})",
                event_type="CORROBORATION",
            )
        )

    for a in assessments:
        timeline_events.append(
            TimelineEventSchema(
                id=f"tl-a-{a.id}",
                timestamp=a.submitted_at,
                title=f"Field Recon Ingested: {a.id} ({a.asset_name})",
                description=f"Verified: {a.structures_damaged_count} damaged structures, Road status: {a.road_accessibility_status}.",
                event_type="ASSESSMENT",
            )
        )

    return IncidentDetailSchema(
        id=inc.id,
        title=inc.title,
        description=inc.description,
        category=inc.disaster_type.capitalize(),
        type=inc.disaster_type.lower(),
        location=inc.location_name,
        sector=inc.sector or inc.location_name,
        latitude=inc.latitude,
        longitude=inc.longitude,
        impact=inc.description or f"Severe surge • 15 civilians isolated • Route 9 Bridge damaged",
        severity=inc.severity,
        status=inc.status,
        priority_level=inc.priority_level,
        affected_population_est=inc.affected_population or "Pending field census",
        affected_area_sq_km=inc.affected_area_sq_km or 50.0,
        resource_coverage=f"{inc.resource_coverage_pct}%",
        is_field_verified=inc.is_field_verified,
        last_updated=format_time_ago(inc.updated_at),
        time_reported=format_time_ago(inc.created_at),
        total_sources_count=len(sources),
        source_counts={
            "citizenReports": citizen_count,
            "newsReports": news_count,
            "governmentReports": gov_count,
            "weatherReports": weather_count,
            "fieldAssessments": field_count,
        },
        sources=source_items,
        citizen_reports=citizen_reports,
        assessments=assessments,
        allocated_resources=operations,
        recommended_resources=recommendations,
        associated_operations=[op.operation_type for op in operations],
        timeline=timeline_events,
    )

VALID_LIFECYCLE_TRANSITIONS = {
    "PENDING": {"ACTIVE", "MONITORING", "RESOLVED"},
    "ACTIVE": {"MONITORING", "RESOLVED"},
    "MONITORING": {"ACTIVE", "RESOLVED"},
    "RESOLVED": {"ACTIVE", "MONITORING"},  # Allow authority command to reopen/reactivate incident
}

def update_incident_status(
    db: Session,
    incident_id: str,
    target_status: str,
    authority_user: dict,
    notes: Optional[str] = None,
) -> Incident:
    from fastapi import HTTPException, status as http_status
    from datetime import datetime, timezone
    import uuid

    clean_target = target_status.strip().upper()
    if clean_target not in {"PENDING", "ACTIVE", "MONITORING", "RESOLVED"}:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid lifecycle status '{target_status}'. Supported states: PENDING, ACTIVE, MONITORING, RESOLVED."
        )

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found."
        )

    current_status = (inc.status or "PENDING").upper()
    
    # If already in target status, return cleanly
    if current_status == clean_target:
        return inc

    allowed_targets = VALID_LIFECYCLE_TRANSITIONS.get(current_status, set())
    if clean_target not in allowed_targets:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Invalid lifecycle transition: Cannot move incident from '{current_status}' to '{clean_target}'."
        )

    now = datetime.now(timezone.utc)
    inc.status = clean_target
    inc.updated_at = now
    if clean_target in {"ACTIVE", "MONITORING"} and current_status == "PENDING":
        inc.is_field_verified = True

    # Record auditable authority source entry on the incident
    auth_name = authority_user.get("name") or authority_user.get("username") or "Command Authority"
    badge = authority_user.get("badge_id") or "AUTH"
    audit_source = IncidentSource(
        id=str(uuid.uuid4()),
        incident_id=inc.id,
        source_type="GOVERNMENT",
        source_label=f"Authority Verification: {auth_name} ({badge})",
        channel_badge="GOV_COMMAND",
        confidence_score=99.0,
        summary=f"Lifecycle transition: {current_status} -> {clean_target}. {notes or 'Authority command verified.'}",
        raw_content=f"AUTHORITY: {auth_name} | BADGE: {badge} | PREV: {current_status} | NEW: {clean_target}",
        created_at=now,
    )
    db.add(audit_source)
    db.commit()
    db.refresh(inc)
    return inc
