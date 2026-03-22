// src/components/hero/Neuralbg.jsx
// Mesh original (verde, pulsos activos, screen blend)
// + Waves caleidoscópicas com Rose Curve e textura dinâmica

import { useEffect, useRef } from 'react'
import { waveSync } from './Wavesync'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const C = {

  // ── Mesh — valores originais ──────────────────────────────────────────────
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

  // ── Cores originais: verde ────────────────────────────────────────────────
  EDGE_OPACITY:  0.08,
  EDGE_COLOR:    '21, 237, 122',
  PULSE_COLOR:   '21, 237, 122',

  // ── Triângulos originais ──────────────────────────────────────────────────
  TRIANGLE_FILL:  '21, 237, 122',
  TRIANGLE_ALPHA: 0.08,

  // ── Wave: cores pastel cycling ────────────────────────────────────────────
  WAVE_FILL_COLOR:  '255, 255, 255',  // fallback
  WAVE_ALPHA_START: 0.5,
  WAVE_ALPHA_END:   0.85,

  // ── Rose Curve ────────────────────────────────────────────────────────────
  ROSE_PETALS:    8,
  ROSE_AMPLITUDE: 0.368,
  ROSE_SAMPLES:   240,

  // ── Textura caleidoscópica ────────────────────────────────────────────────
  // ROTATION_SPEED: velocidade (0.0001=glacial, 0.001=rápido)
  // ROTATION_DIR:   1=CW  |  -1=CCW
  ROTATION_SPEED: 0.0005,
  ROTATION_DIR:   1,

  // ── Rotação individual de cada wave em torno do seu centro ────────────────
  // Cada wave alterna CW/CCW pelo índice (par=CW, ímpar=CCW)
  // 0.002=lento  |  0.006=médio  |  0.015=rápido  |  0.03=muito rápido
  WAVE_SPIN_SPEED: 0.015,

  // ── Pulsos originais ──────────────────────────────────────────────────────
  PULSE_SPEED:      0.0104,
  PULSE_WIDTH:      0.18,
  PULSE_SPAWN_RATE: 0.068,
  MAX_PULSES:       52,
  PULSE_CHAIN_PROB: 0.65,
  MAX_CHAIN:        6,

  BURST_PROB:              0.50,
  BURST_COUNT_MIN:         2,
  BURST_COUNT_MAX:         4,
  BURST_INTERVAL_MS:       240,
  BURST_ALTERNATE_EVERY:   3,
  BURST_LIGHT_COUNT_MIN:   1,
  BURST_LIGHT_COUNT_MAX:   2,
  BURST_LIGHT_INTERVAL_MS: 350,
  BURST_LIGHT_SPEED_MULT:  0.9,
  TRACE_FADE_MS:           2500,
  PULSE_HEAD_RADIUS:       1.5,
  PULSE_GLOW_MULT:         3.5,

  // ── Física original ───────────────────────────────────────────────────────
  BASE_DRIFT:   0.08,
  SPRING_K:     0.009,
  SPRING_DAMP:  0.88,
  MICRO_DAMP:   0.97,
  MAX_NODE_VEL: 6,

  // ── Waves originais ───────────────────────────────────────────────────────
  WAVE_SPEED:       180,
  WAVE_INNER_START: 0,
  WAVE_OUTER_START: 30,
  WAVE_EXPAND_RATE: 0.18,
  WAVE_OUTER_GROW:  0.15,
  WAVE_FORCE:       1.4,
  WAVE_COUNT:       5,
  WAVE_DELAY:       1.2,
  ECHO_AMPLITUDES:  [0.55, 0.32, 0.16],
  CYCLE_IDLE_MS:    1200,
  CYCLE_REST_MS:    800,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.random() * (max - min) + min
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const bell  = t => Math.sin(Math.PI * clamp(t, 0, 1))
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2

const buildGraph = (nodes, maxDist) => {
  const edges = [], adj = Array.from({ length: nodes.length }, () => [])
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
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
        const key = [a, b, c].sort((x, y) => x - y).join('-')
        if (!seen.has(key)) { seen.add(key); triangles.push([a, b, c]) }
      }
    })
  })
  return triangles
}

// ─── NeuralBg ─────────────────────────────────────────────────────────────────
const NeuralBg = () => {
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
      const W = canvas.width, H = canvas.height
      const desktop = W >= 1024, tablet = W >= 640 && W < 1024
      const baseN = desktop ? C.NODE_COUNT_DESKTOP : tablet ? C.NODE_COUNT_TABLET : C.NODE_COUNT_MOBILE
      const nodes = []
      const mkNode = (x, y) => ({ x, y, ox: x, oy: y, vx: rand(-C.BASE_DRIFT, C.BASE_DRIFT), vy: rand(-C.BASE_DRIFT, C.BASE_DRIFT) })
      for (let i = 0; i < baseN; i++) nodes.push(mkNode(rand(0, W), rand(0, H)))
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
      stateRef.current = {
        nodes, edges, adj, triangles, pulses: [], W, H,
        waves: [], waveCtrl: { phase: 'idle', phaseStart: performance.now() },
      }
    }

    // ── Spawn pulse (original) ─────────────────────────────────────────────
    const spawnPulse = (fromNode=null, chainDepth=0, excludeEdge=null, isBurst=false) => {
      const s = stateRef.current
      if (!s || s.pulses.length >= C.MAX_PULSES) return
      let edgeIdx
      if (fromNode !== null && s.adj[fromNode].length > 0) {
        const candidates = s.edges.map((e,i)=>({e,i})).filter(({i,e})=>i!==excludeEdge&&(e.a===fromNode||e.b===fromNode))
        if (!candidates.length) return
        edgeIdx = candidates[Math.floor(Math.random()*candidates.length)].i
      } else { edgeIdx = Math.floor(Math.random()*s.edges.length) }
      s.edges[edgeIdx].lastLit = performance.now()
      const edge = s.edges[edgeIdx]
      let dir = Math.random() > 0.5 ? 1 : -1
      if (fromNode === edge.b) dir = -1
      if (fromNode === edge.a) dir =  1
      s.pulses.push({ edgeIdx, t: dir>0?0:1, dir, speed: isBurst?C.PULSE_SPEED*1.4:C.PULSE_SPEED, alpha: isBurst?rand(0.45,0.75):rand(0.6,1.0), chainDepth, edgeExclude: excludeEdge })
      if (!isBurst && Math.random() < C.BURST_PROB) {
        burstCounter.current++
        const isHeavy = (burstCounter.current % (C.BURST_ALTERNATE_EVERY*2)) < C.BURST_ALTERNATE_EVERY
        const count = isHeavy
          ? C.BURST_COUNT_MIN + Math.floor(Math.random()*(C.BURST_COUNT_MAX-C.BURST_COUNT_MIN+1))
          : C.BURST_LIGHT_COUNT_MIN + Math.floor(Math.random()*(C.BURST_LIGHT_COUNT_MAX-C.BURST_LIGHT_COUNT_MIN+1))
        const interval = isHeavy ? C.BURST_INTERVAL_MS : C.BURST_LIGHT_INTERVAL_MS
        const speedMult = isHeavy ? 1.4 : C.BURST_LIGHT_SPEED_MULT
        for (let k=1; k<=count; k++) {
          const tid = setTimeout(() => {
            const s = stateRef.current
            if (!s || s.pulses.length >= C.MAX_PULSES) return
            const busy = s.pulses.filter(p=>p.edgeIdx===edgeIdx).length
            const targetEdge = busy<3 ? edgeIdx : Math.floor(Math.random()*s.edges.length)
            s.edges[targetEdge].lastLit = performance.now()
            const dir = Math.random()>0.5?1:-1
            s.pulses.push({ edgeIdx:targetEdge, t:dir>0?0:1, dir, speed:C.PULSE_SPEED*speedMult, alpha:isHeavy?rand(0.45,0.75):rand(0.22,0.48), chainDepth:0, edgeExclude:null })
          }, k*interval)
          burstTimers.current.push(tid)
        }
      }
    }

    // ── Waves com cores pastel cycling ────────────────────────────────────
    const WAVE_COLORS  = ['255,182,193', '174,210,255', '255,240,150']
    const WAVE_SHAPES  = ['petals', 'leaves']
    let waveColorIdx   = 0

    const launchWaves = (now, forceMult=1) => {
      const s = stateRef.current
      s.waves.push(...Array.from({ length: C.WAVE_COUNT }, (_, i) => {
        const color   = WAVE_COLORS[waveColorIdx % WAVE_COLORS.length]
        const shape   = WAVE_SHAPES[waveColorIdx % WAVE_SHAPES.length]
        const spinDir = waveColorIdx % 2 === 0 ? 1 : -1   // par=CW, ímpar=CCW
        waveColorIdx++
        return { startTime: now + i*C.WAVE_DELAY*1000, forceMult, color, shape, spinDir, rotation: 0 }
      }))
    }

    const updateWaves = (now) => {
      const s = stateRef.current, wc = s.waveCtrl
      const diagR = Math.sqrt(s.W*s.W + s.H*s.H)
      const elapsed = now - wc.phaseStart
      const groupDuration = (C.WAVE_COUNT-1)*C.WAVE_DELAY*1000 + (diagR/C.WAVE_SPEED)*1000 + 600
      if (wc.phase === 'idle') {
        waveSync.revealProgress = 0
        if (elapsed > C.CYCLE_IDLE_MS) { wc.phase='active'; wc.phaseStart=now; wc.echoIdx=0; launchWaves(now,1.0) }
        return
      }
      if (wc.phase === 'active') {
        waveSync.revealProgress = eio(Math.min(elapsed/2000,1))
        C.ECHO_AMPLITUDES.forEach((amp,idx) => { if (!wc[`echo${idx}Fired`] && elapsed>groupDuration*(idx+1)) { wc[`echo${idx}Fired`]=true; launchWaves(now,amp) } })
        if (elapsed > groupDuration*(C.ECHO_AMPLITUDES.length+1)) { s.waves=[]; wc.phase='rest'; wc.phaseStart=now; waveSync.isActive=false }
        return
      }
      if (wc.phase === 'rest') {
        waveSync.revealProgress = 1 - eio(Math.min(elapsed/C.CYCLE_REST_MS,1))
        if (elapsed > C.CYCLE_REST_MS) { wc.phase='active'; wc.phaseStart=now; wc.echoIdx=0; s.waves=[]; C.ECHO_AMPLITUDES.forEach((_,idx)=>{wc[`echo${idx}Fired`]=false}); launchWaves(now,1.0) }
        return
      }
    }

    const applyWavePhysics = (now) => {
      const s = stateRef.current, cx = s.W/2, cy = s.H/2
      s.waves = s.waves.filter(w => {
        const age = (now-w.startTime)/1000
        if (age < 0) return true
        const midR = age*C.WAVE_SPEED
        const innerThick = C.WAVE_INNER_START + midR*C.WAVE_EXPAND_RATE
        const outerThick = C.WAVE_OUTER_START  + midR*C.WAVE_OUTER_GROW
        const innerR = Math.max(0, midR-innerThick), outerR = midR+outerThick
        const bandwidth = outerR-innerR, force = C.WAVE_FORCE*(w.forceMult??1)
        s.nodes.forEach(n => {
          const dx=n.x-cx, dy=n.y-cy, dist=Math.sqrt(dx*dx+dy*dy)
          if (dist<0.1 || bandwidth<1) return
          const tBand = (dist-innerR)/bandwidth
          if (tBand>=0 && tBand<=1) { const mag=bell(tBand)*eio(bell(tBand))*force*0.5; n.vx+=(dx/dist)*mag; n.vy+=(dy/dist)*mag }
        })
        return innerR < Math.sqrt(s.W*s.W+s.H*s.H) + outerThick
      })
    }

    let rafId

    const draw = () => {
      const s = stateRef.current
      if (!s) { rafId = requestAnimationFrame(draw); return }
      const { nodes, edges, triangles, pulses, W, H } = s
      const now = performance.now()
      const cx = W/2, cy = H/2

      updateWaves(now)
      applyWavePhysics(now)

      // Física dos nós (original)
      nodes.forEach(n => {
        const fx=(n.ox-n.x)*C.SPRING_K, fy=(n.oy-n.y)*C.SPRING_K
        n.vx=(n.vx+fx)*C.SPRING_DAMP*C.MICRO_DAMP; n.vy=(n.vy+fy)*C.SPRING_DAMP*C.MICRO_DAMP
        n.vx=clamp(n.vx,-C.MAX_NODE_VEL,C.MAX_NODE_VEL); n.vy=clamp(n.vy,-C.MAX_NODE_VEL,C.MAX_NODE_VEL)
        n.x+=n.vx; n.y+=n.vy
        if(n.x<0)n.vx+=0.4; if(n.x>W)n.vx-=0.4; if(n.y<0)n.vy+=0.4; if(n.y>H)n.vy-=0.4
      })

      ctx.clearRect(0, 0, W, H)
      const diagR = Math.sqrt(W*W + H*H)

      // ── 1. WAVES — caleidoscópio com Rose Curve ───────────────────────────
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'

      s.waves.forEach(w => {
        const age = (now-w.startTime)/1000
        if (age < 0) return
        // Actualiza rotação acumulada desta wave
        w.rotation = (w.rotation ?? 0) + C.WAVE_SPIN_SPEED * (w.spinDir ?? 1)

        const midR      = age*C.WAVE_SPEED
        const innerThick = C.WAVE_INNER_START + midR*C.WAVE_EXPAND_RATE
        const outerThick = C.WAVE_OUTER_START  + midR*C.WAVE_OUTER_GROW
        const innerR    = Math.max(0, midR-innerThick)
        const outerR    = midR+outerThick
        const progress  = clamp(midR/diagR, 0, 1)
        const waveAlpha = C.WAVE_ALPHA_START + (C.WAVE_ALPHA_END-C.WAVE_ALPHA_START)*progress
        const petalAmp  = outerR * C.ROSE_AMPLITUDE * (w.forceMult ?? 1)
        const k         = C.ROSE_PETALS
        const samples   = C.ROSE_SAMPLES

        // Clip à forma da wave — com rotação individual da wave
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(w.rotation ?? 0)
        ctx.translate(-cx, -cy)
        ctx.beginPath()
        for (let i=0; i<=samples; i++) {
          const angle  = (i/samples)*Math.PI*2
          const rOuter = w.shape === 'leaves'
            ? outerR + petalAmp * Math.pow(Math.cos(k*angle/2), 2)
            : outerR + petalAmp * Math.cos(k*angle)
          const px = cx + Math.cos(angle)*rOuter
          const py = cy + Math.sin(angle)*rOuter
          if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py)
        }
        ctx.closePath()
        // Edge interior com rose curve
        if (innerR > 0) {
          const innerAmp = innerR * C.ROSE_AMPLITUDE * 0.5
          for (let i=0; i<=samples; i++) {
            const angle  = (i/samples)*Math.PI*2
            const rInner = w.shape === 'leaves'
              ? innerR + innerAmp * Math.pow(Math.cos(k*(samples-i)/samples*Math.PI*2/2), 2)
              : innerR + innerAmp * Math.cos(k*(samples-i)/samples*Math.PI*2)
            const px = cx + Math.cos(angle)*rInner
            const py = cy + Math.sin(angle)*rInner
            if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py)
          }
          ctx.closePath()
        }
        ctx.clip('evenodd')

        // Caleidoscópio: 12 wedges espelhados
        const N        = 12
        const wedge    = (Math.PI*2)/N
        const rotTime  = now * C.ROTATION_SPEED * C.ROTATION_DIR
        const [r,g,b]  = (w.color ?? '255,182,193').split(',').map(Number)

        for (let i=0; i<N; i++) {
          const a0     = i*wedge + rotTime
          const mirror = i%2 === 1
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(a0 + (mirror ? wedge : 0))
          if (mirror) ctx.scale(-1, 1)
          const osc    = 0.5 + 0.5*Math.sin((i/N)*Math.PI*3 + now*0.001)
          const alpha1 = waveAlpha*(0.6 + 0.4*osc)
          const alpha2 = waveAlpha*0.2
          const gr = ctx.createRadialGradient(0,0,innerR, 0,0,outerR+petalAmp)
          gr.addColorStop(0,   `rgba(${r},${g},${b},${alpha1})`)
          gr.addColorStop(0.4, `rgba(${Math.min(r+50,255)},${Math.min(g+50,255)},${Math.min(b+50,255)},${alpha1*0.8})`)
          gr.addColorStop(1,   `rgba(${r},${g},${b},${alpha2})`)
          ctx.beginPath()
          ctx.moveTo(0,0); ctx.arc(0,0,outerR+petalAmp,0,wedge,false); ctx.closePath()
          ctx.fillStyle = gr; ctx.fill()
          // Nervura esbatida
          const nv = ctx.createLinearGradient(innerR*Math.cos(wedge/2), innerR*Math.sin(wedge/2), (outerR+petalAmp*0.8)*Math.cos(wedge/2), (outerR+petalAmp*0.8)*Math.sin(wedge/2))
          nv.addColorStop(0,   `rgba(255,255,255,0)`)
          nv.addColorStop(0.5, `rgba(255,255,255,${waveAlpha*0.3})`)
          nv.addColorStop(1,   `rgba(255,255,255,0)`)
          ctx.beginPath()
          ctx.moveTo(innerR*Math.cos(wedge/2), innerR*Math.sin(wedge/2))
          ctx.lineTo((outerR+petalAmp*0.8)*Math.cos(wedge/2), (outerR+petalAmp*0.8)*Math.sin(wedge/2))
          ctx.strokeStyle=nv; ctx.lineWidth=2; ctx.stroke()
          ctx.restore()
        }
        ctx.restore()
      })

      ctx.restore()

      // ── 2. TRIÂNGULOS (original — verde translúcido) ──────────────────────
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

      // ── 3. ARESTAS (original — verde, trace fade) ─────────────────────────
      edges.forEach(({ a, b, lastLit }) => {
        const na=nodes[a], nb=nodes[b]
        const age   = now - lastLit
        const fresh = lastLit > 0 ? clamp(1 - age/C.TRACE_FADE_MS, 0, 1) : 0
        const alpha = C.EDGE_OPACITY + fresh*(0.45 - C.EDGE_OPACITY)
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y)
        ctx.strokeStyle = `rgba(${C.EDGE_COLOR},${alpha})`; ctx.lineWidth=1; ctx.stroke()
      })

      // ── 4. NÓS (original) ────────────────────────────────────────────────
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x,n.y,C.NODE_RADIUS,0,Math.PI*2)
        ctx.fillStyle = `rgba(${C.EDGE_COLOR},0.25)`; ctx.fill()
      })

      // ── 5. PULSOS (original — activos) ────────────────────────────────────
      const toRemove = []
      pulses.forEach((p, pi) => {
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
        ctx.strokeStyle=grad; ctx.lineWidth=1.5; ctx.shadowBlur=4; ctx.shadowColor=`rgba(${C.PULSE_COLOR},0.5)`; ctx.stroke(); ctx.shadowBlur=0
        const gr = C.PULSE_HEAD_RADIUS
        const halo = ctx.createRadialGradient(hx,hy,0,hx,hy,gr*C.PULSE_GLOW_MULT)
        halo.addColorStop(0,   `rgba(255,255,255,${p.alpha*0.85})`)
        halo.addColorStop(0.3, `rgba(${C.PULSE_COLOR},${p.alpha*0.3})`)
        halo.addColorStop(1,   `rgba(${C.PULSE_COLOR},0)`)
        ctx.beginPath(); ctx.arc(hx,hy,gr*C.PULSE_GLOW_MULT,0,Math.PI*2); ctx.fillStyle=halo; ctx.fill()
        ctx.beginPath(); ctx.arc(hx,hy,gr,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${p.alpha})`; ctx.fill()
        p.t += p.dir*(p.speed ?? C.PULSE_SPEED)
        const arrived = p.dir>0 ? p.t>=1 : p.t<=0
        if (arrived) {
          const arrNode = p.dir>0 ? b : a
          if (p.chainDepth<C.MAX_CHAIN && Math.random()<C.PULSE_CHAIN_PROB) spawnPulse(arrNode, p.chainDepth+1, p.edgeIdx, true)
          const fx=nodes[arrNode].x, fy=nodes[arrNode].y
          const flash = ctx.createRadialGradient(fx,fy,0,fx,fy,5)
          flash.addColorStop(0, `rgba(255,255,255,${p.alpha*0.9})`)
          flash.addColorStop(1, 'rgba(21,237,122,0)')
          ctx.beginPath(); ctx.arc(fx,fy,5,0,Math.PI*2); ctx.fillStyle=flash; ctx.fill()
          toRemove.push(pi)
        }
      })
      toRemove.reverse().forEach(i => pulses.splice(i,1))
      if (Math.random() < C.PULSE_SPAWN_RATE) spawnPulse()

      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    setTimeout(() => { for (let i=0; i<8; i++) spawnPulse() }, 100)
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
        mixBlendMode:  'screen',   // original — verde sobre navy escuro
        pointerEvents: 'none',
        zIndex:        0,
      }}
    />
  )
}

export default NeuralBg
