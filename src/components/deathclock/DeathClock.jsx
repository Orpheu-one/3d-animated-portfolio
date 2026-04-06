import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import "./deathclock.css"

// ─── Tunables ────────────────────────────────────────────────────────────────
const DEFAULT_BIRTH_DATE = new Date("1970-10-12T19:00:00")
const DEFAULT_LIFE_YEARS = 80
const DEFAULT_NAME       = "Orpheu"

const IMG_DARK_DEFAULT   = "/Grim_reaper_dark_black_component_001.png"
const IMG_DARK_HOVER     = "/Grim_reaper_dark_red_component_001.png"
const IMG_UNO            = "/Grim_reaper_uno_component_001.png"

const CLOCK_BOTTOM_PX    = 5

const LABEL_FONT_SIZE    = "14px"
const LABEL_FONT_WEIGHT  = 600
const LABEL_COLOR_DARK   = "#fa1905"
const LABEL_COLOR_UNO    = "#ffe600"
// ─────────────────────────────────────────────────────────────────────────────

// Calcula DEATH_DATE a partir de birthDate e lifeYears (expectativa p género)
const calcDeathDate = (birthDate, gender) => {
  // Expectativa de vida PT: M ≈ 78.5 anos, F ≈ 84.5 anos
  const years = gender === "F" ? 84.5 : 78.5
  return new Date(birthDate.getTime() + years * 365.25 * 24 * 60 * 60 * 1000)
}


const DeathClock = () => {
  const { isDark, isUno, setShowRitual, clockUser } = useTheme()
  // clockUser = { name, birthDate, gender } || null  (vem do ThemeContext)

  const [hover,    setHover]    = useState(false)
  const [hoverUno, setHoverUno] = useState(false)
  const [expired,  setExpired]  = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    // Usa dados do visitante se existirem, senão usa defaults (Orpheu)
    const birthDate = clockUser?.birthDate
      ? new Date(clockUser.birthDate)
      : DEFAULT_BIRTH_DATE
    const gender    = clockUser?.gender ?? "M"
    const deathDate = clockUser
      ? calcDeathDate(birthDate, gender)
      : new Date(DEFAULT_BIRTH_DATE.getTime() + DEFAULT_LIFE_YEARS * 365.25 * 24 * 60 * 60 * 1000)

    const tick = () => {
      const distance = deathDate - new Date()
      if (distance < 0) { setExpired(true); return }
      setExpired(false)
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
  }, [clockUser])   // re-corre quando o visitante submete o form

  const displayName = clockUser?.name ?? DEFAULT_NAME
  const blendMode   = isDark ? "multiply" : "screen"
  const labelColor  = isDark ? LABEL_COLOR_DARK : LABEL_COLOR_UNO
  const labelShadow = isDark
    ? "0 0 8px rgba(250,5,5,0.8)"
    : "0 0 8px rgba(255,230,0,0.8)"

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
        width:    "100%",
        cursor:   isDark ? "pointer" : "default",
      }}
      onMouseEnter={() => {
        if (isDark) setHover(true)
        if (isUno)  setHoverUno(true)
      }}
      onMouseLeave={() => {
        if (isDark) setHover(false)
        if (isUno)  setHoverUno(false)
      }}
      onClick={() => isDark && setShowRitual(true)}
    >

      {/* ── Imagens empilhadas (sem glitch de re-layout) ─────────────────── */}
      {isDark ? (

        <div style={{ position: "relative", width: "100%" }}>

          {/* Spacer — mantém altura estável */}
          <img
            src={IMG_DARK_DEFAULT}
            alt=""
            aria-hidden="true"
            style={{ width: "100%", display: "block", visibility: "hidden" }}
          />

          {/* Default (black) */}
          <img
            src={IMG_DARK_DEFAULT}
            alt="grim reaper"
            style={{
              position:     "absolute",
              top: 0, left: 0,
              width:        "100%",
              display:      "block",
              mixBlendMode: blendMode,
              opacity:      hover ? 0 : 1,
              transition:   "opacity 0.3s ease",
            }}
          />

          {/* Hover (red) */}
          <img
            src={IMG_DARK_HOVER}
            alt="grim reaper hover"
            style={{
              position:     "absolute",
              top: 0, left: 0,
              width:        "100%",
              display:      "block",
              mixBlendMode: blendMode,
              opacity:      hover ? 1 : 0,
              transition:   "opacity 0.3s ease",
            }}
          />

        </div>

      ) : (

        // UNO — hover placeholder (substituir por img quando disponível)
        <img
          src={IMG_UNO}
          alt="grim reaper"
          style={{
            width:        "100%",
            display:      "block",
            mixBlendMode: blendMode,
            transition:   "filter 0.3s ease",
            filter:       hoverUno
              ? "brightness(1.15) saturate(1.4) hue-rotate(15deg)"
              : "none",
          }}
        />

      )}

      {/* ── Label "Death Countdown of {name}" ────────────────────────────── */}
      <div style={{
        position:      "absolute",
        top:           "50%",
        left:          "50%",
        transform:     "translate(-50%, -50%)",
        textAlign:     "center",
        pointerEvents: "none",
        whiteSpace:    "nowrap",
      }}>
        <span style={{
          fontFamily:    "'Share Tech Mono', monospace",
          fontSize:      LABEL_FONT_SIZE,
          fontWeight:    LABEL_FONT_WEIGHT,
          color:         labelColor,
          textShadow:    labelShadow,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          Death Countdown of {displayName}
        </span>
      </div>

      {/* ── Clock overlay ─────────────────────────────────────────────────── */}
      <div style={{
        position:       "absolute",
        bottom:         CLOCK_BOTTOM_PX,
        left:           0,
        width:          "100%",
        display:        "flex",
        justifyContent: "space-around",
        alignItems:     "flex-end",
        padding:        "0 8px",
        boxSizing:      "border-box",
        pointerEvents:  "none",
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
