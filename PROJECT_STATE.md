# Disaster Response Platform -- Project State

## 1. Project Purpose
A disaster-response decision-support platform designed to enable emergency-response authorities, operators, and incident coordinators to rapidly detect developing disasters, understand active incidents, assess affected zones, prioritize response actions, coordinate personnel and resources, and continuously reassess as real-time field reports and aerial assessments arrive. Built with a stability-first principle for high-stakes operational environments, emphasizing human-in-the-loop authority control, deterministic fallback resilience, and clear operational clarity.

## 2. Core Capabilities & Product Architecture Principles
- **Proactive Disaster Detection**: Ingests trusted external intelligence (IMD alerts, weather warnings, national/local news, government alerts, satellite and aerial feeds) to detect developing disasters before citizen reports arrive (when platform internet connectivity is active).
- **Citizen Communication Channels**: Supports Web/Mobile App when available, plus SMS and IVR voice reporting for citizens experiencing normal app/internet outages within disaster zones (requiring cellular/telecom connectivity).
- **Authority-Controlled Aerial Assessment**: Aerial assets (drones, aircraft) are field resources dispatched exclusively by Authority for scanning, damage assessment, search/rescue support, or supply delivery. Field operators complete structured assessments that update incidents and trigger advisory priority/resource recalculations.
- **Advisory Resource Allocation Engine**: A structured 9-step allocation process providing explainable recommendations. AI is strictly advisory; final approval and deployment reside exclusively with the Authority.
- **Operational Command Dashboard**: Information-dense, calm, scannable command interface where decision-critical metrics (incidents, severity, population, active alerts, resource recommendations) take priority over secondary contextual maps.
- **Stability-First & Fail-Safe Resilience**: Deterministic heuristics and mock fallbacks guarantee 100% demonstration uptime regardless of external API or network disruptions.

## 3. Current Implementation Status
| Component / Module | Status | Notes |
| :--- | :--- | :--- |
| **Frontend Foundation** | **IMPLEMENTED** | Next.js 16.3.1 (App Router), TypeScript, baseline project structure |
| **Product UI Shell & Views** | **PLANNED** | Operational command dashboard, drawers, modals, assessment forms |
| **Citizen & External Ingestion** | **PLANNED** | External feeds (IMD/News/Gov) and Citizen SMS/IVR ingestion gateways |
| **Disaster Incident Management** | **PLANNED** | Ingestion, NLP extraction, incident lifecycle, status transitions |
| **Contextual Operational Map** | **PLANNED** | Mapbox / Leaflet contextual visualization with mock tile fallback |
| **Aerial Assessment Capability** | **PLANNED (CORE)** | Authority dispatch workflow, operator assessment form, damage telemetry |
| **Priority & Reassessment Engine** | **PLANNED** | Severity estimation, affected population scoring, dynamic recalculation |
| **Resource Allocation Engine** | **PLANNED** | 9-step advisory matching engine with Authority approval lifecycle |
| **Backend REST API** | **PLANNED** | Python FastAPI modular service architecture |
| **Database & Persistence** | **PLANNED** | Supabase PostgreSQL schema with audit trails |
| **AI Advisory Integration** | **PLANNED** | Groq API LLM decision-support with deterministic local fallback |

## 4. Technology Stack
| Layer | Technology | Status |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16.3.1 (App Router), React, TypeScript | IMPLEMENTED (Foundation only) |
| **Styling** | Vanilla CSS / CSS Modules / Tailwind | PLANNED |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 | PLANNED |
| **Database** | Supabase PostgreSQL, PostGIS (optional) | PLANNED |
| **AI Advisory Service** | Groq API (Llama 3 / Mixtral inference) + Deterministic Fallback | PLANNED |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend) | PLANNED |
| **UX & Design** | Calm Operational Command System (adapted from Stitch reference) | PLANNED |

## 5. Repository Structure
```
./
├── PROJECT_STATE.md       # Root project state and progress tracker
├── docs/                  # Architecture, UX, UI, API, DB, and demo documentation
│   ├── ux.md              # UX workflows, information hierarchy, and user journeys
│   ├── ui-design.md       # Visual design system, color tokens, and component specs
│   ├── screens.md         # Screen-by-screen component and layout specifications
│   ├── architecture.md    # System architecture, ingestion flows, and service boundaries
│   ├── database.md        # Database schema and entity relationships
│   ├── api.md             # REST API endpoints and data contracts
│   └── demo-flow.md       # Demonstration storyline and walkthrough script
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
[ Next.js Command Frontend ] <---> [ FastAPI REST Backend ] <---> [ Supabase PostgreSQL ]
                                           │
       ┌───────────────────────────────────┼──────────────────────────────────┐
       │                                   │                                  │
[ Ingestion Gateways ]           [ Groq AI Advisory ]           [ Deterministic Fallback ]
- Citizen App / SMS / IVR        - NLP Extraction               - Pre-computed Scenarios
- External Intelligence (IMD)    - Advisory Suggestions         - Local Heuristics
```
- **Platform Connectivity Assumption**: The Disaster Response Platform backend and authority console remain connected to the internet/telecom infrastructure.
- **Citizen Communication Boundary**: Ingests citizen reports via Web/App, SMS, or IVR gateways when normal internet is disrupted for citizens (requires telecom network availability).
- **Proactive Intelligence Boundary**: Ingests external feeds (IMD, weather warnings, news, government bulletins) to detect threats prior to citizen contact.
- **Aerial Assessment Boundary**: Field resource mission tracking and structured post-mission assessment ingestion; updates incident state and triggers priority recalculation.
- **Resource Lifecycle Boundary**: Advisory AI proposes allocations; state transitions from `AVAILABLE` → `RECOMMENDED` → `AUTHORITY APPROVED` → `ALLOCATED` → `IN USE` → `COMPLETED / AVAILABLE`.
- **Fail-Safe Principle**: All external AI and map services include local deterministic fallbacks for 100% demonstration uptime.

## 7. Security & Secrets Management
- Zero client-side API keys (all Groq and Supabase service role keys reside strictly in backend environment variables).
- Strict input validation and sanitization using Pydantic schemas.
- Role-based authority controls ensuring deployment decisions require verified authority sign-off.
- CORS restricted to known frontend origins.

## 8. Current Git State & Checkpoints
- **Last Commit**: `6bdcea1 chore: establish stable Next.js frontend`
- **Current Milestone**: Documentation & Architectural Blueprint Alignment (Milestone 2).
- **Next Task**: Implement Frontend UI Shell & Operator Command Dashboard.

## 9. Rules for Future AI Coding Agents
1. Read `PROJECT_STATE.md` and `docs/*` before making any codebase modifications.
2. Maintain strict distinction between existing foundation code (Next.js base) and planned feature implementations.
3. Do not claim features are implemented without verified source files.
4. AI is strictly advisory; authority approval is mandatory for any deployment/action.
5. Aerial Assessment is a field resource capability, not an autonomous dispatch system.
6. Always maintain demo mode and offline deterministic fallback resilience.
7. Preserve the stability-first principle across all components.
8. Create a Git checkpoint after every major feature milestone.
