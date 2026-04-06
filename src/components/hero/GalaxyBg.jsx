// src/components/hero/GalaxyBg.jsx
// Substitui o sistema wave/petal da Neuralbg no theme Uno.
// Emissores espiralados em 4 braços — partículas viajam radialmente
// do centro até ao edge do viewport, com lifecycle de 3 s e bell-curve de tamanho.

import { useEffect, useRef } from 'react'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const C = {
  // ── Galáxia ────────────────────────────────────────────────────────────────
  ARMS:             4,        // braços espiralados
  ARM_TIGHTNESS:    0.55,     // "aperto" da espiral (radianos por px de raio)
  GALAXY_ROT_SPEED: 0.012,   // radianos/segundo — rotação lenta da galáxia

  // ── Wave de emissão ────────────────────────────────────────────────────────
  WAVE_INTERVAL:    3800,    // ms entre "explosões" de galáxia
  WAVE_FRONT_SPEED: 200,     // px/s — velocidade do front de emissão
  SPAWN_PER_ARM:    4,       // partículas por braço por frame durante o front
  SPAWN_SCATTER:    22,      // px — dispersão perpendicular ao braço

  // ── Partículas ─────────────────────────────────────────────────────────────
  LIFETIME:         3000,    // ms
  LIFETIME_VAR:     0.35,    // variação ±35% de lifetime
  RADIUS_BIRTH:     1.0,     // px
  RADIUS_PEAK:      3.0,     // px no pico de vida (t=0.5)
  SPEED:            110,     // px/s radial
  SPEED_VAR:        0.45,    // variação ±45%
  ANG_DRIFT:        0.14,    // componente tangencial (0=puro radial)
  COLOR:            '255, 255, 255',
  MAX_PARTICLES:    900,     // cap de performance

  // ── Centro glow ────────────────────────────────────────────────────────────
  CORE_RADIUS:      60,      // px
  CORE_ALPHA:       0.08,    // subtil
}
// ─────────────────────────────────────────────────────────────────────────────

// ease-in-out cúbico
const eio = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2

// bell com ease: cresce suavemente até t=0.5, decresce até t=1
const bell = t => {
  const up   = eio(Math.min(t * 2, 1))
  const down = eio(Math.max(t * 2 - 1, 0))
  return up - down
}

const GalaxyBg = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    let rafId
    let lastTime    = 0
    let galaxyAngle = 0          // rotação acumulada da galáxia
    let lastWave    = -C.WAVE_INTERVAL  // dispara imediatamente no mount
    let waveActive  = false
    let waveRadius  = 0

    // Pool de partículas — array simples de objectos
    const particles = []

    // ── resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    // ── spawn ─────────────────────────────────────────────────────────────────
    // Cria uma partícula no ponto (r, spiralAngle) em coordenadas polares a partir
    // do centro da galáxia, e dá-lhe velocidade radial + drift tangencial.
    const spawn = (cx, cy, spiralAngle, r) => {
      if (particles.length >= C.MAX_PARTICLES) return

      // Dispersão perpendicular ao braço
      const perpA = spiralAngle + Math.PI / 2
      const sc    = (Math.random() - 0.5) * C.SPAWN_SCATTER

      const x = cx + Math.cos(spiralAngle) * r + Math.cos(perpA) * sc
      const y = cy + Math.sin(spiralAngle) * r + Math.sin(perpA) * sc

      // Velocidade: componente radial dominante + drift tangencial pequeno
      const speed    = C.SPEED * (1 + (Math.random() - 0.5) * C.SPEED_VAR)
      const driftDir = Math.random() > 0.5 ? 1 : -1
      const radA     = Math.atan2(y - cy, x - cx)  // ângulo real a partir do centro
      const vx = Math.cos(radA) * speed + Math.cos(radA + Math.PI/2) * driftDir * C.ANG_DRIFT * speed
      const vy = Math.sin(radA) * speed + Math.sin(radA + Math.PI/2) * driftDir * C.ANG_DRIFT * speed

      particles.push({
        x, y, vx, vy,
        born:     performance.now(),
        lifetime: C.LIFETIME * (1 + (Math.random() - 0.5) * C.LIFETIME_VAR),
      })
    }

    // ── draw loop ─────────────────────────────────────────────────────────────
    const draw = (now) => {
      const dt  = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016
      lastTime  = now

      const W = canvas.width, H = canvas.height
      const cx = W / 2, cy = H / 2

      ctx.clearRect(0, 0, W, H)

      // ── rotação lenta da galáxia ──────────────────────────────────────────
      galaxyAngle += C.GALAXY_ROT_SPEED * dt

      // ── core glow subtil ──────────────────────────────────────────────────
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, C.CORE_RADIUS)
      coreGrad.addColorStop(0,   `rgba(255,255,255,${C.CORE_ALPHA})`)
      coreGrad.addColorStop(1,   'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, C.CORE_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      // ── wave emission ─────────────────────────────────────────────────────
      const diagR = Math.sqrt(W*W + H*H)

      if (now - lastWave >= C.WAVE_INTERVAL) {
        lastWave    = now
        waveActive  = true
        waveRadius  = 0
      }

      if (waveActive) {
        waveRadius += C.WAVE_FRONT_SPEED * dt

        // Para cada braço, emite partículas no front
        for (let arm = 0; arm < C.ARMS; arm++) {
          const armBaseAngle = arm * (Math.PI * 2 / C.ARMS) + galaxyAngle
          // Ponto no braço à distância waveRadius: ângulo espiral cresce com r
          const spiralAngle = armBaseAngle + C.ARM_TIGHTNESS * waveRadius

          for (let p = 0; p < C.SPAWN_PER_ARM; p++) {
            // Variação de raio em torno do front (±12%) → espessura da onda
            const rVariation = waveRadius * (0.88 + Math.random() * 0.24)
            if (rVariation > diagR * 1.05) continue
            const sa = armBaseAngle + C.ARM_TIGHTNESS * rVariation
            spawn(cx, cy, sa, rVariation)
          }
        }

        if (waveRadius > diagR) waveActive = false
      }

      // ── partículas ────────────────────────────────────────────────────────
      let i = particles.length
      while (i--) {
        const p   = particles[i]
        const age = now - p.born
        const t   = age / p.lifetime

        if (t >= 1) { particles.splice(i, 1); continue }

        // Posição
        p.x += p.vx * dt
        p.y += p.vy * dt

        // Bell curve de tamanho + alpha com ease
        const b     = bell(t)
        const size  = C.RADIUS_BIRTH + (C.RADIUS_PEAK - C.RADIUS_BIRTH) * b
        const alpha = b * 0.90

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${C.COLOR},${alpha.toFixed(3)})`
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    // ── boot ──────────────────────────────────────────────────────────────────
    resize()
    window.addEventListener('resize', resize)
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:       'absolute',
        top:            0,
        left:           0,
        width:          '100%',
        height:         '100%',
        mixBlendMode:   'screen',
        pointerEvents:  'none',
        zIndex:         0,
      }}
    />
  )
}

export default GalaxyBg
