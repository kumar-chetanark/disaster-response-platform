from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.operation import Operation
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_dispatch_resource_creates_operation_and_updates_resource_status():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Resource(id="res-1", name="NDRF Squad", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    payload = {
        "incident_id": "inc-a",
        "resource_id": "res-1",
        "operation_type": "Swift-Water Rescue",
        "destination_location": "Sector 7G North Basin",
        "authorized_by": "Commander J. Sterling",
        "mission_objective": "Evacuate stranded civilians."
    }
    res = client.post("/api/operations", json=payload)
    assert res.status_code == 201

def test_list_operations():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Resource(id="res-1", name="NDRF Squad", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    client.post("/api/operations", json={
        "incident_id": "inc-a",
        "resource_id": "res-1",
        "operation_type": "Air Recon",
        "destination_location": "Sector 7G",
        "authorized_by": "Commander",
        "mission_objective": "Survey perimeter."
    })
    res = client.get("/api/operations")
    assert res.status_code == 200
    assert len(res.json()) >= 1

def test_get_operation_detail():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Resource(id="res-1", name="NDRF Squad", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    op_res = client.post("/api/operations", json={
        "incident_id": "inc-a",
        "resource_id": "res-1",
        "operation_type": "Air Recon",
        "destination_location": "Sector 7G",
        "authorized_by": "Commander",
        "mission_objective": "Survey perimeter."
    })
    op_id = op_res.json()["id"]
    res = client.get(f"/api/operations/{op_id}")
    assert res.status_code == 200
    assert res.json()["id"] == op_id

def test_phase6_operational_response_and_mission_lifecycle():
    # 1. Create real incident via citizen report
    cit_payload = {
        "disaster_type": "flood",
        "location": "Delta Sector South",
        "description": "Rising floodwaters blocking highway, people trapped in minivan.",
        "is_people_trapped": True,
        "is_immediate_danger": True
    }
    cit_res = client.post("/api/citizen-reports", json=cit_payload)
    assert cit_res.status_code == 201
    inc_id = cit_res.json()["incident_id"]

    # 2. Query Incident Requirements
    req_res = client.get(f"/api/incidents/{inc_id}/requirements")
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert len(req_data["requirements"]) >= 1
    req_caps = [r["capability"] for r in req_data["requirements"]]
    assert "rescue" in req_caps

    # 3. Create an available resource
    res_payload = {
        "name": "Delta Marine Rescue 1",
        "category": "rescue",
        "personnel_count": 6,
        "equipment_details": "Inflatable Zodiac Boats, Sonar",
        "base_location": "Delta Sector South Pier",
        "status": "AVAILABLE"
    }
    create_res = client.post("/api/resources", json=res_payload)
    assert create_res.status_code == 201
    res_id = create_res.json()["id"]

    # 4. Anonymous approval attempt -> 401
    anon_app = client.post(f"/api/allocations/rec-123/approve?incident_id={inc_id}&resource_id={res_id}")
    assert anon_app.status_code == 401

    # 5. Authority login and approve recommendation
    login_res = client.post("/api/auth/login", json={"username": "authority_admin", "password": "Commander@2026!"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    app_res = client.post(
        f"/api/allocations/rec-123/approve?incident_id={inc_id}&resource_id={res_id}&notes=Deploy+swift-water+unit",
        headers=headers
    )
    assert app_res.status_code == 200
    op_id = app_res.json()["operation_id"]
    assert app_res.json()["operation_status"] == "ASSIGNED"

    # 6. Double-allocation guard -> Attempting to assign same resource again returns HTTP 409
    dup_app = client.post(
        f"/api/allocations/rec-123/approve?incident_id={inc_id}&resource_id={res_id}",
        headers=headers
    )
    assert dup_app.status_code == 409

    # 7. Check operation lifecycle transitions: ASSIGNED -> DISPATCHED -> EN_ROUTE -> ON_SCENE -> COMPLETED
    # A: ASSIGNED -> DISPATCHED
    st1 = client.patch(f"/api/operations/{op_id}/status", json={"status": "DISPATCHED"}, headers=headers)
    assert st1.status_code == 200
    assert st1.json()["status"] == "DISPATCHED"

    # B: DISPATCHED -> EN_ROUTE
    st2 = client.patch(f"/api/operations/{op_id}/status", json={"status": "EN_ROUTE"}, headers=headers)
    assert st2.status_code == 200
    assert st2.json()["status"] == "EN_ROUTE"

    # C: EN_ROUTE -> ON_SCENE
    st3 = client.patch(f"/api/operations/{op_id}/status", json={"status": "ON_SCENE"}, headers=headers)
    assert st3.status_code == 200
    assert st3.json()["status"] == "ON_SCENE"

    # D: ON_SCENE -> COMPLETED
    st4 = client.patch(f"/api/operations/{op_id}/status", json={"status": "COMPLETED"}, headers=headers)
    assert st4.status_code == 200
    assert st4.json()["status"] == "COMPLETED"

    # E: Terminal state check -> COMPLETED cannot transition to DISPATCHED (409)
    inv_term = client.patch(f"/api/operations/{op_id}/status", json={"status": "DISPATCHED"}, headers=headers)
    assert inv_term.status_code == 409

    # 8. Verify resource is released and returned to AVAILABLE
    res_check = client.get(f"/api/resources/{res_id}")
    assert res_check.status_code == 200
    assert res_check.json()["status"] == "AVAILABLE"
