from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_citizen_report_creates_new_incident():
    payload = {
        "disaster_type": "flood",
        "location": "Sector 4 Coastal Highway",
        "description": "Rising water levels blocking bridge approach.",
        "reported_time": "10:30 AM",
        "is_people_trapped": False,
        "is_immediate_danger": True,
        "affected_people_estimate": "5-10",
        "contact_info": "citizen@example.com"
    }
    response = client.post("/api/citizen-reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "incident_id" in data
    assert "report_id" in data
    assert "status" in data

def test_citizen_report_deduplication_and_corroboration():
    payload1 = {
        "disaster_type": "cyclone",
        "location": "Sector 7G Coastal Basin",
        "description": "High winds and trees falling across sector avenue.",
        "reported_time": "11:00 AM",
        "is_people_trapped": False,
        "is_immediate_danger": False
    }
    res1 = client.post("/api/citizen-reports", json=payload1)
    assert res1.status_code == 201
    inc_id = res1.json()["incident_id"]

    payload2 = {
        "disaster_type": "cyclone",
        "location": "Sector 7G Coastal Basin",
        "description": "Severe storm damage and fallen power lines on main avenue.",
        "reported_time": "11:05 AM",
        "is_people_trapped": False,
        "is_immediate_danger": False
    }
    res2 = client.post("/api/citizen-reports", json=payload2)
    assert res2.status_code == 201
    assert res2.json()["incident_id"] == inc_id
