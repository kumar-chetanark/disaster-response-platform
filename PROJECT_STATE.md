# Project State — Disaster Response Platform (PS-05)

## 1. Actual System Status & Current Limitations

> [!IMPORTANT]
> **Accurate Reality Check**:
> - **Map Status**: Uses a static/contextual leaflet preview (`ContextualMapPreview.tsx`). Full multi-layer real-time GIS clustering with live vehicle telemetry is **not yet connected/fully operational**.
> - **Resources Status**: Currently loads seed/preset inventory data from the database. Live GPS vehicle telemetry and automated real-time tracking are **preset/static**, not streaming live sensor feeds.
> - **Field Assessment & Intelligence**: Live FastAPI database integration for submitting assessments, recalculating priority scores, and assigning squads is **functional**.

---

## 2. Implemented & Verified Features

### A. Incidents & Intelligence Console (`IncidentsConsole.tsx`)
- **Point-Wise Situational Assessment**: Formatted crisis briefing breaking down severity, corroboration confidence score, hazard vectors, and reserve squads.
- **Field Assessment Findings Ingestion**: Displays latest submitted recon survey metrics (Damaged structures, Road accessibility, Trapped civilians, Evacuation routes, Operator notes).
- **Tactical Squad Deployment Directives**: Matches required capabilities with available inventory and creates deployment records with server-side double-allocation protection (`409 Conflict`).

### B. Field Assessment Module (`AerialAssessmentForm.tsx`)
- Multi-modality selection (Drone UAV, Helicopter, Ground Recon, Boat).
- Standard numeric typing inputs for damaged structure counts.
- Dynamic road accessibility and evacuation status logging.
- Submits directly to `POST /api/assessments` and triggers `POST /api/assessments/{id}/submit` to recalculate priority.

### C. Operational Reports & PDF Generation (`ReportsConsole.tsx` & Backend Engine)
- View and generate situation reports (SITREPs).
- Server-side binary PDF generation via ReportLab with tables and command authorization blocks.
- In-browser preview modal and direct PDF download.

### D. Tactical Resources & Operations (`ResourcesConsole.tsx` & `OperationsConsole.tsx`)
- Preset inventory listing with status filters (`AVAILABLE`, `ASSIGNED`, `MAINTENANCE`).
- Manual status updates and squad deployment tracking.
- Active mission lifecycle state tracker (`ASSIGNED` ➔ `DISPATCHED` ➔ `EN_ROUTE` ➔ `ON_SCENE` ➔ `COMPLETED`).

### E. Early Warning Alerts (`AlertsConsole.tsx`)
- Alert feed with severity indicators.
- Automatic sidebar badge dismissal when clicking tabs.

---

## 3. Technology Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS, TypeScript, Material Symbols, React-Leaflet.
- **Backend**: FastAPI, SQLAlchemy 2.0 ORM, SQLite DB (`disaster_response_dev.db`), Pydantic v2.
- **PDF Engine**: ReportLab.

---

## 4. Current Gaps & Next Planned Work
1. **Operational Map Overhaul**: Fix Leaflet container rendering, marker positioning, and live incident/resource pin layers.
2. **Dynamic / Real-Time Resource Feed**: Move beyond preset inventory to live status updates and interactive asset creation/editing.
3. **Citizen Distress Portal**: Connect frontend distress intake form directly to the backend deduplication queue.
