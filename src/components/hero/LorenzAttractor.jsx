import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SIGMA = 10
const RHO = 28
const BETA = 8 / 3
const DT = 0.005
const MAX_POINTS = 4000

const LorenzAttractor = () => {
  const lineRef = useRef()

  const state = useRef({
    x: 0.1, y: 0, z: 0,
    buffer: new Float32Array(MAX_POINTS * 3).fill(0),
    head: 0,
  })

  const positions = useMemo(
    () => new Float32Array(MAX_POINTS * 3).fill(0),
    []
  )

  useFrame(() => {
    const s = state.current
    const attr = lineRef.current.geometry.attributes.position

    const dx = SIGMA * (s.y - s.x) * DT
    const dy = (s.x * (RHO - s.z) - s.y) * DT
    const dz = (s.x * s.y - BETA * s.z) * DT

    s.x += dx
    s.y += dy
    s.z += dz

    const scale = 0.12
    const i = s.head * 3
    s.buffer[i]     = s.x * scale
    s.buffer[i + 1] = s.y * scale
    s.buffer[i + 2] = s.z * scale

    for (let j = s.head; j < MAX_POINTS; j++) {
      attr.setXYZ(j - s.head, s.buffer[j * 3], s.buffer[j * 3 + 1], s.buffer[j * 3 + 2])
    }
    const offset = MAX_POINTS - s.head
    for (let j = 0; j < s.head; j++) {
      attr.setXYZ(offset + j, s.buffer[j * 3], s.buffer[j * 3 + 1], s.buffer[j * 3 + 2])
    }

    attr.needsUpdate = true
    s.head = (s.head + 1) % MAX_POINTS
  })

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_POINTS}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#15ed7a"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  )
}

export default LorenzAttractor
