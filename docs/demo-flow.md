# Live Demonstration Walkthrough — Disaster Response Platform (PS-07)

## Demonstration Overview
This walkthrough demonstrates the complete 20-step closed-loop disaster intelligence and response lifecycle, verified against the live production deployment.

- **Frontend URL**: `https://disaster-response-platform-eta.vercel.app`
- **Backend API**: `https://disaster-response-api-wrn2.onrender.com`
- **Total Demo Duration**: 3 to 5 minutes

---

## Step-by-Step Live Flow

### Phase 1: Authentication & Global Disaster Intelligence Intake
1. **Hackathon Access**:
   - Open `https://disaster-response-platform-eta.vercel.app`.
   - Click `[AUTHORITY LOGIN]` in the top header.
   - Click the green `[ENTER DEMO COMMAND CENTER]` button (authenticated securely by backend `DEMO_MODE=True` without exposing passwords).
2. **Global Disaster Alerts Console**:
   - Navigate to the **Alerts** tab.
   - Observe the live `GDACS • CONNECTED` status badge and `EXTERNAL DISASTER INTELLIGENCE (GDACS)` sub-tab displaying 100 worldwide disaster events.
   - Point out real-time disaster alerts: *Earthquake in China*, *Flood in Nepal*, *Tropical Cyclone SAUDEL-26*, *Earthquake in Indonesia*.
   - Click `[MAP]` on any alert to demonstrate automated coordinate centering (`flyTo`) on the Tactical Radar Map.
   - Click `[REVIEW]` on an alert (e.g. *Earthquake in China*) to open the structured Global Disaster Dossier.

### Phase 2: Authority Incident Creation & 16-Dimension Intelligence
3. **Convert Alert to Incident**:
   - In the Dossier modal, click `[CONVERT TO INCIDENT]`.
   - Observe the confirmation and instant conversion to a canonical incident.
   - Demonstrate double-conversion protection (clicking again safely returns `HTTP 409 Conflict`).
4. **Incidents Console**:
   - Navigate to the **Incidents** tab.
   - View the newly created incident with full point-wise situational awareness: damaged structures, hazard vectors, population at risk, and corroboration confidence.

### Phase 3: 25km Location-Based Resource Intelligence & Dispatch
5. **Proximity Search & Capability Matching**:
   - Navigate to the **Resources** tab.
   - Search the incident sector or click the radar map to view available squads within the 25km proximity radius.
   - Click `[BUILD RESPONSE TEAM]` to review capability-scored squad recommendations (Water Rescue, Medical Squads, Extrication Units).
6. **Consolidated Tactical Operation**:
   - Approve the allocation and click `[DISPATCH SQUAD]`.
   - Navigate to the **Operations** tab and observe the single consolidated operational mission created for the incident with real-time state tracking (`DISPATCHED` -> `IN TRANSIT` -> `ON SCENE`).

### Phase 4: Aerial Assessment, Dynamic Priority Recalculation & SITREP PDF
7. **Field Reconnaissance**:
   - In the Incidents tab, click `[SUBMIT ASSESSMENT]`.
   - Input structural damage percentage (`75%`), mark road blocked (`YES`), and casualties observed.
   - Submit assessment: observe the incident severity score dynamically recalculate from Level 2 to Level 1.
8. **Situation Report & PDF Export**:
   - Navigate to the **Reports** tab.
   - Click `[GENERATE SITREP]` to produce a comprehensive debrief summarizing operational metrics and casualty figures.
   - Click `[EXPORT PDF]` to download the official binary debrief document with command authorization formatting.
