import { Facebook, Instagram, Linkedin } from "lucide-react";
import "./hero.css";
import Speech from "./Speech";
import Latisse from "./Latisse";
import { Suspense } from "react";
import { motion } from "framer-motion";
import NeuralBg from "./Neuralbg"

// --- Timeline absoluta (delays em segundos) ---
//  0.0s  "Hye There,"  entra  (dur 1.5s) → fim 1.5s
//  1.5s  "I'm Paulo!"  entra  (dur 1.5s) → fim 3.0s
//  3.0s  awards slide  entra  (dur 1.5s)
//  3.2s  "Fullstack"   entra  (dur 1.0s) → fim 4.2s
//  4.2s  "Web Dev"     entra  (dur 1.0s) → fim 5.2s
//  5.2s  parágrafo     entra  (dur 1.0s) → fim 6.2s
//  6.2s  img 1         entra  (dur 0.5s) → fim 6.7s
//  6.7s  img 2         entra  (dur 0.5s) → fim 7.2s
//  7.2s  img 3         entra  (dur 0.5s) → fim 7.7s
//  --- lado direito arranca com 1s de delay após esquerdo terminar ---
//  8.7s  .follow       entra  (dur 1.5s) → fim 10.2s
//  10.2s followText    roda   (dur 1.2s)

const R = 8.7 // base delay do lado direito

const Hero = () => {

  // -- Fade + slide da esquerda genérico --
  const fromLeft = (delay, duration = 1.5) => ({
    hidden:  { x: -100, opacity: 0 },
    visible: {
      x: 0, opacity: 1,
      transition: { delay, duration, ease: "easeInOut" },
    },
  })

  // -- Só fade para as imagens --
  const fadeIn = (delay, duration = 0.5) => ({
    hidden:  { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay, duration, ease: "easeInOut" },
    },
  })

  // -- .follow slide do topo --
  const followVariants = {
    hidden:  { y: -150, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: { delay: R, duration: 1.5, ease: "easeInOut" },
    },
  }

  // -- .followTextContainer roda 180° Z --
  const followTextVariants = {
    hidden:  { rotate: 180 },
    visible: {
      rotate: 0,
      transition: { delay: R + 1.5, duration: 1.2, ease: "easeInOut" },
    },
  }

  return (
    <motion.div
      className="hero"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
    >

      {/* LEFT SIDE */}
      <div className="hSection left">
        <h1 className="hTitle">
          <motion.span style={{ display: "block" }} variants={fromLeft(0)}>
            Hye There,
          </motion.span>
          <motion.span
            className="hName"
            style={{ display: "block" }}
            variants={fromLeft(1.5)}
          >
            I'm Paulo!
          </motion.span>
        </h1>

        <motion.div className="awards" variants={fromLeft(3.0)}>
          <h2 className="aTitle">
            <motion.span style={{ display: "block" }} variants={fromLeft(3.2, 1.0)}>
              <span>Fullstack</span>
            </motion.span>
            <motion.span 
              style={{ display: "block", color: "white", fontWeight: "bold" }} 
              variants={fromLeft(4.2, 1.0)} 
            >
              Web Developer
            </motion.span>
          </h2>

          <motion.p className="aDesc" variants={fromLeft(5.2, 1.0)}>
            Expertise em criar soluções digitais robustas e escaláveis,
            unindo o rigor do backend à fluidez do frontend.
          </motion.p>

          <div className="awardList">
            <motion.img
              src="/Nextjs.webp"
              className="awardImg"
              alt="Next.js"
              variants={fadeIn(6.2)}
            />
            <motion.img
              src="/React19.png"
              className="awardImg_2"
              alt="React 19"
              variants={fadeIn(6.7)}
            />
            <motion.img
              src="/wp.png"
              className="awardImg_3"
              alt="WordPress"
              variants={fadeIn(7.2)}
            />
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hSection right">
        <motion.div className="follow" variants={followVariants}>
          <a href="/" className="fLink"><Facebook /></a>
          <a href="/" className="fLink"><Instagram /></a>
          <a href="/" className="fLink"><Linkedin /></a>

          <motion.div
            className="followTextContainer"
            variants={followTextVariants}
          >
            <div className="followText">FOLLOW ME</div>
          </motion.div>
        </motion.div>

        <Speech />

        <div className="certificate">
          <img
            src="/passaporte_qualifica_Logo_001.png"
            className="cImg"
            alt="Certificado"
          />
          CERTIFIED PROFESSIONAL
        </div>

        <motion.a
          href="/#contacts"
          className="contactBtn"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="contactButton">
            <svg viewBox="0 0 200 200" width="150" height="150">
              <circle cx="100" cy="100" r="90" fill="#15ed7aff" />
              <path
                id="innerCirclePath"
                fill="none"
                d="M 100,100 m -60,0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0"
              />
              <text className="circleText">
                <textPath href="#innerCirclePath">Hire Now •</textPath>
              </text>
              <text className="circleText">
                <textPath href="#innerCirclePath" startOffset="44%">
                  Contact Me •
                </textPath>
              </text>
            </svg>
            <div className="arrow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="50"
                height="50"
                fill="none"
                stroke="black"
                strokeWidth="2"
              >
                <line x1="6" y1="18" x2="18" y2="6" />
                <polyline points="9 6 18 6 18 15" />
              </svg>
            </div>
          </div>
        </motion.a>
      </div>

      <div className="bg">
        <Suspense fallback={null}>
          {/* <Latisse />*/}
        </Suspense>
        <NeuralBg />
      </div>
    </motion.div>
  );
};

export default Hero;