// src/components/hero/Neuralbg.jsx
// Mesh original (verde, pulsos activos, screen blend) — INALTERADO
// Galáxia: 6 emissores a 0°/60°/120°/180°/240°/300°, rotação CCW,
// partículas puramente radiais, paleta branco/preto/magenta/ciano/amarelo.

import { useEffect, useRef } from 'react'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const C = {

  // ── Mesh — valores originais ───────────────────────────────────────────────
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

  // ── Cores originais: verde ─────────────────────────────────────────────────
  EDGE_OPACITY:  0.08,
  EDGE_COLOR:    '21, 237, 122',
  PULSE_COLOR:   '21, 237, 122',

  // ── Triângulos originais ───────────────────────────────────────────────────
  TRIANGLE_FILL:  '21, 237, 122',
  TRIANGLE_ALPHA: 0.08,

  // ── Física original ────────────────────────────────────────────────────────
  BASE_DRIFT:   0.08,
  SPRING_K:     0.009,
  SPRING_DAMP:  0.88,
  MICRO_DAMP:   0.97,
  MAX_NODE_VEL: 6,

  // ── Pulsos originais ───────────────────────────────────────────────────────
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

  // ── Galáxia ────────────────────────────────────────────────────────────────
  GAL_ARMS:             6,       // emissores: 0° / 60° / 120° / 180° / 240° / 300°
  GAL_ROT_SPEED:        0.080,   // rad/s — CCW (aplicado como subtracção)
  GAL_WAVE_INTERVAL:    4000,    // ms entre disparos
  GAL_SPAWN_PER_ARM:    10,       // partículas por emissor por disparo
  GAL_LIFETIME:         10000,    // ms
  GAL_LIFETIME_VAR:     0.35,    // ±35%
  GAL_RADIUS_BIRTH:     1.0,     // px no nascimento
  GAL_RADIUS_PEAK:      100,      // px no pico (t=0.5)
  GAL_SPEED:            105,     // px/s radial base
  GAL_SPEED_VAR:        0.40,    // ±40% — dá profundidade ao stream
  GAL_MAX_PARTICLES:    600,
  GAL_CORE_RADIUS:      55,      // glow central (px)
  GAL_CORE_ALPHA:       0.09,
  // Raio do círculo de emissão (responsivo)
  GAL_EMIT_RADIUS_DESKTOP: 200,  // px
  GAL_EMIT_RADIUS_MOBILE:   50,  // px — reduzido em mobile
  // Paleta de cores (aleatório por partícula)
  GAL_PALETTE: [
    '255, 255, 255',   // branco
    '0,   0,   0',     // preto  (invisível com screen blend, mas mantemos por pedido)
    '255, 0,   255',   // magenta
    '0,   255, 255',   // ciano
    '255, 255, 0',     // amarelo
  ],
}
// ─────────────────────────────────────────────────────────────────────────────

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


// ─── NeuralBg ────────────────────────────────────────────────────────────────
const NeuralBg = () => {
  const canvasRef    = useRef(null)
  const stateRef     = useRef(null)
  const burstTimers  = useRef([])
  const burstCounter = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let rafId

    // ── Galaxy state ──────────────────────────────────────────────────────────
    let galaxyAngle = 0
    let lastWaveTs  = performance.now() - C.GAL_WAVE_INTERVAL  // dispara imediatamente
    let lastFrame   = performance.now()
    const gParticles = []

    // ── resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    // ── init mesh ─────────────────────────────────────────────────────────────
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

    // ── spawnPulse (original) ─────────────────────────────────────────────────
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

    // ── fireGalaxyWave ────────────────────────────────────────────────────────
    // Dispara todos os emissores em simultâneo.
    // Cada emissor está no círculo de raio emitR, a ângulo armAngle (inclui rotação).
    // Partículas vão em linha recta para fora (puramente radial, sem drift).
    const fireGalaxyWave = (cx, cy, W) => {
      const isMobile = W < 640
      const emitR    = isMobile ? C.GAL_EMIT_RADIUS_MOBILE : C.GAL_EMIT_RADIUS_DESKTOP

      for (let arm = 0; arm < C.GAL_ARMS; arm++) {
        // Ângulo deste emissor: espaçado 60° + rotação actual da galáxia
        const armAngle = arm * (Math.PI * 2 / C.GAL_ARMS) + galaxyAngle
        const ex = cx + Math.cos(armAngle) * emitR
        const ey = cy + Math.sin(armAngle) * emitR

        for (let p = 0; p < C.GAL_SPAWN_PER_ARM; p++) {
          if (gParticles.length >= C.GAL_MAX_PARTICLES) break

          // Velocidade puramente radial (linha recta do centro para fora)
          const speed = C.GAL_SPEED * (1 + (Math.random()-0.5) * C.GAL_SPEED_VAR)
          const vx    = Math.cos(armAngle) * speed
          const vy    = Math.sin(armAngle) * speed

          // Cor aleatória da paleta
          const color = C.GAL_PALETTE[Math.floor(Math.random() * C.GAL_PALETTE.length)]

          gParticles.push({
            x: ex, y: ey,
            vx, vy,
            born:     performance.now(),
            lifetime: C.GAL_LIFETIME * (1 + (Math.random()-0.5) * C.GAL_LIFETIME_VAR),
            color,
          })
        }
      }
    }

    // ── draw ──────────────────────────────────────────────────────────────────
    const draw = (now) => {
      const s = stateRef.current
      if (!s) { rafId = requestAnimationFrame(draw); return }

      const dt = Math.min((now - lastFrame)/1000, 0.05)
      lastFrame = now

      const { nodes, edges, triangles, pulses, W, H } = s
      const cx = W/2, cy = H/2

      ctx.clearRect(0, 0, W, H)

      // ─── 1. GALÁXIA ─────────────────────────────────────────────────────────

      // Rotação CCW: subtrai
      galaxyAngle -= C.GAL_ROT_SPEED * dt

      // Core glow central
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, C.GAL_CORE_RADIUS)
      cg.addColorStop(0, `rgba(255,255,255,${C.GAL_CORE_ALPHA})`)
      cg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath(); ctx.arc(cx, cy, C.GAL_CORE_RADIUS, 0, Math.PI*2)
      ctx.fillStyle = cg; ctx.fill()

      // Trigger periódico — todos os emissores disparam em simultâneo
      if (now - lastWaveTs >= C.GAL_WAVE_INTERVAL) {
        lastWaveTs = now
        fireGalaxyWave(cx, cy, W)
      }

      // Partículas — bell-curve de tamanho/alpha, cor individual
      let pi = gParticles.length
      while (pi--) {
        const p   = gParticles[pi]
        const age = now - p.born
        const t   = age / p.lifetime
        if (t >= 1) { gParticles.splice(pi, 1); continue }
        p.x += p.vx * dt
        p.y += p.vy * dt
        const b     = bell(t)
        const size  = C.GAL_RADIUS_BIRTH + (C.GAL_RADIUS_PEAK - C.GAL_RADIUS_BIRTH) * b
        const alpha = (b * 0.88).toFixed(3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI*2)
        ctx.fillStyle = `rgba(${p.color},${alpha})`
        ctx.fill()
      }

      // ─── 2. TRIÂNGULOS ───────────────────────────────────────────────────────
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

      // ─── 3. ARESTAS ──────────────────────────────────────────────────────────
      edges.forEach(({ a, b, lastLit }) => {
        const na=nodes[a], nb=nodes[b]
        const age   = now - lastLit
        const fresh = lastLit>0 ? clamp(1 - age/C.TRACE_FADE_MS, 0, 1) : 0
        const alpha = C.EDGE_OPACITY + fresh*(0.45-C.EDGE_OPACITY)
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y)
        ctx.strokeStyle = `rgba(${C.EDGE_COLOR},${alpha})`; ctx.lineWidth=1; ctx.stroke()
      })

      // ─── 4. NÓS ──────────────────────────────────────────────────────────────
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x,n.y,C.NODE_RADIUS,0,Math.PI*2)
        ctx.fillStyle = `rgba(${C.EDGE_COLOR},0.25)`; ctx.fill()
      })

      // ─── 5. PULSOS ───────────────────────────────────────────────────────────
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

      // ─── 6. FÍSICA DOS NÓS ───────────────────────────────────────────────────
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

    // ── boot ──────────────────────────────────────────────────────────────────
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
