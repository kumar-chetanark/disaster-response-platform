from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.alert import Alert
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_list_alerts_endpoint():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Alert(id="alt-1", incident_id="inc-a", category="METEO", source="IMD Radar", location="Sector 7G", message="Storm surge.", severity="critical", is_reviewed_by_authority=False, created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/alerts")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

def test_filter_alerts():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Alert(id="alt-1", incident_id="inc-a", category="METEO", source="IMD Radar", location="Sector 7G", message="Storm surge.", severity="critical", is_reviewed_by_authority=False, created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/alerts?severity=critical")
    assert res.status_code == 200
    assert res.json()["total"] == 1

def test_acknowledge_alert_patch():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Alert(id="alt-1", incident_id="inc-a", category="METEO", source="IMD Radar", location="Sector 7G", message="Storm surge.", severity="critical", is_reviewed_by_authority=False, created_at=now))
    db.commit()
    db.close()

    res = client.patch("/api/alerts/alt-1/review")
    assert res.status_code == 200
    assert res.json()["is_reviewed"] is True

def test_citizen_report_creates_visible_alert():
    payload = {
        "disaster_type": "flood",
        "location": "Sector 4",
        "description": "Water rising fast",
        "is_immediate_danger": True
    }
    client.post("/api/citizen-reports", json=payload)
    alerts = client.get("/api/alerts").json()["items"]
    assert any("Sector 4" in a["location"] for a in alerts)

def test_operation_dispatch_creates_visible_alert():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Resource(id="res-1", name="NDRF", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    client.post("/api/operations", json={
        "incident_id": "inc-a",
        "resource_id": "res-1",
        "operation_type": "Rescue",
        "destination_location": "Sector 7G",
        "authorized_by": "Commander",
        "mission_objective": "Save civilians"
    })
    alerts = client.get("/api/alerts").json()["items"]
    assert any(a["category"] == "CIVIL" or "Rescue" in a["message"] for a in alerts)

def test_assessment_submit_creates_visible_alert():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.commit()
    db.close()

    asm = client.post("/api/assessments", json={
        "incident_id": "inc-a",
        "assessment_mode": "Drone",
        "mission_type": "Damage Assessment",
        "asset_name": "UAV-1",
        "area_surveyed": "Sector 7G",
        "road_accessibility_status": "Blocked"
    }).json()
    client.post(f"/api/assessments/{asm['id']}/submit")
    alerts = client.get("/api/alerts").json()["items"]
    assert any("uav" in a["message"].lower() or "survey" in a["message"].lower() or "reconnaissance" in a["message"].lower() or "damage" in a["message"].lower() for a in alerts)
