// src/App.jsx
import Contacts from "./components/contacts/Contacts"
import Hero     from "./components/hero/Hero"
import Portfolio from "./components/portfolio/Portfolio"
import Services  from "./components/services/Services"
import { ThemeProvider, useTheme } from "./context/ThemeContext"
import { DarkModeToggle } from "./components/toggle/DarkModeToggle"
import "./index.css"

// ─── TopNav ──────────────────────────────────────────────────────────────────
// Fixed bar no topo — não interfere com o scroll-snap das sections
const TopNav = () => {
  const { isDark, setIsDark } = useTheme()

  return (
    <nav
      style={{
        position:       "fixed",
        top:            0,
        left:           0,
        right:          0,
        height:         52,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "flex-end",
        padding:        "0 32px",
        zIndex:         1000,
        // Fundo: translúcido em ambos os modos
        background: isDark
          ? "rgba(255,255,255,0.85)"
          : "rgba(10, 25, 47, 0.75)",
        backdropFilter: "blur(10px)",
        borderBottom: isDark
          ? "1px solid #e11d4822"
          : "1px solid #4ade8022",
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}
    >
      <DarkModeToggle onChange={setIsDark} />
    </nav>
  )
}

// ─── Inner App (needs ThemeProvider above) ────────────────────────────────────
const AppInner = () => (
  <div className="container">
    <TopNav />
    {/* padding-top: 52px para que o conteúdo não fique escondido sob a navbar */}
    <section id="welcome"  style={{ paddingTop: 52 }}><Hero /></section>
    <section id="services" ><Services /></section>
    <section id="portfolio"><Portfolio /></section>
    <section id="contacts" ><Contacts /></section>
  </div>
)

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <ThemeProvider>
    <AppInner />
  </ThemeProvider>
)

export default App
