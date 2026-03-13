import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { waveSync } from './Wavesync'

// ─── Config ───────────────────────────────────────────────────────────────────
const ROTATION_PERIOD  = 13.3
const TILT_Z           = 23 * (Math.PI / 180)
const SCALE            = 1.8
const DISPLACE         = 0.08
const VIS_LERP_IN      = 0.016
const VIS_LERP_OUT     = 0.005
const MAX_PULSES       = 12
const PULSE_SPEED      = 0.009
const PULSE_SPAWN_RATE = 0.018
const PULSE_CHAIN_PROB = 0.55
const MAX_CHAIN        = 4

// ── Muda para false quando confirmares que está visível ───────────────────────
const DEBUG_ALWAYS_VISIBLE = true

// ─── Octaedro Lattice — geometria criada puramente em Three.js ───────────────
function buildLattice() {
  const N       = 9           // grid mais leve
  const step    = 2 / (N - 1)
  const verts   = []
  const indices = []
  const gridMap = new Map()

  // Vértices filtrados por L1 ≤ 1 (forma octaédrica)
  for (let xi = 0; xi < N; xi++) {
    for (let yi = 0; yi < N; yi++) {
      for (let zi = 0; zi < N; zi++) {
        const nx = -1 + xi * step
        const ny = -1 + yi * step
        const nz = -1 + zi * step
        if (Math.abs(nx) + Math.abs(ny) + Math.abs(nz) > 1.02) continue

        const idx = verts.length / 3
        gridMap.set(`${xi},${yi},${zi}`, idx)

        // Pequeno deslocamento orgânico
        const r  = Math.sqrt(nx*nx + ny*ny + nz*nz)
        const jit = r * DISPLACE * SCALE
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(Math.max(-1, Math.min(1, 2*Math.random()-1)))
        verts.push(
          nx*SCALE + Math.sin(ph)*Math.cos(th)*jit,
          ny*SCALE + Math.sin(ph)*Math.sin(th)*jit,
          nz*SCALE + Math.cos(ph)*jit
        )
      }
    }
  }

  const count = verts.length / 3

  // Arestas entre vizinhos adjacentes
  for (let xi = 0; xi < N; xi++) {
    for (let yi = 0; yi < N; yi++) {
      for (let zi = 0; zi < N; zi++) {
        const a = gridMap.get(`${xi},${yi},${zi}`)
        if (a === undefined) continue
        ;[[1,0,0],[0,1,0],[0,0,1]].forEach(([dx,dy,dz]) => {
          const b = gridMap.get(`${xi+dx},${yi+dy},${zi+dz}`)
          if (b !== undefined) indices.push(a, b)
        })
      }
    }
  }

  // adj para pulsos
  const adj = Array.from({ length: count }, () => [])
  for (let i = 0; i < indices.length; i += 2) {
    adj[indices[i]].push(indices[i+1])
    adj[indices[i+1]].push(indices[i])
  }

  return {
    positions: new Float32Array(verts),
    lineIndex: new Uint16Array(indices),
    edgePairs: indices,   // array JS simples para pulsos
    count,
    adj,
  }
}

// ─── LatticeScene ─────────────────────────────────────────────────────────────
// Cria os objetos Three.js manualmente — muito mais fiável em R3F v8
const LatticeScene = () => {
  const { scene } = useThree()

  const groupRef  = useRef(new THREE.Group())
  const visRef    = useRef(DEBUG_ALWAYS_VISIBLE ? 1 : 0)
  const pulsesRef = useRef([])

  // ── Textura dot suave (igual à NeuralBg) ─────────────────────────────────
  const dotTex = useMemo(() => {
    const c   = document.createElement('canvas')
    c.width   = 64; c.height = 64
    const ctx = c.getContext('2d')
    const g   = ctx.createRadialGradient(32,32,0, 32,32,32)
    g.addColorStop(0,   'rgba(255,255,255,1)')
    g.addColorStop(0.35,'rgba(255,255,255,0.25)')
    g.addColorStop(1,   'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0,0,64,64)
    return new THREE.CanvasTexture(c)
  }, [])

  // ── Lattice data ──────────────────────────────────────────────────────────
  const lattice = useMemo(() => buildLattice(), [])

  // ── Materiais / objectos Three.js criados uma vez ─────────────────────────
  const objects = useMemo(() => {
    const { positions, lineIndex, count } = lattice

    // --- Pontos ---
    const ptGeo = new THREE.BufferGeometry()
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))

    const ptMat = new THREE.ShaderMaterial({
      uniforms: {
        uTex:        { value: dotTex },
        uVisibility: { value: DEBUG_ALWAYS_VISIBLE ? 1 : 0 },
      },
      vertexShader: `
        uniform float uVisibility;
        varying  float vDist;
        void main() {
          vDist = clamp(length(position) / ${SCALE.toFixed(2)}, 0.0, 1.0);
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.5 + 2.5 * vDist) * (90.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float     uVisibility;
        varying float     vDist;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          if (t.a < 0.01) discard;
          vec3 white = vec3(1.0, 1.0, 1.0);
          vec3 green = vec3(0.082, 0.929, 0.478);
          vec3 col   = mix(white, green, vDist);
          float a    = t.a * uVisibility * (0.65 + 0.35*(1.0 - vDist*0.3));
          if (a < 0.002) discard;
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })

    const points = new THREE.Points(ptGeo, ptMat)

    // --- Linhas ---
    const lnGeo = new THREE.BufferGeometry()
    lnGeo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    lnGeo.setIndex(new THREE.BufferAttribute(lineIndex, 1))

    const lnMat = new THREE.LineBasicMaterial({
      color:       0x15ed7a,
      transparent: true,
      opacity:     DEBUG_ALWAYS_VISIBLE ? 0.10 : 0,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })

    const lines = new THREE.LineSegments(lnGeo, lnMat)

    // --- Pulsos ---
    const pulsePos   = new Float32Array(MAX_PULSES * 3).fill(9999)
    const pulseAlpha = new Float32Array(MAX_PULSES).fill(0)

    const plGeo = new THREE.BufferGeometry()
    plGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3))
    plGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(pulseAlpha, 1))

    const plMat = new THREE.ShaderMaterial({
      uniforms: {
        uTex:        { value: dotTex },
        uVisibility: { value: DEBUG_ALWAYS_VISIBLE ? 1 : 0 },
      },
      vertexShader: `
        attribute float aAlpha;
        varying   float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 4.0 * (90.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float     uVisibility;
        varying float     vAlpha;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          if (t.a < 0.01) discard;
          float a = t.a * uVisibility * vAlpha;
          if (a < 0.002) discard;
          gl_FragColor = vec4(1.0, 1.0, 1.0, a);
        }
      `,
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })

    const pulsePoints = new THREE.Points(plGeo, plMat)

    return { points, lines, pulsePoints, ptMat, lnMat, plMat, pulsePos, pulseAlpha }
  }, [lattice, dotTex])

  // ── Monta na scene ────────────────────────────────────────────────────────
  useEffect(() => {
    const g = groupRef.current
    g.add(objects.points)
    g.add(objects.lines)
    g.add(objects.pulsePoints)
    scene.add(g)
    return () => {
      scene.remove(g)
      // cleanup geometrias e materiais
      objects.points.geometry.dispose()
      objects.lines.geometry.dispose()
      objects.pulsePoints.geometry.dispose()
      objects.ptMat.dispose()
      objects.lnMat.dispose()
      objects.plMat.dispose()
    }
  }, [scene, objects])

  // ── Spawn pulso ───────────────────────────────────────────────────────────
  const spawnPulse = (fromNode = null, depth = 0, excludeIdx = -1) => {
    const pulses = pulsesRef.current
    if (pulses.length >= MAX_PULSES) return
    const { edgePairs } = lattice
    const edgeCount = edgePairs.length / 2

    let edgeIdx
    if (fromNode !== null) {
      const cands = []
      for (let i = 0; i < edgeCount; i++) {
        const a = edgePairs[i*2], b = edgePairs[i*2+1]
        if (i !== excludeIdx && (a === fromNode || b === fromNode)) cands.push(i)
      }
      if (!cands.length) return
      edgeIdx = cands[Math.floor(Math.random() * cands.length)]
    } else {
      edgeIdx = Math.floor(Math.random() * edgeCount)
    }

    const a = edgePairs[edgeIdx*2], b = edgePairs[edgeIdx*2+1]
    let dir = Math.random() > 0.5 ? 1 : -1
    if (fromNode === b) dir = -1
    if (fromNode === a) dir =  1

    pulses.push({ edgeIdx, t: dir > 0 ? 0 : 1, dir,
      alpha: 0.5 + Math.random()*0.5, depth, excl: edgeIdx })
  }

  // ── Frame ─────────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    const ang = (clock.elapsedTime / ROTATION_PERIOD) * Math.PI * 2
    const g   = groupRef.current
    g.rotation.y = ang
    g.rotation.z = TILT_Z

    // Visibilidade
    let vis
    if (DEBUG_ALWAYS_VISIBLE) {
      vis = 1
    } else {
      const target   = waveSync.revealProgress ?? 0
      const speed    = target > visRef.current ? VIS_LERP_IN : VIS_LERP_OUT
      visRef.current += (target - visRef.current) * speed
      vis = visRef.current
    }

    objects.ptMat.uniforms.uVisibility.value = vis
    objects.plMat.uniforms.uVisibility.value = vis
    objects.lnMat.opacity = vis * 0.11

    // Pulsos
    const { pulsePos, pulseAlpha } = objects
    const { positions, edgePairs } = lattice

    if (vis > 0.02) {
      if (Math.random() < PULSE_SPAWN_RATE * vis) spawnPulse()

      const pulses   = pulsesRef.current
      const toRemove = []

      pulses.forEach((p, pi) => {
        const a = edgePairs[p.edgeIdx*2], b = edgePairs[p.edgeIdx*2+1]
        const ax=positions[a*3], ay=positions[a*3+1], az=positions[a*3+2]
        const bx=positions[b*3], by=positions[b*3+1], bz=positions[b*3+2]
        pulsePos[pi*3]   = ax + (bx-ax)*p.t
        pulsePos[pi*3+1] = ay + (by-ay)*p.t
        pulsePos[pi*3+2] = az + (bz-az)*p.t
        pulseAlpha[pi]   = p.alpha

        p.t += p.dir * PULSE_SPEED
        if (p.dir > 0 ? p.t >= 1 : p.t <= 0) {
          const arr = p.dir > 0 ? b : a
          if (p.depth < MAX_CHAIN && Math.random() < PULSE_CHAIN_PROB)
            spawnPulse(arr, p.depth+1, p.edgeIdx)
          toRemove.push(pi)
        }
      })

      toRemove.reverse().forEach(i => {
        pulsePos[i*3]=pulsePos[i*3+1]=pulsePos[i*3+2]=9999
        pulseAlpha[i]=0
        pulses.splice(i,1)
      })
    } else {
      pulsePos.fill(9999); pulseAlpha.fill(0)
      pulsesRef.current = []
    }

    objects.pulsePoints.geometry.attributes.position.needsUpdate = true
    objects.pulsePoints.geometry.attributes.aAlpha.needsUpdate   = true
  })

  return null  // tudo gerido via scene.add no useEffect
}

// ─── Latisse ──────────────────────────────────────────────────────────────────
const Latisse = () => (
  <Canvas
    style={{
      position:      'absolute',
      top:           0,
      left:          0,
      width:         '100%',
      height:        '100%',
      mixBlendMode:  'screen',
      pointerEvents: 'none',
    }}
    camera={{ position: [0, 1, 6], fov: 45, near: 0.1, far: 100 }}
    gl={{ antialias: true, alpha: true }}
    onCreated={({ gl }) => {
      gl.setClearColor(0x000000, 0)   // fundo totalmente transparente
    }}
  >
    <LatticeScene />
  </Canvas>
)

export default Latisse
