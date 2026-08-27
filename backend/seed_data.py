import os
import sys
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.incident import Incident, IncidentSource
from app.models.citizen_report import CitizenReport
from app.models.resource import Resource
from app.models.alert import Alert
from app.models.report import Report
from app.models.shelter import Shelter
from app.models.operation import Operation
from app.models.assessment import Assessment

def seed_database(reset: bool = False, populate_demo_resources: bool = False):
    """
    Seed operational resources, shelters, baseline reports.
    
    IMPORTANT: Demo operational resources (res-1 through res-4) are strictly OPT-IN.
    They will ONLY be populated if explicitly passed `--populate-demo-resources` or
    if environment variable SEED_DEMO_RESOURCES=1 is provided.
    By default, operational resources start completely empty.
    """
    if reset:
        print("Resetting database tables...")
        Base.metadata.drop_all(bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    now = datetime.now(timezone.utc)

    # 1. Operational Inventory: Demo Resources (OPT-IN ONLY)
    if populate_demo_resources or os.getenv("SEED_DEMO_RESOURCES") == "1":
        print("Populating opt-in demo operational resources...")
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
    else:
        print("Operational resources left unseeded (empty state by default).")

    # 2. Emergency Relief Shelters
    shelters_data = [
        {
            "id": "shl-101",
            "name": "Sector 7 Community Center & Relief Camp",
            "location": "Sector 7G Basin North",
            "total_capacity": 850,
            "current_occupancy": 320,
            "contact_phone": "+91 98765 11223",
        },
        {
            "id": "shl-102",
            "name": "State Model High School Disaster Shelter",
            "location": "Coastal Causeway Km 14",
            "total_capacity": 600,
            "current_occupancy": 540,
            "contact_phone": "+91 98765 44556",
        },
        {
            "id": "shl-103",
            "name": "Highland Sports Complex Emergency Evacuation Hub",
            "location": "Sector 1 Ridge Highway",
            "total_capacity": 1200,
            "current_occupancy": 150,
            "contact_phone": "+91 98765 77889",
        },
    ]

    for shl in shelters_data:
        existing = db.query(Shelter).filter(Shelter.id == shl["id"]).first()
        if not existing:
            db.add(Shelter(**shl, created_at=now))

    # 3. Global Disaster Telemetry & Early Warning Feeds (Alerts)
    alerts_data = [
        {
            "id": "alt-101",
            "incident_id": None,
            "category": "METEO",
            "source": "IMD Doppler Radar Early Warning Feed",
            "location": "Coastal Basin Sector 7G",
            "message": "Heavy monsoon depression advancing north-northwest. Regional storm surge warning active.",
            "severity": "critical",
            "is_reviewed_by_authority": False,
        },
        {
            "id": "alt-102",
            "incident_id": None,
            "category": "CIVIL",
            "source": "State Electrical Grid Telemetry",
            "location": "Sector 7G Substation",
            "message": "High voltage transformer tripped on over-current protection. Emergency grid backup initiated.",
            "severity": "high",
            "is_reviewed_by_authority": False,
        },
        {
            "id": "alt-103",
            "incident_id": None,
            "category": "TRAFFIC",
            "source": "Highway Patrol Sensor 18",
            "location": "Coastal Causeway Km 18",
            "message": "Causeway access road reported partially water-logged. Traffic diverted to expressway.",
            "severity": "medium",
            "is_reviewed_by_authority": True,
        },
    ]

    for alt in alerts_data:
        existing = db.query(Alert).filter(Alert.id == alt["id"]).first()
        if not existing:
            db.add(Alert(**alt, created_at=now))

    # 4. Standard Operational Template Reports (Audit & SITREP templates)
    reports_data = [
        {
            "id": "rep-audit-303",
            "incident_id": None,
            "report_type": "RESOURCE_AUDIT",
            "title": "Central Regional Disaster Depot  Fleet Readiness & Stockpile Audit",
            "author": "Logistics Controller K. Adams",
            "summary": "Complete audit of all disaster response vehicles, aerial drones, and relief stockpiles. All emergency generators and medical units verified operational.",
            "metrics_summary": "Fleet Readiness: 98% | Food Rations: 14 Days | Medical Kits: 150",
            "tags": "logistics,inventory,audit",
            "status": "COMPLETED",
        },
    ]

    for rep in reports_data:
        existing = db.query(Report).filter(Report.id == rep["id"]).first()
        if not existing:
            db.add(Report(**rep, created_at=now))

    db.commit()
    db.close()
    print("Database seeding completed deterministically.")

if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    demo_flag = "--populate-demo-resources" in sys.argv
    seed_database(reset=reset_flag, populate_demo_resources=demo_flag)
