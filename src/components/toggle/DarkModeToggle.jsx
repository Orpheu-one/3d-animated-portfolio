// src/components/toggle/DarkModeToggle.jsx
import { motion } from "framer-motion"
import { useTheme } from "../../context/ThemeContext"

const THEMES = [
  { key: "light", label: "NORMAL", emoji: "🌿", color: "#4ade80" },
  { key: "dark",  label: "DARK",   emoji: "🌑", color: "#e11d48" },
  { key: "uno",   label: "UNO",    emoji: "🌈", color: "#f9a8d4" },
]

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme()
  const idx    = Math.max(0, THEMES.findIndex(t => t.key === theme))
  const active = THEMES[idx]

  const cycle = () => setTheme(THEMES[(idx + 1) % THEMES.length].key)

  return (
    <div style={{
      display:    "flex",
      alignItems: "center",
      gap:        "10px",
      userSelect: "none",
    }}>

      {/* Label */}
      <span style={{
        fontSize:      "11px",
        fontWeight:    700,
        letterSpacing: "0.12em",
        color:         active.color,
        minWidth:      "52px",
        textAlign:     "right",
        transition:    "color 0.3s ease",
      }}>
        {active.label}
      </span>

      {/* Track */}
      <div
        onClick={cycle}
        style={{
          position:     "relative",
          width:        "76px",
          height:       "30px",
          borderRadius: "15px",
          background:   theme === "dark" ? "#3f0a14"
                      : theme === "uno"  ? "rgba(249,168,212,0.25)"
                      :                   "#14532d",
          border:       `1px solid ${active.color}55`,
          cursor:       "pointer",
          transition:   "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Knob animado */}
        <motion.div
          animate={{ x: idx * 24 + 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          style={{
            position:        "absolute",
            top:             "3px",
            width:           "24px",
            height:          "24px",
            borderRadius:    "50%",
            background:      active.color,
            boxShadow:       `0 0 8px ${active.color}88`,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            fontSize:        "13px",
            pointerEvents:   "none",
          }}
        >
          {active.emoji}
        </motion.div>

        {/* 3 pontos indicadores */}
        {THEMES.map((t, i) => (
          <div
            key={t.key}
            style={{
              position:     "absolute",
              top:          "50%",
              left:         `${i * 24 + 15}px`,
              transform:    "translate(-50%, -50%)",
              width:        "4px",
              height:       "4px",
              borderRadius: "50%",
              background:   idx === i ? "transparent" : "rgba(255,255,255,0.3)",
              transition:   "background 0.2s",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      {/* Hint — próximo tema */}
      <span style={{ fontSize: "13px", opacity: 0.45 }}>
        {THEMES[(idx + 1) % THEMES.length].emoji}
      </span>
    </div>
  )
}

export default DarkModeToggle
