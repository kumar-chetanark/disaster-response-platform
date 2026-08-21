# UI Design System: Disaster Response Platform

## 1. Visual Design Principles & Aesthetics
- **Calm Operational Command Aesthetic**: Professional, modern, neutral slate/zinc canvas engineered for extended emergency monitoring without eye fatigue.
- **Scannable & High Density Without Crowding**: Information-dense layout structured with generous whitespace padding, eliminating cluttered cards and redundant borders.
- **Secondary Contextual Map**: The operational map serves as a secondary spatial reference; it does NOT dominate the dashboard canvas.
- **Strict Color Discipline**: Color is reserved strictly for operational telemetry, severity classification, and status badges.
- **Styling Anti-Patterns (Explicitly Avoided)**:
  - NO excessive cards or nested containers
  - NO excessive borders or heavy dividers
  - NO neon glows, pulsating cyberpunk borders, or gaming aesthetics
  - NO heavy blur/glassmorphism effects
  - NO excessive gradients or decorative illustrations
  - NO distracting non-functional animations
  - NO generic AI dashboard tropes

---

## 2. Dashboard Layout & Visual Hierarchy
The Command Dashboard prioritizes decision-critical information over spatial graphics:

| Hierarchy Rank | Dashboard Element | Visual Treatment |
| :--- | :--- | :--- |
| **1. Active Incidents** | Top primary queue table / cards | High-contrast headline, severity indicator, direct action trigger |
| **2. Severity** | Multi-channel badges (Text + Icon + Color) | Red (`SEV-1 Critical`), Orange (`SEV-2 High`), Yellow (`SEV-3 Medium`), Green (`SEV-4 Low`) |
| **3. Affected Population** | High-visibility numeric metric | Large tabular numbers (e.g., `12,400 est. civilians at risk`) |
| **4. Affected Area** | Geographic scope summary | Monospace sector tags and road accessibility indicators |
| **5. Unresolved Incidents**| Prominent counter in top KPI bar | Badge counter with amber attention tint |
| **6. Active Inbound Alerts** | Proactive alert feed panel | Distinct channel icon (`[IMD]`, `[Gov]`, `[SMS]`, `[IVR]`) + timestamp |
| **7. Resource Availability** | Resource readiness summary bar | Clean breakdown of available, recommended, and deployed units |
| **8. Advisory Allocations** | Advisory recommendation cards | Explainable AI rationale card with clear Authority Approve action |
| **9. Response Team Status** | Field status list | Subdued status badges (`In-Transit`, `On-Scene`, `Standby`) |
| **10. Recent Telemetry** | Unified chronological stream | Monospace timestamps with parsed summary snippets |
| **11. Aerial / Field Updates**| Field assessment report badges | Verification checkmark, damage % tag, operator ID |

---

## 3. Color Tokens & Semantic Theme

### Neutral Slate Foundation (Dark Operational Mode)
- **Canvas Root**: `#090d16` (Deep neutral slate)
- **Surface Elevation 1 (Panels)**: `#101726` (Subtle dark elevation)
- **Surface Elevation 2 (Cards / Popovers)**: `#172033` (Quiet contrast)
- **Border & Dividers**: `#1e293b` (Ultra-subtle 1px boundary)
- **Text Primary**: `#f8fafc` (Clean white legibility)
- **Text Muted / Metadata**: `#94a3b8` (Muted slate for timestamps, labels)
- **Text Accent / Interactive**: `#38bdf8` (Calm sky blue for links and active triggers)

### Operational Severity Encoding (WCAG AA Compliant)
| Level | Text Label | Base Color | Tint Background | Icon |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 CRITICAL** | `CRITICAL` | `#ef4444` (Red-500) | `rgba(239, 68, 68, 0.12)` | AlertTriangle |
| **SEV-2 HIGH** | `HIGH` | `#f97316` (Orange-500) | `rgba(249, 115, 22, 0.12)` | AlertCircle |
| **SEV-3 MEDIUM** | `MEDIUM` | `#eab308` (Yellow-500) | `rgba(234, 179, 8, 0.12)` | InfoHexagon |
| **SEV-4 LOW** | `LOW` | `#22c55e` (Green-500) | `rgba(34, 197, 94, 0.12)` | ShieldCheck |
| **UNKNOWN** | `PENDING EVAL` | `#64748b` (Slate-500) | `rgba(100, 116, 139, 0.12)` | HelpCircle |

### Resource Lifecycle Colors
- `AVAILABLE`: `#22c55e` (Green-500 text / badge)
- `RECOMMENDED`: `#38bdf8` (Sky-400 text / advisory border)
- `AUTHORITY APPROVED`: `#818cf8` (Indigo-400 text / badge)
- `ALLOCATED`: `#a855f7` (Purple-500 text / badge)
- `IN USE`: `#f97316` (Orange-500 text / badge)
- `COMPLETED / AVAILABLE`: `#22c55e` (Green-500 text / badge)

---

## 4. Typography & Data Presentation
- **Primary Font**: Inter / -apple-system / BlinkMacSystemFont (Clean, readable sans-serif).
- **Telemetry & Coordinate Font**: JetBrains Mono / SF Mono / Consolas (Used for lat/long coordinates, timestamps, confidence scores, and raw SMS/IVR snippets).
- **Density**: 8px grid baseline with compact padding (8px / 12px) to maximize scannability without visual noise.

---

## 5. Component Specifications

### Authority Action Controls
- **Authority Dispatch Button**: Prominent solid primary button (`#0284c7`) with mandatory confirmation dialog.
- **Advisory Approval Button**: Direct approve trigger (`#16a34a`) alongside a `Modify` button (`#334155`).
- **Emergency Override**: Amber/Red outlined button requiring explicit authority sign-off.

### Field Assessment Form UI
- Clean, structured form layout with multi-column field groupings.
- Side-by-side photo comparison viewer with clean split divider and zoom controls.

### Implementation Status
- Visual System & Token Specs: **PLANNED**
- Tailwind / CSS Module Tokens: **PLANNED**
- Component Library: **PLANNED**
