# Project State — Disaster Response Platform (PS-07)

## 1. Project Identity & Purpose
- **Project Name**: Disaster Response Platform (PS-07)
- **Problem Statement**: During large-scale natural disasters (earthquakes, flash floods, tropical cyclones, wildfires), emergency response authorities are overwhelmed by fragmented intelligence feeds, unverified reports, and difficult logistics for resource dispatch.
- **Mission & Purpose**: Provide a unified, real-time command platform that:
  1. Ingests, normalizes, and deduplicates worldwide disaster intelligence from official government early-warning feeds (GDACS) alongside citizen crisis reports.
  2. Enables authority review and canonical incident management without uncontrolled automated dispatches.
  3. Provides geospatial intelligence (25km proximity radius, resource matching, shelter capacities).
  4. Manages consolidated multi-squad operations, field/aerial damage assessments, continuous priority recalculations, and automated SITREP PDF reporting.

---

## 2. Production Architecture

```
[ Citizen Web Client ]          [ Authority Command Center (Vercel) ]
       │                                       │
       ▼                                       ▼
[ Next.js 16 App Router (https://disaster-response-platform-eta.vercel.app) ]
       │
       ▼  HTTPS REST API (CORS Allowlisted, Bearer Token Auth / Demo Mode)
[ FastAPI Backend Service (https://disaster-response-api-wrn2.onrender.com) ]
  ├── Lifespan (Async Background GDACS Ingestion Worker, Auto-Schema Upgrade)
  ├── Core (Config with Dynamic Normalization, Database Connection Pooling)
  ├── Routers (/api/incidents, /api/alerts, /api/external-alerts, /api/resources, 
  │            /api/operations, /api/assessments, /api/reports, /api/allocations, 
  │            /api/citizen-reports, /api/auth, /api/health)
  ├── Models (SQLAlchemy 2.0 ORM: 13 Relational Entities with ANSI TEXT columns)
  └── Services (Ingestion, Allocation Engine, Spatial Haversine, SITREP PDF Generator)
       │
       ▼  Session Pooler (Port 5432, pool_recycle=1800, pool_pre_ping=True)
[ Supabase PostgreSQL Database (aws-0-ap-southeast-1.pooler.supabase.com) ]
  (Fallback: SQLite `disaster_response_dev.db` for isolated offline development)
```

---

## 3. Database Architecture (Supabase PostgreSQL / SQLite)

### A. Core Relational Models (13 Tables)
1. **`external_alerts`**: Worldwide disaster intelligence records ingested from GDACS. Deduplicated on `(source, external_id)`. Columns: `id`, `source`, `external_id`, `event_type`, `title` (TEXT), `description` (TEXT), `country` (TEXT), `countries` (TEXT), `location_name` (TEXT), `latitude`, `longitude`, `severity`, `alert_level`, `alert_score`, `population_affected_est`, `published_at`, `status` (`NEW`, `REVIEWED`, `VALIDATED`, `REJECTED`, `CONVERTED_TO_INCIDENT`), `converted_incident_id` (FK -> `incidents.id`), `raw_data` (JSON), `created_at`, `last_seen_at`.
2. **`incidents`**: Canonical disaster incidents. Columns: `id`, `title`, `description`, `disaster_type`, `severity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `priority_level` (`Level 1`, `Level 2`, `Level 3`), `status` (`PENDING`, `ACTIVE`, `MONITORING`, `RESOLVED`), `latitude`, `longitude`, `location_name`, `sector`, `affected_population`, `affected_area_sq_km`, `resource_coverage_pct`, `is_field_verified`, `created_at`, `updated_at`.
3. **`incident_sources`**: Multi-channel corroboration audit trails linked to incidents (FK -> `incidents.id`). Columns: `source_type` (`CITIZEN`, `GOVERNMENT`, `SENSOR`), `channel_badge`, `confidence_score`, `summary`, `raw_content`, `is_contradiction`, `contradiction_reason`.
4. **`alerts`**: High-priority authority notifications and broadcast alerts. Columns: `id`, `incident_id` (FK), `category`, `source`, `location`, `message`, `severity`, `is_reviewed_by_authority`, `alert_time`, `created_at`.
5. **`resources`**: Rescue squads, ambulances, UAV drones, and shelter facilities. Columns: `id`, `name`, `type`, `category`, `status` (`AVAILABLE`, `ASSIGNED`, `DISPATCHED`, `EN_ROUTE`), `base_location`, `latitude`, `longitude`, `capabilities`, `capacity`, `personnel_count`, `equipment_details`, `shelter_capacity`, `shelter_occupied`.
6. **`resource_allocations`**: Capability-matched allocation advisories. Columns: `id`, `incident_id` (FK), `resource_id` (FK), `status` (`RECOMMENDED`, `APPROVED`, `MODIFIED`, `REJECTED`), `match_score`, `travel_time_est`, `reason`, `decided_by`, `decided_at`.
7. **`operations`**: Consolidated active tactical operations. Columns: `id`, `incident_id` (FK), `resource_id` (FK), `operation_type`, `state` (`DISPATCHED`, `IN TRANSIT`, `ON SCENE`, `ACTIVE`, `RETURNING`, `STANDBY`, `COMPLETED`), `destination_location`, `authorized_by`, `mission_objective`, `dispatched_time`, `estimated_completion`, `field_updates_log`.
8. **`assessments`**: Field & aerial damage reconnaissance reports. Columns: `id`, `incident_id` (FK), `assessor_id`, `assessor_role`, `hazard_type`, `severity_score` (1-10), `structural_damage_pct`, `road_blocked`, `survivors_observed`, `notes`, `created_at`.
9. **`reports`**: Operational SITREP debrief documents. Columns: `id`, `incident_id` (FK), `report_type`, `title`, `author`, `summary`, `metrics_summary`, `tags`, `status`, `created_at`.
10. **`citizen_reports`**: Direct citizen distress submissions. Columns: `id`, `citizen_name`, `phone_number`, `disaster_type`, `severity`, `address`, `latitude`, `longitude`, `description`, `people_count`, `medical_attention_required`, `status`.
11. **`shelters`**: Medical centers, relief camps, and hospitals. Columns: `id`, `name`, `location`, `total_capacity`, `current_occupancy`, `latitude`, `longitude`, `facility_type`, `available_beds`, `icu_beds`, `water_litres`, `food_person_days`, `medicine_days_stock`.
12. **`inventory`**: Emergency supply stockpile. Columns: `id`, `item_name`, `category`, `quantity`, `unit`, `storage_location`.
13. **`users`**: System identities and authority roles (`CITIZEN`, `AUTHORITY`).

---

## 4. Implemented Feature Inventory & Verification

### A. Worldwide Disaster Intelligence System (GDACS Ingestion)
- **Status**: **IMPLEMENTED & VERIFIED (Production)**
- **Source**: Official GDACS GeoJSON API (`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?format=json`) with automatic fallback to 24h XML RSS feed.
- **Worker**: 5-minute recurring background task in FastAPI `lifespan`.
- **Deduplication**: Composite unique constraint on `(source, external_id)`. Re-ingesting updates metadata without duplicating rows.
- **Authority Review & Triage**: Clickable alert dossiers (`AlertsConsole.tsx`), `[MARK REVIEWED]`, `[REJECT]`, `[VIEW ON MAP]`, and `[CREATE INCIDENT]` with double-conversion protection (`HTTP 409 Conflict`).
- **Zero Auto-Dispatch Rule**: GDACS alerts NEVER create automatic military/medical dispatches without human authority approval.

### B. Command Center Dashboard & Tactical Radar Map (`ContextualMapPreview.tsx`)
- **Status**: **IMPLEMENTED & VERIFIED**
- **Tactical Visual Radii**: Hazard zones rendered strictly by severity:
  - Red (`#ef4444`): Critical severity / Red alerts (`75km` visual buffer)
  - Orange (`#ea580c`): High severity / Orange alerts (`45km` visual buffer)
  - Green (`#10b981`): Medium severity / Green alerts (`25km` visual buffer)
  - Tactical Blue (`#0284c7`): Global GDACS `G` markers
- **Auto-Scroll & Map Centering**: Clicking `[MAP]` on any alert smoothly navigates and flies the map viewport to the target coordinates.
- **Layer Controls**: Matching visual toggle pills (`ALL`, `INCIDENTS`, `GLOBALS`).

### C. Incident Management & Point-Wise Intelligence (`IncidentsConsole.tsx`)
- **Status**: **IMPLEMENTED & VERIFIED**
- **16-Dimension Intelligence**: Real-time evaluation of hazard vectors, corroboration confidence, damaged structures, and road access.
- **Universal Deletion**: Cascade foreign key cleanup for incidents in any status (`RESOLVED`, `ACTIVE`, `MONITORING`, `PENDING`).
- **Dynamic Coverage Calculation**: Population in coverage calculated dynamically from nearby operational radii and shelter beds.

### D. 25km Location-Based Resource Matching (`ResourcesConsole.tsx`)
- **Status**: **IMPLEMENTED & VERIFIED**
- **Proximity Search**: Interactive location search that pans the map and calculates real-time distances for all squads/vehicles within a 25km radius.
- **Capability Matching**: Rule-based matching engine scores squads (e.g. Water Rescue for Floods, Heavy Extrication for Earthquakes).
- **Single Consolidated Operation**: Multiple vehicle dispatches for the same incident automatically group under a single operational track in the Operations console.

### E. Field & Aerial Assessment (`AerialAssessmentForm.tsx`)
- **Status**: **IMPLEMENTED & VERIFIED**
- **Interactive Recon Form**: Submit structural damage percentages, road blockage booleans, and casualty estimates.
- **Dynamic Re-Assessment**: Submitting an assessment automatically updates incident severity score and recalculates resource allocation recommendations.

### F. Situation Reports & PDF Export (`ReportsConsole.tsx`)
- **Status**: **IMPLEMENTED & VERIFIED**
- **SITREP Generator**: One-click summary generation synthesizing operational metrics, dispatch counts, and casualty figures.
- **Binary PDF Export**: Native ReportLab generator producing downloadable official debrief PDFs (`GET /api/reports/{id}/pdf`).

### G. Hackathon Demo Command Center Access (`AuthorityLoginModal.tsx`)
- **Status**: **IMPLEMENTED & VERIFIED**
- **Dedicated Demo Access**: `[ENTER DEMO COMMAND CENTER]` button controlled by backend `DEMO_MODE=True` environment variable.
- **Security**: Zero hardcoded credentials in frontend code; authenticated via backend `/api/auth/demo` issuing valid JWT bearer tokens.

---

## 5. Distinction: Real vs Rule-Based Intelligence
- **Real External Intelligence**: Live HTTP polling, GeoJSON parsing, coordinate extraction, and deduplication of real-time disaster alerts from the UN/EC GDACS network.
- **Deterministic Rule-Based Intelligence**:
  - Distance calculation: Exact mathematical Haversine formula.
  - Resource matching: Capability scoring matrix matching disaster types to equipment tags.
  - Severity priority: Multi-variable weighted scoring formula based on population density, structural damage %, and road blockage.
  - Gibberish filter: Shannon entropy & character n-gram validation on citizen SMS text.
- **Simulated / Mocked Components**:
  - Live Drone Video Stream: Contextual simulated telemetry stream placeholder.
  - SMS Cellular Gateway: HTTP REST webhook endpoint (`/api/sms/inbound`) simulating telco carrier ingest.

---

## 6. Verified Test & Build Status
- **Backend Test Suite**: `python -m pytest backend/tests` -> **42 passed (100% PASS)**
- **Frontend TypeScript Validation**: `npx tsc --noEmit` -> **0 Errors**
- **Frontend Production Build**: `npm run build --prefix frontend` -> **100% Clean static export**
