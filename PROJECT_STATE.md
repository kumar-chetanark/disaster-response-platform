# Disaster Response Platform -- Project State

## 1. Project Purpose
A disaster-response decision-support platform designed to enable emergency-response operators and incident coordinators to rapidly understand active incidents, assess affected zones, prioritize response actions, coordinate personnel and supplies, and continuously reassess as real-time field reports arrive. Built for a high-stakes hackathon environment emphasizing operational stability, deterministic fallback resilience, and clear demonstration value.

## 2. Hackathon Objective
Deliver a demonstrable MVP with core end-to-end capabilities:
- Disaster incident tracking and management
- Interactive operational map with damage and priority zones
- Aerial imagery damage assessment and severity scoring
- Priority zone generation and automated resource allocation
- Real-time reassessment loop with audit trails
Target completion within 72 hours.

## 3. Current Implementation Status
| Component / Module | Status | Notes |
| :--- | :--- | :--- |
| **Frontend Foundation** | **IMPLEMENTED** | Next.js 16.3.1 (App Router), TypeScript, base styles |
| **Product UI Shell & Views** | **PLANNED** | Command dashboard, operational map, drawers |
| **Disaster Incident Management** | **PLANNED** | Creation, filtering, status transitions |
| **Operational Map & Layers** | **PLANNED** | Mapbox / Leaflet layer integration with mock fallback |
| **Aerial Assessment System** | **PLANNED (CORE)** | Image analysis, severity grading, damage masks |
| **Priority Zone Engine** | **PLANNED** | Algorithmic scoring based on density & damage |
| **Resource Allocation Engine** | **PLANNED** | AI/heuristic dispatch recommendations |
| **Backend REST API** | **PLANNED** | Python FastAPI modular monolith |
| **Database & Persistence** | **PLANNED** | Supabase PostgreSQL schemas & migrations |
| **AI Integration** | **PLANNED** | Groq API LLM decision-support with mock fallback |

## 4. Technology Stack
| Layer | Technology | Status |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16.3.1 (App Router), React, TypeScript | IMPLEMENTED (Foundation only) |
| **Styling** | Vanilla CSS / CSS Modules / Tailwind | PLANNED |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 | PLANNED |
| **Database** | Supabase PostgreSQL, PostGIS (optional) | PLANNED |
| **AI Service** | Groq API (Llama 3 / Mixtral inference) | PLANNED |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend) | PLANNED |
| **UX & Design** | Stitch Design System | PLANNED |

## 5. Repository Structure
```
./
├── PROJECT_STATE.md       # Root project state and progress tracker
├── docs/                  # Architecture, UX, API, DB, and demo documentation
│   ├── ux.md
│   ├── ui-design.md
│   ├── screens.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── demo-flow.md
├── frontend/              # Next.js App Router frontend [IMPLEMENTED: Foundation]
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
├── backend/               # FastAPI backend [PLANNED / NOT IMPLEMENTED]
└── database/              # Supabase migrations & seed scripts [PLANNED / NOT IMPLEMENTED]
```

## 6. Architecture & System Boundaries
```
[ Next.js Frontend ] <---> [ FastAPI REST Backend ] <---> [ Supabase PostgreSQL ]
                                     │
                                     ├──> [ Groq API (AI Inference) ]
                                     └──> [ Deterministic Fallback Engine ]
```
- **Frontend / Backend Boundary**: Client communicates exclusively via typed REST API endpoints.
- **Aerial Assessment Boundary**: Isolated image ingestion and scoring service with deterministic synthetic fallback.
- **Fail-Safe Principle**: All external AI and map services include local simulated fallbacks for 100% demo uptime.

## 7. Security & Secrets Management
- Zero client-side API keys (all Groq and Supabase service role keys reside strictly in backend environment variables).
- Input validation and sanitization using Pydantic schemas.
- CORS restricted to known frontend origins.

## 8. Current Git State & Checkpoints
- **Last Commit**: `6bdcea1 chore: establish stable Next.js frontend`
- **Current Milestone**: Documentation & Architectural Blueprint (Milestone 2).
- **Next Task**: Implement Frontend UI Shell & Operator Command Dashboard.

## 9. Rules for Future AI Coding Agents
1. Read `PROJECT_STATE.md` before making any codebase modifications.
2. Distinguish clearly between existing foundation code and planned feature implementations.
3. Do not claim features are implemented without verified source files.
4. Always maintain demo mode and offline fallback resilience.
5. Create a Git checkpoint after every major feature milestone.
