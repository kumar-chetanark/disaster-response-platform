import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.citizen_report import CitizenReport
from app.models.incident_source import IncidentSource
from app.models.alert import Alert
from app.schemas.citizen_report import CitizenReportCreate, CitizenReportResponse
from app.services.matching_service import find_matching_incident

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

def process_citizen_report(db: Session, report_in: CitizenReportCreate) -> CitizenReportResponse:
    """
    Processes citizen report intake:
    1. Runs deterministic matching against active canonical incidents.
    2. If match found: corroborates to existing incident by attaching an incident_source.
    3. If no match found: initializes a new canonical incident record.
    4. Creates the citizen_report and proactive alert records.
    """
    now = get_utc_now()
    
    # 1. Search for matching canonical incident
    matching_incident = find_matching_incident(
        db=db,
        disaster_type=report_in.disaster_type,
        location_name=report_in.location,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
    )

    report_id = str(uuid.uuid4())[:8]
    submitted_time_str = report_in.reported_time or now.strftime("%I:%M %p")
    is_new = False

    if matching_incident:
        # Existing incident matched -> Deduplicate & Corroborate
        canonical_incident = matching_incident
        
        # If new report indicates trapped people or danger, escalate severity if not already critical
        if report_in.is_people_trapped or report_in.is_immediate_danger:
            if canonical_incident.severity != "CRITICAL":
                canonical_incident.severity = "CRITICAL"
                canonical_incident.priority_level = "Level 1"
        
        canonical_incident.updated_at = now
    else:
        # No matching incident -> Create new Canonical Incident
        is_new = True
        canonical_incident = Incident(
            id=f"inc-{str(uuid.uuid4())[:6]}",
            title=f"{report_in.disaster_type} — {report_in.location}",
            description=report_in.description,
            disaster_type=report_in.disaster_type.lower(),
            severity="CRITICAL" if (report_in.is_people_trapped or report_in.is_immediate_danger) else "HIGH",
            priority_level="Level 1" if report_in.is_people_trapped else "Level 2",
            status="ACTIVE",
            latitude=report_in.latitude,
            longitude=report_in.longitude,
            location_name=report_in.location,
            affected_population=report_in.affected_people_estimate or "Pending field census",
            affected_area_sq_km=50.0,
            resource_coverage_pct=60,
            is_field_verified=False,
            created_at=now,
            updated_at=now,
        )
        db.add(canonical_incident)
        db.flush()

    # 2. Record raw citizen report
    citizen_report_record = CitizenReport(
        id=report_id,
        incident_id=canonical_incident.id,
        location_text=report_in.location,
        disaster_type=report_in.disaster_type,
        description=report_in.description,
        is_people_trapped=report_in.is_people_trapped or False,
        is_immediate_danger=report_in.is_immediate_danger or False,
        affected_people_estimate=report_in.affected_people_estimate,
        citizen_contact=f"{report_in.name or ''} {report_in.contact_info or ''}".strip() or None,
        status="CORROBORATED" if matching_incident else "INGESTED",
        created_at=now,
    )
    db.add(citizen_report_record)

    # 3. Record Corroborating Source Entry on the Incident
    source_entry = IncidentSource(
        id=str(uuid.uuid4()),
        incident_id=canonical_incident.id,
        source_type="CITIZEN",
        source_label=f"Public Citizen Intake (#{report_id})",
        channel_badge="CITIZEN_WEB",
        confidence_score=92.0,
        summary=f"{report_in.description} ({'PEOPLE TRAPPED' if report_in.is_people_trapped else 'Active situation'})",
        raw_content=f"CONTACT: {report_in.contact_info or 'N/A'} | LOC: {report_in.location}",
        created_at=now,
    )
    db.add(source_entry)

    # 4. Generate Proactive Alert for Authority Dispatch Queue
    alert_record = Alert(
        id=str(uuid.uuid4()),
        incident_id=canonical_incident.id,
        category="CIVIL",
        source="Citizen Emergency Intake",
        location=report_in.location,
        message=f"[CITIZEN REPORT #{report_id}] {report_in.disaster_type} at {report_in.location}: {report_in.description[:120]}...",
        severity="critical" if report_in.is_immediate_danger else "warning",
        alert_time=submitted_time_str,
        is_reviewed_by_authority=False,
        created_at=now,
    )
    db.add(alert_record)

    db.commit()

    return CitizenReportResponse(
        report_id=report_id,
        incident_id=canonical_incident.id,
        incident_title=canonical_incident.title,
        is_new_incident=is_new,
        status="CORROBORATED" if not is_new else "CREATED",
        message="Report successfully corroborated with active incident." if not is_new else "New incident registered in central disaster command.",
        submitted_at=submitted_time_str,
    )
