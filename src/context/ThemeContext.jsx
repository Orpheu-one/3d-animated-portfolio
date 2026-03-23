// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("app-theme") || "light"
  )

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("app-theme", theme)
  }, [theme])

  // isDark mantido para retrocompatibilidade com todo o código existente
  const isDark = theme === "dark"
  const isUno  = theme === "uno"

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, isUno }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
