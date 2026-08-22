
from datetime import datetime, timezone
from app.core.database import SessionLocal, engine, Base
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.citizen_report import CitizenReport
from app.models.assessment import Assessment
from app.models.resource import Resource
from app.models.resource_allocation import ResourceAllocation
from app.models.operation import Operation
from app.models.alert import Alert
from app.models.report import Report

def seed_database():
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Incident).filter(Incident.id == "inc-a").first():
        if db.query(Report).count() == 0:
            print("Seeding missing reports...")
            reports = [
                Report(
                    id="rep-sitrep-101",
                    incident_id="inc-a",
                    report_type="SITREP",
                    title="Cyclone Alpha 4 — Executive Command SITREP & Impact Debrief",
                    author="Commander J. Sterling (SDMA Crisis Desk)",
                    summary="Landfall recorded at 09:30 UTC. High-resolution telemetry and aerial UAV reconnaissance confirm severe storm surge across Coastal Basin Sector 7G. 15 civilians extracted from critical water-logging zones. Mobile trauma units active.",
                    metrics_summary="Affected: 12,500 | Evacuated: 1,420 | Casualties: 0 | Resource Coverage: 85%",
                    tags="cyclone,evacuation,drone_recon,sitrep",
                    created_at=datetime.utcnow(),
                ),
                Report(
                    id="rep-afteraction-202",
                    incident_id="inc-b",
                    report_type="AFTER_ACTION",
                    title="Industrial Chemical Storage Spill — Incident Mitigation Debrief",
                    author="Chief Hazmat Inspector V. Vance",
                    summary="Atmospheric dispersion sensors logged rapid dissipation of toxic vapor clouds following emergency perimeter foaming. Zero residential sector breach.",
                    metrics_summary="Air Quality Index: Normalized (42 AQI) | Containment: 100%",
                    tags="chemical_spill,hazmat,after_action",
                    created_at=datetime.utcnow(),
                ),
                Report(
                    id="rep-audit-303",
                    incident_id=None,
                    report_type="RESOURCE_AUDIT",
                    title="Central Regional Disaster Depot — Fleet Readiness & Stockpile Audit",
                    author="Logistics Controller K. Adams",
                    summary="Complete audit of all disaster response vehicles, aerial drones, and relief stockpiles. All emergency generators and medical units verified operational.",
                    metrics_summary="Fleet Readiness: 98% | Food Rations: 14 Days | Medical Kits: 150",
                    tags="logistics,inventory,audit",
                    created_at=datetime.utcnow(),
                ),
            ]
            db.add_all(reports)
            db.commit()
        print("Database contains seed data.")
        db.close()
        return

    now = datetime.now(timezone.utc)

    # 1. Incident A (Cyclone Alpha 4)
    inc_a = Incident(
        id="inc-a",
        title="Cyclone Alpha 4 — Central Grid Failure & Coastal Basin Surge",
        description="Severe surge • 15 civilians isolated in pocket • Route 9 Bridge damaged",
        disaster_type="cyclone",
        severity="CRITICAL",
        priority_level="Level 1",
        status="ACTIVE",
        latitude=29.7604,
        longitude=-95.3698,
        location_name="Sector 7G / Coastal Basin",
        sector="Sector 7G",
        affected_population="2.4M",
        affected_area_sq_km=1420.0,
        resource_coverage_pct=84,
        is_field_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(inc_a)

    # 2. Incident B (Highway 4 Flooding)
    inc_b = Incident(
        id="inc-b",
        title="Incident B — Highway 4 Flooding & Causeway Blockage",
        description="Submerged underpass • 3 vehicles stranded • Water depth 4.2ft",
        disaster_type="flood",
        severity="HIGH",
        priority_level="Level 2",
        status="ACTIVE",
        latitude=29.8100,
        longitude=-95.4200,
        location_name="Coastal Causeway Km 18",
        sector="Sector 4B",
        affected_population="450",
        affected_area_sq_km=120.0,
        resource_coverage_pct=70,
        is_field_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(inc_b)

    # 3. Incident C (Comms Tower)
    inc_c = Incident(
        id="inc-c",
        title="Incident C — Comms Tower Delta Offline",
        description="Cell coverage degraded 30% • Radio fallback active",
        disaster_type="infrastructure",
        severity="MEDIUM",
        priority_level="Level 3",
        status="ACTIVE",
        latitude=29.9000,
        longitude=-95.2000,
        location_name="Highland Ridge Sector 1",
        sector="Sector 1",
        affected_population="12,000",
        affected_area_sq_km=340.0,
        resource_coverage_pct=90,
        is_field_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(inc_c)

    # 4. Incident D (East Levee)
    inc_d = Incident(
        id="inc-d",
        title="Incident D — East Levee Seepage Warning",
        description="Pre-breach seepage • 400 households alerted",
        disaster_type="flood",
        severity="HIGH",
        priority_level="Level 2",
        status="MONITORING",
        latitude=29.7200,
        longitude=-95.3100,
        location_name="Riverfront Sector 2",
        sector="Sector 2",
        affected_population="1,600",
        affected_area_sq_km=85.0,
        resource_coverage_pct=75,
        is_field_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(inc_d)

    # Add Corroborating Sources for Incident A
    sources_a = [
        IncidentSource(
            id="src-101",
            incident_id="inc-a",
            source_type="WEATHER",
            source_label="IMD Early Warning Radar",
            channel_badge="IMD_METEO",
            confidence_score=96.0,
            summary="Cyclone Alpha 4 landfall confirmed. Sustained winds 120km/h with heavy coastal surge.",
            raw_content="RADAR_LOC: 29.76N/95.36W | WIND_MAX: 124km/h | SURGE_EST: 2.8m",
            created_at=now,
        ),
        IncidentSource(
            id="src-102",
            incident_id="inc-a",
            source_type="CITIZEN",
            source_label="Citizen SMS Broadcast Gateway",
            channel_badge="CELL_SMS",
            confidence_score=90.0,
            summary="Water rising rapidly near Sector 7G school. 15 people trapped on building rooftop.",
            raw_content="SMS_ID: 98124 | SENDER: +919876543210 | MSG: Water 6ft deep at Sector 7 rooftop.",
            created_at=now,
        ),
        IncidentSource(
            id="src-103",
            incident_id="inc-a",
            source_type="NEWS",
            source_label="National Broadcast Network",
            channel_badge="MEDIA_INTEL",
            confidence_score=94.0,
            summary="Coastal substation tripping causes blackout across Sector 7G metro. Hospital C on backup power.",
            raw_content="MEDIA_FEED: Live report from metro substation.",
            created_at=now,
        ),
        IncidentSource(
            id="src-104",
            incident_id="inc-a",
            source_type="GOVERNMENT",
            source_label="State Disaster Management Authority (SDMA)",
            channel_badge="GOV_BULLETIN",
            confidence_score=99.0,
            summary="Mandatory evacuation order active for Coastal Basin. Deploying swift-water response units.",
            raw_content="SDMA_ORDER_#4491",
            created_at=now,
        ),
    ]
    for s in sources_a:
        db.add(s)

    # Add Citizen Reports for Incident A
    c_reports = [
        CitizenReport(
            id="cr-101",
            incident_id="inc-a",
            location_text="Sector 7G school building rooftop",
            disaster_type="Cyclone",
            description="Water is 6ft deep on the ground floor. 15 people waiting on rooftop.",
            is_people_trapped=True,
            is_immediate_danger=True,
            affected_people_estimate="15 people",
            citizen_contact="Citizen SMS Gateway (+919876543210)",
            status="CORROBORATED",
            created_at=now,
        )
    ]
    for c in c_reports:
        db.add(c)

    db.commit()
    db.close()
    print("Database seeded with canonical incidents and corroborating sources successfully.")

if __name__ == "__main__":
    seed_database()
