import { motion } from "framer-motion"

const Speech = ({ delay = 0 }) => {
  const AVATAR_DUR  = 0.55
  const BUBBLE_LAG  = 0.15

  return (
    <div className="bubbleContainer">

      <motion.div
        className="bubble"
        initial={{ x: 70, opacity: 0, scaleX: 0.3 }}
        whileInView={{
          x: 0,
          opacity: 1,
          scaleX: 1,
          transition: {
            delay:    delay + AVATAR_DUR + BUBBLE_LAG,
            duration: 0.65,
            ease:     [0.22, 1, 0.36, 1],
          },
        }}
        viewport={{ once: false, amount: 0.5 }}
        style={{ originX: 1 }}
      >
        TEXT
      </motion.div>

      <motion.img
        src="/man.png"
        className="paulo"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{
          scale:   1,
          opacity: 1,
          transition: {
            delay,
            duration: AVATAR_DUR,
            ease:     [0.34, 1.56, 0.64, 1],
          },
        }}
        viewport={{ once: false, amount: 0.5 }}
        style={{ borderRadius: "100%" }}
      />

    </div>
  )
}

export default Speech
