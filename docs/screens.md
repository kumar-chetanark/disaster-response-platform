# Screen Specifications: Disaster Response Platform

## 1. Overview of Screens
The platform features an operational authority console structured around high-priority decision making, clear information hierarchy, and calm situational awareness:
1. **Authority Command Dashboard (Primary Operational View)** [PLANNED]
2. **Incident Details & Intelligence Ingestion Feed** [PLANNED]
3. **Aerial Resource Dispatch & Field Assessment Console** [PLANNED (CORE)]
4. **Advisory Resource Allocation & Approval Center** [PLANNED]
5. **Contextual Map & Spatial Inspector (Secondary Context View)** [PLANNED]

---

## 2. Screen 1: Authority Command Dashboard (Primary Operational View)
- **Status**: **PLANNED**
- **Purpose**: Central situational command dashboard prioritized for instant scanning of high-stakes emergency data. The design is calm, operational, and information-dense without feeling crowded. The map is kept contextual and secondary, avoiding map-heavy clustering.
- **Information Hierarchy (Strict Order of Priority)**:
  1. **Active / High-Priority Incidents**: Dominant top table/cards with status badges.
  2. **Severity Classification**: Clear SEV-1 to SEV-4 tagging with explicit text and icons.
  3. **Affected Population**: Aggregate and per-incident estimated civilian impact count.
  4. **Affected Area / Geographic Scope**: Sector boundaries, access blockage indicators.
  5. **Unresolved Incidents**: Dedicated count and filtered quick-action view.
  6. **Active Inbound Alerts**: Highlighting proactive external warnings (IMD/News) and urgent citizen distress.
  7. **Resource Availability Summary**: Live breakdown of available vs deployed personnel and equipment.
  8. **Resource Allocation Recommendations**: Advisory AI proposals with explainable rationale awaiting Authority sign-off.
  9. **Response Team Status**: Active status of SAR, medical, logistics, and aerial teams in the field.
  10. **Recent Information Updates**: Real-time chronological ticker of multi-channel reports.
  11. **Aerial / Field Telemetry Updates**: Incoming post-mission telemetry and damage metrics.
- **Layout & Key Components**:
  - **Top Navigation Bar**: Platform connection pulse, active incident switcher, demo mode toggle, authority credentials.
  - **Decision KPI Bar**: Unresolved critical incidents, estimated population at risk, active resources deployed, pending advisory recommendations.
  - **Main Operational Grid**:
    - *Left / Primary 8-col*: Prioritized Incident Queue (sortable by severity, population, time) + Advisory Allocation Recommendations.
    - *Right 4-col*: Active Intelligence Alert Feed (IMD bulletins + SMS/IVR transcript summaries) + Resource Readiness Ledger.
    - *Bottom Collapsible / Secondary*: Compact Contextual Map preview (can be expanded on demand).
- **Design Tone & Aesthetics**:
  - Professional, modern, calm, readable slate-zinc background.
  - No excessive neon, heavy glassmorphism, gaming glow, or distracting animations.
  - Clear typography with monospace coordinates and timestamps.

---

## 3. Screen 2: Incident Details & Intelligence Ingestion Feed
- **Status**: **PLANNED**
- **Purpose**: Deep-dive review of a single disaster incident showing multi-source intelligence ingestion and chronological progression.
- **Layout & Key Components**:
  - **Incident Header**: Title, type (flood, earthquake, etc.), verified severity, origin (Proactive External vs Citizen SMS/IVR vs Web).
  - **Multi-Channel Ingestion Feed**:
    - Proactive alerts (IMD weather warnings, government bulletins, news feeds).
    - Citizen reports (Web app submissions, parsed SMS text, transcribed IVR voice calls with confidence score).
  - **Incident Timeline & Reassessment History**: Audit log of severity adjustments and incoming field updates.
  - **Action Header**: "Dispatch Aerial Mission", "Review Advisory Resource Allocations", "Mark Incident Resolved".

---

## 4. Screen 3: Aerial Resource Dispatch & Field Assessment Console (Core Feature)
- **Status**: **PLANNED (CORE)**
- **Purpose**: Enables Authority to dispatch aerial resources (drones/aircraft) and allows aerial operators/teams to submit structured mission assessments that update the incident.
- **Sub-View A: Authority Aerial Dispatch Console**:
  - **Resource Selector**: Available aerial assets (UAV Fleet Alpha, Recon Chopper 2).
  - **Mission Definition Panel**:
    - Mission Type: Area Scanning, Damage Assessment, Search Support, Rescue Support, Supply Delivery.
    - Objective & Target Coordinates/Sector.
    - Assigned Operator / Team.
  - **Dispatch Action**: "Authorize & Dispatch Mission" (requires Authority confirmation).
- **Sub-View B: Structured Field Assessment Ingestion Form**:
  - **Input Fields**:
    - Incident ID & Mission Reference
    - Mission Type & Objective
    - Location / Area Sector
    - Time of Assessment
    - Operator / Team Identifier
    - Field Observations (text & structured tags)
    - Affected People & Structural Counts
    - Damage Observations (% destruction, collapsed infrastructure)
    - Accessibility Status (Accessible, Road Blocked, Air Access Only)
    - Required Ground/Medical Resources
    - Imagery / Video Attachment Uploads
    - Assessment Confidence Score (%)
    - Operational Notes
  - **Side-by-Side Visual Review**: Baseline pre-event imagery vs post-mission survey photos with synchronized pan/zoom.
  - **Submit & Integrate**: "Submit Assessment & Update Incident" (triggers recalculation of priority and advisory resource allocations).

---

## 5. Screen 4: Advisory Resource Allocation & Approval Center
- **Status**: **PLANNED**
- **Purpose**: Displays AI-generated advisory allocation recommendations across active incidents and provides Authority decision makers with final approval controls.
- **9-Step Workflow UI Components**:
  - **Priority Incident Queue**: Ranked unresolved incidents with capability requirements.
  - **Resource Availability Pool**: Units categorized by type (`AVAILABLE`, `RECOMMENDED`, `AUTHORITY APPROVED`, `ALLOCATED`, `IN USE`).
  - **Advisory Recommendation Cards**:
    - Proposed matches based on proximity, capability, and scarcity.
    - Explainable AI Rationale: *"Recommended SAR Team 2 due to swift-water specialization and 12-min ETA; 3 units held in reserve for competing Sector 5 flood."*
  - **Authority Decision Bar**:
    - `Approve & Dispatch` (Transitions status: RECOMMENDED → AUTHORITY APPROVED → ALLOCATED)
    - `Modify Selection` (Manual override of units)
    - `Reject Recommendation`
  - **Reassessment Banner**: Indicates when new telemetry or aerial assessments have triggered recommendation updates.

---

## 6. Screen 5: Contextual Operational Map & Spatial Inspector
- **Status**: **PLANNED**
- **Purpose**: Secondary spatial view providing geographic context without overwhelming the command dashboard.
- **Layout & Key Components**:
  - **Clean Map Canvas**: Neutral cartography with restrained damage polygon overlays and asset pins.
  - **Layer Controls**: Toggle Weather Overlay, Sector Boundaries, Blocked Routes, Aerial Flight Paths.
  - **Zone Inspector Drawer**: Slides in on polygon click showing population density, road status, and linked incidents.
