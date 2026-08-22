from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.resource import Resource
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_get_resources_list():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Resource(id="res-1", name="NDRF Swift Rescue Squad 4", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.add(Resource(id="res-2", name="Mobile Trauma Unit", category="medical", status="AVAILABLE", base_location="Sector 4", created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/resources")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

def test_get_resources_by_category():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Resource(id="res-1", name="NDRF Swift Rescue Squad 4", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/resources?category=rescue")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["category"] == "rescue"

def test_get_nearby_resources_discovery():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Resource(id="res-1", name="NDRF Squad", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/resources/nearby?location=Sector 7G")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1

def test_create_resource():
    payload = {
        "id": "res-new-3",
        "name": "Heavy Debris Excavator Unit 9",
        "category": "land",
        "status": "AVAILABLE",
        "base_location": "Sector 9 Logistics Bay",
        "personnel_count": 4,
        "equipment_details": "Hydraulic shears"
    }
    res = client.post("/api/resources", json=payload)
    assert res.status_code == 201

def test_update_resource_quantities_and_status():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Resource(id="res-1", name="NDRF Squad", category="rescue", status="AVAILABLE", base_location="Sector 7G", created_at=now))
    db.commit()
    db.close()

    payload = {"status": "IN OPERATION", "personnel_count": 15}
    res = client.patch("/api/resources/res-1", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "IN OPERATION"
