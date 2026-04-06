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

const STORAGE_KEY_THEME = "app-theme"
const STORAGE_KEY_USER  = "ritual_user"

// ─── Tenta recuperar o utilizador guardado no browser ─────────────────────────
const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.profile?.name && parsed?.profile?.birthDate) {
      return {
        name:      parsed.profile.name,
        birthDate: parsed.profile.birthDate,
        gender:    parsed.profile.gender ?? "M",
      }
    }
  } catch (_) {}
  return null
}

// ─────────────────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {

  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY_THEME) || "dark"
  )

  // ── DeathClock state ────────────────────────────────────────────────────────
  const [showRitual,     setShowRitual]     = useState(false)
  const [showDeathClock, setShowDeathClock] = useState(true)

  // Inicializa com dados guardados no browser; fallback para Orpheu
  const [userData, setUserData] = useState(
    () => loadStoredUser() ?? DEFAULT_USER
  )

  // ── Sincroniza data-theme no <html> e persiste ──────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem(STORAGE_KEY_THEME, theme)
  }, [theme])

  const isDark = theme === "dark"
  const isUno  = theme === "uno"

  // ── Registar um novo utilizador (vindo do RitualForm) ──────────────────────
  const registerUser = ({ name, birthDate, gender }) => {
    const updated = { name, birthDate, gender }
    setUserData(updated)
    setShowRitual(false)
    setShowDeathClock(true)

    // Persiste com estrutura preparada para backend
    try {
      const payload = {
        version:  "1.0",
        savedAt:  new Date().toISOString(),
        profile: {
          name:      name.trim(),
          email:     "",          // email guardado só no RitualForm por privacidade
          birthDate,
          gender,
        },
        _sync: {
          synced:   false,
          syncedAt: null,
          userId:   null,
        },
      }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(payload))
    } catch (_) {}
  }

  // ── Reset ao default (Orpheu) ──────────────────────────────────────────────
  const resetUser = () => {
    setUserData(DEFAULT_USER)
    try { localStorage.removeItem(STORAGE_KEY_USER) } catch (_) {}
  }

  return (
    <ThemeContext.Provider value={{
      theme, setTheme,
      isDark, isUno,
      showRitual,      setShowRitual,
      showDeathClock,  setShowDeathClock,
      userData,
      clockUser: userData,    // alias usado pelo DeathClock
      registerUser,
      resetUser,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)