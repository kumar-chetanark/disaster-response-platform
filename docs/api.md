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
- **Description**: Returns backend service, AI gateway, and database connectivity health.
- **Response** (`200 OK`):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ai_gateway": "connected",
  "database": "connected",
  "demo_mode": false
}
```

---

### 2.2 Incident Management
#### `GET /incidents`
- **Description**: List all active and archived disaster incidents.
- **Query Params**: `status` (optional), `severity` (optional), `limit` (default 20).
- **Response** (`200 OK`):
```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Coastal Hurricane Surge - Sector Bay",
    "type": "flood",
    "status": "active",
    "severity": "critical",
    "latitude": 29.7604,
    "longitude": -95.3698,
    "created_at": "2026-08-21T06:00:00Z"
  }
]
```

#### `POST /incidents`
- **Description**: Create a new emergency incident record.

---

### 2.3 Aerial Imagery Assessment (Core Feature)
#### `POST /assessments/analyze`
- **Description**: Submit aerial drone imagery (or select simulated tile ID) for automated AI damage detection.
- **Request Body**:
```json
{
  "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "image_url_before": "https://storage.local/tiles/sector4_pre.jpg",
  "image_url_after": "https://storage.local/tiles/sector4_post.jpg",
  "simulation_preset": "river_basin_flash_flood"
}
```
- **Response** (`200 OK`):
```json
{
  "assessment_id": "8c59b20d-7b23-42e1-95c8-c918a51e62bc",
  "incident_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "damage_score": 0.78,
  "severity_level": "critical",
  "confidence": 0.924,
  "summary": "Severe structural inundation and bridge collapse detected in sector 4B.",
  "damage_zones": [
    {
      "zone_id": "zone-4b",
      "damage_type": "structural_collapse",
      "severity": "critical",
      "confidence": 0.94,
      "bounds": { "x": 120, "y": 85, "width": 340, "height": 210 }
    }
  ],
  "recommended_actions": [
    "Deploy swift-water rescue team to East Bridge Sector 4B",
    "Establish medical evacuation LZ at Highground Park"
  ]
}
```

---

### 2.4 Priority Zones & Reassessment
#### `GET /incidents/{incident_id}/priority-zones`
- **Description**: Retrieve ranked priority response sectors calculated from latest aerial and field data.

#### `POST /incidents/{incident_id}/reassess`
- **Description**: Triggers recalculation of priority ranks when new field telemetry is submitted.

---

### 2.5 Resource Dispatch & Allocations
#### `GET /resources`
- **Description**: Query available rescue units, vehicles, and equipment.

#### `POST /allocations/dispatch`
- **Description**: Confirm and dispatch units to targeted priority zones.
- **Request Body**:
```json
{
  "zone_id": "zone-4b",
  "resource_ids": ["res-001", "res-004"],
  "assigned_by": "OPERATOR_CHETAN",
  "reasoning": "Immediate swift-water extraction for 14 stranded individuals."
}
```
- **Response** (`201 Created`):
```json
{
  "allocation_id": "a9e22c01-7711-4fa3-82de-bb40129031d2",
  "status": "dispatched",
  "timestamp": "2026-08-21T06:30:00Z"
}
```
