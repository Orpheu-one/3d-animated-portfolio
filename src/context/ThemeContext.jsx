// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

// ─── Expectativa de vida por género (anos) ────────────────────────────────────
export const LIFE_EXPECTANCY = {
  M: 78,   // Portugal: homens ~77.95
  F: 84,   // Portugal: mulheres ~84.2
}

// ─── Calcula a data de morte com base no nascimento e género ──────────────────
export const calcDeathDate = (birthDateStr, gender) => {
  const birth = new Date(birthDateStr)
  const years = LIFE_EXPECTANCY[gender] ?? 78
  return new Date(birth.getTime() + years * 365.25 * 24 * 60 * 60 * 1000)
}

// ─── Dados default: Paulo / Orpheu ────────────────────────────────────────────
const DEFAULT_USER = {
  name:      "Orpheu",
  birthDate: "1970-10-12T19:00:00",
  gender:    "M",
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("app-theme") || "dark"
  )

  // ── DeathClock state ────────────────────────────────────────────────────────
  const [showRitual,    setShowRitual]    = useState(false)
  const [showDeathClock, setShowDeathClock] = useState(true)  // sempre visível em dark
  const [userData, setUserData]           = useState(DEFAULT_USER)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("app-theme", theme)
  }, [theme])

  const isDark = theme === "dark"
  const isUno  = theme === "uno"

  // ── Registar um novo user (vindo do RitualForm) ────────────────────────────
  const registerUser = ({ name, birthDate, gender }) => {
    setUserData({ name, birthDate, gender })
    setShowRitual(false)
    setShowDeathClock(true)
  }

  // ── Reset ao default (Orpheu) ──────────────────────────────────────────────
  const resetUser = () => setUserData(DEFAULT_USER)

  return (
    <ThemeContext.Provider value={{
      theme, setTheme,
      isDark, isUno,
      showRitual,    setShowRitual,
      showDeathClock, setShowDeathClock,
      userData,
      registerUser,
      resetUser,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
