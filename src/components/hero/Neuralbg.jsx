// src/components/hero/Neuralbg.jsx
// Mesh original (verde, pulsos activos, screen blend) â€” INALTERADO
// GalÃ¡xia: 6 emissores + clone 30Â°, cascata -10%/partÃ­cula, speed dinÃ¢mico,
// paleta branco/preto/magenta/ciano/amarelo.

import { useEffect, useRef } from 'react'

// â”€â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {

  // â”€â”€ Mesh â€” valores originais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Cores originais: verde â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  EDGE_OPACITY:  0.08,
  EDGE_COLOR:    '21, 237, 122',
  PULSE_COLOR:   '21, 237, 122',

  // â”€â”€ TriÃ¢ngulos originais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  TRIANGLE_FILL:  '21, 237, 122',
  TRIANGLE_ALPHA: 0.08,

  // â”€â”€ FÃ­sica original â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  BASE_DRIFT:   0.08,
  SPRING_K:     0.009,
  SPRING_DAMP:  0.88,
  MICRO_DAMP:   0.97,
  MAX_NODE_VEL: 6,

  // â”€â”€ Pulsos originais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  PULSE_SPEED:              0.0104,
  PULSE_WIDTH:              0.18,
  PULSE_SPAWN_RATE:         0.068,
  MAX_PULSES:               52,
  PULSE_CHAIN_PROB:         0.65,
  MAX_CHAIN:                6,
  BURST_PROB:               0.50,
  BURST_COUNT_MIN:          2,
  BURST_COUNT_MAX:          4,
  BURST_INTERVAL_MS:        240,
  BURST_ALTERNATE_EVERY:    3,
  BURST_LIGHT_COUNT_MIN:    1,
  BURST_LIGHT_COUNT_MAX:    2,
  BURST_LIGHT_INTERVAL_MS:  350,
  BURST_LIGHT_SPEED_MULT:   0.9,
  TRACE_FADE_MS:            2500,
  PULSE_HEAD_RADIUS:        1.5,
  PULSE_GLOW_MULT:          3.5,

  // â”€â”€ GalÃ¡xia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  GAL_ARMS:             6,
  GAL_ROT_SPEED:        0.600,     // rad/s â€” CCW
  GAL_WAVE_INTERVAL:    4000,      // ms
  GAL_SPAWN_PER_ARM:    10,        // partÃ­culas por emissor
  GAL_SPAWN_DELAY:      100,        // ms de delay entre partÃ­culas do mesmo emissor
  GAL_LIFETIME:         7000,      // ms
  GAL_LIFETIME_VAR:     0.35,      // Â±35%
  GAL_RADIUS_BIRTH:     1.0,       // px nascimento
  GAL_RADIUS_PEAK:      100,       // px pico da 1Âª partÃ­cula (as seguintes -10%)
  GAL_SPEED:            105,       // px/s base (serÃ¡ elevado se necessÃ¡rio para atingir o edge)
  GAL_SPEED_VAR:        0.80,      // Â±40%
  GAL_MAX_PARTICLES:    600,
  GAL_CORE_RADIUS:      55,
  GAL_CORE_ALPHA:       0.09,
  GAL_EMIT_RADIUS_DESKTOP: 50,
  GAL_EMIT_RADIUS_MOBILE:   50,
  GAL_PALETTE: [
    '255, 255, 255',   // branco
    '0,   0,   0',     // preto
    '255, 0,   255',   // magenta
    '0,   255, 255',   // ciano
    '255, 255, 0',     // amarelo
  ],
  // Clone: offset angular e scale do peak radius
  GAL_CLONE_OFFSET:      Math.PI / 6,   // 30Â°
  GAL_CLONE_SIZE_FACTOR: 0.5,           // 50% do tamanho principal
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const rand  = (min, max) => Math.random() * (max - min) + min
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
const bell  = t => eio(Math.min(t*2,1)) - eio(Math.max(t*2-1,0))

const buildGraph = (nodes, maxDist) => {
  const edges = [], adj = Array.from({ length: nodes.length }, () => [])
  for (let i = 0; i < nodes.length; i++)
    for (let j = i+1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
      if (Math.sqrt(dx*dx + dy*dy) < maxDist) {
        edges.push({ a: i, b: j, dist: Math.sqrt(dx*dx+dy*dy), lastLit: 0 })
        adj[i].push(j); adj[j].push(i)
      }
    }
  return { edges, adj }
}

const computeTriangles = (nodes, edges) => {
  const adjSet = Array.from({ length: nodes.length }, () => new Set())
  edges.forEach(({ a, b }) => { adjSet[a].add(b); adjSet[b].add(a) })
  const triangles = [], seen = new Set()
  edges.forEach(({ a, b }) => {
    adjSet[a].forEach(c => {
      if (c !== b && adjSet[b].has(c)) {
        const key = [a,b,c].sort((x,y)=>x-y).join('-')
        if (!seen.has(key)) { seen.add(key); triangles.push([a,b,c]) }
      }
    })
  })
  return triangles
}


// â”€â”€â”€ NeuralBg â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NeuralBg = () => {
  const canvasRef    = useRef(null)
  const stateRef     = useRef(null)
  const burstTimers  = useRef([])
  const burstCounter = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let rafId

    let galaxyAngle = 0
    let lastWaveTs  = performance.now() - C.GAL_WAVE_INTERVAL
    let lastFrame   = performance.now()
    const gParticles = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    const init = () => {
      const W = canvas.width, H = canvas.height
      const desktop = W >= 1024, tablet = W >= 640 && W < 1024
      const baseN = desktop ? C.NODE_COUNT_DESKTOP : tablet ? C.NODE_COUNT_TABLET : C.NODE_COUNT_MOBILE
      const nodes = []
      const mkNode = (x, y) => ({
        x, y, ox: x, oy: y,
        vx: rand(-C.BASE_DRIFT, C.BASE_DRIFT),
        vy: rand(-C.BASE_DRIFT, C.BASE_DRIFT),
      })
      for (let i = 0; i < baseN; i++) nodes.push(mkNode(rand(0,W), rand(0,H)))
      if (desktop) {
        const cx = W/2, cy = H/2, cr = Math.min(W,H) * C.CENTER_RADIUS
        for (let i = 0; i < C.CENTER_EXTRA; i++) {
          const a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*cr
          nodes.push(mkNode(cx+Math.cos(a)*r, cy+Math.sin(a)*r))
        }
        C.CLUSTERS.forEach(({ rx, ry, r, n }) => {
          const clx=W*rx, cly=H*ry, clr=Math.min(W,H)*r
          for (let i=0; i<n; i++) {
            const a=Math.random()*Math.PI*2, rad=Math.sqrt(Math.random())*clr
            nodes.push(mkNode(clx+Math.cos(a)*rad, cly+Math.sin(a)*rad))
          }
        })
      }
      const { edges, adj } = buildGraph(nodes, C.CONNECTION_DIST)
      const triangles = computeTriangles(nodes, edges)
      stateRef.current = { nodes, edges, adj, triangles, pulses: [], W, H }
    }

    const spawnPulse = (fromNode=null, chainDepth=0, excludeEdge=null, isBurst=false) => {
      const s = stateRef.current
      if (!s || s.pulses.length >= C.MAX_PULSES) return
      let edgeIdx
      if (fromNode !== null && s.adj[fromNode].length > 0) {
        const candidates = s.edges.map((e,i)=>({e,i}))
          .filter(({i,e}) => i!==excludeEdge && (e.a===fromNode||e.b===fromNode))
        if (!candidates.length) return
        edgeIdx = candidates[Math.floor(Math.random()*candidates.length)].i
      } else {
        edgeIdx = Math.floor(Math.random()*s.edges.length)
      }
      s.edges[edgeIdx].lastLit = performance.now()
      const edge = s.edges[edgeIdx]
      let dir = Math.random() > 0.5 ? 1 : -1
      if (fromNode === edge.b) dir = -1
      if (fromNode === edge.a) dir =  1
      s.pulses.push({
        edgeIdx, t: dir>0?0:1, dir,
        speed: isBurst ? C.PULSE_SPEED*C.BURST_LIGHT_SPEED_MULT : C.PULSE_SPEED,
        alpha: isBurst ? rand(0.45,0.75) : rand(0.6,1.0),
        chainDepth, edgeExclude: excludeEdge,
      })
      if (!isBurst && Math.random() < C.BURST_PROB) {
        burstCounter.current++
        const isHeavy  = (burstCounter.current % (C.BURST_ALTERNATE_EVERY*2)) < C.BURST_ALTERNATE_EVERY
        const count    = Math.ceil(isHeavy
          ? rand(C.BURST_COUNT_MIN,        C.BURST_COUNT_MAX+1)
          : rand(C.BURST_LIGHT_COUNT_MIN,  C.BURST_LIGHT_COUNT_MAX+1))
        const interval = isHeavy ? C.BURST_INTERVAL_MS : C.BURST_LIGHT_INTERVAL_MS
        const arrNode  = dir>0 ? edge.b : edge.a
        for (let b=0; b<count; b++) {
          burstTimers.current.push(
            setTimeout(() => spawnPulse(arrNode, 0, edgeIdx, true), b*interval)
          )
        }
      }
    }

    // â”€â”€ spawnRingArm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Emite GAL_SPAWN_PER_ARM partÃ­culas de um Ãºnico ponto no anel.
    // - index p: define peakRadius (p=0 â†’ peak mÃ¡x, cada +1 â†’ -10%)
    // - sizeFactor: multiplicador adicional de peak (para o clone)
    // - born delay: p * GAL_SPAWN_DELAY â†’ dispersÃ£o espacial progressiva
    // - speed dinÃ¢mico: garante que a partÃ­cula chega ao edge do viewport
    const spawnRingArm = (cx, cy, armAngle, emitR, diagR, sizeFactor) => {
      const ex = cx + Math.cos(armAngle) * emitR
      const ey = cy + Math.sin(armAngle) * emitR

      for (let p = 0; p < C.GAL_SPAWN_PER_ARM; p++) {
        if (gParticles.length >= C.GAL_MAX_PARTICLES) break
        
        // A cor agora Ã© calculada aqui dentro, gerando uma cor Ãºnica por partÃ­cula
        const color = C.GAL_PALETTE[Math.floor(Math.random() * C.GAL_PALETTE.length)]

        const lifetime = C.GAL_LIFETIME * (1 + (Math.random()-0.5) * C.GAL_LIFETIME_VAR)

        // Speed dinÃ¢mico â€” partÃ­cula deve percorrer diagR em ~90% do lifetime
        const lifeSec = lifetime / 1000
        const minSpeed = (diagR - emitR) / (lifeSec * 0.88)
        const baseSpeed = Math.max(C.GAL_SPEED, minSpeed)
        const speed = baseSpeed * (1 + (Math.random()-0.5) * C.GAL_SPEED_VAR)

        const vx = Math.cos(armAngle) * speed
        const vy = Math.sin(armAngle) * speed

        // Cascata de tamanho: 1Âª partÃ­cula = peak, cada seguinte -10%
        const peakRadius = C.GAL_RADIUS_PEAK * sizeFactor * Math.pow(0.90, p)

        gParticles.push({
          x: ex, y: ey,
          vx, vy,
          born:     performance.now() + p * C.GAL_SPAWN_DELAY,
          lifetime,
          color,
          peakRadius,
        })
      }
    }

    // â”€â”€ fireGalaxyWave â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fireGalaxyWave = (cx, cy, W, diagR) => {
      const isMobile = W < 640
      const emitR    = isMobile ? C.GAL_EMIT_RADIUS_MOBILE : C.GAL_EMIT_RADIUS_DESKTOP

      for (let arm = 0; arm < C.GAL_ARMS; arm++) {
        const armAngle = arm * (Math.PI * 2 / C.GAL_ARMS) + galaxyAngle

        // Anel principal
        spawnRingArm(cx, cy, armAngle, emitR, diagR, 1.0)

        // Clone 30Â° â€” 50% do tamanho peak
        spawnRingArm(cx, cy, armAngle + C.GAL_CLONE_OFFSET, emitR, diagR, C.GAL_CLONE_SIZE_FACTOR)
      }
    }

    const draw = (now) => {
      const s = stateRef.current
      if (!s) { rafId = requestAnimationFrame(draw); return }

      const dt = Math.min((now - lastFrame)/1000, 0.05)
      lastFrame = now

      const { nodes, edges, triangles, pulses, W, H } = s
      const cx = W/2, cy = H/2
      const diagR = Math.sqrt(W*W + H*H)

      ctx.clearRect(0, 0, W, H)

      // â”€â”€â”€ 1. GALÃXIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      galaxyAngle -= C.GAL_ROT_SPEED * dt

      // Core glow central
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, C.GAL_CORE_RADIUS)
      cg.addColorStop(0, `rgba(255,255,255,${C.GAL_CORE_ALPHA})`)
      cg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath(); ctx.arc(cx, cy, C.GAL_CORE_RADIUS, 0, Math.PI*2)
      ctx.fillStyle = cg; ctx.fill()

      if (now - lastWaveTs >= C.GAL_WAVE_INTERVAL) {
        lastWaveTs = now
        fireGalaxyWave(cx, cy, W, diagR)
      }

      // PartÃ­culas â€” born delay: nÃ£o renderiza antes do tempo de nascimento
      let pi = gParticles.length
      while (pi--) {
        const p   = gParticles[pi]
        if (now < p.born) continue          // ainda nÃ£o nasceu
        const age = now - p.born
        const t   = age / p.lifetime
        if (t >= 1) { gParticles.splice(pi, 1); continue }
        p.x += p.vx * dt
        p.y += p.vy * dt
        const b     = bell(t)
        const size  = C.GAL_RADIUS_BIRTH + (p.peakRadius - C.GAL_RADIUS_BIRTH) * b
        const alpha = (b * 0.88).toFixed(3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI*2)
        ctx.fillStyle = `rgba(${p.color},${alpha})`
        ctx.fill()
      }

      // â”€â”€â”€ 2. TRIÃ‚NGULOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = C.TRIANGLE_ALPHA
      triangles.forEach(([ai,bi,ci]) => {
        const na=nodes[ai], nb=nodes[bi], nc=nodes[ci]
        ctx.beginPath()
        ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y); ctx.lineTo(nc.x,nc.y)
        ctx.closePath()
        ctx.fillStyle = `rgb(${C.TRIANGLE_FILL})`; ctx.fill()
      })
      ctx.globalAlpha = 1; ctx.restore()

      // â”€â”€â”€ 3. ARESTAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      edges.forEach(({ a, b, lastLit }) => {
        const na=nodes[a], nb=nodes[b]
        const age   = now - lastLit
        const fresh = lastLit>0 ? clamp(1 - age/C.TRACE_FADE_MS, 0, 1) : 0
        const alpha = C.EDGE_OPACITY + fresh*(0.45-C.EDGE_OPACITY)
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y)
        ctx.strokeStyle = `rgba(${C.EDGE_COLOR},${alpha})`; ctx.lineWidth=1; ctx.stroke()
      })

      // â”€â”€â”€ 4. NÃ“S â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x,n.y,C.NODE_RADIUS,0,Math.PI*2)
        ctx.fillStyle = `rgba(${C.EDGE_COLOR},0.25)`; ctx.fill()
      })

      // â”€â”€â”€ 5. PULSOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const toRemove = []
      pulses.forEach((p, pIdx) => {
        const { a, b } = edges[p.edgeIdx]
        const na=nodes[a], nb=nodes[b]
        const head=p.t, tail=head-p.dir*C.PULSE_WIDTH
        const hx=na.x+(nb.x-na.x)*head, hy=na.y+(nb.y-na.y)*head
        const tx=na.x+(nb.x-na.x)*clamp(tail,0,1), ty=na.y+(nb.y-na.y)*clamp(tail,0,1)
        const grad = ctx.createLinearGradient(tx,ty,hx,hy)
        grad.addColorStop(0,   `rgba(${C.PULSE_COLOR},0)`)
        grad.addColorStop(0.5, `rgba(${C.PULSE_COLOR},${p.alpha*0.35})`)
        grad.addColorStop(1,   `rgba(${C.PULSE_COLOR},${p.alpha})`)
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(hx,hy)
        ctx.strokeStyle=grad; ctx.lineWidth=1.5
        ctx.shadowBlur=4; ctx.shadowColor=`rgba(${C.PULSE_COLOR},0.5)`
        ctx.stroke(); ctx.shadowBlur=0
        const gr   = C.PULSE_HEAD_RADIUS
        const halo = ctx.createRadialGradient(hx,hy,0,hx,hy,gr*C.PULSE_GLOW_MULT)
        halo.addColorStop(0,   `rgba(255,255,255,${p.alpha*0.85})`)
        halo.addColorStop(0.3, `rgba(${C.PULSE_COLOR},${p.alpha*0.3})`)
        halo.addColorStop(1,   `rgba(${C.PULSE_COLOR},0)`)
        ctx.beginPath(); ctx.arc(hx,hy,gr*C.PULSE_GLOW_MULT,0,Math.PI*2)
        ctx.fillStyle=halo; ctx.fill()
        ctx.beginPath(); ctx.arc(hx,hy,gr,0,Math.PI*2)
        ctx.fillStyle=`rgba(255,255,255,${p.alpha})`; ctx.fill()
        p.t += p.dir*(p.speed ?? C.PULSE_SPEED)
        const arrived = p.dir>0 ? p.t>=1 : p.t<=0
        if (arrived) {
          const arrNode = p.dir>0 ? b : a
          if (p.chainDepth<C.MAX_CHAIN && Math.random()<C.PULSE_CHAIN_PROB)
            spawnPulse(arrNode, p.chainDepth+1, p.edgeIdx, true)
          const fx=nodes[arrNode].x, fy=nodes[arrNode].y
          const flash = ctx.createRadialGradient(fx,fy,0,fx,fy,5)
          flash.addColorStop(0, `rgba(255,255,255,${p.alpha*0.9})`)
          flash.addColorStop(1, 'rgba(21,237,122,0)')
          ctx.beginPath(); ctx.arc(fx,fy,5,0,Math.PI*2)
          ctx.fillStyle=flash; ctx.fill()
          toRemove.push(pIdx)
        }
      })
      toRemove.reverse().forEach(i => pulses.splice(i,1))
      if (Math.random() < C.PULSE_SPAWN_RATE) spawnPulse()

      // â”€â”€â”€ 6. FÃSICA DOS NÃ“S â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      nodes.forEach(n => {
        n.vx += (n.ox - n.x) * C.SPRING_K
        n.vy += (n.oy - n.y) * C.SPRING_K
        n.vx *= C.SPRING_DAMP
        n.vy *= C.SPRING_DAMP
        const spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy)
        if (spd > C.MAX_NODE_VEL) { n.vx*=C.MAX_NODE_VEL/spd; n.vy*=C.MAX_NODE_VEL/spd }
        n.x += n.vx; n.y += n.vy
        n.vx *= C.MICRO_DAMP; n.vy *= C.MICRO_DAMP
      })

      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    setTimeout(() => { for (let i=0; i<8; i++) spawnPulse() }, 100)
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
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
        mixBlendMode:  'screen',
        pointerEvents: 'none',
        zIndex:        0,
      }}
    />
  )
}

export default NeuralBg