from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.incident import Incident
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_generic_field_assessment_workflow_and_closed_loop_recalculation():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="HIGH", priority_level="Level 2", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.commit()
    db.close()

    payload = {
        "incident_id": "inc-a",
        "assessment_mode": "Drone",
        "mission_type": "Damage Assessment",
        "asset_name": "SkyWatch UAV 12",
        "area_surveyed": "Sector 7G North Breach",
        "road_accessibility_status": "Impassable",
        "structures_damaged_count": 14,
        "people_observed": "25 civilians trapped on terrace",
        "confidence_score": 98.5
    }
    res = client.post("/api/assessments", json=payload)
    assert res.status_code == 201
    asm_id = res.json()["id"]

    submit_res = client.post(f"/api/assessments/{asm_id}/submit")
    assert submit_res.status_code == 200

    inc_res = client.get("/api/incidents/inc-a")
    assert inc_res.status_code == 200
    assert inc_res.json()["is_field_verified"] is True
