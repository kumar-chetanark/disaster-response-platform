import sys
from pathlib import Path
from datetime import datetime, timezone

# Anchor to backend directory
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal, Base, engine
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.citizen_report import CitizenReport
from app.models.resource import Resource
from app.models.resource_allocation import ResourceAllocation
from app.models.alert import Alert
from app.models.report import Report
from app.models.operation import Operation

def seed_database(reset: bool = False):
    """
    Idempotently seeds canonical incidents, resources, alerts, operations,
    and official situational reports into the authoritative database.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if reset:
        print("Resetting database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    now = datetime.now(timezone.utc)

    # 1. Incidents
    incidents_data = [
        {
            "id": "inc-a",
            "title": "Cyclone Alpha 4 — Central Grid Failure & Coastal Basin Surge",
            "description": "Severe surge — 15 civilians isolated in pocket — Route 9 Bridge damaged",
            "disaster_type": "cyclone",
            "severity": "CRITICAL",
            "priority_level": "Level 1",
            "status": "ACTIVE",
            "latitude": 29.7604,
            "longitude": -95.3698,
            "location_name": "Sector 7G / Coastal Basin",
            "sector": "Sector 7G",
            "affected_population": "2.4M",
            "affected_area_sq_km": 1420.0,
            "resource_coverage_pct": 84,
            "is_field_verified": True,
        },
        {
            "id": "inc-b",
            "title": "Incident B — Highway 4 Flooding & Causeway Blockage",
            "description": "Submerged underpass — 3 vehicles stranded — Water depth 4.2ft",
            "disaster_type": "flood",
            "severity": "HIGH",
            "priority_level": "Level 2",
            "status": "ACTIVE",
            "latitude": 29.8100,
            "longitude": -95.4200,
            "location_name": "Coastal Causeway Km 18",
            "sector": "Sector 4B",
            "affected_population": "450",
            "affected_area_sq_km": 120.0,
            "resource_coverage_pct": 70,
            "is_field_verified": False,
        },
        {
            "id": "inc-c",
            "title": "Incident C — Comms Tower Delta Offline",
            "description": "Cell coverage degraded 30% — Radio fallback active",
            "disaster_type": "infrastructure",
            "severity": "MEDIUM",
            "priority_level": "Level 3",
            "status": "ACTIVE",
            "latitude": 29.9000,
            "longitude": -95.2000,
            "location_name": "Highland Ridge Sector 1",
            "sector": "Sector 1",
            "affected_population": "12,000",
            "affected_area_sq_km": 340.0,
            "resource_coverage_pct": 90,
            "is_field_verified": False,
        },
        {
            "id": "inc-d",
            "title": "Incident D — East Levee Seepage Warning",
            "description": "Pre-breach seepage — 400 households alerted",
            "disaster_type": "flood",
            "severity": "HIGH",
            "priority_level": "Level 2",
            "status": "MONITORING",
            "latitude": 29.7200,
            "longitude": -95.3100,
            "location_name": "Riverfront Sector 2",
            "sector": "Sector 2",
            "affected_population": "1,600",
            "affected_area_sq_km": 85.0,
            "resource_coverage_pct": 75,
            "is_field_verified": False,
        },
    ]

    for item in incidents_data:
        existing = db.query(Incident).filter(Incident.id == item["id"]).first()
        if not existing:
            db.add(Incident(**item, created_at=now, updated_at=now))

    # 2. Corroborating Sources for Incident A
    sources_data = [
        {
            "id": "src-101",
            "incident_id": "inc-a",
            "source_type": "WEATHER",
            "source_label": "IMD Early Warning Radar",
            "channel_badge": "IMD_METEO",
            "confidence_score": 96.0,
            "summary": "Cyclone Alpha 4 landfall confirmed. Sustained winds 120km/h with heavy coastal surge.",
            "raw_content": "RADAR_LOC: 29.76N/95.36W | WIND_MAX: 124km/h | SURGE_EST: 2.8m",
        },
        {
            "id": "src-102",
            "incident_id": "inc-a",
            "source_type": "CITIZEN",
            "source_label": "Citizen SMS Broadcast Gateway",
            "channel_badge": "CELL_SMS",
            "confidence_score": 90.0,
            "summary": "Water rising rapidly near Sector 7G school. 15 people trapped on building rooftop.",
            "raw_content": "SMS_ID: 98124 | SENDER: +919876543210 | MSG: Water 6ft deep at Sector 7 rooftop.",
        },
        {
            "id": "src-103",
            "incident_id": "inc-a",
            "source_type": "NEWS",
            "source_label": "National Broadcast Network",
            "channel_badge": "MEDIA_INTEL",
            "confidence_score": 94.0,
            "summary": "Coastal substation tripping causes blackout across Sector 7G metro. Hospital C on backup power.",
            "raw_content": "MEDIA_FEED: Live report from metro substation.",
        },
        {
            "id": "src-104",
            "incident_id": "inc-a",
            "source_type": "GOVERNMENT",
            "source_label": "State Disaster Management Authority (SDMA)",
            "channel_badge": "GOV_BULLETIN",
            "confidence_score": 99.0,
            "summary": "Mandatory evacuation order active for Coastal Basin. Deploying swift-water response units.",
            "raw_content": "SDMA_ORDER_#4491",
        },
    ]

    for s in sources_data:
        existing = db.query(IncidentSource).filter(IncidentSource.id == s["id"]).first()
        if not existing:
            db.add(IncidentSource(**s, created_at=now))

    # 3. Citizen Reports
    citizen_reports_data = [
        {
            "id": "cr-101",
            "incident_id": "inc-a",
            "location_text": "Sector 7G school building rooftop",
            "disaster_type": "Cyclone",
            "description": "Water is 6ft deep on the ground floor. 15 people waiting on rooftop.",
            "is_people_trapped": True,
            "is_immediate_danger": True,
            "affected_people_estimate": "15 people",
            "citizen_contact": "Citizen SMS Gateway (+919876543210)",
            "status": "CORROBORATED",
        }
    ]

    for cr in citizen_reports_data:
        existing = db.query(CitizenReport).filter(CitizenReport.id == cr["id"]).first()
        if not existing:
            db.add(CitizenReport(**cr, created_at=now))

    # 4. Resources
    resources_data = [
        {
            "id": "res-1",
            "name": "NDRF Swift-Water Rescue Squad 4",
            "category": "rescue",
            "status": "AVAILABLE",
            "base_location": "Sector 7G Basin Substation",
            "personnel_count": 14,
            "equipment_details": "4x Inflatable Gemini boats, life-vests, thermal night-vision",
        },
        {
            "id": "res-2",
            "name": "Rapid Mobile Trauma Unit & Ambulance 12",
            "category": "medical",
            "status": "AVAILABLE",
            "base_location": "Sector 4 Main Depot",
            "personnel_count": 8,
            "equipment_details": "Mobile ICU, triage trauma beds, oxygen generators",
        },
        {
            "id": "res-3",
            "name": "SkyWatch Heavy UAV Recon Drone 9",
            "category": "aerial",
            "status": "AVAILABLE",
            "base_location": "Central Regional Airfield",
            "personnel_count": 3,
            "equipment_details": "LiDAR mapping sensor, high-zoom 4K infrared gimbal",
        },
        {
            "id": "res-4",
            "name": "Heavy Debris Road Clearance Excavator",
            "category": "land",
            "status": "AVAILABLE",
            "base_location": "Sector 9 Logistics Bay",
            "personnel_count": 4,
            "equipment_details": "Hydraulic breaker, claw bucket, chain saws",
        },
    ]

    for res in resources_data:
        existing = db.query(Resource).filter(Resource.id == res["id"]).first()
        if not existing:
            db.add(Resource(**res, created_at=now))

    # 5. Alerts
    alerts_data = [
        {
            "id": "alt-101",
            "incident_id": "inc-a",
            "category": "METEO",
            "source": "IMD Doppler Radar",
            "location": "Coastal Sector 7G",
            "message": "Storm surge height peaked at 2.8m. Immediate levee monitoring advised.",
            "severity": "critical",
            "is_reviewed_by_authority": True,
        },
        {
            "id": "alt-102",
            "incident_id": "inc-a",
            "category": "CIVIL",
            "source": "Grid Telemetry",
            "location": "Sector 7G Substation",
            "message": "Primary transformer breaker trip. Emergency generators active at Base Hospital.",
            "severity": "high",
            "is_reviewed_by_authority": False,
        },
        {
            "id": "alt-103",
            "incident_id": "inc-b",
            "category": "TRAFFIC",
            "source": "Traffic Police Camera 18",
            "location": "Coastal Causeway Km 18",
            "message": "Causeway submerged. Route 4 traffic diverted to Northern Expressway.",
            "severity": "medium",
            "is_reviewed_by_authority": True,
        },
    ]

    for alt in alerts_data:
        existing = db.query(Alert).filter(Alert.id == alt["id"]).first()
        if not existing:
            db.add(Alert(**alt, created_at=now))

    # 6. Reports (Phase 8 Official Reports)
    reports_data = [
        {
            "id": "rep-sitrep-101",
            "incident_id": "inc-a",
            "report_type": "SITREP",
            "title": "Cyclone Alpha 4 — Executive Command SITREP & Impact Debrief",
            "author": "Commander J. Sterling (SDMA Crisis Desk)",
            "summary": "Landfall recorded at 09:30 UTC. High-resolution telemetry and aerial UAV reconnaissance confirm severe storm surge across Coastal Basin Sector 7G. 15 civilians extracted from critical water-logging zones. Mobile trauma units active.",
            "metrics_summary": "Affected: 12,500 | Evacuated: 1,420 | Casualties: 0 | Resource Coverage: 85%",
            "tags": "cyclone,evacuation,drone_recon,sitrep",
        },
        {
            "id": "rep-afteraction-202",
            "incident_id": "inc-b",
            "report_type": "AFTER_ACTION",
            "title": "Industrial Chemical Storage Spill — Incident Mitigation Debrief",
            "author": "Chief Hazmat Inspector V. Vance",
            "summary": "Atmospheric dispersion sensors logged rapid dissipation of toxic vapor clouds following emergency perimeter foaming. Zero residential sector breach.",
            "metrics_summary": "Air Quality Index: Normalized (42 AQI) | Containment: 100%",
            "tags": "chemical_spill,hazmat,after_action",
        },
        {
            "id": "rep-audit-303",
            "incident_id": None,
            "report_type": "RESOURCE_AUDIT",
            "title": "Central Regional Disaster Depot — Fleet Readiness & Stockpile Audit",
            "author": "Logistics Controller K. Adams",
            "summary": "Complete audit of all disaster response vehicles, aerial drones, and relief stockpiles. All emergency generators and medical units verified operational.",
            "metrics_summary": "Fleet Readiness: 98% | Food Rations: 14 Days | Medical Kits: 150",
            "tags": "logistics,inventory,audit",
        },
    ]

    for rep in reports_data:
        existing = db.query(Report).filter(Report.id == rep["id"]).first()
        if not existing:
            db.add(Report(**rep, created_at=now))

    db.commit()
    db.close()
    print("Database seeding completed deterministically and idempotently.")

if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    seed_database(reset=reset_flag)
