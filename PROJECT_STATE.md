# Project State — Disaster Response Platform (PS-06)

## 1. Actual System Status & Current State

> [!IMPORTANT]
> **System Architecture & Key Milestones**:
> - **Operational State**: Fully dynamic incident, resource, operation, assessment, alert, and report management backed by FastAPI and SQLite.
> - **Authority Session & Profile**: Commander authority identity unified under **Chetan Kumar (Level 5)** across login, session persistence, incident dossiers, and report authors.
> - **Real-Time Temporal Engine**: Dynamic 12-hour ticking local clock and live calendar widgets integrated throughout Top Header, Resources, and Incidents consoles (removing static Zulu/Sector 7 placeholders).
> - **Anti-Gibberish AI Intake Protocol**: Multi-layer semantic validation on citizen reporting for location landmark/city integrity, situation coherence, and valid contact checks.
> - **Hierarchical Geographic Geocoder**: Multi-tier geocoding fallback (Known DB -> OpenStreetMap Nominatim -> Photon) for exact coordinates across global and regional locations (e.g. Birgunj, Nepal; Rourkela, India).

---

## 2. Implemented & Verified Features

### A. Dynamic Dashboard & Tactical Command Radar
- **Active Incident Live Telemetry Banner**: Binds dynamically to active crisis parameters (`affected_population`, geocoded coordinates, severity, operational zone radius). Shows clean monitoring standby state when empty.
- **Full-Width Tactical Radar Map**: Expanded full-width GIS contextual preview centered on live geocoded coordinates.
- **Synchronized Cascade Deletion**: Deleting an incident instantly purges its linked alerts and Resource Allocation Advisories, resetting the dashboard state optimistically.

### B. Citizen Emergency Reporting & AI Intake Validation
- **Structured Address Form**: Specific landmark/street and city inputs with real-time semantic anti-spam and anti-gibberish verification.
- **GPS Auto-Geocoding**: Hierarchical city and landmark coordinate resolution on intake.
- **Incident Corroboration**: Automatically attaches corroborating evidence to matching active canonical incidents or creates a `PENDING` incident record.

### C. Resource Allocation & Deployment Engine
- **Single Consolidated Operation per Incident**: Dispatching response teams from the Resources console consolidates multiple squad dispatches under ONE unified mission track in the Operations tab.
- **Area Coverage Management**: Local Resource Picture with squads (Rescue, Police, Medical, Fire) and assets (Ambulances, Boats, Helicopters, Drones, Evacuation Buses).
- **Double-Allocation Guard**: Backend enforcement prevents assigning already deployed units (`HTTP 409 Conflict`).

### D. Incidents & Intelligence Console
- **Lifecycle Management**: Supports transitioning between `PENDING`, `ACTIVE`, `MONITORING`, and `RESOLVED` states.
- **Universal Deletion**: Allows deleting incidents in any status (including `RESOLVED`) with cascade cleanup across foreign keys.
- **Instant SITREP Generation**: One-click dossier generation compiling incident data into formal Situation Reports.

### E. Custom UI & Design System
- **Unified Glassmorphic Confirmation Modal**: Replaced all native browser dialogs with promise-based custom modals.
- **Custom Toast Notifications**: White card layout, circular icons, and progress bars anchored at top-right.
- **Branded Application Favicon**: Cyber-shield vector logo deployed across all web app manifest and favicon endpoints.

---

## 3. Verified Backend Endpoints
- `POST /api/citizen-reports`: AI-validated citizen emergency intake.
- `GET /api/incidents`, `DELETE /api/incidents/{id}`, `PATCH /api/incidents/{id}/status`: Incident lifecycle management.
- `POST /api/operations`, `GET /api/operations`, `PATCH /api/operations/{id}/status`: Consolidated operational mission tracking.
- `GET /api/allocations/recommendations`: Real-time capability-aware resource allocation advisory.
- `GET /api/resources`, `POST /api/resources`: Squad and vehicle asset inventory.
- `GET /api/reports`, `POST /api/reports`: Incident SITREP dossier generation and PDF exports.
