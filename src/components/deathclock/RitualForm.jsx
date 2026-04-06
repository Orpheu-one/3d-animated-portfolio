// src/components/deathclock/RitualForm.jsx

import { useState } from "react"
import { motion } from "framer-motion"
import { useTheme } from "../../context/ThemeContext"

// ─── Tunables ────────────────────────────────────────────────────────────────
const BG_IMAGE          = "/morte_Realista_001._no_Watermark.jpg"
const STORAGE_KEY       = "ritual_user"
const STORAGE_VERSION   = "1.0"
// ─────────────────────────────────────────────────────────────────────────────

// ─── Estilos base ─────────────────────────────────────────────────────────────

const FONT_MONO  = "'Share Tech Mono', monospace"
const FONT_TITLE = "'Share Tech Mono', monospace"

const labelStyle = {
  display:       "block",
  color:         "#666",
  fontSize:      "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  marginBottom:  "4px",
  fontFamily:    FONT_MONO,
}

const baseInputStyle = {
  background:    "rgba(0,0,0,0.55)",
  border:        "1px solid #2a0000",
  borderRadius:  "3px",
  color:         "#ccc",
  padding:       "10px 14px",
  fontSize:      "14px",
  fontFamily:    FONT_MONO,
  width:         "100%",
  outline:       "none",
  boxSizing:     "border-box",
  transition:    "border 0.2s ease, box-shadow 0.2s ease",
}

const focusedInputStyle = {
  ...baseInputStyle,
  border:    "1px solid #fa0505",
  boxShadow: "0 0 8px rgba(250,5,5,0.45)",
  color:     "#ffffff",
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const buildStoragePayload = (form) => ({
  version:     STORAGE_VERSION,
  savedAt:     new Date().toISOString(),
  profile: {
    name:        form.name.trim(),
    email:       form.email.trim().toLowerCase(),
    birthDate:   form.birthDate,
    gender:      form.gender,
  },
  // Espaço reservado p backend — popular quando houver API
  _sync: {
    synced:     false,
    syncedAt:   null,
    userId:     null,
  },
})

// ─────────────────────────────────────────────────────────────────────────────

const RitualForm = () => {
  const { setShowRitual, registerUser } = useTheme()

  const [form, setForm] = useState({ name: "", email: "", birthDate: "", gender: "M" })
  const [focused, setFocused] = useState(null)   // id do campo com foco
  const [error, setError]   = useState("")

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.birthDate || !form.gender) {
      setError("Preenche todos os campos, mortal.")
      return
    }

    const birth = new Date(form.birthDate)
    if (isNaN(birth.getTime()) || birth > new Date()) {
      setError("Data de nascimento inválida.")
      return
    }

    // ── Persiste no browser ─────────────────────────────────────────────────
    const payload = buildStoragePayload(form)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (_) {
      // storage indisponível — continua na mesma
    }

    // ── Atualiza o DeathClock com os dados do visitante ─────────────────────
    registerUser({
      name:      form.name.trim(),
      birthDate: form.birthDate,
      gender:    form.gender,
    })
  }

  const inputStyle = (id) => focused === id ? focusedInputStyle : baseInputStyle

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:           "fixed",
        top: 0, left: 0,
        width:              "100vw",
        height:             "100vh",
        zIndex:             10000,
        display:            "flex",
        justifyContent:     "center",
        alignItems:         "center",
        backgroundImage:    `url('${BG_IMAGE}')`,
        backgroundSize:     "cover",
        backgroundPosition: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowRitual(false) }}
    >

      {/* Véu escuro sobre a imagem — ajusta opacity p deixar mais/menos bg visível */}
      <div style={{
        position: "absolute",
        inset:    0,
        background: "rgba(0,0,0,0.62)",
        pointerEvents: "none",
      }} />

      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.88, opacity: 0, y: 20  }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{
          position:     "relative",   // acima do véu
          border:       "1px solid #3a0000",
          borderRadius: "2px",
          padding:      "40px 36px 32px",
          maxWidth:     "400px",
          width:        "90%",
          background:   "rgba(6,0,0,0.78)",
          boxShadow:    "0 0 50px rgba(250,5,5,0.15), inset 0 0 30px rgba(0,0,0,0.4)",
          backdropFilter: "blur(3px)",
        }}
      >

        {/* ── Título ─────────────────────────────────────────────────────── */}
        <h2 style={{
          color:         "#fa0505",
          fontFamily:    FONT_TITLE,
          fontSize:      "50px",
          fontWeight:    700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textAlign:     "center",
          lineHeight:    1,
          marginBottom:  "6px",
        }}>
          Initiation<br />Ritual
        </h2>

        <p style={{
          color:         "#444",
          fontSize:      "11px",
          textAlign:     "center",
          marginBottom:  "28px",
          fontFamily:    FONT_MONO,
          letterSpacing: "0.1em",
        }}>
          descobre o tempo que te resta, mortal
        </p>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              style={inputStyle("name")}
              type="text"
              name="name"
              placeholder="Como te chamas?"
              value={form.name}
              onChange={handleChange}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle("email")}
              type="email"
              name="email"
              placeholder="Para onde mandamos o aviso?"
              value={form.email}
              onChange={handleChange}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              required
            />
          </div>

          {/* Data de nascimento */}
          <div>
            <label style={labelStyle}>Data de nascimento</label>
            <input
              style={{ ...inputStyle("birthDate"), colorScheme: "dark" }}
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              onFocus={() => setFocused("birthDate")}
              onBlur={() => setFocused(null)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Género — radio visual */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Género</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { value: "M", label: "Masculino" },
                { value: "F", label: "Feminino"  },
              ].map(opt => (
                <label
                  key={opt.value}
                  style={{
                    flex:          1,
                    border:        `1px solid ${form.gender === opt.value ? "#fa0505" : "#2a0000"}`,
                    borderRadius:  "3px",
                    padding:       "10px",
                    textAlign:     "center",
                    cursor:        "pointer",
                    color:         form.gender === opt.value ? "#fa0505" : "#444",
                    fontFamily:    FONT_MONO,
                    fontSize:      "12px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background:    form.gender === opt.value ? "rgba(250,5,5,0.07)" : "transparent",
                    transition:    "all 0.2s ease",
                    userSelect:    "none",
                    boxShadow:     form.gender === opt.value ? "0 0 6px rgba(250,5,5,0.3)" : "none",
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={form.gender === opt.value}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <p style={{
              color:         "#fa0505",
              fontSize:      "11px",
              fontFamily:    FONT_MONO,
              textAlign:     "center",
              letterSpacing: "0.08em",
              margin:        0,
            }}>
              {error}
            </p>
          )}

          {/* ── Botões ────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>

            {/* Set Clock */}
            <button
              type="submit"
              style={{
                flex:          1,
                background:    "#fa0505",
                color:         "#000",
                border:        "none",
                padding:       "13px 0",
                fontFamily:    "'Teko', sans-serif",
                fontSize:      "1.1rem",
                letterSpacing: "0.2em",
                fontWeight:    700,
                cursor:        "pointer",
                transition:    "background 0.2s ease",
                borderRadius:  "2px",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#c00"}
              onMouseLeave={e => e.currentTarget.style.background = "#fa0505"}
            >
              SET CLOCK
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => setShowRitual(false)}
              style={{
                flex:          "0 0 auto",
                background:    "transparent",
                color:         "#444",
                border:        "1px solid #2a0000",
                padding:       "13px 20px",
                fontFamily:    FONT_MONO,
                fontSize:      "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor:        "pointer",
                transition:    "all 0.2s ease",
                borderRadius:  "2px",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#fa0505"
                e.currentTarget.style.color       = "#fa0505"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#2a0000"
                e.currentTarget.style.color       = "#444"
              }}
            >
              CANCEL
            </button>

          </div>

        </form>

      </motion.div>

    </motion.div>
  )
}

export default RitualForm
