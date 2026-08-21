---
name: Crisis Command
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  status-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  sidebar-width: 240px
  header-height: 64px
  gutter: 16px
  container-padding: 24px
  stack-compact: 8px
  stack-dense: 4px
---

## Brand & Style
The design system is engineered for mission-critical disaster response environments where cognitive load must be minimized. The brand personality is calm, authoritative, and clinical, prioritizing rapid data processing over aesthetic flourish. 

The style is **Corporate Modern with a Technical Edge**, utilizing high-density layouts and a "Dark Mode First" philosophy. It avoids decorative effects like heavy glassmorphism or vibrant glows in favor of structural clarity, precise borders, and functional color coding. The goal is to evoke a sense of absolute reliability and situational awareness for operators managing high-stress emergencies.

## Colors
This design system utilizes a deep "Operational Dark" palette. The core interface is built on **#0F172A (Base)** and **#1E293B (Surface)** to reduce eye strain during long shifts in low-light command centers.

**Functional Color Palette:**
- **Primary:** Used for active states and primary actions.
- **Severity Scale:** These colors must be used strictly for incident status. Do not use Red or Orange for standard UI highlights to prevent "alert fatigue."
- **Contrast:** Text should maintain a minimum 7:1 contrast ratio against background surfaces to ensure legibility under duress.

## Typography
The system uses **Inter** for all standard UI elements due to its exceptional legibility in dense interfaces. **JetBrains Mono** is reserved for mission-critical data strings including GPS coordinates, timestamps, and resource IDs to ensure numerical clarity and alignment.

- **Scale:** Font sizes are kept tight (13px-14px for body) to maximize information density.
- **Hierarchy:** Use font weight rather than size to distinguish information layers within high-density panels.
- **Readability:** Maintain tighter line-heights for data tables, but increase leading for long-form incident reports.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model optimized for ultra-wide command center monitors and laptops.

1.  **Sidebar:** A fixed 240px navigation bar on the left for global context switching.
2.  **Top Header:** A fixed 64px bar containing the active incident summary and global search.
3.  **Central Focal Point:** The primary viewport is reserved for the operational map or data grid.
4.  **Density:** Use a 4px base unit. Component internal padding should default to 8px or 12px (Compact) to ensure as much data as possible is visible "above the fold."

**Breakpoints:**
- **Desktop (1440px+):** 3-column layout (Nav / Main Map / Secondary Details).
- **Tablet (1024px):** 2-column layout (Nav / Main Map). Sidebar collapses to icons.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** rather than traditional drop shadows. This preserves the "Operational Dark" aesthetic and prevents the UI from feeling muddy.

- **Base Layer (#0F172A):** Used for the background and furthest-back canvas.
- **Surface Layer (#1E293B):** Used for primary cards, sidebars, and navigation headers.
- **Elevated Layer (#334155):** Used for hover states, tooltips, and active selection states.
- **Borders:** Use low-contrast 1px strokes (#334155) to define component boundaries. Shadows should be used sparingly, only for modal dialogs, and should be highly diffused with 0px offset and 20% opacity black.

## Shapes
The design system utilizes **Soft (0.25rem)** roundedness. This provides a professional, modern feel without appearing "consumer-grade" or overly soft. 

- **Standard Elements:** Buttons, input fields, and cards use 4px (0.25rem) corners.
- **Status Badges:** Use 2px corners or are completely square to emphasize a technical, rigorous look.
- **Interactive States:** Focus rings should be 2px solid strokes in the Primary color with a 2px offset.

## Components
Consistent styling across mission-critical components:

- **Buttons:**
    - Primary: Solid #3B82F6 with white text. 
    - Secondary: Ghost style with #334155 border.
    - Danger: Solid #EF4444 for destructive actions only.
- **Status Badges:** Compact labels with a subtle background tint (15% opacity of the severity color) and a solid 2px left border in the severity color.
- **Input Fields:** Dark background (#0F172A), 1px border (#334155), and JetBrains Mono text for numerical inputs.
- **Operational Cards:** Flat design, no shadows, 1px border. The header should have a slightly darker background to anchor the content.
- **Data Tables:** Zebra striping using #1E293B and #1A2235. No vertical borders; use 1px horizontal dividers only.
- **Map Overlays:** Use semi-transparent #0F172A (85% opacity) for floating map controls to maintain context while ensuring legibility.