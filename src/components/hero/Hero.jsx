// src/components/hero/Hero.jsx
import { Facebook, Instagram, Linkedin } from "lucide-react"
import "./hero.css"
import Speech from "./Speech"
import { Suspense } from "react"
import { motion } from "framer-motion"
import NeuralBg     from "./Neuralbg"
import NeuralBgDark from "./NeuralBgDark"
import { useTheme } from "../../context/ThemeContext"

// ─── Timeline ─────────────────────────────────────────────────────────────────
const speed = 0.8

const T1   = 0   * speed
const T2   = 1.5 * speed
const T3   = 3.0 * speed
const T3_1 = 3.2 * speed
const T4   = 4.2 * speed
const T5   = 5.2 * speed
const I1   = 6.2 * speed
const I2   = 6.7 * speed
const I3   = 7.2 * speed

const R            = I3
const FOLLOW_DUR   = 1.2 * speed
const FOLLOW_ROT   = 1.0 * speed
const SPEECH_DELAY = R + FOLLOW_DUR + FOLLOW_ROT
const BUTTON_DELAY = SPEECH_DELAY + 0.55 + 0.65 + 0.3

// ─── Tamanho do botão — fonte única de verdade ─────────────────────────────────
const BTN = 150        // px — largura/altura do container
const BTN_HALF = BTN / 2  // 75px — centro exacto

// ─── Hero ──────────────────────────────────────────────────────────────────────
const Hero = () => {
  const { isDark } = useTheme()

  const circleAccent = isDark ? "#fa0505ff" : "#15ed7aff"
  const avatarSrc    = isDark ? "/avatar_Paulo_dark_mode_001.png" : "/avatar_Paulo_001.png"

  const fromLeft = (delay, duration = 1.2) => ({
    hidden:  { x: -100, opacity: 0 },
    visible: { x: 0, opacity: 1,
      transition: { delay, duration: duration * speed, ease: "easeInOut" } },
  })

  const fadeIn = (delay, duration = 0.4) => ({
    hidden:  { opacity: 0 },
    visible: { opacity: 1,
      transition: { delay, duration, ease: "easeInOut" } },
  })

  const contactBtnEntry = {
    hidden:  { opacity: 0, clipPath: "circle(0% at 50% 50%)" },
    visible: { opacity: 1, clipPath: "circle(100% at 50% 50%)",
      transition: { delay: BUTTON_DELAY, duration: 2.2, ease: "easeInOut" } },
  }

  return (
    <motion.div
      className="hero"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
    >

      {/* ── LEFT ── */}
      <div className="hSection left">
        <h1 className="hTitle">
          <motion.span style={{ display: "block" }} variants={fromLeft(T1)}>
            {isDark ? "Welcome into the void," : "Hye There,"}
          </motion.span>
          <motion.span
            className="hName"
            style={{
              display:    "block",
              color:      isDark ? "#000000" : undefined,
              fontWeight: isDark ? 900        : undefined,
            }}
            variants={fromLeft(T2)}
          >
            {isDark ? "I'm Orpheu!" : "I'm Paulo!"}
          </motion.span>
        </h1>

        <motion.div className="awards" variants={fromLeft(T3)}>
          <h2 className="aTitle">
            <motion.span style={{ display: "block" }} variants={fromLeft(T3_1, 0.8)}>
              <span style={{
                color:           isDark ? "#ffffff" : "#dc0000",
                backgroundColor: isDark ? "#000000" : "transparent",
                padding:         isDark ? "2px 8px"  : "0",
                display:         "inline-block",
              }}>Fullstack</span>
            </motion.span>

            <motion.span
              style={{
                display:         "block",
                color:           isDark ? "#dc0000" : "white",
                fontWeight:      "bold",
                backgroundColor: isDark ? "#000000" : "transparent",
                padding:         isDark ? "2px 8px"  : "0",
              }}
              variants={fromLeft(T4, 0.8)}
            >
              Web Developer
            </motion.span>
          </h2>

          <motion.p className="aDesc" variants={fromLeft(T5, 0.8)}>
            {isDark
              ? "I'm gonna do as I please, gonna spread the disease because I want to!"
              : "Expertise em criar soluções digitais robustas e escaláveis, unindo o rigor do backend à fluidez do frontend."
            }
          </motion.p>

          <div className="awardList">
            <motion.img src="/Nextjs.webp" className="awardImg"   alt="Next.js"   variants={fadeIn(I1)} />
            <motion.img src="/React19.png" className="awardImg_2" alt="React 19"  variants={fadeIn(I2)} />
            <motion.img src="/wp.png"      className="awardImg_3" alt="WordPress" variants={fadeIn(I3)} />
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT ── */}
      <div className="hSection right">

        {/* ── NORMAL MODE follow — intacto ── */}
        {!isDark && (
          <motion.div
            className="follow"
            variants={{
              hidden:  { y: -150, opacity: 0 },
              visible: { y: 0, opacity: 1,
                transition: { delay: R, duration: FOLLOW_DUR, ease: "easeInOut" } },
            }}
          >
            <a href="/" className="fLink"><Facebook /></a>
            <a href="/" className="fLink"><Instagram /></a>
            <a href="/" className="fLink"><Linkedin /></a>
            <motion.div
              className="followTextContainer"
              variants={{
                hidden:  { rotate: 180 },
                visible: { rotate: 0,
                  transition: { delay: R + FOLLOW_DUR, duration: FOLLOW_ROT, ease: "easeInOut" } },
              }}
            >
              <div className="followText">FOLLOW ME</div>
            </motion.div>
          </motion.div>
        )}

        {/* ── DARK MODE follow ── */}
        {isDark && (
          <motion.div
            className="follow follow--dark"
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0,    opacity: 1 }}
            transition={{ delay: R, duration: FOLLOW_DUR, ease: "easeInOut" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* "to" — horizontal, topo */}
              <span style={{
                fontFamily:    "'Teko', 'Share Tech Mono', monospace",
                fontSize:      "22px",
                fontWeight:    600,
                color:         "#ffffff",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                lineHeight:    1,
                paddingTop:    "6px",
              }}>to</span>
              {/* "FOLLOW" — vertical */}
              <span className="follow__darkLabel">FOLLOW</span>
            </div>
            <motion.div
              className="follow__darkChild"
              initial={{ rotate: 0 }}
              animate={{ rotate: -90 }}
              transition={{ delay: R + FOLLOW_DUR, duration: FOLLOW_ROT, ease: "easeInOut" }}
            >
              <span className="follow__darkChildText">No One</span>
            </motion.div>
          </motion.div>
        )}

        <Speech delay={SPEECH_DELAY} />

        <motion.div
          className="certificate"
          variants={fadeIn(SPEECH_DELAY + 0.3)}
          style={isDark ? {
            alignItems:    "center",
            textAlign:     "center",
            gap:           "2px",
            flexDirection: "column",
          } : undefined}
        >
          {/* Img sempre em cima */}
          <img
            src={isDark ? "/amo-te.png" : "/passaporte_qualifica_Logo_001.png"}
            className="cImg"
            alt="Certificado"
            style={isDark ? {
              mixBlendMode: "multiply",
              width:        "auto",
              height:       "auto",
              maxWidth:     "clamp(225px, 37vw, 375px)",
              maxHeight:    "375px",
              objectFit:    "contain",
              filter:       "contrast(160%)",
            } : undefined}
          />

          {/* Texto em baixo */}
          {isDark ? (
            <span style={{
              backgroundColor: "#000000",
              color:           "#dc0000",
              fontWeight:      700,
              fontSize:        "19px",
              letterSpacing:   "0.1em",
              padding:         "3px 8px",
              display:         "inline-block",
            }}>
              CERTIFIED MISFIT
            </span>
          ) : "CERTIFIED PROFESSIONAL"}
        </motion.div>

        {/* ── CONTACT BUTTON ─────────────────────────────────────────────────── */}
        <motion.a
          href="#contacts"
          className="contactBtn"
          style={{ display: "block", cursor: "pointer", pointerEvents: "auto" }}
          variants={contactBtnEntry}
        >

          {/* ── NORMAL MODE ── */}
          {!isDark && (
            <motion.div
              className="contactButtonContainer"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ pointerEvents: "none" }}
            >
              <svg viewBox="0 0 200 200" width={BTN} height={BTN}>
                <circle className="mainCircle" cx="100" cy="100" r="90" fill={circleAccent} />
                <path id="innerCirclePath" fill="none"
                  d="M 100,100 m -60,0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" />
                <text className="circleText">
                  <textPath href="#innerCirclePath">Hire Now •</textPath>
                </text>
                <text className="circleText">
                  <textPath href="#innerCirclePath" startOffset="44%">Contact Me •</textPath>
                </text>
              </svg>
              <div className="arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  width="50" height="50" fill="none" stroke="black" strokeWidth="2">
                  <line x1="6" y1="18" x2="18" y2="6" />
                  <polyline points="9 6 18 6 18 15" />
                </svg>
              </div>
            </motion.div>
          )}

          {/* ── DARK MODE ─────────────────────────────────────────────────────
              Estratégia: um único container de 150×150, position relative.
              O layer rotativo e o skull partilham exactamente o mesmo centro:
              top:0 left:0 width:150 height:150 — transform-origin: 75px 75px.
              Assim os dois centros são matematicamente idênticos.
          ─────────────────────────────────────────────────────────────────── */}
          {isDark && (
            <div
              className="contactButtonContainer"
              style={{
                position:    "relative",
                width:       BTN,
                height:      BTN,
                pointerEvents: "none",
              }}
            >
              {/* ── Layer 1: SVG rotativo (texto + círculos) ── */}
              <motion.div
                style={{
                  position:        "absolute",
                  top:             0,
                  left:            0,
                  width:           BTN,
                  height:          BTN,
                  transformOrigin: `${BTN_HALF}px ${BTN_HALF}px`, // 75px 75px — centro exacto
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 200 200" width={BTN} height={BTN}>
                  {/* Círculo exterior vermelho, border preto 2px */}
                  <circle
                    cx="100" cy="100" r="89"
                    fill="#fa0505"
                    stroke="#000000"
                    strokeWidth="2"
                  />
                  {/* Círculo preto central — onde a skull vai ficar */}
                  <circle cx="100" cy="100" r="46" fill="#000000" />
                  {/* Path para o texto */}
                  <path
                    id="darkCirclePath"
                    fill="none"
                    d="M 100,100 m -64,0 a 64,64 0 1,1 128,0 a 64,64 0 1,1 -128,0"
                  />
                  {/* Texto único, bold, sem ponto final */}
                  <text
                    fontSize="24"
                    fontWeight="bold"
                    fill="black"
                    letterSpacing="3"
                  >
                    <textPath href="#darkCirclePath" startOffset="0%">
                      Take a walk on the Dark Side. •
                    </textPath>
                  </text>
                </svg>
              </motion.div>

              {/* ── Layer 2: Skull estática — mesmo centro, não roda ── */}
              <div
                style={{
                  position:        "absolute",
                  top:             0,
                  left:            0,
                  width:           BTN,
                  height:          BTN,
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  pointerEvents:   "none",
                }}
              >
                <div style={{
                  width:           "92px",
                  height:          "92px",
                  borderRadius:    "50%",
                  overflow:        "hidden",
                  backgroundColor: "#000000",
                  flexShrink:      0,
                }}>
                  <img
                    src="/skull_001.png"
                    alt="skull"
                    style={{
                      width:        "100%",
                      height:       "100%",
                      objectFit:    "cover",
                      mixBlendMode: "screen",
                      display:      "block",
                    }}
                  />
                </div>
              </div>

            </div>
          )}

        </motion.a>

      </div>

      {/* ── BG ── */}
      <div className="bg">
        <Suspense fallback={null}>
          {isDark ? <NeuralBgDark /> : <NeuralBg />}
        </Suspense>
        <div className="avatar">
          <img src={avatarSrc} alt="" />
        </div>
      </div>

    </motion.div>
  )
}

export default Hero
