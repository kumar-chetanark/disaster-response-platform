import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.assessment import Assessment
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.resource_allocation import ResourceAllocation
from app.models.resource import Resource
from app.models.alert import Alert
from app.schemas.assessment import (
    AssessmentDraftCreate,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentSubmitResponse,
)

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

def to_assessment_response(a: Assessment) -> AssessmentResponse:
    return AssessmentResponse(
        id=a.id,
        incident_id=a.incident_id,
        incident_title=a.incident.title if a.incident else "Target Disaster Sector",
        assessment_mode=a.assessment_mode,
        mission_type=a.mission_type,
        asset_id=a.asset_id,
        asset_name=a.asset_name,
        assessment_time=a.assessment_time,
        weather_conditions=a.weather_conditions,
        area_surveyed=a.area_surveyed,
        hazards_detected=a.hazards_detected,
        structures_damaged_count=a.structures_damaged_count or 0,
        road_accessibility_status=a.road_accessibility_status or "Open",
        people_observed=a.people_observed,
        recommended_resources=a.recommended_resources,
        evacuation_route_status=a.evacuation_route_status or "Clear",
        operator_observations=a.operator_observations,
        confidence_score=a.confidence_score or 90.0,
        media_file_urls=a.media_file_urls,
        submitted_at=a.submitted_at.strftime("%I:%M %p") if a.submitted_at else "10:35 AM",
    )

def create_assessment(db: Session, a_in: AssessmentDraftCreate) -> AssessmentResponse:
    now = get_utc_now()
    a_id = f"asm-{str(uuid.uuid4())[:6]}"
    
    assessment = Assessment(
        id=a_id,
        incident_id=a_in.incident_id,
        assessment_mode=a_in.assessment_mode,
        mission_type=a_in.mission_type,
        asset_id=a_in.asset_id or f"asset-{str(uuid.uuid4())[:4]}",
        asset_name=a_in.asset_name,
        assessment_time=a_in.assessment_time or now.strftime("%I:%M %p"),
        weather_conditions=a_in.weather_conditions or "Winds 45km/h • Vis 3km",
        area_surveyed=a_in.area_surveyed,
        hazards_detected=a_in.hazards_detected or "Downed lines • Standing water",
        structures_damaged_count=a_in.structures_damaged_count or 0,
        road_accessibility_status=a_in.road_accessibility_status or "Flooded",
        people_observed=a_in.people_observed or "Civilians observed in sector",
        recommended_resources=a_in.recommended_resources or "Swift-Water Rescue • Mobile Trauma Unit",
        evacuation_route_status=a_in.evacuation_route_status or "Compromised",
        operator_observations=a_in.operator_observations,
        confidence_score=a_in.confidence_score or 94.0,
        media_file_urls=a_in.media_file_urls,
        submitted_at=now,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return to_assessment_response(assessment)

def get_assessment_by_id(db: Session, assessment_id: str) -> Optional[AssessmentResponse]:
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        return None
    return to_assessment_response(a)

def update_assessment(db: Session, assessment_id: str, a_up: AssessmentUpdate) -> Optional[AssessmentResponse]:
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        return None

    if a_up.weather_conditions is not None:
        a.weather_conditions = a_up.weather_conditions
    if a_up.hazards_detected is not None:
        a.hazards_detected = a_up.hazards_detected
    if a_up.structures_damaged_count is not None:
        a.structures_damaged_count = a_up.structures_damaged_count
    if a_up.road_accessibility_status is not None:
        a.road_accessibility_status = a_up.road_accessibility_status
    if a_up.people_observed is not None:
        a.people_observed = a_up.people_observed
    if a_up.recommended_resources is not None:
        a.recommended_resources = a_up.recommended_resources
    if a_up.evacuation_route_status is not None:
        a.evacuation_route_status = a_up.evacuation_route_status
    if a_up.operator_observations is not None:
        a.operator_observations = a_up.operator_observations
    if a_up.confidence_score is not None:
        a.confidence_score = a_up.confidence_score
    if a_up.media_file_urls is not None:
        a.media_file_urls = a_up.media_file_urls

    db.commit()
    db.refresh(a)
    return to_assessment_response(a)

def submit_assessment_to_command(db: Session, assessment_id: str) -> Optional[AssessmentSubmitResponse]:
    """
    Closed-Loop Field Recon Ingestion:
    1. Attaches reconnaissance telemetry as a new Corroborating Source.
    2. Updates incident to Field-Verified with verified ground impact narrative.
    3. Deterministically recalculates incident priority level and severity.
    4. Deterministically generates/recalculates type-matched Resource Allocation Advisories.
    5. Emits Priority Incident Alert.
    """
    now = get_utc_now()
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        return None

    incident = db.query(Incident).filter(Incident.id == a.incident_id).first()
    if not incident:
        return None

    # 1. Attach as Corroborating Source
    source_entry = IncidentSource(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        source_type="FIELD_ASSESSMENT",
        source_label=f"{a.assessment_mode} Mission ({a.asset_name})",
        channel_badge="FIELD_RECON",
        confidence_score=a.confidence_score or 95.0,
        summary=f"Recon Verified: {a.structures_damaged_count} structures damaged, Road status: {a.road_accessibility_status}, {a.people_observed}. Mode: {a.assessment_mode}. Mission: {a.mission_type}.",
        raw_content=f"MISSION_ID: {a.id} | ASSET: {a.asset_name} | HAZARDS: {a.hazards_detected} | EVAC: {a.evacuation_route_status}",
        created_at=now,
    )
    db.add(source_entry)

    # 2. Update Incident status & verification
    incident.is_field_verified = True
    incident.resource_coverage_pct = min(100, (incident.resource_coverage_pct or 60) + 15)
    incident.description = f"Verified: {a.structures_damaged_count} structures damaged • {a.people_observed} • Route status: {a.road_accessibility_status}"
    incident.updated_at = now

    # 3. Deterministic Priority & Severity Recalculation
    if (
        (a.structures_damaged_count and a.structures_damaged_count >= 5) or
        "impassable" in (a.evacuation_route_status or "").lower() or
        "trapped" in (a.people_observed or "").lower() or
        "flooded" in (a.road_accessibility_status or "").lower()
    ):
        incident.severity = "CRITICAL"
        incident.priority_level = "Level 1"
    else:
        incident.severity = "HIGH"
        incident.priority_level = "Level 2"

    # 4. Deterministic Resource Allocation Recalculation
    db.query(ResourceAllocation).filter(ResourceAllocation.incident_id == incident.id).delete()
    
    recalc_count = 0
    rescue_res = db.query(Resource).filter(Resource.category == "rescue", Resource.status == "AVAILABLE").first()
    if rescue_res:
        ra1 = ResourceAllocation(
            id=f"ra-{str(uuid.uuid4())[:6]}",
            incident_id=incident.id,
            resource_id=rescue_res.id,
            status="RECOMMENDED",
            match_score=98,
            travel_time_est="12 min",
            reason=f"Priority extraction matched for {a.people_observed or 'civilians'} based on {a.assessment_mode} recon.",
            created_at=now,
        )
        db.add(ra1)
        recalc_count += 1

    med_res = db.query(Resource).filter(Resource.category == "medical", Resource.status == "AVAILABLE").first()
    if med_res:
        ra2 = ResourceAllocation(
            id=f"ra-{str(uuid.uuid4())[:6]}",
            incident_id=incident.id,
            resource_id=med_res.id,
            status="RECOMMENDED",
            match_score=95,
            travel_time_est="15 min",
            reason=f"Trauma response matched for verified {a.structures_damaged_count} damaged buildings in sector.",
            created_at=now,
        )
        db.add(ra2)
        recalc_count += 1

    # 5. Broadcast High Priority Command Alert
    alert = Alert(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        category="CIVIL",
        source=f"Field Recon ({a.asset_name})",
        location=incident.location_name,
        message=f"[FIELD VERIFIED] {a.assessment_mode} survey completed: {a.structures_damaged_count} damaged structures, {a.people_observed}. Priority escalated to {incident.priority_level}.",
        severity="critical" if incident.severity == "CRITICAL" else "warning",
        alert_time=now.strftime("%I:%M %p"),
        is_reviewed_by_authority=False,
        created_at=now,
    )
    db.add(alert)

    db.commit()
    db.refresh(a)
    db.refresh(incident)

    return AssessmentSubmitResponse(
        assessment=to_assessment_response(a),
        incident_id=incident.id,
        updated_severity=incident.severity,
        updated_priority=incident.priority_level,
        resource_coverage_pct=incident.resource_coverage_pct,
        is_field_verified=True,
        recalculated_advisories_count=recalc_count,
        message=f"Assessment ingested into central command. Incident priority recalculated to {incident.priority_level} with {recalc_count} resource advisories.",
    )
