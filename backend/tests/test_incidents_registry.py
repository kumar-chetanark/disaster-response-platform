from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.incident import Incident
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_get_incidents_list():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now, updated_at=now))
    db.add(Incident(id="inc-b", title="Highway 4 Flooding", disaster_type="flood", severity="HIGH", priority_level="Level 2", status="ACTIVE", location_name="Sector 4", created_at=now, updated_at=now))
    db.commit()
    db.close()

    res = client.get("/api/incidents")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2

def test_get_incidents_filtered_by_severity():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now, updated_at=now))
    db.commit()
    db.close()

    res = client.get("/api/incidents?severity=CRITICAL")
    assert res.status_code == 200
    assert res.json()["total"] == 1

def test_get_incidents_search():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-b", title="Highway 4 Flooding", disaster_type="flood", severity="HIGH", priority_level="Level 2", status="ACTIVE", location_name="Sector 4", created_at=now, updated_at=now))
    db.commit()
    db.close()

    res = client.get("/api/incidents?search=Highway")
    assert res.status_code == 200
    assert res.json()["total"] == 1

def test_get_incident_detail():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now, updated_at=now))
    db.commit()
    db.close()

    res = client.get("/api/incidents/inc-a")
    assert res.status_code == 200
    assert res.json()["id"] == "inc-a"

def test_get_incident_not_found():
    res = client.get("/api/incidents/non-existent-id")
    assert res.status_code == 404


def test_anonymous_cannot_patch_incident_status():
    res = client.patch("/api/incidents/inc-test-dummy/status", json={"status": "ACTIVE"})
    assert res.status_code == 401

def test_authority_lifecycle_transitions_workflow():
    # 1. Create a fresh PENDING incident via citizen report
    cit_payload = {
        "disaster_type": "flood",
        "location": "Sector 4 Underpass",
        "description": "High water levels blocking traffic and 2 cars submerged.",
        "is_people_trapped": True,
        "is_immediate_danger": True
    }
    cit_res = client.post("/api/citizen-reports", json=cit_payload)
    assert cit_res.status_code == 201
    inc_id = cit_res.json()["incident_id"]

    # Verify initial status is PENDING
    inc_res = client.get(f"/api/incidents/{inc_id}")
    assert inc_res.status_code == 200
    assert inc_res.json()["status"] == "PENDING"

    # 2. Login as Authority
    login_res = client.post("/api/auth/login", json={"username": "authority_admin", "password": "Commander@2026!"})
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Test Invalid Status (HTTP 422)
    inv_status_res = client.patch(f"/api/incidents/{inc_id}/status", json={"status": "SUPER_ACTIVE"}, headers=headers)
    assert inv_status_res.status_code == 422

    # 4. Test Invalid Transition directly to RESOLVED from PENDING (HTTP 409)
    inv_trans_res = client.patch(f"/api/incidents/{inc_id}/status", json={"status": "RESOLVED"}, headers=headers)
    assert inv_trans_res.status_code == 409

    # 5. Test Valid Transition: PENDING -> ACTIVE (HTTP 200)
    act_res = client.patch(f"/api/incidents/{inc_id}/status", json={"status": "ACTIVE", "notes": "Verified by field commander"}, headers=headers)
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "ACTIVE"

    # 6. Test Valid Transition: ACTIVE -> MONITORING (HTTP 200)
    mon_res = client.patch(f"/api/incidents/{inc_id}/status", json={"status": "MONITORING"}, headers=headers)
    assert mon_res.status_code == 200
    assert mon_res.json()["status"] == "MONITORING"

    # 7. Test Valid Transition: MONITORING -> RESOLVED (HTTP 200)
    res_res = client.patch(f"/api/incidents/{inc_id}/status", json={"status": "RESOLVED", "notes": "Water cleared and road reopened"}, headers=headers)
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"

    # 8. Test Terminal State: RESOLVED -> ACTIVE rejected with HTTP 409
    reopen_res = client.patch(f"/api/incidents/{inc_id}/status", json={"status": "ACTIVE"}, headers=headers)
    assert reopen_res.status_code == 409

    # 9. Verify Nonexistent Incident (HTTP 404)
    nf_res = client.patch("/api/incidents/inc-nonexistent-999/status", json={"status": "ACTIVE"}, headers=headers)
    assert nf_res.status_code == 404
