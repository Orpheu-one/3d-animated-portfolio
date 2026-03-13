import { useEffect, useRef } from 'react'

import { waveSync } from './Wavesync'


// â”€â”€â”€ ConfiguraÃ§ão â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CONFIG = {

// â”€â”€ Nós â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

NODE_COUNT_MOBILE: 68,

NODE_COUNT_TABLET: 85,

NODE_COUNT_DESKTOP: 120,

CENTER_EXTRA: 40,

CENTER_RADIUS: 0.30,


// â”€â”€ Clusters dispersos (só desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// n = 80% da densidade anterior (20% menos densos)

CLUSTERS: [

{ rx: 0.18, ry: 0.22, r: 0.11, n: 14 }, // canto sup-esq

{ rx: 0.82, ry: 0.75, r: 0.11, n: 14 }, // canto inf-dir

{ rx: 0.72, ry: 0.20, r: 0.10, n: 12 }, // sup-dir

{ rx: 0.25, ry: 0.72, r: 0.10, n: 12 }, // inf-esq ← novo

{ rx: 0.50, ry: 0.85, r: 0.09, n: 11 }, // centro-baixo ← novo

],


CONNECTION_DIST: 180,

NODE_RADIUS: 2.5,

EDGE_OPACITY: 0.08,

EDGE_COLOR: '21, 237, 122',

PULSE_COLOR: '21, 237, 122',


// â”€â”€ Pulsos (+30% velocidade, +20% frequÃªncia) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

PULSE_SPEED: 0.0104, // 0.008 Ã— 1.30

PULSE_WIDTH: 0.18,

PULSE_SPAWN_RATE: 0.068,  // +25% — mais actividade contínua // 0.04 Ã— 1.20 Ã— 1.15

MAX_PULSES: 52,           // espaço para alternância heavy/light // mais espaÃ§o para bursts

PULSE_CHAIN_PROB: 0.65,

MAX_CHAIN: 6,


// â”€â”€ Burst: 50% dos pulsos disparam sequÃªncia rÃ¡pida â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

BURST_PROB: 0.50, // probabilidade de gerar burst

BURST_COUNT_MIN: 2, // mínimo de pulsos extra no burst

BURST_COUNT_MAX: 4, // mÃ¡ximo

BURST_INTERVAL_MS: 240, // ms entre pulsos do burst (200â€“300)


// â”€â”€ Traces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

TRACE_FADE_MS: 2500, // era 4000


// â”€â”€ Pulse head â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

PULSE_HEAD_RADIUS: 1.5,

PULSE_GLOW_MULT: 3.5,


// â”€â”€ Física dos nós â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

BASE_DRIFT: 0.08,

SPRING_K: 0.009,

SPRING_DAMP: 0.88,

MICRO_DAMP: 0.97,

MAX_NODE_VEL: 6,


// â”€â”€ Onda de propagaÃ§ão â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

WAVE_SPEED: 180,

WAVE_INNER_START: 0,

WAVE_OUTER_START: 30,

WAVE_EXPAND_RATE: 0.18,

WAVE_OUTER_GROW: 0.06,

WAVE_FORCE: 1.4, // forÃ§a base â€” escalada por wave.forceMult


// â”€â”€ Réplicas principais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

WAVE_COUNT: 5,

WAVE_DELAY: 1.8, // segundos entre ondas


// â”€â”€ Eco â€” ondas de agitaÃ§ão residual após o ciclo principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Mesma cadÃªncia (WAVE_DELAY), amplitude decrescente

ECHO_AMPLITUDES: [0.55, 0.32, 0.16], // 3 ecos, forÃ§a relativa


// â”€â”€ Ciclo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CYCLE_IDLE_MS: 1200,   // era 5000 — arranque quase imediato

CYCLE_REST_MS: 800, // mínimo â€” só dissolve visual, depois rearranque imediato

}


// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const rand = (min, max) => Math.random() * (max - min) + min

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const bell = t => Math.sin(Math.PI * clamp(t, 0, 1))

const eio = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2


const buildGraph = (nodes, maxDist) => {

const edges = []

const adj = Array.from({ length: nodes.length }, () => [])

for (let i = 0; i < nodes.length; i++) {

for (let j = i + 1; j < nodes.length; j++) {

const dx = nodes[i].x - nodes[j].x

const dy = nodes[i].y - nodes[j].y

const dist = Math.sqrt(dx * dx + dy * dy)

if (dist < maxDist) {

edges.push({ a: i, b: j, dist, lastLit: 0 })

adj[i].push(j)

adj[j].push(i)

}

}

}

return { edges, adj }

}


// â”€â”€â”€ NeuralBg â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const NeuralBg = () => {

const canvasRef = useRef(null)

const stateRef = useRef(null)

const burstTimers  = useRef([])  // timeouts dos bursts pendentes
  const burstCounter = useRef(0)    // alterna heavy/light


useEffect(() => {

const canvas = canvasRef.current

const ctx = canvas.getContext('2d')


const resize = () => {

canvas.width = window.innerWidth

canvas.height = window.innerHeight

init()

}


const init = () => {

const W = canvas.width

const H = canvas.height

const desktop = W >= 1024

const tablet = W >= 640 && W < 1024

const baseN = desktop ? CONFIG.NODE_COUNT_DESKTOP

: tablet ? CONFIG.NODE_COUNT_TABLET

: CONFIG.NODE_COUNT_MOBILE

const nodes = []


const mkNode = (x, y) => ({

x, y, ox: x, oy: y,

vx: rand(-CONFIG.BASE_DRIFT, CONFIG.BASE_DRIFT),

vy: rand(-CONFIG.BASE_DRIFT, CONFIG.BASE_DRIFT),

})


for (let i = 0; i < baseN; i++) nodes.push(mkNode(rand(0, W), rand(0, H)))


if (desktop) {

// Cluster central

const cx = W / 2, cy = H / 2

const cr = Math.min(W, H) * CONFIG.CENTER_RADIUS

for (let i = 0; i < CONFIG.CENTER_EXTRA; i++) {

const a = Math.random() * Math.PI * 2

const r = Math.sqrt(Math.random()) * cr

nodes.push(mkNode(cx + Math.cos(a)*r, cy + Math.sin(a)*r))

}

// Clusters dispersos

CONFIG.CLUSTERS.forEach(({ rx, ry, r, n }) => {

const clx = W * rx, cly = H * ry

const clr = Math.min(W, H) * r

for (let i = 0; i < n; i++) {

const a = Math.random() * Math.PI * 2

const rad = Math.sqrt(Math.random()) * clr

nodes.push(mkNode(clx + Math.cos(a)*rad, cly + Math.sin(a)*rad))

}

})

}


const { edges, adj } = buildGraph(nodes, CONFIG.CONNECTION_DIST)


stateRef.current = {

nodes, edges, adj, pulses: [], W, H,

waves: [],

waveCtrl: { phase: 'idle', phaseStart: performance.now() },

}

}


// â”€â”€ Spawn pulse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// isBurst = true â†’ pulso é membro de uma sequÃªncia rÃ¡pida na mesma aresta

const spawnPulse = (fromNode = null, chainDepth = 0, excludeEdge = null, isBurst = false, forcedEdge = null) => {

const s = stateRef.current

if (!s || s.pulses.length >= CONFIG.MAX_PULSES) return


let edgeIdx

if (forcedEdge !== null) {

// Burst: mesma aresta do pulso original

edgeIdx = forcedEdge

} else if (fromNode !== null && s.adj[fromNode].length > 0) {

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

if (fromNode === edge.a) dir = 1


s.pulses.push({

edgeIdx, t: dir > 0 ? 0 : 1, dir,

// Pulsos de burst: +40% velocidade, alpha ligeiramente menor

speed: isBurst ? CONFIG.PULSE_SPEED * 1.4 : CONFIG.PULSE_SPEED,

alpha: isBurst ? rand(0.45, 0.75) : rand(0.6, 1.0),

chainDepth, edgeExclude: excludeEdge,

})


      // ── Alternância heavy / light ────────────────────────────────────────
      // Pares de ciclos: heavy → light → heavy → light ...
      if (!isBurst && Math.random() < CONFIG.BURST_PROB) {
        burstCounter.current++
        const isHeavy = (burstCounter.current % (CONFIG.BURST_ALTERNATE_EVERY * 2)) < CONFIG.BURST_ALTERNATE_EVERY

        const count    = isHeavy
          ? CONFIG.BURST_COUNT_MIN + Math.floor(Math.random() * (CONFIG.BURST_COUNT_MAX - CONFIG.BURST_COUNT_MIN + 1))
          : CONFIG.BURST_LIGHT_COUNT_MIN + Math.floor(Math.random() * (CONFIG.BURST_LIGHT_COUNT_MAX - CONFIG.BURST_LIGHT_COUNT_MIN + 1))
        const interval  = isHeavy ? CONFIG.BURST_INTERVAL_MS : CONFIG.BURST_LIGHT_INTERVAL_MS
        const speedMult = isHeavy ? 1.4 : CONFIG.BURST_LIGHT_SPEED_MULT

        for (let k = 1; k <= count; k++) {
          const tid = setTimeout(() => {
            const s = stateRef.current
            if (!s || s.pulses.length >= CONFIG.MAX_PULSES) return
            // Usa a aresta original se não estiver saturada, senão adjacente
            const busy = s.pulses.filter(p => p.edgeIdx === edgeIdx).length
            const targetEdge = busy < 3 ? edgeIdx : Math.floor(Math.random() * s.edges.length)
            s.edges[targetEdge].lastLit = performance.now()
            const dir = Math.random() > 0.5 ? 1 : -1
            s.pulses.push({
              edgeIdx: targetEdge, t: dir > 0 ? 0 : 1, dir,
              speed:      CONFIG.PULSE_SPEED * speedMult,
              alpha:      isHeavy ? rand(0.45, 0.75) : rand(0.22, 0.48),
              chainDepth: 0, edgeExclude: null,
            })
          }, k * interval)
          burstTimers.current.push(tid)
        }
      }
    }


// â”€â”€ LanÃ§a conjunto de ondas (principal ou eco) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const launchWaves = (now, forceMult = 1) => {

const s = stateRef.current

const newWaves = Array.from({ length: CONFIG.WAVE_COUNT }, (_, i) => ({

startTime: now + i * CONFIG.WAVE_DELAY * 1000,

forceMult,

}))

s.waves.push(...newWaves)

}


// â”€â”€ Wave cycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const updateWaves = (now) => {

const s = stateRef.current

const wc = s.waveCtrl

const diagR = Math.sqrt(s.W * s.W + s.H * s.H)

const elapsed = now - wc.phaseStart


// Tempo para a Ãºltima onda de um grupo sair do ecrã

const groupDuration = (CONFIG.WAVE_COUNT - 1) * CONFIG.WAVE_DELAY * 1000

+ (diagR / CONFIG.WAVE_SPEED) * 1000 + 600


if (wc.phase === 'idle') {

waveSync.revealProgress = 0

if (elapsed > CONFIG.CYCLE_IDLE_MS) {

wc.phase = 'active'

wc.phaseStart = now

wc.echoIdx = 0 // índice do próximo eco a disparar

launchWaves(now, 1.0)

}

return

}


if (wc.phase === 'active') {

// Revela Latisse nos primeiros 2s

const tr = Math.min(elapsed / 2000, 1)

waveSync.revealProgress = eio(tr)


// Dispara ecos após o grupo principal terminar

// Cada eco é um grupo completo com forceMult decrescente

CONFIG.ECHO_AMPLITUDES.forEach((amp, idx) => {

const echoStart = groupDuration * (idx + 1)

if (!wc[`echo${idx}Fired`] && elapsed > echoStart) {

wc[`echo${idx}Fired`] = true

launchWaves(now, amp)

}

})


// Fim do ciclo: após o Ãºltimo eco terminar

const allDone = groupDuration * (CONFIG.ECHO_AMPLITUDES.length + 1)

if (elapsed > allDone) {

s.waves = []

wc.phase = 'rest'

wc.phaseStart = now

waveSync.isActive = false

}

return

}


if (wc.phase === 'rest') {

// Dissolve Latisse durante o rest

const tf = Math.min(elapsed / CONFIG.CYCLE_REST_MS, 1)

waveSync.revealProgress = 1 - eio(tf)


if (elapsed > CONFIG.CYCLE_REST_MS) {

wc.phase = 'active'

wc.phaseStart = now

wc.echoIdx = 0

s.waves = [] // limpa ondas residuais

// Reset flags de eco

CONFIG.ECHO_AMPLITUDES.forEach((_, idx) => { wc[`echo${idx}Fired`] = false })

launchWaves(now, 1.0)

}

return

}

}


// â”€â”€ Física das ondas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const applyWavePhysics = (now) => {

const s = stateRef.current

const cx = s.W / 2, cy = s.H / 2


s.waves = s.waves.filter(w => {

const age = (now - w.startTime) / 1000

if (age < 0) return true // ainda não iniciou, mantém


const midR = age * CONFIG.WAVE_SPEED

const innerThick = CONFIG.WAVE_INNER_START + midR * CONFIG.WAVE_EXPAND_RATE

const outerThick = CONFIG.WAVE_OUTER_START + midR * CONFIG.WAVE_OUTER_GROW

const innerR = Math.max(0, midR - innerThick)

const outerR = midR + outerThick

const bandwidth = outerR - innerR

const force = CONFIG.WAVE_FORCE * (w.forceMult ?? 1)


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


// Remove onda quando sair completamente do ecrã

const diagR = Math.sqrt(s.W*s.W + s.H*s.H)

return innerR < diagR + outerThick

})

}


// â”€â”€ Draw â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let rafId


const draw = () => {

const s = stateRef.current

if (!s) { rafId = requestAnimationFrame(draw); return }

const { nodes, edges, pulses, W, H } = s

const now = performance.now()


updateWaves(now)

applyWavePhysics(now)


// Move nós: mola fluida

nodes.forEach(n => {

const fx = (n.ox - n.x) * CONFIG.SPRING_K

const fy = (n.oy - n.y) * CONFIG.SPRING_K

n.vx = (n.vx + fx) * CONFIG.SPRING_DAMP * CONFIG.MICRO_DAMP

n.vy = (n.vy + fy) * CONFIG.SPRING_DAMP * CONFIG.MICRO_DAMP

n.vx = clamp(n.vx, -CONFIG.MAX_NODE_VEL, CONFIG.MAX_NODE_VEL)

n.vy = clamp(n.vy, -CONFIG.MAX_NODE_VEL, CONFIG.MAX_NODE_VEL)

n.x += n.vx; n.y += n.vy

if (n.x < 0) n.vx += 0.4

if (n.x > W) n.vx -= 0.4

if (n.y < 0) n.vy += 0.4

if (n.y > H) n.vy -= 0.4

})


ctx.clearRect(0, 0, W, H)


// Arestas com trace fade (2.5s)

edges.forEach(({ a, b, lastLit }) => {

const na = nodes[a], nb = nodes[b]

const age = now - lastLit

const fresh = lastLit > 0 ? clamp(1 - age / CONFIG.TRACE_FADE_MS, 0, 1) : 0

const alpha = CONFIG.EDGE_OPACITY + fresh * (0.45 - CONFIG.EDGE_OPACITY)

ctx.beginPath()

ctx.moveTo(na.x, na.y)

ctx.lineTo(nb.x, nb.y)

ctx.strokeStyle = `rgba(${CONFIG.EDGE_COLOR}, ${alpha})`

ctx.lineWidth = 1

ctx.stroke()

})


// Nós

nodes.forEach(n => {

ctx.beginPath()

ctx.arc(n.x, n.y, CONFIG.NODE_RADIUS, 0, Math.PI * 2)

ctx.fillStyle = `rgba(${CONFIG.EDGE_COLOR}, 0.25)`

ctx.fill()

})


// Pulsos

const toRemove = []


pulses.forEach((p, pi) => {

const { a, b } = edges[p.edgeIdx]

const na = nodes[a], nb = nodes[b]

const head = p.t

const tail = head - p.dir * CONFIG.PULSE_WIDTH

const hx = na.x + (nb.x - na.x) * head

const hy = na.y + (nb.y - na.y) * head

const tx = na.x + (nb.x - na.x) * clamp(tail, 0, 1)

const ty = na.y + (nb.y - na.y) * clamp(tail, 0, 1)


const grad = ctx.createLinearGradient(tx, ty, hx, hy)

grad.addColorStop(0, `rgba(${CONFIG.PULSE_COLOR}, 0)`)

grad.addColorStop(0.5, `rgba(${CONFIG.PULSE_COLOR}, ${p.alpha * 0.35})`)

grad.addColorStop(1, `rgba(255, 255, 255, ${p.alpha})`)


ctx.beginPath()

ctx.moveTo(tx, ty); ctx.lineTo(hx, hy)

ctx.strokeStyle = grad

ctx.lineWidth = 1.5

ctx.shadowBlur = 4

ctx.shadowColor = `rgba(${CONFIG.PULSE_COLOR}, 0.5)`

ctx.stroke()

ctx.shadowBlur = 0


const gr = CONFIG.PULSE_HEAD_RADIUS

const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, gr * CONFIG.PULSE_GLOW_MULT)

halo.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.85})`)

halo.addColorStop(0.3, `rgba(${CONFIG.PULSE_COLOR}, ${p.alpha * 0.3})`)

halo.addColorStop(1, `rgba(${CONFIG.PULSE_COLOR}, 0)`)

ctx.beginPath()

ctx.arc(hx, hy, gr * CONFIG.PULSE_GLOW_MULT, 0, Math.PI * 2)

ctx.fillStyle = halo; ctx.fill()


ctx.beginPath()

ctx.arc(hx, hy, gr, 0, Math.PI * 2)

ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`

ctx.fill()


p.t += p.dir * (p.speed ?? CONFIG.PULSE_SPEED)


const arrived = p.dir > 0 ? p.t >= 1 : p.t <= 0

if (arrived) {

const arrNode = p.dir > 0 ? b : a

if (p.chainDepth < CONFIG.MAX_CHAIN && Math.random() < CONFIG.PULSE_CHAIN_PROB) {

spawnPulse(arrNode, p.chainDepth + 1, p.edgeIdx, true)

}

const fx = nodes[arrNode].x, fy = nodes[arrNode].y

const flash = ctx.createRadialGradient(fx, fy, 0, fx, fy, 5)

flash.addColorStop(0, `rgba(255,255,255,${p.alpha * 0.9})`)

flash.addColorStop(1, 'rgba(21,237,122,0)')

ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2)

ctx.fillStyle = flash; ctx.fill()

toRemove.push(pi)

}

})


toRemove.reverse().forEach(i => pulses.splice(i, 1))

if (Math.random() < CONFIG.PULSE_SPAWN_RATE) spawnPulse()


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

position: 'absolute',

top: 0,

left: 0,

width: '100%',

height: '100%',

mixBlendMode: 'screen',

pointerEvents: 'none',

zIndex: 0,

}}

/>

)

}


export default NeuralBg