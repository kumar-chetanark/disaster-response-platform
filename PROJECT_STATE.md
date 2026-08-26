# Project State — Disaster Response Platform (PS-05)

## Platform Overview
An enterprise-grade, real-time Disaster Response & Incident Intelligence Platform delivering closed-loop crisis coordination, multi-source corroboration, AI-driven decision support, tactical resource allocation, and field reconnaissance ingestion.

---

## Architecture & Technology Stack
- **Frontend**: Next.js 14 (App Router, Turbopack), React 18, Tailwind CSS, TypeScript, Material Symbols, Leaflet & React-Leaflet GIS maps.
- **Backend**: FastAPI (Python 3.12+), SQLAlchemy 2.0 ORM, SQLite/PostgreSQL, Pydantic v2 schemas, Uvicorn ASGI server.
- **Document & Export Engine**: ReportLab (vector PDF generation with multi-page telemetry tables and official command seals).
- **Communication & Gateways**: REST API, WebSockets/Server-Sent Events architecture, SMS Gateway hooks.

---

## Comprehensive Feature Matrix (Currently Implemented & Live)

### 1. Unified Operational Dashboard & Live Map Console
- **Interactive Multi-Layer Map**: Real-time Leaflet GIS visualization featuring cluster pins for incidents, deployed squads, shelters, alerts, and field recon perimeters.
- **Summary Metrics Strip**: Real-time counters for Total Active Incidents, Critical Threats, Deployed Squads, Available Reserves, and System Readiness Index.
- **Real-Time Notification Ledger**: Instant alert banner with auto-dismissing sidebar notification counters on tab switch.

### 2. Automated Incident Intelligence & Decision Support
- **Multi-Factor Priority Scoring**: Deterministic priority ranking (Level 1 to Level 4, 0–100 index) calculated from severity, population at risk, affected area, and field evidence.
- **Multi-Source Corroboration Engine**: Synthesizes citizen SMS, news wires, SCADA sensors, government bulletins, and satellite telemetry into a unified Confidence Score (0–100%) and Confidence Band (VERIFIED / HIGH / MODERATE / LOW).
- **Point-Wise Situational Assessment Dossier**:
  - *Crisis & Severity Evaluation*: Executive overview detailing hazard category, affected sector, and impact scope.
  - *Priority & Corroboration Ledger*: Real-time confidence percentage backed by independent field sources.
  - *Primary Threat Vectors & Civilian Risk*: Contextual hazard extraction (e.g. submerged transit corridors, toxic plumes, structural collapse).
  - *Tactical Readiness & Squad Reserve Posture*: Live count of on-scene vs reserve squads.
- **Live Field Assessment Telemetry Ingestion**:
  - Automatically surfaces latest ground/aerial recon reports (Damaged structures count, Road accessibility status, Trapped civilians, Hazards detected, Evacuation routes, and Operator commentary).
- **Explainable 1-Click Tactical Dispatch Directives**:
  - Matches required tactical capabilities (Water Rescue, Heavy Land Extrication, Mobile Trauma/Medical, Drone Recon) with available inventory squads.
  - 1-click **`Deploy Squad →`** action with built-in server-side **Double-Allocation Conflict Prevention** (409 safe-guards).

### 3. Field Assessment & Recon Ingestion Module
- **Multi-Modality Reconnaissance**: Support for Drone/UAV, Aerial Helicopter, Ground Team, and Boat reconnaissance surveys.
- **Interactive Geolocation Ingestion**: Auto-populated or pinpointed map coordinates with dynamic Leaflet resize invalidation.
- **Damage & Accessibility Telemetry**:
  - Standard numeric typing inputs for damaged structures.
  - Road accessibility categorization (*Clear, Partially Blocked, Impassable, Flooded*).
  - Evacuation route monitoring (*Clear, Heavily Congested, Blocked*).
  - Observed civilian counts and specialized resource requirements.
- **Closed-Loop Backend Recalculation**: Submitting a field assessment automatically flips the incident's `is_field_verified=True` status, recalculates priority levels, and updates operational requirements.

### 4. Citizen Ingestion & Crowdsourced Triage
- **Citizen Distress Reporting**: Multi-language citizen intake form capturing geolocation, emergency category, trapped individuals, and media attachments.
- **AI-Powered Deduplication & Clustering**: Automatically links incoming citizen signals to matching geospatial incident perimeters.
- **SMS Gateway Integration**: Emergency broadcast dispatch and inbound SMS triage parser.

### 5. Tactical Resource Management & Inventory
- **Real-Time Resource Ledger**: Tracking status (`AVAILABLE`, `ASSIGNED`, `EN_ROUTE`, `ON_SCENE`, `MAINTENANCE`), base depots, personnel counts, and specialized equipment payload.
- **Proximity & Haversine Distance Engine**: Computes distance (km) and estimated time of arrival (ETA) for matching squad recommendations.
- **Active Operations Tracker**: Live mission monitoring (`ASSIGNED` ➔ `DISPATCHED` ➔ `EN_ROUTE` ➔ `ON_SCENE` ➔ `COMPLETED`) with field activity timeline logging.

### 6. Early Warning Alert System
- **Multi-Channel Alert Console**: Real-time broadcast ledger for meteorological bulletins, seismic warnings, dam discharge advisories, and evacuation orders.
- **Severity Classification**: Red/Amber/Blue priority visual coding with targeted sector broadcasting.

### 7. Automated Operational Reports & PDF Generation Engine
- **Situation Reports (SITREP) & After-Action Debriefs**: Auto-generated comprehensive reports aggregating canonical incident details.
- **ReportLab PDF Engine**: High-fidelity, multi-page vector PDF generation complete with:
  - Official command headers, timestamps, and security classification markings.
  - Multi-Channel Corroborating Intelligence Ledger tables.
  - Ingested Field Reconnaissance survey telemetry tables.
  - Resource Allocation & Dispatched Operations records.
  - SCADA / IMD Early Warning alerts ledger.
  - Command authority authorization sign-off blocks.
- **In-Browser PDF Preview & Direct Binary Export**: Interactive embedded modal with 1-click download.

### 8. Evacuation & Shelter Coordination
- **Shelter Registry**: Real-time capacity vs occupancy tracking, emergency supply reserves (food days, medical kits, clothing, water), and accessibility status.

---

## REST API Endpoints Summary

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Service health & database connectivity probe |
| **Incidents** | `GET` | `/api/incidents` | List all incidents with severity/status filters |
| **Incidents** | `GET` | `/api/incidents/{id}` | Get incident detailed record |
| **Incidents** | `GET` | `/api/incidents/{id}/intelligence` | Synthesize real-time AI intelligence, confidence, and directives |
| **Assessments** | `POST` | `/api/assessments` | Create draft field/aerial assessment |
| **Assessments** | `POST` | `/api/assessments/{id}/submit` | Finalize assessment & trigger closed-loop recalculation |
| **Resources** | `GET` | `/api/resources` | Query resource squads with category/status filters |
| **Allocations** | `GET` | `/api/allocations/recommendations` | Get capability-aware squad recommendations |
| **Allocations** | `POST` | `/api/allocations/{id}/approve` | Authorize squad deployment & create active operation |
| **Operations** | `GET` | `/api/operations` | List active operations and deployment missions |
| **Operations** | `PATCH` | `/api/operations/{id}/status` | Update mission state (DISPATCHED/EN_ROUTE/ON_SCENE/COMPLETED) |
| **Alerts** | `GET` | `/api/alerts` | List active emergency alerts & warnings |
| **Reports** | `GET` | `/api/reports` | Paginated operational situation reports |
| **Reports** | `POST` | `/api/reports` | Generate new SITREP or After-Action report |
| **Reports** | `GET` | `/api/reports/{id}/pdf` | Generate and download vector ReportLab PDF |
| **Citizen** | `POST` | `/api/citizen-reports` | Ingest crowdsourced citizen distress report |
| **Shelters** | `GET` | `/api/shelters` | Query emergency shelter capacity & supplies |

---

## Quality, Testing & Verification
- **Backend Test Suite**: Pytest suite passing (**31 passed**, covering allocation engines, confidence algorithms, assessment workflows, and PDF generation).
- **Frontend Build**: Zero TypeScript errors (`npx tsc --noEmit` clean, Turbopack verified).
- **Concurrency & Safety**: Server-side idempotency, double-allocation guards, transactional database sessions.
