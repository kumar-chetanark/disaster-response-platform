# REST API Reference — Disaster Response Platform (PS-07)

## Base URLs
- **Production API**: `https://disaster-response-api-wrn2.onrender.com/api`
- **Development API**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `/docs`
- **ReDoc Reference**: `/redoc`

## Verified Endpoints

### 1. External Disaster Intelligence (GDACS)
- **`GET /api/external-alerts`**: Paginated worldwide disaster intelligence alerts with filters (`event_type`, `severity`, `status`, `country`, `limit`, `offset`).
- **`GET /api/external-alerts/{id}`**: Full dossier of a specific external disaster record.
- **`GET /api/external-alerts/ingestion-status`**: Status of GDACS pipeline (`CONNECTED`, `events_fetched`, `last_successful_sync`).
- **`POST /api/external-alerts/ingest`**: Manual trigger to fetch and ingest fresh GDACS disaster events.
- **`POST /api/external-alerts/reset-and-resync`**: Resets cache and ingests curated GeoJSON disaster feeds.
- **`POST /api/external-alerts/{id}/status`**: Mark alert as `REVIEWED`, `VALIDATED`, or `REJECTED`.
- **`POST /api/external-alerts/{id}/convert-to-incident`**: Converts an external alert into a canonical active Incident with double-conversion protection (`HTTP 409 Conflict`).

### 2. Incident Management
- **`GET /api/incidents`**: List canonical incidents with priority and status filters.
- **`GET /api/incidents/{id}`**: 16-dimension incident intelligence profile.
- **`POST /api/incidents`**: Create new incident manually.
- **`PATCH /api/incidents/{id}/status`**: Update status (`PENDING`, `ACTIVE`, `MONITORING`, `RESOLVED`).
- **`DELETE /api/incidents/{id}`**: Universal incident deletion with cascade cleanup.

### 3. Citizen Crisis Reports & SMS
- **`POST /api/citizen-reports`**: Ingest and validate citizen disaster reports.
- **`POST /api/sms/inbound`**: Ingest simulated telco SMS crisis reports.

### 4. Tactical Operations & Resource Dispatch
- **`GET /api/resources`**: Squad and equipment asset inventory with 25km geospatial filters.
- **`POST /api/resources`**: Register new resource unit or shelter.
- **`GET /api/allocations/recommendations`**: Capability-aware resource allocation recommendations.
- **`POST /api/operations`**: Dispatch and consolidate tactical operation missions.
- **`GET /api/operations`**: List all active operations and timeline status logs.
- **`PATCH /api/operations/{id}/status`**: Update operational state (`DISPATCHED`, `IN TRANSIT`, `ON SCENE`, `COMPLETED`).

### 5. Reconnaissance & Damage Assessments
- **`POST /api/assessments`**: Submit field/aerial reconnaissance survey.
- **`GET /api/assessments/incident/{incident_id}`**: Retrieve assessment history for an incident.

### 6. SITREP Reporting & PDF Export
- **`POST /api/reports`**: Create debrief situation report.
- **`GET /api/reports`**: List situation reports.
- **`GET /api/reports/{id}/pdf`**: Download binary PDF situation report with official formatting.

### 7. Authentication & System Health
- **`POST /api/auth/demo`**: Authenticate demo session when `DEMO_MODE=True`.
- **`POST /api/auth/login`**: Standard username/password login.
- **`GET /api/health`**: Database connectivity and server health verification.
