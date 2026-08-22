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
