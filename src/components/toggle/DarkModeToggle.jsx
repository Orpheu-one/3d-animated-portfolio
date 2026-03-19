// src/components/toggle/DarkModeToggle.jsx
import { useState } from "react"

// ─── Palettes ─────────────────────────────────────────────────────────────────
const THEMES = {
  normal: {
    trackBg:     "#1e2d3d",
    trackBorder: "#4ade8066",
    knobBg:      "#4ade80",
    knobShadow:  "0 0 12px #4ade80cc, 0 0 28px #4ade8066",
    labelColor:  "#4ade80",
    label:       "NORMAL",
  },
  dark: {
    trackBg:     "#1a0000",
    trackBorder: "#e11d4866",
    knobBg:      "#e11d48",
    knobShadow:  "0 0 12px #e11d48cc, 0 0 28px #e11d4866",
    labelColor:  "#e11d48",
    label:       "DARK",
  },
}

const SunIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="5" fill={color} />
    {[0,45,90,135,180,225,270,315].map(a => (
      <line key={a}
        x1={12 + 8.5 * Math.cos(a * Math.PI / 180)}
        y1={12 + 8.5 * Math.sin(a * Math.PI / 180)}
        x2={12 + 11  * Math.cos(a * Math.PI / 180)}
        y2={12 + 11  * Math.sin(a * Math.PI / 180)}
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
    ))}
  </svg>
)

const MoonIcon = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={color}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────────────
export const DarkModeToggle = ({ onChange }) => {
  const [isDark, setIsDark] = useState(false)
  const t = THEMES[isDark ? "dark" : "normal"]

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    onChange?.(next)
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}>

      {/* Sun */}
      <span style={{ opacity: isDark ? 0.3 : 1, transition: "opacity 0.4s", display: "flex", alignItems: "center" }}>
        <SunIcon color={THEMES.normal.knobBg} />
      </span>

      {/* Track */}
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        style={{
          position: "relative",
          width: 52, height: 28,
          borderRadius: 14,
          background: t.trackBg,
          border: `1.5px solid ${t.trackBorder}`,
          cursor: "pointer",
          padding: 0,
          outline: "none",
          transition: "background 0.45s ease, border-color 0.45s ease",
        }}
      >
        <span style={{
          position: "absolute",
          top: 3,
          left: isDark ? 25 : 3,
          width: 20, height: 20,
          borderRadius: "50%",
          background: t.knobBg,
          boxShadow: t.knobShadow,
          transition: "left 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.4s ease, box-shadow 0.4s ease",
        }} />
      </button>

      {/* Moon */}
      <span style={{ opacity: isDark ? 1 : 0.3, transition: "opacity 0.4s", display: "flex", alignItems: "center" }}>
        <MoonIcon color={THEMES.dark.knobBg} />
      </span>

      {/* Label */}
      <span style={{
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        fontSize: 10,
        letterSpacing: "0.15em",
        color: t.labelColor,
        transition: "color 0.4s",
        minWidth: 48,
      }}>
        {t.label}
      </span>

    </div>
  )
}

export default DarkModeToggle
