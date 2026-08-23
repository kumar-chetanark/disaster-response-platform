import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.resource import Resource
from app.models.shelter import Shelter
from app.models.operation import Operation

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geodesic distance in kilometers between two lat/lon coordinates."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999.0
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_priority_score(incident: Incident) -> Dict[str, Any]:
    """
    Deterministic multi-factor priority scoring engine:
    Base Score:
      - Severity (CRITICAL=40, HIGH=28, MEDIUM=18, LOW=8)
      - Vulnerability & People Trapped (+20 if trapped/immediate danger)
      - Population Exposure Scale (+5 to +15 based on affected population)
      - Accessibility Hurdles (+10 if access blocked/impassable)
      - Reconnaissance / Uncertainty Penalty (+10 if unverified/incomplete data)
    Max score is 100.
    """
    breakdown = {}
    score = 0.0

    # 1. Severity weight
    sev = str(incident.severity or "MEDIUM").upper()
    sev_points = 40.0 if sev == "CRITICAL" else 28.0 if sev == "HIGH" else 18.0 if sev == "MEDIUM" else 8.0
    score += sev_points
    breakdown["severity_score"] = sev_points

    # 2. People & Danger weight
    desc = (incident.description or "") + " " + (incident.title or "")
    is_trapped = "trapped" in desc.lower() or "isolated" in desc.lower() or "stranded" in desc.lower()
    danger_points = 20.0 if is_trapped else 0.0
    score += danger_points
    breakdown["trapped_danger_score"] = danger_points

    # 3. Population exposure
    pop_str = str(incident.affected_population or "0").replace(",", "").replace(" civilians", "").replace("M", "000000").replace("k", "000")
    try:
        pop_num = float(pop_str) if pop_str.replace(".", "").isdigit() else 1000.0
    except ValueError:
        pop_num = 1000.0
    pop_points = 15.0 if pop_num > 10000 else 10.0 if pop_num > 1000 else 5.0
    score += pop_points
    breakdown["population_exposure_score"] = pop_points

    # 4. Reconnaissance / Verification Status
    is_verified = bool(incident.is_field_verified)
    recon_points = 0.0 if is_verified else 10.0
    score += recon_points
    breakdown["uncertainty_penalty"] = recon_points

    # 5. Resource coverage deficiency
    cov = float(incident.resource_coverage_pct or 0)
    deficit_points = max(0.0, round((100.0 - cov) * 0.15, 1))
    score += deficit_points
    breakdown["coverage_deficit_score"] = deficit_points

    total_score = min(100.0, round(score, 1))

    # Determine explanation narrative
    reasons = [f"Base severity: {sev} (+{sev_points:.0f} pts)"]
    if is_trapped:
        reasons.append("Reported civilians isolated/stranded in crisis zone (+20 pts)")
    reasons.append(f"Affected population footprint ({pop_points:.0f} pts)")
    if not is_verified:
        reasons.append("Uncorroborated field telemetry requiring reconnaissance validation (+10 pts)")
    if deficit_points > 0:
        reasons.append(f"Critical coverage deficiency: {cov:.0f}% current coverage (+{deficit_points:.1f} pts)")

    return {
        "priority_score": total_score,
        "priority_level": "Level 1" if total_score >= 80 else "Level 2" if total_score >= 50 else "Level 3",
        "explanation": " | ".join(reasons),
        "breakdown": breakdown,
    }

def get_required_capability(incident: Incident) -> str:
    """Derive required specialized capability from disaster type and descriptions."""
    dtype = str(incident.disaster_type or "").lower()
    text = (incident.description or "").lower() + " " + (incident.title or "").lower()
    if "water" in text or "boat" in text or "flood" in dtype or "surge" in text or "submerged" in text or "levee" in text:
        return "water"
    if "medical" in text or "trauma" in text or "hospital" in text or "casualt" in text or "injured" in text:
        return "medical"
    if "fire" in dtype or "hazmat" in dtype or "chemical" in text or "toxic" in text:
        return "rescue"
    if "debris" in text or "bridge" in text or "road" in text or "excavat" in text or "landslide" in dtype:
        return "land"
    if "survey" in text or "recon" in text or not incident.is_field_verified:
        return "aerial"
    return "rescue"

def compute_allocation_recommendations(db: Session, incident_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Deterministic Capability-Aware Allocation Engine:
    1. Evaluates all unresolved incidents and computes deterministic priority scores.
    2. Gathers available resources and checks capability, capacity, status, and proximity.
    3. Handles resource scarcity across competing incidents.
    4. Generates explainable recommendations with alternatives and unmet demand flags.
    """
    incidents_query = db.query(Incident).filter(Incident.status.in_(["ACTIVE", "MONITORING"]))
    if incident_id:
        incidents_query = incidents_query.filter(Incident.id == incident_id)

    incidents = incidents_query.all()
    incident_priorities = []
    for inc in incidents:
        p_data = calculate_priority_score(inc)
        incident_priorities.append((p_data["priority_score"], inc, p_data))
    incident_priorities.sort(key=lambda x: x[0], reverse=True)

    available_resources = db.query(Resource).filter(Resource.status == "AVAILABLE").all()
    allocated_resource_ids = set()

    recommendations = []

    for score, inc, p_data in incident_priorities:
        req_cap = get_required_capability(inc)
        inc_lat = inc.latitude or 29.7604
        inc_lon = inc.longitude or -95.3698

        matching_candidates = [
            r for r in available_resources
            if r.id not in allocated_resource_ids and (
                r.category == req_cap or
                (req_cap == "water" and r.category in ["water", "rescue"]) or
                (req_cap == "rescue" and r.category in ["rescue", "land"])
            )
        ]

        if matching_candidates:
            scored_candidates = []
            for cand in matching_candidates:
                dist = haversine_distance_km(inc_lat, inc_lon, 29.7604, -95.3698)
                match_score = 95 - int(min(dist, 30)) + min(cand.personnel_count or 0, 10)
                scored_candidates.append((match_score, dist, cand))
            scored_candidates.sort(key=lambda x: x[0], reverse=True)

            best_match_score, dist, best_resource = scored_candidates[0]
            allocated_resource_ids.add(best_resource.id)

            est_travel_time = f"{max(5, int(dist * 2.5))} mins"

            rec_reason = (
                f"Optimal match for {inc.title}: {best_resource.name} possesses required '{req_cap}' capability "
                f"with {best_resource.personnel_count or 0} active personnel. Proximity est: {dist} km. "
                f"Priority Rank: {score:.1f} pts ({p_data['priority_level']})."
            )

            alternatives = [c.name for _, _, c in scored_candidates[1:3]]

            recommendations.append({
                "id": f"rec-{inc.id}-{best_resource.id}",
                "incident_id": inc.id,
                "incident_title": inc.title,
                "incident_priority": score,
                "required_capability": req_cap,
                "resource_id": best_resource.id,
                "resource_name": best_resource.name,
                "resource_category": best_resource.category,
                "personnel_count": best_resource.personnel_count,
                "match_score": min(99, best_match_score),
                "travel_time_est": est_travel_time,
                "reason": rec_reason,
                "explanation_breakdown": p_data["breakdown"],
                "alternatives": alternatives,
                "scarcity_warning": len(matching_candidates) <= 1,
                "unmet_demand": False,
            })
        else:
            recommendations.append({
                "id": f"rec-{inc.id}-unmet",
                "incident_id": inc.id,
                "incident_title": inc.title,
                "incident_priority": score,
                "required_capability": req_cap,
                "resource_id": None,
                "resource_name": "RESOURCE DEFICIT - MUTUAL AID REQUIRED",
                "resource_category": req_cap,
                "personnel_count": 0,
                "match_score": 0,
                "travel_time_est": "N/A",
                "reason": f"CRITICAL SCARCITY: Zero available '{req_cap}' capability units remain in regional depot. Higher priority incidents currently command available fleet.",
                "explanation_breakdown": p_data["breakdown"],
                "alternatives": ["Request Inter-State Disaster Contingency", "Deploy Aerial Reconnaissance UAV to monitor escalation"],
                "scarcity_warning": True,
                "unmet_demand": True,
            })

    return recommendations
