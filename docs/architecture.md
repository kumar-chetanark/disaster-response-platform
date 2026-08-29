# System Architecture — Disaster Response Platform (PS-07)

## High-Level Architecture Overview

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

## Backend Service Components
1. **FastAPI Application Layer (`backend/app/main.py`)**:
   - Asynchronous request handling and auto-generated OpenAPI / Swagger documentation (`/docs`).
   - `lifespan` manager orchestrating background disaster ingestion tasks and startup table schema compatibility.
2. **Database Engine & Connection Pool (`backend/app/core/database.py`)**:
   - Configured for Supabase PostgreSQL Session Pooler on Port `5432`.
   - Robust pooling: `pool_size=10`, `max_overflow=20`, `pool_recycle=1800`, `pool_pre_ping=True`.
   - SQLite fallback for offline development.
3. **Intelligence Ingestion & Deduplication Pipeline (`backend/app/services/external_ingestion_service.py`)**:
   - Periodic 5-minute ingestion pulling from official UN/EC GDACS GeoJSON and RSS endpoints.
   - Idempotent deduplication by composite key `(source, external_id)`.
4. **Allocation & Geospatial Engine (`backend/app/services/matching_service.py`)**:
   - Real-time Haversine distance computations within 25km operational radius.
   - Capability-based scoring matrix matching disaster requirements to available squads and equipment.

## Frontend Architecture (`frontend/app/`)
1. **Next.js 16 App Router**:
   - Client-side operational dashboard with responsive full-width layout.
   - Persistent tab state across browser refreshes via URL hash and `localStorage`.
2. **Modular Consoles**:
   - `AlertsConsole.tsx`: Worldwide GDACS disaster intelligence and citizen triage.
   - `IncidentsConsole.tsx`: 16-dimension situational awareness, point-wise assessment, and lifecycle management.
   - `ResourcesConsole.tsx`: 25km interactive radar map and squad dispatch center.
   - `OperationsConsole.tsx`: Consolidated single-operation tracking per incident.
   - `ReportsConsole.tsx`: SITREP debrief generation and binary PDF exports.
