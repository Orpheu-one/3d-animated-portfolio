// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false)

  // Aplica data-theme no <html> → CSS selectors funcionam globalmente
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
