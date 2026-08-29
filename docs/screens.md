# Screen Specifications — Disaster Response Platform (PS-07)

## 1. Screen Architecture
The platform features an operational authority console structured into 6 primary operational workspaces:

1. **Dashboard & Tactical Radar Map (`page.tsx` & `ContextualMapPreview.tsx`)**
   - Live KPI overview (Active Incidents, Critical Hazards, Operational Readiness).
   - Full-width interactive Leaflet tactical radar map with severity hazard circles and layer filters.
   - Priority Incidents ticker and recent Alerts summary.

2. **Alerts & Disaster Intelligence Console (`AlertsConsole.tsx`)**
   - Sub-tab A: `EXTERNAL DISASTER INTELLIGENCE (GDACS)` featuring 100 worldwide disaster intelligence cards with `[MAP]` and `[REVIEW]` actions.
   - Sub-tab B: `CITIZEN & SENSOR ALERTS` displaying incoming civilian distress reports and telemetry alarms.
   - Global Disaster Dossier modal for authority review, validation, and canonical incident conversion.

3. **Incidents Console (`IncidentsConsole.tsx`)**
   - Active, Pending, Monitoring, and Resolved incident cards.
   - 16-dimension intelligence dossiers (hazard vectors, infrastructure damage %, casualties, population in coverage).
   - `[SUBMIT ASSESSMENT]`, `[GENERATE SITREP]`, and `[DELETE INCIDENT]` actions.

4. **Resources & Proximity Radar (`ResourcesConsole.tsx`)**
   - 25km radius location search and tactical asset inventory (Squads, Ambulances, UAV Drones, Shelter capacities).
   - Capability-based response team builder with match scoring.

5. **Operations Console (`OperationsConsole.tsx`)**
   - Consolidated tactical operational tracks grouped per incident.
   - Mission objective, authorized commander, dispatched squads, and chronological timeline update logs.

6. **Reports & Debriefs (`ReportsConsole.tsx`)**
   - Formal SITREP generation synthesizing multi-squad metrics.
   - Downloadable official binary PDF debrief documents.
