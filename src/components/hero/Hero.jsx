// src/components/hero/Hero.jsx
import { Facebook, Instagram, Linkedin } from "lucide-react"
import "./hero.css"
import Speech    from "./Speech"
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
          <motion.span className="hName" style={{ display: "block" }} variants={fromLeft(T2)}>
            {isDark ? "I'm Orpheu!" : "I'm Paulo!"}
          </motion.span>
        </h1>

        <motion.div className="awards" variants={fromLeft(T3)}>
          <h2 className="aTitle">
            <motion.span style={{ display: "block" }} variants={fromLeft(T3_1, 0.8)}>
              <span>Fullstack</span>
            </motion.span>
            <motion.span
              style={{ display: "block", color: "white", fontWeight: "bold" }}
              variants={fromLeft(T4, 0.8)}
            >
              Web Developer
            </motion.span>
          </h2>

          <motion.p className="aDesc" variants={fromLeft(T5, 0.8)}>
            Expertise em criar soluções digitais robustas e escaláveis,
            unindo o rigor do backend à fluidez do frontend.
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

        <Speech delay={SPEECH_DELAY} />

        <motion.div className="certificate" variants={fadeIn(SPEECH_DELAY + 0.3)}>
          <img src="/passaporte_qualifica_Logo_001.png" className="cImg" alt="Certificado" />
          CERTIFIED PROFESSIONAL
        </motion.div>

        <motion.a
          href="#contacts"
          className="contactBtn"
          style={{ display: "block", cursor: "pointer", pointerEvents: "auto" }}
          variants={contactBtnEntry}
        >
          <motion.div
            className="contactButtonContainer"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ pointerEvents: "none" }}
          >
            <svg viewBox="0 0 200 200" width="150" height="150">
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
        </motion.a>

      </div>

      {/* ── BG: NeuralBg normal OU NeuralBgDark ─────────────────────────────── */}
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
