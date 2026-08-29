# UX Document — Disaster Response Platform (PS-07)

## 1. Product UX Philosophy & Goals
The Disaster Response Platform is an operational decision-support tool engineered for emergency authorities, incident commanders, and disaster coordinators. It delivers:
- **Stability-First Operation**: High resilience with clear fallback states and deterministic data flows.
- **Human Authority Supremacy**: Zero automated military/rescue dispatches. AI and algorithms provide structured recommendations, but final execution strictly requires human commander review.
- **Calm, Information-Dense Interface**: Clean slate/zinc canvas avoiding eye fatigue, gaming aesthetics, or distracting animations during multi-hour emergency operations.
- **Full-Width Responsive Spatial View**: Edge-to-edge full-width layout with responsive 1-3 column grids ensuring maximum workspace utilization on both desktop command screens and mobile field tablets.

---

## 2. Operator Workflows & Console UX

### A. Global Disaster Intelligence Console (`AlertsConsole.tsx`)
- Sub-tab toggle between `EXTERNAL DISASTER INTELLIGENCE (GDACS)` (worldwide early warnings) and `CITIZEN & SENSOR ALERTS` (local reports).
- Filter toolbar allowing filtering by Hazard Type (`Earthquake`, `Flood`, `Cyclone`, `Wildfire`), Severity (`Critical`, `High`, `Medium`), and Status.
- Clickable disaster cards with color-coded severity borders (Red = Critical, Orange = High, Green = Medium) opening complete situation dossiers.
- Persistent active tab state preserved across browser refreshes via URL hash and `localStorage`.

### B. Command Center Tactical Radar Map (`ContextualMapPreview.tsx`)
- Visual hazard circles mapped strictly by severity (`75km` Red for Critical, `45km` Orange for High, `25km` Green for Medium).
- Auto-scroll and animated coordinate flying when clicking `[MAP]` from any alert card.
- Synchronized layer controls (`ALL`, `INCIDENTS`, `GLOBALS`) with matching visual glyphs (`!` red circle, `G` blue diamond).

### C. Incidents Console (`IncidentsConsole.tsx`)
- 16-dimension point-wise assessment cards (hazard vectors, population density, structural damage, road accessibility).
- Universal deletion support for any incident state with cascade cleanup.

### D. Resources & Operations Console (`ResourcesConsole.tsx` & `OperationsConsole.tsx`)
- Proximity search computing real-time distances within a 25km operational radius.
- Consolidated single-operation tracking per crisis preventing fragmented duplicate tracks.

### E. SITREP Debriefs & Reports (`ReportsConsole.tsx`)
- One-click synthesis of incident metrics into formal debriefs.
- Instant binary PDF download for official inter-agency communication.
