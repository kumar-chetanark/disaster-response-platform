# System Architecture (Phase 1 — Backend Foundation)

## High-Level Architecture

```
[ Citizen Web Client ]          [ Authority Command Center ]
       │                                     │
       ▼                                     ▼
[ Next.js 16 App Router Frontend (Port 3000) ]
       │
       ▼  HTTP / REST (CORS enabled)
[ FastAPI Backend Service (Port 8000) ]
  ├── Core (Config, Database Engine)
  ├── Routers (/api/health)
  ├── Models (SQLAlchemy 2.0 ORM: 12 Core Entities)
  ├── Schemas (Pydantic V2)
  └── Services
       │
       ▼
[ PostgreSQL Database (Supabase / Local) ]
  └── Alembic Migrations (41ecd5015911)
```

## Core Principles
1. **Canonical Incident Record**: Incidents represent single deduplicated events. Multiple citizen reports, weather updates, and field assessments corroborate to the canonical incident via `incident_sources`.
2. **Authority vs. Citizen Separation**: Citizens submit reports calmly without visibility into internal AI ratings or authority operational controls.
3. **AI Recommends, Authority Decides**: Advisory records (`resource_allocations`) are created as recommendations; operational tracks (`operations`) are only generated upon explicit Authority approval.
4. **Generalized Multi-Mode Assessments**: Assessment models ingest Drone, Helicopter, Land, and Water field reconnaissance seamlessly.
