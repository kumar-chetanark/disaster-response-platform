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
