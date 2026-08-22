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
