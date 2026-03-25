// src/components/deathclock/RitualForm.jsx
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "../../context/ThemeContext"

const inputStyle = {
  background:    "transparent",
  border:        "1px solid #fa0505",
  borderRadius:  "4px",
  color:         "#ffffff",
  padding:       "10px 14px",
  fontSize:      "14px",
  fontFamily:    "'Share Tech Mono', monospace",
  width:         "100%",
  outline:       "none",
  marginBottom:  "12px",
  boxSizing:     "border-box",
}

const labelStyle = {
  display:       "block",
  color:         "#888",
  fontSize:      "11px",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  marginBottom:  "4px",
  fontFamily:    "'Share Tech Mono', monospace",
}

const RitualForm = () => {
  const { setShowRitual, registerUser } = useTheme()

  const [form, setForm] = useState({
    name:      "",
    email:     "",
    birthDate: "",
    gender:    "M",
  })

  const [error, setError] = useState("")

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
    // Valida data de nascimento
    const birth = new Date(form.birthDate)
    if (isNaN(birth.getTime()) || birth > new Date()) {
      setError("Data de nascimento inválida.")
      return
    }
    registerUser({
      name:      form.name,
      birthDate: form.birthDate,
      gender:    form.gender,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      style={{
        position:        "fixed",
        top:             0, left: 0,
        width:           "100vw",
        height:          "100vh",
        backgroundColor: "rgba(0,0,0,0.95)",
        zIndex:          10000,
        display:         "flex",
        justifyContent:  "center",
        alignItems:      "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowRitual(false) }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{    scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          border:     "1px solid #fa0505",
          padding:    "40px",
          maxWidth:   "420px",
          width:      "90%",
          background: "rgba(10,0,0,0.95)",
          boxShadow:  "0 0 40px rgba(250,5,5,0.2)",
        }}
      >
        {/* Título */}
        <h2 style={{
          color:       "#fa0505",
          fontFamily:  "'Teko', sans-serif",
          fontSize:    "2rem",
          letterSpacing: "0.2em",
          textAlign:   "center",
          marginBottom: "8px",
        }}>
          RITUAL DE INICIAÇÃO
        </h2>
        <p style={{
          color:       "#555",
          fontSize:    "12px",
          textAlign:   "center",
          marginBottom: "28px",
          fontFamily:  "'Share Tech Mono', monospace",
        }}>
          Descobre o tempo que te resta, mortal.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Nome */}
          <label style={labelStyle}>O teu nome</label>
          <input
            style={inputStyle}
            type="text"
            name="name"
            placeholder="Como te chamas?"
            value={form.name}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            name="email"
            placeholder="Para onde mandamos o aviso?"
            value={form.email}
            onChange={handleChange}
            required
          />

          {/* Data de nascimento */}
          <label style={labelStyle}>Data de nascimento</label>
          <input
            style={{ ...inputStyle, colorScheme: "dark" }}
            type="date"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            required
          />

          {/* Género */}
          <label style={labelStyle}>Género</label>
          <div style={{ display:"flex", gap:"12px", marginBottom:"20px" }}>
            {[
              { value: "M", label: "Masculino" },
              { value: "F", label: "Feminino"  },
            ].map(opt => (
              <label
                key={opt.value}
                style={{
                  flex:          1,
                  border:        `1px solid ${form.gender === opt.value ? "#fa0505" : "#333"}`,
                  borderRadius:  "4px",
                  padding:       "10px",
                  textAlign:     "center",
                  cursor:        "pointer",
                  color:         form.gender === opt.value ? "#fa0505" : "#555",
                  fontFamily:    "'Share Tech Mono', monospace",
                  fontSize:      "13px",
                  transition:    "all 0.2s ease",
                  userSelect:    "none",
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

          {/* Erro */}
          {error && (
            <p style={{
              color:       "#fa0505",
              fontSize:    "12px",
              fontFamily:  "'Share Tech Mono', monospace",
              marginBottom: "12px",
              textAlign:   "center",
            }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            style={{
              background:    "#fa0505",
              color:         "#000",
              border:        "none",
              padding:       "14px 30px",
              width:         "100%",
              fontFamily:    "'Teko', sans-serif",
              fontSize:      "1.2rem",
              letterSpacing: "0.2em",
              fontWeight:    "bold",
              cursor:        "pointer",
              transition:    "background 0.2s ease",
            }}
            onMouseEnter={e => e.target.style.background = "#c00"}
            onMouseLeave={e => e.target.style.background = "#fa0505"}
          >
            CONFIRMAR O MEU DESTINO
          </button>

        </form>

        {/* Fechar */}
        <p
          onClick={() => setShowRitual(false)}
          style={{
            color:       "#333",
            fontSize:    "11px",
            textAlign:   "center",
            marginTop:   "16px",
            cursor:      "pointer",
            fontFamily:  "'Share Tech Mono', monospace",
            transition:  "color 0.2s",
          }}
          onMouseEnter={e => e.target.style.color = "#666"}
          onMouseLeave={e => e.target.style.color = "#333"}
        >
          ← escapar ao ritual
        </p>

      </motion.div>
    </motion.div>
  )
}

export default RitualForm
