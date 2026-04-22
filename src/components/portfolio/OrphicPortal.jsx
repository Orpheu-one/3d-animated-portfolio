import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tunables ────────────────────────────────────────────────────────────────
const BG_IMAGE = "/Caronte_001.png"
const FONT_MONO = "'Share Tech Mono', monospace"
const FONT_TITLE = "'Share Tech Mono', monospace"
// ─────────────────────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block",
  color: "#666",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  marginBottom: "4px",
  fontFamily: FONT_MONO,
}

const baseInputStyle = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid #2a0000",
  borderRadius: "3px",
  color: "#ccc",
  padding: "10px 14px",
  fontSize: "14px",
  fontFamily: FONT_MONO,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
}

const focusedInputStyle = {
  ...baseInputStyle,
  border: "1px solid #fa0505",
  boxShadow: "0 0 8px rgba(250,5,5,0.45)",
  color: "#ffffff",
}

// ─────────────────────────────────────────────────────────────────────────────

const OrphicPortal = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [form, setForm] = useState({ name: "", password: "" })
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState("")

  const inputStyle = (id) => focused === id ? focusedInputStyle : baseInputStyle

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.password) {
      setError("Preenche todos os campos, mortal.")
      return
    }
    // TODO: lógica de autenticação
    console.log("Orphic login →", form.name.trim())
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="orphic-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          style={{
            position: "fixed",
            top: 0, left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 10000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundImage: `url('${BG_IMAGE}')`,
            backgroundSize: "cover",
            backgroundPosition: "top center",
          }}
        >
          {/* Véu escuro */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.62)",
            pointerEvents: "none",
          }} />

          {/* ── Card ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            style={{
              position: "relative",
              zIndex: 20,
              border: "1px solid #3a0000",
              borderRadius: "2px",
              padding: "40px 36px 32px",
              maxWidth: "480px",
              width: "90%",
              background: "rgba(6,0,0,0.78)",
              boxShadow: "0 0 50px rgba(250,5,5,0.15), inset 0 0 30px rgba(0,0,0,0.4)",
              backdropFilter: "blur(3px)",
            }}
          >

            {/* Título */}
            <h2 style={{
              color: "#fa0505",
              fontFamily: FONT_TITLE,
              fontSize: "42px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1,
              marginBottom: "6px",
            }}>
              MNEMOSINE:<br />ARQUIVO DA MEMÓRIA
            </h2>

            <p style={{
              color: "#444",
              fontSize: "11px",
              textAlign: "center",
              marginBottom: "28px",
              fontFamily: FONT_MONO,
              letterSpacing: "0.1em",
            }}>
              a memória é o nosso escudo
            </p>

            {/* Texto do manifesto */}
            <div className="orphic-text" style={{ textAlign: "justify", fontSize: "0.95rem", marginBottom: "30px" }}>
              <p style={{ marginBottom: "16px" }}>
                Reconhecemos a vertigem de olhar para o abismo — o "Void" — e entendemos que essa descida
                é idêntica à de Orfeu. Não descemos para morrer, mas para resgatar a nossa <strong>Essência</strong>.
              </p>
              <p>
                Aqui, a memória é o nosso escudo e a cooperação a nossa espada.
              </p>
            </div>

            {/* Divisor */}
            <div style={{ borderTop: "1px solid #2a0000", marginBottom: "24px" }} />

            {/* ── Form ────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <div>
                <label style={labelStyle}>User</label>
                <input
                  style={inputStyle("name")}
                  type="text"
                  name="name"
                  placeholder="Identifica-te, filho da Terra..."
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  style={inputStyle("password")}
                  type="password"
                  name="password"
                  placeholder="A senha secreta..."
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <p style={{
                  color: "#fa0505",
                  fontSize: "11px",
                  fontFamily: FONT_MONO,
                  textAlign: "center",
                  letterSpacing: "0.08em",
                  margin: 0,
                }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>

                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: "#fa0505",
                    color: "#000",
                    border: "none",
                    padding: "13px 0",
                    fontFamily: "'Teko', sans-serif",
                    fontSize: "1.1rem",
                    letterSpacing: "0.2em",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#c00"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fa0505"}
                >
                  SOU FILHO DA TERRA E DO CÉU ESTRELADO
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    flex: "0 0 auto",
                    background: "transparent",
                    color: "#444",
                    border: "1px solid #2a0000",
                    padding: "13px 20px",
                    fontFamily: FONT_MONO,
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#fa0505"
                    e.currentTarget.style.color = "#fa0505"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#2a0000"
                    e.currentTarget.style.color = "#444"
                  }}
                >
                  CANCEL
                </button>

              </div>

            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OrphicPortal
