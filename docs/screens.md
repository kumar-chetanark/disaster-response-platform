# Screen Specifications: Disaster Response Platform

## 1. Overview of Screens
The platform consists of four primary views accessible through the unified command interface:
1. **Command Dashboard (Overview Screen)** [PLANNED]
2. **Operational Map & Damage Zone View** [PLANNED]
3. **Aerial Imagery Assessment & Analysis Screen** [PLANNED (CORE)]
4. **Resource Allocation & Deployment Center** [PLANNED]

---

## 2. Screen 1: Command Dashboard (Overview)
- **Status**: **PLANNED**
- **Purpose**: Real-time situational awareness dashboard displaying active incidents, alert levels, resource readiness, and recent field telemetry.
- **Layout & Key Components**:
  - **Top Navigation Bar**: System status pulse, active incident selector, demo mode toggle, and notification drawer trigger.
  - **KPI Metrics Bar**: Total active incidents, critical zones, deployed units, and unassigned urgent reports.
  - **Incident Summary Table**: Sortable list with severity badges, location tags, reported time, and action triggers.
  - **Live Alert Feed**: Chronological ticker of inbound field reports and automated anomaly warnings.
- **States**:
  - *Default*: Populated with active incident list.
  - *Empty State*: No active disasters detected prompt with button to load sample scenario.
  - *Offline / Demo*: Banner indicating simulated mock telemetry active.

---

## 3. Screen 2: Operational Map & Zone Inspector
- **Status**: **PLANNED**
- **Purpose**: Spatial visualization of disaster coordinates, affected boundary polygons, severity heatmaps, and deployed emergency assets.
- **Layout & Key Components**:
  - **Interactive Map Canvas**: Layer controls for Satellite, Terrain, Damage Overlay, and Asset Markers.
  - **Zone Inspector Drawer**: Slides out on polygon click; details population density, estimated casualties, road blockages, and priority score.
  - **Map Tooling Bar**: Zoom, bounding box selector, filter by severity level, and toggle aerial overlay.
- **States**:
  - *Loading*: Map tile skeletons and telemetry loader.
  - *Selected Zone*: Highlighted neon boundary with synchronized zone card in sidebar.

---

## 4. Screen 3: Aerial Imagery Assessment & Analysis (Core Feature)
- **Status**: **PLANNED (CORE)**
- **Purpose**: Ingests pre- and post-disaster aerial/satellite drone imagery, runs AI/heuristic damage detection, highlights damage polygons, and calculates structural damage severity.
- **Layout & Key Components**:
  - **Split-View / Slider Canvas**: Side-by-side comparison of baseline vs. post-incident imagery with synchronized pan and zoom.
  - **Damage Detection Layer**: Color-coded overlay polygons classifying Collapsed Structures, Flooded Areas, and Debris Obstructions.
  - **Assessment Metric Card**:
    - Structural Damage Index (% destroyed)
    - Severity Classification (Critical / High / Moderate / Minimal)
    - Model Confidence Score (e.g., 91.4%)
  - **Action Header**: Upload New Imagery, Re-run AI Analysis, Generate Priority Zones from Damage.
- **States**:
  - *Empty State*: Drag-and-drop zone with pre-loaded demo aerial imagery tiles (Flood, Earthquake, Hurricane).
  - *Processing*: Progress indicator with simulated neural analysis stages.
  - *Assessment Complete*: Interactive segmented bounding boxes with inspection tooltips.

---

## 5. Screen 4: Resource Allocation & Deployment Center
- **Status**: **PLANNED**
- **Purpose**: Matches verified high-priority disaster zones with available medical, search-and-rescue (SAR), and supply logistics units.
- **Layout & Key Components**:
  - **Priority Zone Queue**: Ranked list of operational zones sorted by AI Priority Score.
  - **Available Asset Pool**: Search-and-rescue teams, ambulances, supply helicopters, heavy clearance equipment with location and status (Idle / In-Transit / Deployed).
  - **Recommendation Panel**: AI-suggested resource match with plain-language explanation of rationale.
  - **Deployment Execution Bar**: Multi-select dispatch trigger with audit log confirmation.
- **States**:
  - *Proposed*: Blue highlighted match with reason card.
  - *Dispatched*: Green lock state with estimated time of arrival (ETA) countdown.
