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


def test_multi_source_corroboration_and_confidence_scoring():
    # 1. First citizen report -> Single citizen baseline confidence (25 pts)
    cit1 = {
        "disaster_type": "flood",
        "location": "North Basin Levee Road",
        "description": "Rising river water flooding outer road section.",
        "name": "Local Resident A",
        "contact_info": "+919876543201"
    }
    res1 = client.post("/api/citizen-reports", json=cit1)
    assert res1.status_code == 201
    inc_id = res1.json()["incident_id"]

    # Query initial confidence
    conf_res1 = client.get(f"/api/incidents/{inc_id}/confidence")
    assert conf_res1.status_code == 200
    cdata1 = conf_res1.json()
    assert cdata1["confidence_score"] == 25
    assert cdata1["confidence_level"] == "LOW"
    assert cdata1["independent_source_count"] == 1

    # 2. Duplicate submission from same contact -> No double counting
    cit_dup = {
        "disaster_type": "flood",
        "location": "North Basin Levee Road",
        "description": "Still flooding, water rising further.",
        "name": "Local Resident A",
        "contact_info": "+919876543201"
    }
    client.post("/api/citizen-reports", json=cit_dup)
    conf_dup = client.get(f"/api/incidents/{inc_id}/confidence").json()
    assert conf_dup["independent_source_count"] == 1
    assert conf_dup["duplicate_submissions_filtered"] >= 1
    assert conf_dup["confidence_score"] == 25

    # 3. Second independent citizen report -> Corroboration bonus (+10 pts = 35 pts)
    cit2 = {
        "disaster_type": "flood",
        "location": "North Basin Levee Road near Bridge",
        "description": "Confirming water breach on levee avenue, cars turning back.",
        "name": "Driver B",
        "contact_info": "+919876543202"
    }
    res2 = client.post("/api/citizen-reports", json=cit2)
    assert res2.status_code == 201
    assert res2.json()["incident_id"] == inc_id
    conf_res2 = client.get(f"/api/incidents/{inc_id}/confidence").json()
    assert conf_res2["independent_source_count"] == 2
    assert conf_res2["confidence_score"] == 35

    # 4. Authority verification -> Strong confidence boost (+30 pts = 65 pts, MODERATE)
    login_res = client.post("/api/auth/login", json={"username": "authority_admin", "password": "Commander@2026!"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.patch(f"/api/incidents/{inc_id}/status", json={"status": "ACTIVE", "notes": "Verified by Sector Command"}, headers=headers)
    
    conf_res3 = client.get(f"/api/incidents/{inc_id}/confidence").json()
    assert conf_res3["confidence_score"] == 65
    assert conf_res3["confidence_level"] == "MODERATE"

    # 5. Field assessment survey -> Reconnaissance boost (+25 pts = 90 pts, HIGH)
    draft_res = client.post("/api/assessments", json={
        "incident_id": inc_id,
        "assessment_mode": "Aerial - Drone",
        "mission_type": "Area Scan / Survey",
        "asset_name": "SkyWatch UAV 9",
        "weather_conditions": "Overcast",
        "area_surveyed": "North Basin Levee",
        "structures_damaged_count": 2,
        "road_accessibility_status": "Partially Flooded",
        "evacuation_route_status": "Routes Clear",
        "operator_observations": "Levee overtop confirmed, 200m road section submerged.",
        "confidence_score": 95
    })
    assert draft_res.status_code == 201
    asm_id = draft_res.json()["id"]
    sub_res = client.post(f"/api/assessments/{asm_id}/submit")
    assert sub_res.status_code == 200

    conf_res4 = client.get(f"/api/incidents/{inc_id}/confidence").json()
    assert conf_res4["confidence_score"] == 90
    assert conf_res4["confidence_level"] == "HIGH"

    # 6. Add contradictory report -> Penalty (-20 pts = 70 pts)
    client.post(
        f"/api/incidents/{inc_id}/evidence/contradiction?reason=False+alarm+reported+by+patrol+unit+on+east+gate&source_label=Patrol+Unit+7",
        headers=headers
    )
    conf_res5 = client.get(f"/api/incidents/{inc_id}/confidence").json()
    assert conf_res5["confidence_score"] == 70
    assert len(conf_res5["contradictions"]) == 1
    assert "False alarm" in conf_res5["contradictions"][0]["reason"]

    # 7. Test Nonexistent incident confidence -> 404
    nf_conf = client.get("/api/incidents/inc-nonexistent-404/confidence")
    assert nf_conf.status_code == 404


def test_phase7_live_command_center_telemetry():
    # 1. Nonexistent incident telemetry -> 404
    nf_tel = client.get("/api/incidents/inc-nonexistent-777/operations/telemetry")
    assert nf_tel.status_code == 404

    # 2. Create fresh incident
    cit_payload = {
        "disaster_type": "flood",
        "location": "Central Telemetry Sector",
        "description": "Rising floodwaters reported, 2 families isolated on terrace.",
        "is_people_trapped": True,
        "is_immediate_danger": True
    }
    cit_res = client.post("/api/citizen-reports", json=cit_payload)
    assert cit_res.status_code == 201
    inc_id = cit_res.json()["incident_id"]

    # 3. Telemetry with 0 operations -> Check empty baseline counts
    tel0 = client.get(f"/api/incidents/{inc_id}/operations/telemetry")
    assert tel0.status_code == 200
    t0_data = tel0.json()
    assert t0_data["incident_id"] == inc_id
    assert t0_data["active_operation_count"] == 0
    assert t0_data["completed_operation_count"] == 0
    assert t0_data["resources_assigned"] == 0
    assert t0_data["resources_en_route"] == 0
    assert t0_data["resources_on_scene"] == 0

    # 4. Create an available resource with coordinates
    res_payload = {
        "name": "Rapid Recon Drone Unit 4",
        "category": "aerial",
        "personnel_count": 3,
        "equipment_details": "4K Thermal Sensors, FLIR",
        "base_location": "Central Drone Hub",
        "status": "AVAILABLE"
    }
    res_res = client.post("/api/resources", json=res_payload)
    assert res_res.status_code == 201
    res_id = res_res.json()["id"]

    # 5. Authority approve deployment -> Operation ASSIGNED
    login_res = client.post("/api/auth/login", json={"username": "authority_admin", "password": "Commander@2026!"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    app_res = client.post(
        f"/api/allocations/rec-p7/approve?incident_id={inc_id}&resource_id={res_id}&notes=Launch+aerial+recon+survey",
        headers=headers
    )
    assert app_res.status_code == 200
    op_id = app_res.json()["operation_id"]

    # 6. Verify Telemetry reflects ASSIGNED state
    tel1 = client.get(f"/api/incidents/{inc_id}/operations/telemetry").json()
    assert tel1["active_operation_count"] == 1
    assert tel1["resources_assigned"] == 1
    assert tel1["resources_en_route"] == 0
    assert tel1["resources_on_scene"] == 0
    assert tel1["operation_state_breakdown"].get("ASSIGNED") == 1

    # 7. Transition: ASSIGNED -> DISPATCHED -> EN_ROUTE -> Verify telemetry bucket
    disp_res = client.patch(f"/api/operations/{op_id}/status", json={"status": "DISPATCHED"}, headers=headers)
    assert disp_res.status_code == 200
    enr_res = client.patch(f"/api/operations/{op_id}/status", json={"status": "EN_ROUTE"}, headers=headers)
    assert enr_res.status_code == 200
    tel2 = client.get(f"/api/incidents/{inc_id}/operations/telemetry").json()
    assert tel2["active_operation_count"] == 1
    assert tel2["resources_assigned"] == 0
    assert tel2["resources_en_route"] == 1
    assert tel2["resources_on_scene"] == 0

    # 8. Transition to ON_SCENE -> Verify telemetry bucket
    client.patch(f"/api/operations/{op_id}/status", json={"status": "ON_SCENE"}, headers=headers)
    tel3 = client.get(f"/api/incidents/{inc_id}/operations/telemetry").json()
    assert tel3["active_operation_count"] == 1
    assert tel3["resources_assigned"] == 0
    assert tel3["resources_en_route"] == 0
    assert tel3["resources_on_scene"] == 1

    # 9. Transition to COMPLETED -> Verify completed count and resource release
    client.patch(f"/api/operations/{op_id}/status", json={"status": "COMPLETED"}, headers=headers)
    tel4 = client.get(f"/api/incidents/{inc_id}/operations/telemetry").json()
    assert tel4["active_operation_count"] == 0
    assert tel4["completed_operation_count"] == 1
    assert tel4["resources_assigned"] == 0
    assert tel4["resources_en_route"] == 0
    assert tel4["resources_on_scene"] == 0

    # 10. Check resource returned to AVAILABLE in latest_resource_states
    matched_res = [r for r in tel4["latest_resource_states"] if r["resource_id"] == res_id]
    assert len(matched_res) == 1
    assert matched_res[0]["status"] == "AVAILABLE"
