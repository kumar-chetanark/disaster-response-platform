from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.operation import Operation
from app.models.resource import Resource
from app.models.incident_source import IncidentSource
from app.models.assessment import Assessment
from app.services.confidence_service import calculate_incident_confidence
from app.services.allocation_engine import (
    analyze_incident,
    calculate_priority_score,
    get_incident_resource_requirements,
    compute_allocation_recommendations,
)
from app.services.telemetry_service import get_incident_operational_telemetry

def get_incident_intelligence(db: Session, incident_id: str) -> Optional[Dict[str, Any]]:
    """
    Deterministic Unified Incident Intelligence & Decision Support Engine (Phase 8):
    
    Synthesizes:
    1. Incident dossier & lifecycle state
    2. Multi-source evidence & confidence telemetry
    3. Multi-factor priority score & risk vectors
    4. Deterministic tactical capability requirements
    5. Operational resource matching & deployment recommendations
    6. Live operational telemetry (active vs deployed missions)
    7. Machine-readable decision-support action directives & warnings
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return None

    now = datetime.now(timezone.utc)

        # 1b. Field Assessment Telemetry Ingestion
    latest_assessment = (
        db.query(Assessment)
        .filter(Assessment.incident_id == inc.id)
        .order_by(Assessment.submitted_at.desc())
        .first()
    )
    assessment_data = None
    if latest_assessment:
        assessment_data = {
            "id": latest_assessment.id,
            "mode": latest_assessment.assessment_mode,
            "mission_type": latest_assessment.mission_type,
            "asset_name": latest_assessment.asset_name,
            "weather": latest_assessment.weather_conditions or "Clear",
            "area_surveyed": latest_assessment.area_surveyed,
            "hazards_detected": latest_assessment.hazards_detected or "None flagged",
            "structures_damaged": latest_assessment.structures_damaged_count or 0,
            "road_accessibility": latest_assessment.road_accessibility_status or "Clear",
            "people_observed": latest_assessment.people_observed or "None reported",
            "recommended_resources": latest_assessment.recommended_resources or "Standard response",
            "evacuation_status": latest_assessment.evacuation_route_status or "Clear",
            "operator_notes": latest_assessment.operator_observations or "No additional field notes.",
            "confidence": latest_assessment.confidence_score or 90.0,
            "timestamp": latest_assessment.submitted_at.strftime("%I:%M %p") if latest_assessment.submitted_at else "Recent",
        }

    # 1. Multi-source Confidence Telemetry
    conf_data = calculate_incident_confidence(db=db, incident=inc)

    # 2. Priority & Risk Analysis
    prio_data = calculate_priority_score(inc)
    risk_analysis = analyze_incident(inc)
    key_risks = risk_analysis.get("key_risks", [])

    # 3. Tactical Capability Requirements
    req_data = get_incident_resource_requirements(inc)
    requirements = req_data.get("requirements", [])

    # 4. Resource Allocation Recommendations
    recommendations = compute_allocation_recommendations(db=db, incident_id=inc.id)

    # 5. Live Operational Telemetry & Mission Tracking
    telemetry = get_incident_operational_telemetry(db=db, incident_id=inc.id)
    active_ops = telemetry.get("latest_operations", []) if telemetry else []
    
    active_mission_count = telemetry.get("active_operation_count", 0) if telemetry else 0
    assigned_count = telemetry.get("resources_assigned", 0) if telemetry else 0
    en_route_count = telemetry.get("resources_en_route", 0) if telemetry else 0
    on_scene_count = telemetry.get("resources_on_scene", 0) if telemetry else 0
    completed_count = telemetry.get("completed_operation_count", 0) if telemetry else 0
    avail_count = telemetry.get("resources_available", 0) if telemetry else 0

    # 6. Decision Support Rules Formulation
    recommended_actions = []
    blocking_factors = []
    warnings = []

    inc_status = (inc.status or "PENDING").upper()
    conf_score = conf_data.get("confidence_score", 0)
    conf_level = conf_data.get("confidence_level", "LOW")
    contradictions = conf_data.get("contradictions", [])

    # Identify currently deployed/active capabilities
    deployed_categories = set()
    for op in active_ops:
        if op.get("status") in {"ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION"}:
            deployed_categories.add(str(op.get("resource_category") or "").lower())

    if inc_status == "RESOLVED":
        recommended_actions.append({
            "action": "ARCHIVE_DOSSIER",
            "priority": "INFO",
            "reason": "Incident is officially RESOLVED and closed. Response operations concluded. Dossier is read-only.",
            "capability": None,
        })
    else:
        # Rule 1: Authority Verification Recommendation for PENDING incidents
        if inc_status == "PENDING":
            if conf_score >= 50:
                recommended_actions.append({
                    "action": "VERIFY_AND_ACTIVATE",
                    "priority": "HIGH",
                    "reason": f"Incident has {conf_level} confidence ({conf_score}%). Recommend authority field verification and escalation to ACTIVE.",
                    "capability": None,
                })
            else:
                recommended_actions.append({
                    "action": "GATHER_RECON",
                    "priority": "MEDIUM",
                    "reason": "Initial citizen report has limited independent corroboration. Recommend UAV aerial reconnaissance survey before escalation.",
                    "capability": "aerial",
                })

        # Rule 2: Contradictory evidence warnings
        if contradictions:
            warnings.append(
                f"{len(contradictions)} conflicting field reports registered. Review contradictory evidence ledger before dispatching major logistics."
            )

        # Rule 3: Capability Requirement vs Deployment Matching
        for req in requirements:
            cap = str(req.get("capability") or "").lower()
            req_prio = req.get("priority", "HIGH")
            min_units = req.get("minimum_units", 1)

            # Check if this capability is already active on-scene or en route
            matching_active_ops = [
                op for op in active_ops
                if str(op.get("resource_category") or "").lower() == cap
                and op.get("status") in {"ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS"}
            ]

            if matching_active_ops:
                latest_op = matching_active_ops[0]
                recommended_actions.append({
                    "action": f"MONITOR_{cap.upper()}_MISSION",
                    "priority": "MEDIUM",
                    "reason": f"Capability '{cap}' is actively deployed under Mission #{latest_op.get('operation_id')} (Status: {latest_op.get('status')}).",
                    "capability": cap,
                })
            else:
                # Find directly if any AVAILABLE resource in database matches this capability
                # Find strictly AVAILABLE resources not assigned to any active mission
                active_op_res_ids = {
                    op.resource_id for op in db.query(Operation).filter(
                        Operation.state.in_(["ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_PROGRESS", "IN OPERATION", "IN TRANSIT"])
                    ).all() if op.resource_id
                }
                
                avail_resources = [
                    r for r in db.query(Resource).filter(Resource.status == "AVAILABLE").all()
                    if r.id not in active_op_res_ids and not r.assigned_incident_id
                ]
                
                # Check direct or interoperable capability match first
                matching_avail = [
                    r for r in avail_resources
                    if str(r.category).lower() == cap.lower() or
                    (cap in ["land", "debris", "heavy"] and str(r.category).lower() in ["land", "rescue", "fire"]) or
                    (cap in ["rescue", "extraction"] and str(r.category).lower() in ["rescue", "water", "land", "aerial"]) or
                    (cap in ["water", "flood"] and str(r.category).lower() in ["water", "rescue"]) or
                    (cap in ["medical", "trauma", "triage"] and str(r.category).lower() in ["medical", "rescue"]) or
                    (cap in ["aerial", "recon", "survey"] and str(r.category).lower() in ["aerial", "recon"])
                ]

                # If no exact category matches but there are other general AVAILABLE unassigned resources in inventory, offer the best available squad
                if not matching_avail and avail_resources:
                    matching_avail = avail_resources

                if matching_avail:
                    best_unit = matching_avail[0]
                    recommended_actions.append({
                        "action": f"DEPLOY_{cap.upper()}",
                        "priority": req_prio,
                        "reason": f"Tactical requirement '{cap}' is required. Recommend deploying available unit '{best_unit.name}' ({best_unit.personnel_count or 1} personnel ready).",
                        "capability": cap,
                        "resource_id": best_unit.id,
                        "resource_name": best_unit.name,
                    })
                else:
                    blocking_factors.append(
                        f"CRITICAL SCARCITY: Tactical requirement '{cap}' is required but 0 units are currently AVAILABLE in inventory."
                    )
                    recommended_actions.append({
                        "action": f"REQUEST_MUTUAL_AID_{cap.upper()}",
                        "priority": "CRITICAL",
                        "reason": f"Zero local '{cap}' assets available in operational inventory. Request emergency mutual aid assistance.",
                        "capability": cap,
                    })

        # Rule 4: Active mission monitoring directive
        if active_mission_count > 0:
            recommended_actions.append({
                "action": "TRACK_ACTIVE_DEPLOYMENTS",
                "priority": "INFO",
                "reason": f"{active_mission_count} operational mission(s) active in sector ({en_route_count} en route, {on_scene_count} on scene). Maintain radio telemetry.",
                "capability": None,
            })

    # 7. Synthesize Rich, Clear & Formatted Situation Summary
    sources_summary = f"{conf_data.get('independent_source_count', 1)} independent source(s)"
    
    # Threat Vector Synthesis
    threat_points = []
    if getattr(inc, "severity", "") == "CRITICAL":
        threat_points.append("Severe hazard to trapped residents with critical lifeline access cut off")
    elif getattr(inc, "severity", "") == "HIGH":
        threat_points.append("Significant infrastructure damage and elevated civilian risk")
        
    if inc.disaster_type == "Flood":
        threat_points.append("Rising flood waters inundating residential ground floors")
    elif inc.disaster_type == "Earthquake":
        threat_points.append("Structural building instability with heavy rubble and debris")
    elif inc.disaster_type in ["Fire", "Wildfire"]:
        threat_points.append("Spreading active flame front and dense smoke plumes")
    elif inc.disaster_type == "Industrial":
        threat_points.append("Hazardous chemical vapor plume requiring exclusion perimeter")
    else:
        threat_points.append("Volatile crisis conditions requiring immediate on-ground stabilization")

    threat_narrative = "; ".join(threat_points)

    situation_summary = (
        f"{inc.title} is currently evaluated as a {getattr(inc, 'severity', 'HIGH')} severity {inc.disaster_type} emergency in {inc.location_name}. "
        f"Operational priority is established at {inc.priority_level or 'Level 1'} (Priority Index: {prio_data.get('priority_score', 0)}/100) with {conf_score}% corroboration certainty from {sources_summary}. "
        f"Primary hazards include: {threat_narrative}. "
        f"Current field posture: {active_mission_count} mission(s) active on scene / en route, with {avail_count} specialized squad(s) available in reserve for immediate dispatch."
    )

    # 8. Evidence list
    evidence_list = []
    for s in inc.sources or []:
        evidence_list.append({
            "id": s.id,
            "source_type": s.source_type,
            "source_label": s.source_label,
            "channel_badge": s.channel_badge,
            "summary": s.summary,
            "is_contradiction": getattr(s, "is_contradiction", False),
            "timestamp": s.created_at.strftime("%I:%M %p") if s.created_at else "Earlier",
        })

    return {
        "incident_id": inc.id,
        "incident_title": inc.title,
        "incident_status": inc_status,
        "situation_summary": situation_summary,
        "crisis_context": {
            "disaster_type": inc.disaster_type,
            "severity": getattr(inc, "severity", "HIGH"),
            "priority": inc.priority_level or "Level 1",
            "priority_score": prio_data.get("priority_score", 0),
            "location": inc.location_name,
            "threat_summary": threat_narrative,
            "corroboration": f"{conf_score}% certainty ({sources_summary})",
        },
        "confidence": {
            "score": conf_score,
            "level": conf_level,
            "independent_sources": conf_data.get("independent_source_count", 1),
            "sources_breakdown": {b["source_type"]: b["count"] for b in conf_data.get("breakdown", [])},
        },
        "priority": {
            "score": prio_data.get("priority_score", 0),
            "level": inc.priority_level or "Level 2",
            "reasons": [k if isinstance(k, str) else k.get("risk", "High risk vector") for k in key_risks] if key_risks else ["Standard crisis response protocol"],
        },
        "key_risks": key_risks,
        "required_capabilities": requirements,
        "resource_recommendations": recommendations,
        "latest_assessment": assessment_data,
        "operational_state": {
            "active_missions": active_mission_count,
            "assigned": assigned_count,
            "en_route": en_route_count,
            "on_scene": on_scene_count,
            "completed": completed_count,
            "available_resources": avail_count,
        },
        "decision_support": {
            "recommended_actions": recommended_actions,
            "blocking_factors": blocking_factors,
            "warnings": warnings,
        },
        "evidence": evidence_list,
    }
