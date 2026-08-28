# Project State — Disaster Response Platform (PS-07)

## 1. Actual System Status & Current State

> [!IMPORTANT]
> **Complete Integrated Disaster Response & Worldwide Intelligence Architecture**:
> - **Operational State**: Live, fully dynamic disaster intelligence and response platform backed by FastAPI and SQLite.
> - **Worldwide Intelligence Pipeline (GDACS)**: Real-time global early-warning ingestion pipeline continuously fetching worldwide disaster events from GDACS (Global Disaster Alert and Coordination System) via structured GeoJSON and 24h RSS feeds.
> - **Deduplication Engine**: Composite index deduplication by `(source, external_id)` with non-destructive state updates and double-conversion protection (`HTTP 409 Conflict`).
> - **Tactical GIS Radar & Heatmap**: Full-width interactive map featuring severity-driven hazard circles (Red = Critical, Orange = High, Green = Medium, Blue = Global), interactive popups, auto-scroll `[VIEW ON MAP]` actions, and synced legend controls.
> - **Citizen Emergency & AI Intake**: Real-time semantic anti-gibberish pre-screening, structured address validation, and automatic geocoding.
> - **Authority Workflow & Zero Auto-Dispatch**: Global external intelligence feeds require explicit Commander Review before conversion to canonical incidents. Absolute zero automated squads or vehicle allocations occur without authority approval.

---

## 2. Implemented & Verified Features

### A. Worldwide Disaster Intelligence System (GDACS Ingestion)
- **Extensible Source Adapter**: `BaseExternalDisasterAdapter` with `GDACSAdapter` parsing disaster categories (`EARTHQUAKE`, `FLOOD`, `TROPICAL_CYCLONE`, `VOLCANIC_ACTIVITY`, `WILDFIRE`, `DROUGHT`, `STORM`, `TSUNAMI`, `LANDSLIDE`).
- **5-Minute Ingestion Worker**: Async background task in FastAPI `lifespan` with fault isolation (external source outages never crash the platform).
- **Ingestion Health API**: `GET /api/external-alerts/ingestion-status` and on-demand `POST /api/external-alerts/ingest` manual sync triggers.
- **Alerts & Intelligence Console (`AlertsConsole.tsx`)**:
  - `EXTERNAL DISASTER INTELLIGENCE (GDACS)` sub-tab with live sync badge and filtering by event type, severity, and status.
  - `CITIZEN & SENSOR ALERTS` sub-tab with interactive clickable cards opening detailed crisis dossiers.
  - **Global Disaster Dossier Modal**: Structured breakdown of exact location, coordinates, severity level, impacted population estimates, situation briefing, and official GDACS permalinks.
  - **Authority Actions**: `[MARK REVIEWED]`, `[REJECT]`, `[VIEW ON MAP]`, and `[CREATE INCIDENT]`.

### B. Dynamic Dashboard & Tactical Radar Map (`ContextualMapPreview.tsx`)
- **Severity-Driven Hazard Circles**: Dynamic visual radius rendering:
  - 🔴 **Red (`#ef4444`)**: Critical severity / Red alerts (`75km` radius)
  - 🟠 **Orange (`#ea580c`)**: High severity / Orange alerts
  - 🟢 **Green (`#10b981`)**: Medium severity / Green alerts
  - 🔷 **Tactical Blue (`#0284c7`)**: Global GDACS `G` markers
- **Auto-Scroll to Tactical Map**: Clicking `[MAP]` on any alert smoothly navigates and scrolls the viewport directly to the map section with animated coordinate centering (`flyTo`).
- **Tactical Layer Controls**: Synchronized filter toggles (`ALL`, `INCIDENTS`, `GLOBALS`) with exact matching visual glyphs.

### C. Incidents & Authority Command Platform
- **Point-Wise Situational Assessment**: Real-time evaluation of hazard vectors, corroboration confidence, damaged structures, and road access.
- **Universal Deletion**: Allows deleting incidents in any status (`RESOLVED`, `ACTIVE`, `MONITORING`, `PENDING`) with cascade foreign key cleanup.
- **Field Recon Surveys (`AerialAssessmentForm.tsx`)**: Direct reconnaissance submission and instant priority level recalculation.
- **Situation Reports (SITREPs)**: One-click generation and binary PDF exports with command authorization blocks.

### D. Resources & Tactical Operations
- **Single Consolidated Operation per Incident**: All response squad and vehicle dispatches for a given crisis are consolidated under a single operational track in the Operations tab.
- **Area Overview Metrics**: Live 12-hour ticking local clock and dynamic **Population in Coverage** calculation based on active disaster zones and regional shelter capacities within the chosen operational radius.
- **Double-Allocation Guard**: Prevents conflicting squad assignments (`HTTP 409 Conflict`).

---

## 3. Verified Backend Endpoints
- `GET /api/external-alerts`, `GET /api/external-alerts/{id}`: Global disaster intelligence feeds.
- `POST /api/external-alerts/{id}/status`, `POST /api/external-alerts/{id}/convert-to-incident`: Authority review and canonical incident conversion.
- `GET /api/external-alerts/ingestion-status`, `POST /api/external-alerts/ingest`: GDACS sync status and manual sync trigger.
- `POST /api/citizen-reports`: AI-validated citizen emergency reporting.
- `GET /api/incidents`, `DELETE /api/incidents/{id}`, `PATCH /api/incidents/{id}/status`: Incident lifecycle management.
- `POST /api/operations`, `GET /api/operations`, `PATCH /api/operations/{id}/status`: Consolidated operational mission tracking.
- `GET /api/allocations/recommendations`: Real-time capability-aware resource allocation advisory.
- `GET /api/resources`, `POST /api/resources`: Squad and vehicle asset inventory.
- `GET /api/reports`, `POST /api/reports`: Incident SITREP dossier generation and PDF exports.
