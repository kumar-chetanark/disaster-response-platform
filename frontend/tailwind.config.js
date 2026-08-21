/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "secondary-fixed": "#d3e4fe",
        "inverse-on-surface": "#283044",
        "outline": "#8c909f",
        "on-tertiary-fixed": "#311400",
        "primary-container": "#4d8eff",
        "surface-tint": "#adc6ff",
        "error-container": "#93000a",
        "surface-variant": "#2d3449",
        "secondary-container": "#3a4a5f",
        "inverse-primary": "#005ac2",
        "on-background": "#dae2fd",
        "inverse-surface": "#dae2fd",
        "on-error-container": "#ffdad6",
        "primary-fixed-dim": "#adc6ff",
        "surface-container-highest": "#2d3449",
        "tertiary-fixed-dim": "#ffb786",
        "surface-container-low": "#131b2e",
        "on-secondary": "#213145",
        "outline-variant": "#424754",
        "on-tertiary-fixed-variant": "#723600",
        "on-secondary-container": "#a9bad3",
        "tertiary-container": "#df7412",
        "on-error": "#690005",
        "background": "#0b1326",
        "surface-container-lowest": "#060e20",
        "on-primary": "#002e6a",
        "on-surface-variant": "#c2c6d6",
        "surface-bright": "#31394d",
        "primary": "#adc6ff",
        "on-tertiary": "#502400",
        "on-secondary-fixed": "#0b1c30",
        "secondary-fixed-dim": "#b7c8e1",
        "tertiary": "#ffb786",
        "on-primary-fixed-variant": "#004395",
        "surface-dim": "#0b1326",
        "surface": "#0b1326",
        "secondary": "#b7c8e1",
        "error": "#ffb4ab",
        "on-primary-fixed": "#001a42",
        "tertiary-fixed": "#ffdcc6",
        "on-tertiary-container": "#461f00",
        "on-secondary-fixed-variant": "#38485d",
        "primary-fixed": "#d8e2ff",
        "on-primary-container": "#00285d",
        "surface-container": "#171f33",
        "on-surface": "#dae2fd",
        "surface-container-high": "#222a3d"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "header-height": "56px",
        "sidebar-width": "200px",
        "container-padding": "24px"
      },
      fontFamily: {
        "body-base": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "headline-sm": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "mono-label": ["JetBrains Mono", "monospace"],
        "status-badge": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-base": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "display-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "mono-label": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "status-badge": ["11px", { lineHeight: "12px", fontWeight: "700" }]
      }
    }
  },
  plugins: [],
}
