import { useEffect, useRef } from 'react'

// ─── Configuração ─────────────────────────────────────────────────────────────
const CONFIG = {
  NODE_COUNT:        55,     // nós da rede
  CONNECTION_DIST:   180,    // distância máxima para conectar dois nós
  NODE_RADIUS:       2.5,    // tamanho dos nós
  EDGE_OPACITY:      0.08,   // opacidade base das arestas
  EDGE_COLOR:        '21, 237, 122',   // verde #15ed7a em RGB
  PULSE_COLOR:       '21, 237, 122',
  PULSE_SPEED:       0.008,  // velocidade do pulso ao longo da aresta (0→1 por frame)
  PULSE_WIDTH:       0.18,   // comprimento visual do pulso (0→1)
  PULSE_SPAWN_RATE:  0.04,   // probabilidade por frame de nascer um novo pulso
  MAX_PULSES:        30,     // máximo de pulsos simultâneos
  PULSE_CHAIN_PROB:  0.65,   // probabilidade de continuar para outra aresta no fim
  MAX_CHAIN:         6,      // nós máximos que um pulso pode atravessar
  BG_COLOR:          '#0a192f',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min

const buildGraph = (nodes, maxDist) => {
  const edges = []
  const adj   = Array.from({ length: nodes.length }, () => [])

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx   = nodes[i].x - nodes[j].x
      const dy   = nodes[i].y - nodes[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < maxDist) {
        edges.push({ a: i, b: j, dist })
        adj[i].push(j)
        adj[j].push(i)
      }
    }
  }
  return { edges, adj }
}

// ─── NeuralBg ─────────────────────────────────────────────────────────────────
const NeuralBg = () => {
  const canvasRef = useRef(null)
  const stateRef  = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    const init = () => {
      const W = canvas.width
      const H = canvas.height

      // Gerar nós aleatórios
      const nodes = Array.from({ length: CONFIG.NODE_COUNT }, () => ({
        x:  rand(0, W),
        y:  rand(0, H),
        vx: rand(-0.12, 0.12),  // deriva lenta — a rede respira
        vy: rand(-0.12, 0.12),
      }))

      const { edges, adj } = buildGraph(nodes, CONFIG.CONNECTION_DIST)

      stateRef.current = { nodes, edges, adj, pulses: [], W, H }
    }

    const spawnPulse = (fromNode = null, chainDepth = 0, excludeEdge = null) => {
      const s = stateRef.current
      if (!s || s.pulses.length >= CONFIG.MAX_PULSES) return

      // Escolhe aresta aleatória (ou aresta ligada ao fromNode)
      let edgeIdx
      if (fromNode !== null && s.adj[fromNode].length > 0) {
        // Continua do nó de chegada para uma aresta adjacente diferente
        const candidates = s.edges
          .map((e, i) => ({ e, i }))
          .filter(({ e, i }) =>
            i !== excludeEdge &&
            (e.a === fromNode || e.b === fromNode)
          )
        if (candidates.length === 0) return
        const pick = candidates[Math.floor(Math.random() * candidates.length)]
        edgeIdx = pick.i
      } else {
        edgeIdx = Math.floor(Math.random() * s.edges.length)
      }

      const edge = s.edges[edgeIdx]
      // Direção: a→b ou b→a aleatório (ou forçado pelo fromNode)
      let dir = Math.random() > 0.5 ? 1 : -1
      if (fromNode === edge.b) dir = -1
      if (fromNode === edge.a) dir =  1

      s.pulses.push({
        edgeIdx,
        t:          dir > 0 ? 0 : 1,  // posição 0→1 na aresta
        dir,
        alpha:      rand(0.6, 1.0),
        chainDepth,
        edgeExclude: excludeEdge,
      })
    }

    const draw = () => {
      const s = stateRef.current
      if (!s) return
      const { nodes, edges, pulses, W, H } = s

      // ── Mover nós (deriva suave + bounce) ─────────────────────────────
      nodes.forEach(n => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })

      // ── Clear com alpha baixo — cria rastro suave ──────────────────────
      ctx.fillStyle = CONFIG.BG_COLOR
      ctx.globalAlpha = 0.18
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1

      // ── Arestas base ───────────────────────────────────────────────────
      edges.forEach(({ a, b }) => {
        const na = nodes[a], nb = nodes[b]
        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = `rgba(${CONFIG.EDGE_COLOR}, ${CONFIG.EDGE_OPACITY})`
        ctx.lineWidth   = 1
        ctx.stroke()
      })

      // ── Nós ────────────────────────────────────────────────────────────
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, CONFIG.NODE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${CONFIG.EDGE_COLOR}, 0.25)`
        ctx.fill()
      })

      // ── Pulsos de energia ──────────────────────────────────────────────
      const toRemove = []

      pulses.forEach((p, pi) => {
        const { a, b } = edges[p.edgeIdx]
        const na = nodes[a], nb = nodes[b]

        // Posição do pulso na aresta (0→1)
        const head = p.t
        const tail = head - p.dir * CONFIG.PULSE_WIDTH

        // Pontos no canvas
        const hx = na.x + (nb.x - na.x) * head
        const hy = na.y + (nb.y - na.y) * head
        const tx = na.x + (nb.x - na.x) * Math.max(0, Math.min(1, tail))
        const ty = na.y + (nb.y - na.y) * Math.max(0, Math.min(1, tail))

        // Gradiente ao longo do pulso
        const grad = ctx.createLinearGradient(tx, ty, hx, hy)
        grad.addColorStop(0, `rgba(${CONFIG.PULSE_COLOR}, 0)`)
        grad.addColorStop(0.5, `rgba(${CONFIG.PULSE_COLOR}, ${p.alpha * 0.4})`)
        grad.addColorStop(1, `rgba(255, 255, 255, ${p.alpha})`)

        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(hx, hy)
        ctx.strokeStyle = grad
        ctx.lineWidth   = 2
        ctx.shadowBlur  = 6
        ctx.shadowColor = `rgba(${CONFIG.PULSE_COLOR}, 0.8)`
        ctx.stroke()
        ctx.shadowBlur  = 0

        // Glow no head
        const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8)
        glow.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.8})`)
        glow.addColorStop(1, `rgba(${CONFIG.PULSE_COLOR}, 0)`)
        ctx.beginPath()
        ctx.arc(hx, hy, 8, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Avança o pulso
        p.t += p.dir * CONFIG.PULSE_SPEED

        // ── Chegou ao fim da aresta ────────────────────────────────────
        const arrived = p.dir > 0 ? p.t >= 1 : p.t <= 0
        if (arrived) {
          const arrivalNode = p.dir > 0 ? b : a

          // Continua em chain com probabilidade PULSE_CHAIN_PROB
          if (
            p.chainDepth < CONFIG.MAX_CHAIN &&
            Math.random() < CONFIG.PULSE_CHAIN_PROB
          ) {
            spawnPulse(arrivalNode, p.chainDepth + 1, p.edgeIdx)
          }

          // Flash no nó de chegada
          ctx.beginPath()
          ctx.arc(nodes[arrivalNode].x, nodes[arrivalNode].y, 6, 0, Math.PI * 2)
          const flash = ctx.createRadialGradient(
            nodes[arrivalNode].x, nodes[arrivalNode].y, 0,
            nodes[arrivalNode].x, nodes[arrivalNode].y, 10
          )
          flash.addColorStop(0, `rgba(255,255,255,${p.alpha})`)
          flash.addColorStop(1, 'rgba(21,237,122,0)')
          ctx.fillStyle = flash
          ctx.fill()

          toRemove.push(pi)
        }
      })

      // Remove pulsos terminados (de trás para a frente)
      toRemove.reverse().forEach(i => pulses.splice(i, 1))

      // ── Spawna novos pulsos aleatoriamente ─────────────────────────────
      if (Math.random() < CONFIG.PULSE_SPAWN_RATE) spawnPulse()

      requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)

    // Pré-popula com alguns pulsos para não começar vazio
    setTimeout(() => {
      for (let i = 0; i < 8; i++) spawnPulse()
    }, 100)

    const rafId = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:  'absolute',
        top:       0,
        left:      0,
        width:     '100%',
        height:    '100%',
        // screen blend — sobrepõe sem tapar o que está atrás
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        zIndex:    0,
      }}
    />
  )
}

export default NeuralBg