# UX Document: Disaster Response Platform

## 1. Product UX Goal
Create an operational disaster-response decision-support platform that enables emergency-response authorities, operators, and incident coordinators to quickly detect developing disasters, understand active incidents, assess affected zones, prioritize response needs, and coordinate resources with continuous reassessment as new field intelligence and aerial assessments arrive. The platform emphasizes stability, calm clarity, high scannability, and human-in-the-loop authority control.

---

## 2. Primary User & Stakeholder Roles
- **Emergency Authority / Incident Commander**: Ultimate decision maker with legal authority to approve resource allocations and dispatch aerial missions.
- **Incident Operator / Coordinator**: Monitors inbound alerts, triages multi-channel citizen reports, and tracks ongoing field operations.
- **Aerial Operator / Field Recon Team**: Executes authorized aerial missions and submits structured field assessment reports.
- **Affected Citizen**: Submits distress/situation reports via Mobile/Web App, SMS, or IVR Voice channels when inside a disaster zone with cellular connectivity.

---

## 3. Core UX Principles
- **Stability-First Operation**: Resilient and deterministic under emergency conditions; zero broken views, clear fallback indicators.
- **Human Authority Supremacy**: AI provides advisory recommendations; final dispatch and allocation always require explicit human authority authorization.
- **Calm, High-Scannability Interface**: Modern, professional, information-dense layout without feeling crowded. Avoids excessive cards, neon glows, heavy glassmorphism, or gaming aesthetics.
- **Decision-Critical Primacy**: Operational metrics, unresolved emergencies, and advisory recommendations take precedence over secondary spatial map views. The map is a contextual tool, not the dominating element.
- **Explainable Advisory Intelligence**: All automated priority rankings and resource suggestions provide transparent, plain-language reasoning.

---

## 4. Information Hierarchy (Strict Operational Priority)
The UI surfaces data according to this strict priority ranking:
1. **Active / High-Priority Incidents** (Immediate critical threats)
2. **Severity Classification** (SEV-1 Critical to SEV-4 Low)
3. **Affected Population** (Estimated civilian casualties / trapped individuals)
4. **Affected Area & Geographic Scope** (Sector boundaries and blocked access routes)
5. **Unresolved Incidents** (Outstanding incidents needing immediate action)
6. **Active Alerts** (Proactive IMD/Weather alerts and incoming emergency distress)
7. **Resource Availability** (Available vs deployed personnel, vehicles, and medical assets)
8. **Resource Allocation Recommendations** (Advisory AI proposals with explainable rationale)
9. **Response Team Status** (Active field status of SAR, medical, logistics, and aerial teams)
10. **Recent Information Updates** (Chronological multi-channel telemetry stream)
11. **Aerial & Field Telemetry Updates** (Structured post-mission damage assessments and drone imagery)

---

## 5. Ingestion & Communication UX

### 5.1 Proactive External Intelligence Ingestion
- Ingests trusted external intelligence (IMD weather warnings, cyclone alerts, news feeds, government bulletins, satellite intelligence) when platform connectivity is active.
- Automatically generates proactive incident alerts on the dashboard before citizen distress calls arrive.
- Clearly flags intelligence source and confidence score in the incident summary.

### 5.2 Citizen Multi-Channel Reporting (Web / SMS / IVR)
- **Context**: Designed for citizens inside disaster zones where standard internet/mobile app connectivity is unavailable, but telecom/cellular networks remain functional. (Does not claim to function when zero cellular/telecom connectivity exists).
- **Channels Supported**:
  - Web / Mobile App (Broadband/Data)
  - SMS Text Reporting (Parsed via NLP for location and urgency)
  - IVR Voice Reporting (Transcribed speech-to-text with entity extraction)
- **Operator Review UX**: Multi-channel reports are unified into the incident feed with source badges (e.g., `[SMS]`, `[IVR]`, `[WEB]`) and raw message transcripts available on demand.

---

## 6. Aerial Assessment UX (Field Resource Capability)

Aerial assets (UAVs, aircraft) are **operational field resources** dispatched exclusively by Authority. They are not autonomous dispatch agents.

### Complete Aerial Workflow:
```
1. Incident Review
   └── Authority reviews active incident details on dashboard.

2. Aerial Resource Selection & Mission Definition
   └── Authority selects available aerial asset (e.g., Drone Alpha, Chopper Recon 1).
   └── Authority specifies mission type: Area Scanning, Damage Assessment,
       Search Support, Rescue Support, or Supply Delivery.
   └── Authority defines objectives, flight sector, and assigned operator.

3. Authority Dispatch Approval
   └── Explicit "Authorize & Dispatch" confirmation.

4. Mission Execution
   └── Aerial operator/team executes flight mission in the field.

5. Structured Assessment Form Completion
   └── Field operator completes standardized assessment form:
       • Incident ID & Mission Reference
       • Mission Type & Objective
       • Location / Area Sector
       • Time of Assessment
       • Operator / Team Name
       • Field Observations
       • Affected People & Structural Counts
       • Damage Observations (% destroyed, flood levels)
       • Accessibility Status (Accessible, Road Blocked, Air Access Only)
       • Ground/Medical Resource Requirements
       • Imagery / Video Attachments
       • Assessment Confidence Score (%)
       • Operational Notes

6. Submission & Incident Update
   └── Operator submits assessment.
   └── Original incident record is updated with verified field findings.

7. Advisory Recalculations
   └── Priority engine recalculates incident severity.
   └── Resource allocation engine updates advisory recommendations.

8. Authority Dashboard Refresh
   └── Dashboard highlights updated damage metrics and new advisory recommendations.
```

---

## 7. Resource Allocation Engine UX (9-Step Advisory Workflow)

The resource allocation engine operates strictly as an advisory system:
```
[ Step A: Select Highest-Priority Unresolved Incident ]
                  │
[ Step B: Determine Required Capabilities & Capacity ]
                  │
[ Step C: Filter Capable & Available Resources ]
                  │
[ Step D: Estimate Travel / Proximity & Operational Constraints ]
                  │
[ Step E: Balance Resource Scarcity & Competing Incidents ]
                  │
[ Step F: Generate Best Feasible Allocation Plan ]
                  │
[ Step G: Reserve / Mark Resources as RECOMMENDED ]
                  │
[ Step H: Display Advisory Recommendation to Authority ]
                  │
[ Step I: Dynamic Recalculation Trigger ]
  (Fires on: new incidents, new information, resource status changes,
   aerial assessments, severity/priority changes, competing incidents)
```

### Resource Lifecycle States:
`AVAILABLE` → `RECOMMENDED` → `AUTHORITY APPROVED` → `ALLOCATED` → `IN USE` → `COMPLETED / AVAILABLE`

### Authority Approval Interaction:
- **Recommendation Card**: Clearly displays recommended units, ETA, matched capabilities, and rationale.
- **Actions**:
  - `Approve & Dispatch`: Single-click authorization transitions resource to `AUTHORITY APPROVED` → `ALLOCATED`.
  - `Modify Allocation`: Operator can adjust unit selection.
  - `Reject Recommendation`: Dismisses suggestion with optional feedback note.

---

## 8. Dashboard Visual & Layout Design Principles
- **Avoid Clutter**: High information density without feeling crowded.
- **Secondary Map Integration**: The map provides spatial context below or beside key incident cards, avoiding map-heavy clustering.
- **Color Discipline**: Color is strictly functional (Red for SEV-1 Critical, Orange for SEV-2 High, Yellow for SEV-3 Medium, Green for Available/Resolved).
- **Typography**: Clean sans-serif for UI text paired with tabular monospace numbers for coordinates, timestamps, and confidence percentages.

## 9. Error, Resilience & Demo Mode UX
- **AI Advisory Fallback**: If external LLM inference is delayed or unavailable, the UI seamlessly presents local deterministic recommendations with a subtle `[Deterministic Heuristic]` tag.
- **Demo Mode Toggle**: Header toggle activates pre-loaded multi-hazard scenarios (Cyclone, Urban Flash Flood, Industrial Fire) for reliable live demonstrations.
- **Empty States**: Helpful, non-intrusive guidance with "Load Demo Scenario" action.
