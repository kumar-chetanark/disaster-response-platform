# System Architecture: Disaster Response Platform

## 1. Architectural Philosophy
The Disaster Response Platform is designed as a **modular monolith** optimized for rapid hackathon iteration, high operational reliability, and deterministic fail-safe demonstrations.

## 2. High-Level Architecture Diagram
```
+-------------------------------------------------------------------+
|                     Next.js 16 Client (App Router)                |
|  - Operator Dashboard  - Operational Map  - Aerial Assessment UI  |
+---------------------------------+---------------------------------+
                                  |
                           HTTPS REST API
                                  |
+---------------------------------v---------------------------------+
|                   FastAPI Backend Service Layer                   |
|  - IncidentService       - AerialAssessmentService                |
|  - PriorityEngine        - ResourceAllocationService              |
|  - AuditLogger           - FallbackSimulationEngine               |
+---------------+-------------------+-------------------------------+
                |                   |
        Supabase PostgreSQL     Groq API (AI Inference)
        (Data & Spatial)        (Fallback to local heuristics)
```

## 3. Component Boundaries & Status
| Subsystem | Responsibility | Implementation Status |
| :--- | :--- | :--- |
| **Frontend UI Shell** | React server/client components, state management, map rendering | **IMPLEMENTED (Base)** / **PLANNED (UI)** |
| **Backend REST API** | Request routing, validation, service orchestration | **PLANNED** |
| **Aerial Assessment Service** | Image feature extraction, damage segmentation, severity metrics | **PLANNED (CORE)** |
| **Priority & Scoring Engine** | Combines damage severity + population density to rank zones | **PLANNED** |
| **Resource Dispatch Engine** | Matches equipment/teams to urgent zones | **PLANNED** |
| **Persistence Layer** | PostgreSQL database tables via Supabase | **PLANNED** |
| **Deterministic Fallback Engine** | Provides pre-computed realistic responses during external API outages | **PLANNED** |

## 4. Resilience & Fallback Architecture
To guarantee zero-downtime during live hackathon evaluation:
1. **AI Service Fallback**: If the Groq API fails or times out (>4000ms), the `FallbackSimulationEngine` immediately returns structured heuristic analysis.
2. **Aerial Imagery Fallback**: Bundled local satellite tiles are available if third-party map tiles or uploaded images fail to load.
3. **Database Fallback**: In-memory mock repositories mirror Supabase tables for standalone offline demonstrations.

## 5. Security & Isolation Architecture
- All API keys (Groq API tokens, Supabase Service Role Keys) are stored strictly in server-side environment variables (`.env`).
- No secret keys are bundled in client-side Next.js bundles.
- CORS policies restrict backend access to the authorized frontend domain.
