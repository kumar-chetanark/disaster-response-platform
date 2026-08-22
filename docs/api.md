# API Documentation (Phase 7 — Alerts Backend Integration)

## Base URL
- Development: `http://localhost:8000/api`
- OpenAPI Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Implemented Endpoints

### 1. Root & Health Check
- **`GET /`**: Service metadata and route index.
- **`GET /api/health`**: Verifies service runtime and database connectivity.

### 2. Citizen Incident Report Ingestion
- **`POST /api/citizen-reports`**: Ingests public citizen disaster reports, runs deterministic deduplication/matching against active incidents, attaches corroborated sources without creating duplicate incidents, and enqueues a `CIVIL` alert for Authority Command.

### 3. Incident Registry
- **`GET /api/incidents`**: Paginated incident registry with search, severity filter, and status filter.
- **`GET /api/incidents/{incident_id}`**: Full canonical incident detail dossier with all 16 intelligence dimensions.

### 4. Authority Resource Management
- **`GET /api/resources`**: Complete resource inventory listing.
- **`GET /api/resources/nearby`**: Location-First resource discovery.
- **`POST /api/resources`**: Authority endpoint to add new emergency response units or shelters.
- **`PATCH /api/resources/{resource_id}`**: Authority endpoint to update operational status, personnel quantity, and shelter/supply capacities.

### 5. Operations & Resource Dispatch
- **`POST /api/operations`**: Authority dispatch action creating an active mission track (`AVAILABLE` → `IN OPERATION`) and enqueues a dispatch alert.
- **`GET /api/operations`**: Returns list of active, in-progress, and completed operations.
- **`GET /api/operations/{operation_id}`**: Returns full detail dossier of a specific operational track.
- **`PATCH /api/operations/{operation_id}`**: Updates operational state (`IN OPERATION` → `AVAILABLE` when completed/cancelled).

### 6. Generic Field Assessment Backend
- **`POST /api/assessments`**: Ingests generic field reconnaissance from any method (**Drone**, **Helicopter**, **Land Vehicle**, **Water Vehicle**, **Field Team**).
- **`GET /api/assessments/{assessment_id}`**: Retrieves telemetry and survey details.
- **`PATCH /api/assessments/{assessment_id}`**: Modifies assessment draft telemetry.
- **`POST /api/assessments/{assessment_id}/submit`**: Executes closed-loop recalculation and enqueues a high-priority `FIELD VERIFIED` alert.

### 7. Alerts & Early Warnings
- **`GET /api/alerts`**:
  - Returns paginated early warning intelligence stream directly from the database.
  - Query parameters:
    - `severity` (`critical`, `warning`, `info`)
    - `category` (`METEO`, `CIVIL`, `INFRASTRUCTURE`, `MEDICAL`, `GOVERNMENT`)
    - `incident_id` (filter by canonical incident)
    - `is_reviewed` (`true` / `false`)
    - `page` (default `1`), `page_size` (default `20`)
  - Response (`AlertListResponse`):
    ```json
    {
      "items": [
        {
          "id": "alt-101",
          "incident_id": "inc-a",
          "incident_title": "Cyclone Alpha 4",
          "category": "METEO",
          "source": "IMD Doppler Radar",
          "location": "Sector 7G / Coastal Basin",
          "message": "Storm surge warning: 2.8m water elevation approaching shoreline.",
          "severity": "critical",
          "is_reviewed": false,
          "alert_time": "10:15 AM",
          "created_at": "10:15 AM"
        }
      ],
      "total": 1,
      "page": 1,
      "page_size": 20,
      "total_pages": 1,
      "unreviewed_count": 1
    }
    ```
- **`PATCH /api/alerts/{id}/review`**:
  - Authority acknowledgment action marking an alert as reviewed.
  - Request body (`AlertReviewUpdate`): `{ "is_reviewed": true }`.
  - Response: Updated `AlertResponse`.

## Planned Endpoints (Subsequent Phases)
- `GET /api/reports` — Historical debriefs and PDF generation
- `POST /api/reports` — Create after-action debrief dossier

---

## 8. Reports & PDF Dossier API (`/api/reports`)

### 8.1 List Operational Reports
`GET /api/reports`
- **Query Params**:
  - `incident_id` (optional, string): Filter reports by linked canonical incident ID.
  - `report_type` (optional, string): Filter by `SITREP`, `AFTER_ACTION`, `DAMAGE_ASSESSMENT`, `RESOURCE_AUDIT`.
  - `page` (integer, default `1`): Pagination page number.
  - `page_size` (integer, default `20`): Page size limit (1-100).
- **Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "rep-sitrep-101",
      "incident_id": "inc-a",
      "incident_title": "Cyclone Alpha 4",
      "report_type": "SITREP",
      "title": "Cyclone Alpha 4 — Executive Command SITREP & Impact Debrief",
      "author": "Commander J. Sterling (SDMA Crisis Desk)",
      "summary": "Landfall recorded at 09:30 UTC. High-resolution telemetry and aerial UAV reconnaissance confirm severe storm surge across Coastal Basin Sector 7G.",
      "metrics_summary": "Affected: 12,500 | Evacuated: 1,420 | Casualties: 0 | Resource Coverage: 85%",
      "tags": "cyclone,evacuation,drone_recon,sitrep",
      "created_at": "2026-08-22 09:30 AM"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### 8.2 Get Report by ID
`GET /api/reports/{id}`
- **Response**: `200 OK` (ReportResponse object) or `404 Not Found`.

### 8.3 Create Operational Report
`POST /api/reports`
- **Body**:
```json
{
  "incident_id": "inc-a",
  "report_type": "AFTER_ACTION",
  "title": "Sector 7G Flood Recovery After-Action Review",
  "author": "Chief Operations Director",
  "summary": "Full summary of evacuation efficiency and resource deployment.",
  "metrics_summary": "Evacuation Rate: 99.4%",
  "tags": "flood,evacuation,review"
}
```
- **Response**: `201 Created`

### 8.4 Generate Official PDF Dossier
`GET /api/reports/{id}/pdf`
- **Response**: `200 OK`
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `inline; filename="report_{id}.pdf"`
- Generates a full multi-section PDF document containing executive summary, canonical incident metadata, multi-channel corroboration ledgers, field reconnaissance surveys, authority operations, resource allocations, and telemetry warning alerts.
