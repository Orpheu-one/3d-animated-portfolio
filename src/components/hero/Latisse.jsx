import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ─── Grelha ───────────────────────────────────────────────────────────────────
const SEGMENTS = 6
const TOTAL    = SEGMENTS * SEGMENTS * SEGMENTS

// ─── Atratores ────────────────────────────────────────────────────────────────
const ATTRACTOR_WORLD = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, 5.4),
]

// ─── Física ───────────────────────────────────────────────────────────────────
const INFLUENCE_RADIUS = 13
const G                = 2.7
const MAX_DISPLACEMENT = 2.2
const Y_DAMPING        = 0.55   // ← aumentado de 0.25 → mais volume em Y

// ─── Rotação ──────────────────────────────────────────────────────────────────
const ROTATION_PERIOD  = 13.3
const TILT_Z           = 23 * (Math.PI / 180)

// ─── Pulso ────────────────────────────────────────────────────────────────────
// Pulsos por volta completa — 2 = duas batidas por rotação
const PULSE_FREQ       = 2.5
const BG_COLOR         = '#0a192f'

// ─── Vertex Shader ────────────────────────────────────────────────────────────
const vertexShader = `
  uniform float uPulse;
  uniform float uPulseAmplitude;
  varying float vDistFromCenter;
  varying float vPulse;

  void main() {
    float d         = clamp(length(position) / 2.3, 0.0, 1.0);
    vDistFromCenter = d;
    vPulse          = uPulse;

    float radialFactor = d * d * uPulse * uPulseAmplitude;
    vec3  pulsedPos    = position + normalize(position) * radialFactor;

    float pointSize = (1.0 + 3.0 * d) * (1.0 + 0.15 * uPulse * d);

    vec4 mvPosition = modelViewMatrix * vec4(pulsedPos, 1.0);
    gl_PointSize    = pointSize * (100.0 / -mvPosition.z);
    gl_Position     = projectionMatrix * mvPosition;
  }
`

// ─── Fragment Shader ──────────────────────────────────────────────────────────
const fragmentShader = `
  uniform sampler2D uTexture;
  varying float vDistFromCenter;
  varying float vPulse;

  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    if (tex.a < 0.01) discard;

    vec3 white      = vec3(1.0,   1.0,   1.0);
    vec3 green      = vec3(0.082, 0.929, 0.478);
    vec3 baseColor  = mix(white, green, vDistFromCenter);
    float flash     = vPulse * vDistFromCenter * 0.3;
    vec3 finalColor = mix(baseColor, white, flash);
    float alpha     = tex.a * (1.0 - vDistFromCenter * 0.3 * (1.0 - vPulse));

    gl_FragColor = vec4(finalColor, alpha);
  }
`

// ─── LatticeInner ─────────────────────────────────────────────────────────────
const LatticeInner = () => {
  const pointsRef = useRef()
  const linesRef  = useRef()
  const groupRef  = useRef()

  const dotTexture = useMemo(() => {
    const canvas  = document.createElement('canvas')
    canvas.width  = 64
    canvas.height = 64
    const ctx  = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0,   'rgba(255, 255, 255, 1)')
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)')
    grad.addColorStop(1,   'rgba(255, 255, 255, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(canvas)
  }, [])

  const shaderUniforms = useMemo(() => ({
    uTexture:        { value: dotTexture },
    uPulse:          { value: 0 },
    uPulseAmplitude: { value: 0.35 },
  }), [dotTexture])

  const { positions, initialPositions, indices } = useMemo(() => {
    const pos         = []
    const lineIndices = []
    const S           = SEGMENTS

    for (let xi = 0; xi < S; xi++) {
      for (let yi = 0; yi < S; yi++) {
        for (let zi = 0; zi < S; zi++) {
          const x = (xi / (S - 1)) * 2 - 1
          const y = (yi / (S - 1)) * 2 - 1
          const z = (zi / (S - 1)) * 2 - 1
          pos.push(x * 1.65, y * 0.825, z * 1.65)
        }
      }
    }

    for (let xi = 0; xi < S; xi++) {
      for (let yi = 0; yi < S; yi++) {
        for (let zi = 0; zi < S; zi++) {
          const idx = xi * S * S + yi * S + zi
          if (xi < S - 1) lineIndices.push(idx, idx + S * S)
          if (yi < S - 1) lineIndices.push(idx, idx + S)
          if (zi < S - 1) lineIndices.push(idx, idx + 1)
        }
      }
    }

    return {
      positions:        new Float32Array(pos),
      initialPositions: new Float32Array(pos),
      indices:          new Uint16Array(lineIndices),
    }
  }, [])

  const _invMatrix   = new THREE.Matrix4()
  const _attrLocal   = new THREE.Vector3()
  const _pointLocal  = new THREE.Vector3()
  const _toAttractor = new THREE.Vector3()
  const _totalForce  = new THREE.Vector3()

  useFrame(({ clock }) => {
    const t             = clock.elapsedTime
    const posAttr       = pointsRef.current.geometry.attributes.position
    const rotationAngle = (t / ROTATION_PERIOD) * Math.PI * 2

    groupRef.current.rotation.y = rotationAngle
    groupRef.current.rotation.z = TILT_Z

    // ── Pulso mais rápido: PULSE_FREQ batidas por volta ───────────────────
    const rawPulse = Math.sin(rotationAngle * PULSE_FREQ)
    const pulse01  = (rawPulse + 1) / 2
    const breathe  = pulse01 * pulse01 * (3 - 2 * pulse01)

    shaderUniforms.uPulse.value = breathe
    groupRef.current.scale.setScalar(1.0 + 0.06 * breathe)

    const pulsedG = G * (0.55 + 0.45 * breathe)

    groupRef.current.updateWorldMatrix(true, false)
    _invMatrix.copy(groupRef.current.matrixWorld).invert()

    const attractorsLocal = ATTRACTOR_WORLD.map(worldPos =>
      _attrLocal.clone().copy(worldPos).applyMatrix4(_invMatrix)
    )

    for (let i = 0; i < posAttr.count; i++) {
      const baseX = initialPositions[i * 3]
      const baseY = initialPositions[i * 3 + 1]
      const baseZ = initialPositions[i * 3 + 2]

      _pointLocal.set(baseX, baseY, baseZ)
      _totalForce.set(0, 0, 0)

      for (const attrLocal of attractorsLocal) {
        _toAttractor.copy(attrLocal).sub(_pointLocal)
        const dist = _toAttractor.length()

        if (dist < INFLUENCE_RADIUS && dist > 0.05) {
          const t01      = 1 - dist / INFLUENCE_RADIUS
          const smooth   = t01 * t01 * (3 - 2 * t01)
          const forceMag = Math.min(pulsedG * smooth / (dist * dist + 0.1), MAX_DISPLACEMENT)
          _totalForce.addScaledVector(_toAttractor.normalize(), forceMag)
        }
      }

      if (_totalForce.length() > MAX_DISPLACEMENT) _totalForce.setLength(MAX_DISPLACEMENT)
      _totalForce.y *= Y_DAMPING

      posAttr.setX(i, baseX + _totalForce.x)
      posAttr.setY(i, baseY + _totalForce.y)
      posAttr.setZ(i, baseZ + _totalForce.z)
    }

    posAttr.needsUpdate = true
    const linePosAttr = linesRef.current.geometry.attributes.position
    linePosAttr.copy(posAttr)
    linePosAttr.needsUpdate = true

    linesRef.current.material.opacity = 0.08 + 0.1 * breathe
  })

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={TOTAL} array={positions} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={shaderUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={TOTAL} array={new Float32Array(positions)} itemSize={3} />
          <bufferAttribute attach="index" count={indices.length} array={indices} itemSize={1} />
        </bufferGeometry>
        <lineBasicMaterial color="white" transparent opacity={0.08} />
      </lineSegments>
    </group>
  )
}

const Lattice = () => (
  <section style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [0, 0, 5.4], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[BG_COLOR]} />
      <ambientLight intensity={0.5} />
      <LatticeInner />
      <OrbitControls enableZoom={false} />
    </Canvas>
  </section>
)

export default Lattice