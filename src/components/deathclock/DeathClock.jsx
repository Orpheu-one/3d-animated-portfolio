import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import "./deathclock.css"

// ─── Tunables ────────────────────────────────────────────────────────────────
const BIRTH_DATE       = new Date("1970-10-12T19:00:00")
const LIFE_YEARS       = 80                          // expectativa de vida (anos)
const DEATH_DATE       = new Date(BIRTH_DATE.getTime() + LIFE_YEARS * 365.25 * 24 * 60 * 60 * 1000)

const IMG_DARK_DEFAULT = "/Grim_reaper_dark_black_component_001.png"
const IMG_DARK_HOVER   = "/Grim_reaper_dark_red_component_001.png"
const IMG_UNO          = "/Grim_reaper_uno_component_001.png"

const CLOCK_BOTTOM_PX  = 5      // distância do clock ao bottom da imagem
// ─────────────────────────────────────────────────────────────────────────────


const DeathClock = () => {
  const { isDark, isUno, setShowRitual } = useTheme()

  const [hover,    setHover]    = useState(false)
  const [expired,  setExpired]  = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const tick = () => {
      const distance = DEATH_DATE - new Date()
      if (distance < 0) { setExpired(true); return }
      setTimeLeft({
        days:    Math.floor(distance / 86400000),
        hours:   Math.floor((distance % 86400000)  / 3600000),
        minutes: Math.floor((distance % 3600000)   / 60000),
        seconds: Math.floor((distance % 60000)     / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const imgSrc = isDark
    ? (hover ? IMG_DARK_HOVER : IMG_DARK_DEFAULT)
    : IMG_UNO

  // ── blending forçado por theme ──────────────────────────────────────────────
  const blendMode = isDark ? "multiply" : "screen"

  const units = [
    { v: timeLeft.days,    l: "dias" },
    { v: timeLeft.hours,   l: "hrs"  },
    { v: timeLeft.minutes, l: "min"  },
    { v: timeLeft.seconds, l: "sec"  },
  ]

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        cursor: isDark ? "pointer" : "default",
        // isolation: "auto" — NOT isolate, p não quebrar o blending com o bg
      }}
      onMouseEnter={() => isDark && setHover(true)}
      onMouseLeave={() => isDark && setHover(false)}
      onClick={() => isDark && setShowRitual(true)}
    >

      {/* ── Imagem ────────────────────────────────────────────────────────── */}
      <img
        src={imgSrc}
        alt="grim reaper"
        style={{
          width: "100%",
          display: "block",
          mixBlendMode: blendMode,
          transition: "all 0.3s ease",
        }}
      />

      {/* ── Clock overlay ─────────────────────────────────────────────────── */}
      <div style={{
        position:      "absolute",
        bottom:        CLOCK_BOTTOM_PX,
        left:          0,
        width:         "100%",
        display:       "flex",
        justifyContent:"space-around",
        alignItems:    "flex-end",
        padding:       "0 8px",
        boxSizing:     "border-box",
        pointerEvents: "none",
      }}>

        {expired ? (

          <span style={{
            color:      "#fa1905",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize:   "20px",
            textShadow: "0 0 10px rgba(250,5,5,0.7)",
          }}>
            TEMPO ESGOTADO
          </span>

        ) : (

          units.map(({ v, l }, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center" }}>
              <div className="mini-unit">
                <span className="mini-value">{String(v).padStart(2, "0")}</span>
                <span className="mini-label">{l}</span>
              </div>
              {i < units.length - 1 && (
                <span className="mini-separator">:</span>
              )}
            </div>
          ))

        )}
      </div>

    </div>
  )
}

export default DeathClock
