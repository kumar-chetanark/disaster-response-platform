# UI Design System — Disaster Response Platform (PS-07)

## 1. Visual Aesthetics & Design System
- **Theme**: Operational Dark Mode (`#0b1329` deep navy canvas, `#131f3d` surface cards, `#1e293b` borders).
- **Color Discipline**:
  - 🔴 **Critical / Red (`#ef4444`)**: Immediate life-threatening hazard, SEV-1.
  - 🟠 **High / Orange (`#ea580c`)**: Severe disaster condition, SEV-2.
  - 🟢 **Medium / Green (`#10b981`)**: Monitored condition, available squads, resolved status.
  - 🔷 **Tactical Blue / Sky (`#0284c7` / `#38bdf8`)**: Global GDACS external intelligence feeds.
- **Typography**:
  - `font-mono`: Data telemetry, coordinates, status badges, timestamps.
  - `font-body-base`: Readable disaster descriptions and incident summaries.
  - `font-headline`: Clean, high-contrast operational headers.

## 2. Layout & Spacing
- Full-width responsive layout (`w-full`) across all consoles, maximizing viewport usage without restrictive artificial centering.
- Persistent active tab routing synchronized via URL hash and `localStorage`.
- Edge-to-edge interactive Leaflet tactical radar map with animated `flyTo` coordinate navigation.
