from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.shelter import Shelter
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_priority_score_calculation():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    inc = Incident(
        id="inc-crit",
        title="Severe Flood with Trapped Civilians",
        description="People trapped on rooftop with rapidly rising water.",
        disaster_type="flood",
        severity="CRITICAL",
        priority_level="Level 1",
        status="ACTIVE",
        location_name="Sector 7G Coastal Basin",
        affected_population="5,000",
        resource_coverage_pct=50,
        is_field_verified=False,
        created_at=now,
    )
    db.add(inc)
    db.commit()
    db.close()

    res = client.get("/api/allocations/priority/inc-crit")
    assert res.status_code == 200
    data = res.json()
    assert data["priority_score"] >= 80
    assert data["priority_level"] == "Level 1"
    assert "severity" in data["explanation"].lower()
    assert ("trapped" in data["explanation"].lower() or "isolated" in data["explanation"].lower() or "stranded" in data["explanation"].lower())

def test_capability_aware_allocation_and_scarcity():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    
    # 2 Incidents needing water rescue
    inc1 = Incident(
        id="inc-1",
        title="Submerged Pocket A",
        description="Water depth 6ft, rescue boats required.",
        disaster_type="flood",
        severity="CRITICAL",
        priority_level="Level 1",
        status="ACTIVE",
        location_name="Sector 7G North Breach",
        affected_population="10,000",
        created_at=now,
    )
    inc2 = Incident(
        id="inc-2",
        title="Submerged Pocket B",
        description="Causeway flooded, water rescue needed.",
        disaster_type="flood",
        severity="MEDIUM",
        priority_level="Level 3",
        status="ACTIVE",
        location_name="Coastal Causeway Km 18",
        affected_population="500",
        created_at=now,
    )
    # Only 1 water rescue boat available (SCARCITY)
    res_boat = Resource(
        id="res-boat-1",
        name="Gemini Inflatable Boat Unit 1",
        category="rescue",
        status="AVAILABLE",
        base_location="Sector 7G",
        personnel_count=6,
        equipment_details="Swift water boat",
        created_at=now,
    )
    db.add(inc1)
    db.add(inc2)
    db.add(res_boat)
    db.commit()
    db.close()

    res = client.get("/api/allocations/recommendations")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2

    # High priority inc-1 should receive the boat
    rec_inc1 = next(r for r in data if r["incident_id"] == "inc-1")
    assert rec_inc1["resource_id"] == "res-boat-1"
    assert rec_inc1["unmet_demand"] is False

    # Lower priority inc-2 should reflect resource scarcity / unmet demand
    rec_inc2 = next(r for r in data if r["incident_id"] == "inc-2")
    assert rec_inc2["unmet_demand"] is True
    assert "SCARCITY" in rec_inc2["reason"] or rec_inc2["scarcity_warning"] is True

def test_shelters_endpoint_and_availability():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    shl = Shelter(
        id="shl-test-1",
        name="Relief Center 1",
        location="Sector 7",
        total_capacity=500,
        current_occupancy=200,
        contact_phone="+91 99999 11111",
        created_at=now,
    )
    db.add(shl)
    db.commit()
    db.close()

    res = client.get("/api/shelters")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["available_capacity"] == 300
    assert data[0]["status"] == "AVAILABLE"

def test_sms_inbound_gateway_pipeline():
    payload = {
        "sender_phone": "+919876543210",
        "message_text": "FLOOD HELP 29.7604 -95.3698 6 PEOPLE TRAPPED ELDERLY NEED BOAT"
    }
    res = client.post("/api/sms/inbound", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "PROCESSED"
    assert data["protocol"] == "SMS_IVR_TELECOM_GATEWAY"
    assert "incident_id" in data
    assert data["parsed_metadata"]["disaster_type"] == "flood"
    assert data["parsed_metadata"]["is_people_trapped"] is True
