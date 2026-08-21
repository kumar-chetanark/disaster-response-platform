# REST API Specification: Disaster Response Platform

## 1. Overview & Base URL
- **Base URL**: `http://localhost:8000/api/v1`
- **Protocol**: HTTP/1.1 over TLS (Production: HTTPS)
- **Data Format**: JSON (`Content-Type: application/json`)
- **Status**: **PLANNED** (No API routes currently implemented).

---

## 2. API Endpoints

### 2.1 Health & Diagnostics
#### `GET /health`
- **Description**: Returns backend service health, AI inference status, and persistence connectivity.
- **Response** (`200 OK`):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ai_advisory": "connected",
  "database": "connected",
  "demo_mode": false
}
```

---

### 2.2 Ingestion Gateways (Proactive Intelligence & Citizen Multi-Channel)

#### `POST /ingestion/proactive`
- **Description**: Ingests trusted external intelligence (IMD alerts, weather bulletins, news feeds, government advisories, satellite feeds) to detect emerging disasters.
- **Request Body**:
```json
{
  "source": "IMD_NATIONAL_WEATHER_SERVICE",
  "alert_type": "flash_flood_warning",
  "title": "Severe Coastal Flash Flood Warning - Bay Sector 4",
  "raw_content": "Heavy precipitation (>120mm/hr) detected. High risk of river overflow and structural inundation.",
  "geographic_scope": {
    "region_name": "Sector 4 Coastal Metro",
    "latitude": 29.7604,
    "longitude": -95.3698,
    "radius_km": 15.0
  },
  "confidence": 0.95
}
```
- **Response** (`201 Created`):
```json
{
  "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "detection_status": "PROACTIVE_DETECTED",
  "severity_estimated": "critical",
  "affected_population_est": 12000
}
```

#### `POST /ingestion/citizen/sms`
- **Description**: Ingests citizen SMS distress reports forwarded from telecom SMS Gateway.
- **Request Body**:
```json
{
  "sender_phone": "+919876543210",
  "message_text": "Water rising rapidly near Sector 4B bridge. 14 people trapped on building rooftop. Need immediate rescue!",
  "telecom_timestamp": "2026-08-21T06:12:00Z"
}
```

#### `POST /ingestion/citizen/ivr`
- **Description**: Ingests citizen voice emergency call transcripts and audio metadata forwarded from IVR Gateway.
- **Request Body**:
```json
{
  "call_sid": "CA1029384857",
  "caller_phone": "+919123456789",
  "transcript": "Road to Central Hospital is completely submerged. Water depth 5 feet. Ambulance cannot pass.",
  "extracted_entities": {
    "location": "Central Hospital Road, Sector 4B",
    "hazard": "road_submerged",
    "urgency": "high"
  }
}
```

---

### 2.3 Incident Management

#### `GET /incidents`
- **Description**: List all active, monitoring, and resolved disaster incidents with prioritized ordering.
- **Query Params**: `status` (e.g. `active`, `unresolved`), `severity` (e.g. `critical`, `high`), `limit` (default 20).
- **Response** (`200 OK`):
```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Coastal Metro - Sector 4 Flood Emergency",
    "type": "flood",
    "status": "unresolved",
    "severity": "critical",
    "affected_population_est": 12000,
    "affected_area": "Sector 4 Bay Region",
    "latitude": 29.7604,
    "longitude": -95.3698,
    "proactive_origin": true,
    "citizen_report_count": 42,
    "created_at": "2026-08-21T06:00:00Z"
  }
]
```

#### `GET /incidents/{incident_id}`
- **Description**: Retrieve detailed incident profile including multi-channel telemetry and linked aerial assessments.

---

### 2.4 Aerial Resource Dispatch & Structured Assessment (Core Feature)

#### `POST /aerial/missions/dispatch`
- **Description**: Authorize and dispatch an aerial field resource (drones/aircraft) to an incident. (Requires Authority role).
- **Request Body**:
```json
{
  "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "resource_id": "aerial-uav-01",
  "mission_type": "damage_assessment",
  "objective": "Conduct low-altitude survey of Sector 4B causeway and assess rooftop stranded civilians.",
  "target_sector": "Sector 4B",
  "authorized_by": "AUTHORITY_CHETAN_ARK"
}
```
- **Response** (`201 Created`):
```json
{
  "mission_id": "msn-88210-uav1",
  "status": "DISPATCHED",
  "dispatched_at": "2026-08-21T06:15:00Z"
}
```

#### `POST /aerial/assessments`
- **Description**: Ingests structured post-mission assessment submitted by the aerial operator/team. Automatically updates original incident and triggers advisory recalculation.
- **Request Body**:
```json
{
  "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "mission_id": "msn-88210-uav1",
  "mission_type": "damage_assessment",
  "objective": "Survey Sector 4B causeway and rooftop strandings",
  "location_area": "Sector 4B - Riverfront & East Causeway",
  "assessment_time": "2026-08-21T06:25:00Z",
  "operator_team": "Recon Flight Team Alpha",
  "observations": "Causeway bridge span partially collapsed. Swift water current 8 knots.",
  "affected_people_count": 14,
  "affected_structures_count": 6,
  "damage_observations": "Severe structural inundation, ground access roads cut off",
  "accessibility": "air_only",
  "resource_requirements": ["swift_water_sar", "air_evacuation"],
  "imagery_attachments": [
    {
      "url_before": "https://storage.local/tiles/sector4b_pre.jpg",
      "url_after": "https://storage.local/tiles/sector4b_aerial_post.jpg"
    }
  ],
  "confidence_score": 0.92,
  "notes": "Urgent swift-water rescue required before high tide in 45 minutes."
}
```
- **Response** (`201 Created`):
```json
{
  "assessment_id": "8c59b20d-7b23-42e1-95c8-c918a51e62bc",
  "incident_updated": true,
  "priority_recalculated": true,
  "resource_allocation_updated": true
}
```

---

### 2.5 Advisory Resource Allocation Engine (9-Step Workflow)

#### `GET /resources`
- **Description**: Query all emergency personnel, teams, vehicles, and aerial assets with current lifecycle state.
- **Response** (`200 OK`):
```json
[
  {
    "id": "res-sar-01",
    "name": "Swift-Water SAR Team Alpha",
    "category": "search_and_rescue",
    "capabilities": ["swift_water", "boat_extraction"],
    "status": "AVAILABLE",
    "base_location": { "lat": 29.7550, "lon": -95.3600 }
  }
]
```

#### `GET /allocations/recommendations`
- **Description**: Executes the 9-step advisory allocation algorithm across highest-priority unresolved incidents and returns explainable advisory recommendations for Authority review.
- **Response** (`200 OK`):
```json
[
  {
    "recommendation_id": "rec-99102",
    "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "target_sector": "Sector 4B",
    "recommended_resources": [
      {
        "resource_id": "res-sar-01",
        "name": "Swift-Water SAR Team Alpha",
        "eta_minutes": 12
      },
      {
        "resource_id": "res-air-01",
        "name": "Air Evacuation Chopper 1",
        "eta_minutes": 8
      }
    ],
    "advisory_rationale": "Selected SAR Team Alpha due to specialized swift-water capabilities and 12-min proximity; air evacuation required due to blocked ground causeway. 2 ground ambulances held in reserve for competing Sector 5.",
    "scarcity_balanced": true,
    "status": "RECOMMENDED"
  }
]
```

#### `POST /allocations/approve`
- **Description**: Authority approval endpoint. Transitions resource state: `RECOMMENDED` → `AUTHORITY APPROVED` → `ALLOCATED` → `IN USE`.
- **Request Body**:
```json
{
  "recommendation_id": "rec-99102",
  "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "approved_resource_ids": ["res-sar-01", "res-air-01"],
  "authorized_by": "AUTHORITY_CHETAN_ARK",
  "notes": "Approved for immediate deployment with air cover."
}
```
- **Response** (`200 OK`):
```json
{
  "allocation_id": "a9e22c01-7711-4fa3-82de-bb40129031d2",
  "status": "ALLOCATED",
  "timestamp": "2026-08-21T06:30:00Z"
}
```

#### `POST /allocations/recalculate`
- **Description**: Explicitly triggers advisory reallocation recalculation when field telemetry or incident priorities update.

