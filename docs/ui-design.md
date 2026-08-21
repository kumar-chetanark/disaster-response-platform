# UI Design System: Disaster Response Platform

## 1. Visual Design Principles
- **Mission-Critical Clarity**: High-contrast, dark-first operational command aesthetic (neutral slate / zinc foundation).
- **Cognitive Load Reduction**: Dense yet readable typography, unambiguous iconography, and clear visual hierarchy.
- **Color Discipline**: Color is reserved strictly for operational status, severity levels, and priority indicators.
- **Accessibility**: Dual-coding (color + text label + icon badge) for all critical alert states ensuring WCAG AA compliance.

## 2. Color Palette & Semantics

### Base Theme (Dark Operational Mode)
- **Background Root**: `#0a0d14` (Deep command canvas)
- **Surface Elevation 1**: `#111622` (Panel backgrounds)
- **Surface Elevation 2**: `#182032` (Card / modal backgrounds)
- **Border & Dividers**: `#253046` (Subtle containment)
- **Text Primary**: `#f1f5f9` (High legibility)
- **Text Muted**: `#94a3b8` (Secondary metadata)
- **Text Accent / Interactive**: `#38bdf8` (Cyan-sky operational blue)

### Severity & Status Classification (Multi-Channel Encoding)
| Level | Color Code | Background Tint | Icon Indicator | Text Label |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `#ef4444` (Red-500) | `rgba(239, 68, 68, 0.15)` | Alert Triangle | [CRITICAL / SEV-1] |
| **HIGH** | `#f97316` (Orange-500) | `rgba(249, 115, 22, 0.15)` | Alert Circle | [HIGH / SEV-2] |
| **MEDIUM** | `#eab308` (Yellow-500) | `rgba(234, 179, 8, 0.15)` | Info Hexagon | [MEDIUM / SEV-3] |
| **LOW** | `#22c55e` (Green-500) | `rgba(34, 197, 94, 0.15)` | Shield Check | [LOW / SEV-4] |
| **UNKNOWN** | `#64748b` (Slate-500) | `rgba(100, 116, 139, 0.15)` | Question Circle | [PENDING AUDIT] |

## 3. Typography & Layout System
- **Font Stack**: Inter / Segoe UI for UI; JetBrains Mono / SF Mono for telemetry, coordinates, timestamps, and confidence percentages.
- **Density**: Compact padding (8px / 12px units) allowing maximum data density on standard operator monitors.
- **Grid Layout**: 12-column responsive layout with persistent status top-bar and collateral side-drawers.

## 4. Component Standards

### Severity Badges
- Text label always accompanying color dot or border.
- Confidence score explicitly displayed alongside (e.g., `HIGH SEVERITY · 88% CONFIDENCE`).

### Action Buttons
- **Primary Deploy**: Solid cyan-blue button with confirmation modal.
- **Secondary / Filter**: Outlined slate button with active toggle glow.
- **Danger / Override**: Amber/Red outlined button requiring explicit confirmation.

### Data Tables & Feed Cards
- Zebra-stripe hover feedback.
- Monospace timestamps formatted in UTC with local offset indication.
- Real-time pulse indicator for active streaming data or demo simulations.

## 5. Implementation Status
- Visual System Specification: **PLANNED**
- Tailwind / CSS Tokens: **PLANNED**
- Component Library: **PLANNED**
