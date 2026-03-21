// src/components/hero/NeuralBgDark.jsx
// ─── Clone do NeuralBg para dark mode ────────────────────────────────────────
// • Triângulos  → neutral-200, overlay, alpha 0.184 (+15%)
// • Arestas     → vermelho puro (220, 0, 0)
// • Pulsos      → vermelho puro (220, 0, 0)
// • Wave ring   → vermelho, opacity 60% no centro → 100% no edge
// • canvas      → mixBlendMode 'multiply' (bg branco)

import { useEffect, useRef } from 'react'
import { waveSync } from './Wavesync'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const C = {
  NODE_COUNT_MOBILE:  68,
  NODE_COUNT_TABLET:  85,
  NODE_COUNT_DESKTOP: 120,
  CENTER_EXTRA:       40,
  CENTER_RADIUS:      0.30,

  CLUSTERS: [
    { rx: 0.18, ry: 0.22, r: 0.11, n: 14 },
    { rx: 0.82, ry: 0.75, r: 0.11, n: 14 },
    { rx: 0.72, ry: 0.20, r: 0.10, n: 12 },
    { rx: 0.25, ry: 0.72, r: 0.10, n: 12 },
    { rx: 0.50, ry: 0.85, r: 0.09, n: 11 },
  ],

  CONNECTION_DIST: 180,
  NODE_RADIUS:     2.5,

  EDGE_OPACITY:   0.08,
  EDGE_COLOR:     '220, 0, 0',      // arestas + nós: vermelho
  PULSE_COLOR:    '220, 0, 0',      // pulsos: vermelho
  WAVE_RING_COLOR:'220, 0, 0',      // waves: vermelho

  // ── Triângulos: neutral-200, overlay, +15% vs anterior (0.16 → 0.184) ─────
  TRIANGLE_FILL:  '229, 229, 229',
  TRIANGLE_ALPHA: 0.184,

  // ── Wave opacity: nasce em 60%, chega ao edge em 100% ─────────────────────
  WAVE_ALPHA_START: 0.6,
  WAVE_ALPHA_END:   1.0,

  PULSE_SPEED:      0.0304,
  PULSE_WIDTH:      0.18,
  PULSE_SPAWN_RATE: 0.068,
  MAX_PULSES:       80,
  PULSE_CHAIN_PROB: 0.65,
  MAX_CHAIN:        6,

  BURST_PROB:              0.80,
  BURST_COUNT_MIN:         2,
  BURST_COUNT_MAX:         4,
  BURST_INTERVAL_MS:       240,
  BURST_ALTERNATE_EVERY:   3,
  BURST_LIGHT_COUNT_MIN:   1,
  BURST_LIGHT_COUNT_MAX:   2,
  BURST_LIGHT_INTERVAL_MS: 350,
  BURST_LIGHT_SPEED_MULT:  0.9,

  TRACE_FADE_MS:     2500,
  PULSE_HEAD_RADIUS: 1.5,
  PULSE_GLOW_MULT:   3.5,

  BASE_DRIFT:   0.08,
  SPRING_K:     0.009,
  SPRING_DAMP:  0.88,
  MICRO_DAMP:   0.97,
  MAX_NODE_VEL: 6,

  WAVE_SPEED:       180,
  WAVE_INNER_START: 0,
  WAVE_OUTER_START: 30,
  WAVE_EXPAND_RATE: 0.18,
  WAVE_OUTER_GROW:  0.06,
  WAVE_FORCE:       1.4,
  WAVE_COUNT:       5,
  WAVE_DELAY:       1.2,

  ECHO_AMPLITUDES: [0.55, 0.32, 0.16],
  CYCLE_IDLE_MS:   1200,
  CYCLE_REST_MS:   800,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.random() * (max - min) + min
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const bell  = t => Math.sin(Math.PI * clamp(t, 0, 1))
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2

const buildGraph = (nodes, maxDist) => {
  const edges = []
  const adj   = Array.from({ length: nodes.length }, () => [])
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      if (Math.sqrt(dx*dx + dy*dy) < maxDist) {
        edges.push({ a: i, b: j, dist: Math.sqrt(dx*dx+dy*dy), lastLit: 0 })
        adj[i].push(j)
        adj[j].push(i)
      }
    }
  }
  return { edges, adj }
}

const computeTriangles = (nodes, edges) => {
  const adjSet = Array.from({ length: nodes.length }, () => new Set())
  edges.forEach(({ a, b }) => { adjSet[a].add(b); adjSet[b].add(a) })
  const triangles = []
  const seen      = new Set()
  edges.forEach(({ a, b }) => {
    adjSet[a].forEach(c => {
      if (c !== b && adjSet[b].has(c)) {
        const key = [a, b, c].sort((x, y) => x - y).join('-')
        if (!seen.has(key)) { seen.add(key); triangles.push([a, b, c]) }
      }
    })
  })
  return triangles
}

// ─── NeuralBgDark ─────────────────────────────────────────────────────────────
const NeuralBgDark = () => {
  const canvasRef    = useRef(null)
  const stateRef     = useRef(null)
  const burstTimers  = useRef([])
  const burstCounter = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    const init = () => {
      const W       = canvas.width
      const H       = canvas.height
      const desktop = W >= 1024
      const tablet  = W >= 640 && W < 1024
      const baseN   = desktop ? C.NODE_COUNT_DESKTOP
                    : tablet  ? C.NODE_COUNT_TABLET
                    :           C.NODE_COUNT_MOBILE

      const nodes  = []
      const mkNode = (x, y) => ({
        x, y, ox: x, oy: y,
        vx: rand(-C.BASE_DRIFT, C.BASE_DRIFT),
        vy: rand(-C.BASE_DRIFT, C.BASE_DRIFT),
      })

      for (let i = 0; i < baseN; i++) nodes.push(mkNode(rand(0, W), rand(0, H)))

      if (desktop) {
        const cx = W / 2, cy = H / 2
        const cr = Math.min(W, H) * C.CENTER_RADIUS
        for (let i = 0; i < C.CENTER_EXTRA; i++) {
          const a = Math.random() * Math.PI * 2
          const r = Math.sqrt(Math.random()) * cr
          nodes.push(mkNode(cx + Math.cos(a)*r, cy + Math.sin(a)*r))
        }
        C.CLUSTERS.forEach(({ rx, ry, r, n }) => {
          const clx = W * rx, cly = H * ry
          const clr = Math.min(W, H) * r
          for (let i = 0; i < n; i++) {
            const a   = Math.random() * Math.PI * 2
            const rad = Math.sqrt(Math.random()) * clr
            nodes.push(mkNode(clx + Math.cos(a)*rad, cly + Math.sin(a)*rad))
          }
        })
      }

      const { edges, adj } = buildGraph(nodes, C.CONNECTION_DIST)
      const triangles      = computeTriangles(nodes, edges)

      stateRef.current = {
        nodes, edges, adj, triangles, pulses: [], W, H,
        waves: [],
        waveCtrl: { phase: 'idle', phaseStart: performance.now() },
      }
    }

    // ── Spawn pulse ────────────────────────────────────────────────────────────
    const spawnPulse = (fromNode = null, chainDepth = 0, excludeEdge = null, isBurst = false) => {
      const s = stateRef.current
      if (!s || s.pulses.length >= C.MAX_PULSES) return

      let edgeIdx
      if (fromNode !== null && s.adj[fromNode].length > 0) {
        const candidates = s.edges
          .map((e, i) => ({ e, i }))
          .filter(({ i, e }) => i !== excludeEdge && (e.a === fromNode || e.b === fromNode))
        if (!candidates.length) return
        edgeIdx = candidates[Math.floor(Math.random() * candidates.length)].i
      } else {
        edgeIdx = Math.floor(Math.random() * s.edges.length)
      }

      s.edges[edgeIdx].lastLit = performance.now()
      const edge = s.edges[edgeIdx]
      let dir = Math.random() > 0.5 ? 1 : -1
      if (fromNode === edge.b) dir = -1
      if (fromNode === edge.a) dir =  1

      s.pulses.push({
        edgeIdx, t: dir > 0 ? 0 : 1, dir,
        speed: isBurst ? C.PULSE_SPEED * 1.4 : C.PULSE_SPEED,
        alpha: isBurst ? rand(0.45, 0.75) : rand(0.6, 1.0),
        chainDepth, edgeExclude: excludeEdge,
      })

      if (!isBurst && Math.random() < C.BURST_PROB) {
        burstCounter.current++
        const isHeavy   = (burstCounter.current % (C.BURST_ALTERNATE_EVERY * 2)) < C.BURST_ALTERNATE_EVERY
        const count     = isHeavy
          ? C.BURST_COUNT_MIN + Math.floor(Math.random() * (C.BURST_COUNT_MAX - C.BURST_COUNT_MIN + 1))
          : C.BURST_LIGHT_COUNT_MIN + Math.floor(Math.random() * (C.BURST_LIGHT_COUNT_MAX - C.BURST_LIGHT_COUNT_MIN + 1))
        const interval  = isHeavy ? C.BURST_INTERVAL_MS : C.BURST_LIGHT_INTERVAL_MS
        const speedMult = isHeavy ? 1.4 : C.BURST_LIGHT_SPEED_MULT

        for (let k = 1; k <= count; k++) {
          const tid = setTimeout(() => {
            const s = stateRef.current
            if (!s || s.pulses.length >= C.MAX_PULSES) return
            const busy       = s.pulses.filter(p => p.edgeIdx === edgeIdx).length
            const targetEdge = busy < 3 ? edgeIdx : Math.floor(Math.random() * s.edges.length)
            s.edges[targetEdge].lastLit = performance.now()
            const dir = Math.random() > 0.5 ? 1 : -1
            s.pulses.push({
              edgeIdx: targetEdge, t: dir > 0 ? 0 : 1, dir,
              speed: C.PULSE_SPEED * speedMult,
              alpha: isHeavy ? rand(0.45, 0.75) : rand(0.22, 0.48),
              chainDepth: 0, edgeExclude: null,
            })
          }, k * interval)
          burstTimers.current.push(tid)
        }
      }
    }

    // ── Wave launch ────────────────────────────────────────────────────────────
    const launchWaves = (now, forceMult = 1) => {
      const s = stateRef.current
      s.waves.push(...Array.from({ length: C.WAVE_COUNT }, (_, i) => ({
        startTime: now + i * C.WAVE_DELAY * 1000,
        forceMult,
      })))
    }

    // ── Wave cycle ─────────────────────────────────────────────────────────────
    const updateWaves = (now) => {
      const s       = stateRef.current
      const wc      = s.waveCtrl
      const diagR   = Math.sqrt(s.W * s.W + s.H * s.H)
      const elapsed = now - wc.phaseStart
      const groupDuration = (C.WAVE_COUNT - 1) * C.WAVE_DELAY * 1000
        + (diagR / C.WAVE_SPEED) * 1000 + 600

      if (wc.phase === 'idle') {
        waveSync.revealProgress = 0
        if (elapsed > C.CYCLE_IDLE_MS) {
          wc.phase = 'active'; wc.phaseStart = now; wc.echoIdx = 0
          launchWaves(now, 1.0)
        }
        return
      }
      if (wc.phase === 'active') {
        waveSync.revealProgress = eio(Math.min(elapsed / 2000, 1))
        C.ECHO_AMPLITUDES.forEach((amp, idx) => {
          if (!wc[`echo${idx}Fired`] && elapsed > groupDuration * (idx + 1)) {
            wc[`echo${idx}Fired`] = true
            launchWaves(now, amp)
          }
        })
        if (elapsed > groupDuration * (C.ECHO_AMPLITUDES.length + 1)) {
          s.waves = []; wc.phase = 'rest'; wc.phaseStart = now
          waveSync.isActive = false
        }
        return
      }
      if (wc.phase === 'rest') {
        waveSync.revealProgress = 1 - eio(Math.min(elapsed / C.CYCLE_REST_MS, 1))
        if (elapsed > C.CYCLE_REST_MS) {
          wc.phase = 'active'; wc.phaseStart = now; wc.echoIdx = 0
          s.waves = []
          C.ECHO_AMPLITUDES.forEach((_, idx) => { wc[`echo${idx}Fired`] = false })
          launchWaves(now, 1.0)
        }
        return
      }
    }

    // ── Wave physics — displacement mantido ───────────────────────────────────
    const applyWavePhysics = (now) => {
      const s  = stateRef.current
      const cx = s.W / 2, cy = s.H / 2
      s.waves = s.waves.filter(w => {
        const age = (now - w.startTime) / 1000
        if (age < 0) return true
        const midR       = age * C.WAVE_SPEED
        const innerThick = C.WAVE_INNER_START + midR * C.WAVE_EXPAND_RATE
        const outerThick = C.WAVE_OUTER_START  + midR * C.WAVE_OUTER_GROW
        const innerR     = Math.max(0, midR - innerThick)
        const outerR     = midR + outerThick
        const bandwidth  = outerR - innerR
        const force      = C.WAVE_FORCE * (w.forceMult ?? 1)
        s.nodes.forEach(n => {
          const dx = n.x - cx, dy = n.y - cy
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 0.1 || bandwidth < 1) return
          const tBand = (dist - innerR) / bandwidth
          if (tBand >= 0 && tBand <= 1) {
            const mag = bell(tBand) * eio(bell(tBand)) * force * 0.5
            n.vx += (dx / dist) * mag
            n.vy += (dy / dist) * mag
          }
        })
        return innerR < Math.sqrt(s.W*s.W + s.H*s.H) + outerThick
      })
    }

    // ── Draw ───────────────────────────────────────────────────────────────────
    let rafId

    const draw = () => {
      const s = stateRef.current
      if (!s) { rafId = requestAnimationFrame(draw); return }
      const { nodes, edges, triangles, pulses, W, H } = s
      const now = performance.now()
      const cx  = W / 2, cy = H / 2

      updateWaves(now)
      applyWavePhysics(now)

      // Física dos nós
      nodes.forEach(n => {
        const fx = (n.ox - n.x) * C.SPRING_K
        const fy = (n.oy - n.y) * C.SPRING_K
        n.vx = (n.vx + fx) * C.SPRING_DAMP * C.MICRO_DAMP
        n.vy = (n.vy + fy) * C.SPRING_DAMP * C.MICRO_DAMP
        n.vx = clamp(n.vx, -C.MAX_NODE_VEL, C.MAX_NODE_VEL)
        n.vy = clamp(n.vy, -C.MAX_NODE_VEL, C.MAX_NODE_VEL)
        n.x += n.vx; n.y += n.vy
        if (n.x < 0) n.vx += 0.4
        if (n.x > W) n.vx -= 0.4
        if (n.y < 0) n.vy += 0.4
        if (n.y > H) n.vy -= 0.4
      })

      ctx.clearRect(0, 0, W, H)

      const diagR = Math.sqrt(W*W + H*H)

      // ── 1. WAVE RINGS — vermelho, 60% → 100% opacity ao expandir ────────────
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      s.waves.forEach(w => {
        const age = (now - w.startTime) / 1000
        if (age < 0) return
        const midR       = age * C.WAVE_SPEED
        const innerThick = C.WAVE_INNER_START + midR * C.WAVE_EXPAND_RATE
        const outerThick = C.WAVE_OUTER_START  + midR * C.WAVE_OUTER_GROW
        const innerR     = Math.max(0, midR - innerThick)
        const outerR     = midR + outerThick

        // progress: 0 no centro, 1 no edge — opacity cresce de 60% → 100%
        const progress  = clamp(midR / diagR, 0, 1)
        const waveAlpha = C.WAVE_ALPHA_START + (C.WAVE_ALPHA_END - C.WAVE_ALPHA_START) * progress

        ctx.beginPath()
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2, false)
        if (innerR > 0) ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true)
        ctx.fillStyle = `rgba(${C.WAVE_RING_COLOR}, ${waveAlpha})`
        ctx.fill('evenodd')
      })
      ctx.restore()

      // ── 2. TRIÂNGULOS — neutral-200, overlay, alpha 0.184 ────────────────────
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = C.TRIANGLE_ALPHA
      triangles.forEach(([ai, bi, ci]) => {
        const na = nodes[ai], nb = nodes[bi], nc = nodes[ci]
        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.lineTo(nc.x, nc.y)
        ctx.closePath()
        ctx.fillStyle = `rgb(${C.TRIANGLE_FILL})`
        ctx.fill()
      })
      ctx.globalAlpha = 1
      ctx.restore()

      // ── 3. ARESTAS — vermelho com trace fade ─────────────────────────────────
      edges.forEach(({ a, b, lastLit }) => {
        const na    = nodes[a], nb = nodes[b]
        const age   = now - lastLit
        const fresh = lastLit > 0 ? clamp(1 - age / C.TRACE_FADE_MS, 0, 1) : 0
        const alpha = C.EDGE_OPACITY + fresh * (0.45 - C.EDGE_OPACITY)
        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = `rgba(${C.EDGE_COLOR}, ${alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // ── 4. NÓS — vermelho ────────────────────────────────────────────────────
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, C.NODE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${C.EDGE_COLOR}, 0.25)`
        ctx.fill()
      })

      // ── 5. PULSOS — vermelho puro ─────────────────────────────────────────────
      const toRemove = []
      pulses.forEach((p, pi) => {
        const { a, b } = edges[p.edgeIdx]
        const na   = nodes[a], nb = nodes[b]
        const head = p.t
        const tail = head - p.dir * C.PULSE_WIDTH
        const hx   = na.x + (nb.x - na.x) * head
        const hy   = na.y + (nb.y - na.y) * head
        const tx   = na.x + (nb.x - na.x) * clamp(tail, 0, 1)
        const ty   = na.y + (nb.y - na.y) * clamp(tail, 0, 1)

        const grad = ctx.createLinearGradient(tx, ty, hx, hy)
        grad.addColorStop(0,   `rgba(${C.PULSE_COLOR}, 0)`)
        grad.addColorStop(0.5, `rgba(${C.PULSE_COLOR}, ${p.alpha * 0.35})`)
        grad.addColorStop(1,   `rgba(${C.PULSE_COLOR}, ${p.alpha})`)
        ctx.beginPath()
        ctx.moveTo(tx, ty); ctx.lineTo(hx, hy)
        ctx.strokeStyle = grad
        ctx.lineWidth   = 1.5
        ctx.shadowBlur  = 4
        ctx.shadowColor = `rgba(${C.PULSE_COLOR}, 0.4)`
        ctx.stroke()
        ctx.shadowBlur  = 0

        const gr   = C.PULSE_HEAD_RADIUS
        const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, gr * C.PULSE_GLOW_MULT)
        halo.addColorStop(0,   `rgba(${C.PULSE_COLOR}, ${p.alpha * 0.85})`)
        halo.addColorStop(0.3, `rgba(${C.PULSE_COLOR}, ${p.alpha * 0.3})`)
        halo.addColorStop(1,   `rgba(${C.PULSE_COLOR}, 0)`)
        ctx.beginPath()
        ctx.arc(hx, hy, gr * C.PULSE_GLOW_MULT, 0, Math.PI * 2)
        ctx.fillStyle = halo; ctx.fill()

        ctx.beginPath()
        ctx.arc(hx, hy, gr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${C.PULSE_COLOR}, ${p.alpha})`
        ctx.fill()

        p.t += p.dir * (p.speed ?? C.PULSE_SPEED)
        const arrived = p.dir > 0 ? p.t >= 1 : p.t <= 0

        if (arrived) {
          const arrNode = p.dir > 0 ? b : a
          if (p.chainDepth < C.MAX_CHAIN && Math.random() < C.PULSE_CHAIN_PROB) {
            spawnPulse(arrNode, p.chainDepth + 1, p.edgeIdx, true)
          }
          const fx    = nodes[arrNode].x, fy = nodes[arrNode].y
          const flash = ctx.createRadialGradient(fx, fy, 0, fx, fy, 5)
          flash.addColorStop(0, `rgba(${C.PULSE_COLOR}, ${p.alpha * 0.9})`)
          flash.addColorStop(1, `rgba(${C.PULSE_COLOR}, 0)`)
          ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2)
          ctx.fillStyle = flash; ctx.fill()
          toRemove.push(pi)
        }
      })

      toRemove.reverse().forEach(i => pulses.splice(i, 1))
      if (Math.random() < C.PULSE_SPAWN_RATE) spawnPulse()

      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    setTimeout(() => { for (let i = 0; i < 8; i++) spawnPulse() }, 100)
    rafId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
      burstTimers.current.forEach(clearTimeout)
      burstTimers.current = []
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        width:         '100%',
        height:        '100%',
        mixBlendMode:  'multiply',
        pointerEvents: 'none',
        zIndex:        0,
      }}
    />
  )
}

export default NeuralBgDark
