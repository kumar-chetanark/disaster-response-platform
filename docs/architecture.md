# System Architecture: Disaster Response Platform

## 1. Architectural Philosophy
The Disaster Response Platform is designed as a **stability-first modular monolith** optimized for emergency operational reliability, deterministic fail-safe demonstrations, and human-in-the-loop authority decision support.

### Key Architectural Assumptions & Principles:
- **Platform Connectivity**: The core Disaster Response Platform backend and authority consoles remain connected to internet and telecom infrastructure.
- **Citizen Communication Resiliency**: "No network" refers to a citizen being unable to use normal mobile/web applications while inside a disaster area. When cellular/telecom connectivity exists, citizens can reach the platform via SMS or IVR voice channels in addition to web/mobile apps. (The platform does not claim SMS/IVR functions when zero cellular/telecom connectivity exists).
- **Proactive Intelligence**: The platform does not depend solely on citizen reports; when connected, it continuously ingests trusted external intelligence (IMD alerts, weather warnings, national/local news, government bulletins, satellite intelligence) to detect developing disasters autonomously.
- **Advisory AI with Human Authority**: AI functions strictly as an advisory and feature extraction tool. All aerial resource dispatches and emergency resource allocations require explicit human Authority approval.

---

## 2. High-Level Architecture Diagram
```
+---------------------------------------------------------------------------------------+
|                                    INGESTION LAYER                                    |
|  +-------------------------------------+     +-------------------------------------+  |
|  | Citizen Ingestion Gateways          |     | Proactive External Intelligence     |  |
|  | - Web / Mobile App (Broadband/Data) |     | - IMD Weather & Cyclone Alerts      |  |
|  | - SMS Gateway (Telecom SMS)         |     | - National & Local News Feeds       |  |
|  | - IVR Voice Gateway (Telecom Voice) |     | - Government / Disaster Bulletins   |  |
|  +------------------+------------------+     | - Satellite & Aerial Intelligence   |  |
|                     |                        +------------------+------------------+  |
+---------------------|-------------------------------------------|---------------------+
                      |                                           |
                      +---------------------+---------------------+
                                            | HTTPS / Ingestion API
                                            v
+---------------------------------------------------------------------------------------+
|                             FASTAPI BACKEND SERVICE LAYER                             |
|  +---------------------------------------------------------------------------------+  |
|  | Ingestion & Extraction Service (NLP / Text / Speech Entity & Location Parsing)  |  |
|  +---------------------------------------------------------------------------------+  |
|  | Incident Management Service (Proactive Detection, Ingestion, Deduplication)    |  |
|  +---------------------------------------------------------------------------------+  |
|  | Priority & Scoring Engine (Severity Estimation, Affected Population Scoring)     |  |
|  +---------------------------------------------------------------------------------+  |
|  | Aerial Capability & Mission Service (Authority Dispatch, Assessment Ingestion)  |  |
|  +---------------------------------------------------------------------------------+  |
|  | Resource Allocation Engine (9-Step Advisory Matching & Scarcity Solver)         |  |
|  +---------------------------------------------------------------------------------+  |
|  | Fallback Simulation Engine (Deterministic Heuristics for 100% Offline Uptime)   |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------+-------------------------------+---------------------------------+
                      |                               |
                      v                               v
          +-----------------------+       +-----------------------------------+
          |  Supabase PostgreSQL  |       |   Groq API (AI Inference Service)  |
          |  - Incidents & Zones  |       |   - NLP Entity & Intent Parsing   |
          |  - Resources & Assets |       |   - Advisory Allocation Scoring   |
          |  - Aerial Assessments |       |   - Fallback: Local Deterministic |
          |  - Audit Trail Logs   |       +-----------------------------------+
          +-----------+-----------+
                      ^
                      | Authenticated REST / WebSocket
                      v
+---------------------------------------------------------------------------------------+
|                           NEXT.JS 16 AUTHORITY COMMAND UI                             |
|  - Operational Command Dashboard (Decision-Critical Metrics & Incident Prioritization)|
|  - Incident Lifecycle & Field Update Feed                                             |
|  - Authority Aerial Dispatch & Structured Field Assessment Form                       |
|  - Advisory Resource Recommendation & Authority Approval Console                      |
|  - Contextual Operational Map (Secondary Spatial Visualization)                       |
+---------------------------------------------------------------------------------------+
```

---

## 3. Subsystem Workflows & Boundaries

### 3.1 Citizen Reporting Flow (Web / SMS / IVR)
Designed for scenarios where citizens inside disaster zones lose normal internet/app connectivity but maintain standard telecom/cellular access:
```
Citizen inside disaster zone
  │
  ├── [Normal App / Web available] ───────────────┐
  │                                               │
  ├── [No normal internet, Cellular SMS active] ──┼──> SMS/IVR Gateway
  │                                               │         │
  └── [No normal internet, Cellular Voice active] ─┘         │
                                                            v
                                                  Backend Ingestion
                                                            │
                                                            v
                                                  NLP / AI Extraction
                                                            │
                                                            v
                                                 Incident Creation/Update
                                                            │
                                                            v
                                                   Priority Calculation
                                                            │
                                                            v
                                                   Authority Dashboard
```

### 3.2 Proactive External Disaster Detection Flow
Enables early disaster warning even before citizen distress reports are received:
```
External Intelligence Sources
(IMD alerts, weather warnings, news, government feeds, satellite intel)
  │
  v
Platform Ingestion Pipeline (when platform is connected)
  │
  v
NLP / AI Analysis & Threat Detection
  │
  v
Incident Creation / Update
  │
  v
Severity Estimation & Affected-Region Identification
  │
  v
Authority Dashboard Alert & Monitoring
```

### 3.3 Aerial Assessment Subsystem (Field Resource Capability)
Aerial assets (UAVs, drones, aircraft) are **operational field resources**, NOT an autonomous AI system. Only the human Authority can authorize and dispatch an aerial mission.
```
Original Incident Identified
  │
  v
Authority reviews incident
  │
  v
Authority selects aerial resource & defines mission
(Area scanning, damage assessment, search support, rescue support, supply delivery)
  │
  v
Aerial resource dispatched to field
  │
  v
Aerial operator / team executes mission
  │
  v
Operator completes Structured Assessment Form:
- incident_id, mission_type, objective, location/area, timestamp, operator_team
- observations, affected people/structures, damage observations, accessibility
- resource_requirements, imagery/video attachments, confidence_score, notes
  │
  v
Assessment submitted to backend
  │
  v
Original Incident updated with verified field telemetry
  │
  v
Priority recalculated if necessary
  │
  v
Resource allocation recalculated if necessary
  │
  v
Authority Dashboard updated in real time
```

### 3.4 Resource Allocation Engine (9-Step Advisory Process)
The allocation engine executes a structured 9-step advisory cycle. AI provides recommendations; the Authority retains final approval:
1. **A. Select Highest-Priority Incident**: Identifies the highest-priority unresolved incident from the active queue.
2. **B. Determine Capabilities & Capacity**: Evaluates required response capabilities (e.g., medical, swift-water SAR, heavy clearance, air evacuation) and approximate capacity needed.
3. **C. Filter Capable Resources**: Filters the resource pool for assets that are available and capable of serving the incident requirements.
4. **D. Estimate Operational Constraints**: Evaluates travel time, proximity, terrain accessibility, and operational constraints.
5. **E. Balance Scarcity & Competition**: Evaluates resource scarcity and competing unresolved incidents across the operational theater.
6. **F. Generate Best Feasible Allocation**: Computes the optimal advisory allocation plan with explainable rationale.
7. **G. Reserve / Mark Resource State**: Marks proposed resources in a `RECOMMENDED` state.
8. **H. Display Recommendation to Authority**: Presents the recommendation on the Authority Dashboard for review, modification, or approval.
9. **I. Dynamic Recalculation Trigger**: Automatically triggers recalculation when:
   - New incidents appear
   - New information arrives
   - Resource status changes
   - Aerial assessment updates an incident
   - Severity changes
   - Priority changes
   - Competing incidents change

#### Resource Lifecycle States:
`AVAILABLE` → `RECOMMENDED` → `AUTHORITY APPROVED` → `ALLOCATED` → `IN USE` → `COMPLETED / AVAILABLE`

---

## 4. Component Boundaries & Status
| Subsystem | Responsibility | Implementation Status |
| :--- | :--- | :--- |
| **Frontend Foundation** | Next.js 16 App Router foundation, base configuration | **IMPLEMENTED** |
| **Authority Command UI** | Calm, scannable command dashboard, metric cards, incident table | **PLANNED** |
| **Contextual Map View** | Spatial visualization layer secondary to decision metrics | **PLANNED** |
| **Ingestion Gateways** | Multi-channel ingestion (SMS, IVR, Web, External IMD/News) | **PLANNED** |
| **Incident Management Service**| Incident lifecycle, proactive detection, status transitions | **PLANNED** |
| **Aerial Capability Service** | Authority mission dispatch, structured field assessment ingestion | **PLANNED (CORE)** |
| **Priority & Scoring Engine** | Algorithmic scoring based on severity, population, and accessibility | **PLANNED** |
| **Resource Allocation Engine** | 9-step advisory matching algorithm with Authority approval hooks | **PLANNED** |
| **Persistence Layer** | PostgreSQL database tables via Supabase | **PLANNED** |
| **Deterministic Fallback Engine**| Pre-computed realistic scenarios for 100% demo resilience | **PLANNED** |

---

## 5. Resilience & Fallback Architecture
To guarantee zero-downtime during live hackathon evaluation:
1. **AI Service Fallback**: If external LLM inference fails or exceeds latency thresholds (>4000ms), the backend immediately switches to local deterministic heuristic parsers.
2. **Offline Data Fallback**: In-memory mock repositories and bundled geo-coordinates allow full demonstration without external network access.
3. **Map Tile Fallback**: Offline SVG/Canvas contextual fallbacks provide spatial orientation if third-party map tile servers are unreachable.

---

## 6. Security & Isolation Architecture
- All API keys (Groq API tokens, Supabase Service Role Keys) are stored strictly in server-side environment variables (`.env`).
- No secret keys are bundled in client-side Next.js bundles.
- CORS policies restrict backend access to authorized frontend origins.
- Role-based authority validation ensures deployment actions cannot be executed autonomously without human authorization.
