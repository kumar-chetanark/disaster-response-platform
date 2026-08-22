from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.incident import Incident
from app.models.report import Report
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_list_reports():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Report(id="REP-TEST-1", incident_id="inc-a", report_type="SITREP", title="Cyclone Alpha 4 Situation Report", author="Commander J. Sterling", summary="Comprehensive analysis.", created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/reports")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == "REP-TEST-1"

def test_get_report_by_id():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Report(id="REP-TEST-1", incident_id="inc-a", report_type="SITREP", title="Cyclone Alpha 4 Situation Report", author="Commander J. Sterling", summary="Comprehensive analysis.", created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/reports/REP-TEST-1")
    assert res.status_code == 200
    assert res.json()["title"] == "Cyclone Alpha 4 Situation Report"

def test_get_report_not_found():
    res = client.get("/api/reports/REP-NONEXISTENT")
    assert res.status_code == 404

def test_create_report_success():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.commit()
    db.close()

    payload = {
        "incident_id": "inc-a",
        "report_type": "AFTER_ACTION",
        "title": "Sector 7G Flood Recovery After-Action Review",
        "author": "Chief Operations Director",
        "summary": "Full summary of evacuation efficiency.",
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 201
    assert res.json()["title"] == "Sector 7G Flood Recovery After-Action Review"

def test_create_report_invalid_incident_id():
    payload = {
        "incident_id": "inc-invalid-999",
        "report_type": "SITREP",
        "title": "Invalid Report",
        "author": "Officer",
        "summary": "Should fail.",
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 400

def test_download_report_pdf():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    db.add(Incident(id="inc-a", title="Cyclone Alpha 4", disaster_type="cyclone", severity="CRITICAL", priority_level="Level 1", status="ACTIVE", location_name="Sector 7G", created_at=now))
    db.add(Report(id="REP-TEST-1", incident_id="inc-a", report_type="SITREP", title="Cyclone Alpha 4 Situation Report", author="Commander J. Sterling", summary="Comprehensive analysis.", created_at=now))
    db.commit()
    db.close()

    res = client.get("/api/reports/REP-TEST-1/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    assert res.content.startswith(b"%PDF-")

def test_download_report_pdf_not_found():
    res = client.get("/api/reports/REP-NONEXISTENT/pdf")
    assert res.status_code == 404
