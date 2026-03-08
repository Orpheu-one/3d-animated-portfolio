import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const EnergyLattice = () => {
  const pointsRef = useRef()
  const linesRef = useRef()
  const energyRef = useRef()
  
  // 1. Definição da Estrutura (3x3x3)
  const { positions, initialPositions, randomData } = useMemo(() => {
    const pos = []
    const rnd = []
    const stepX = 2; // Ajustável conforme o container
    const stepY = 0.3; // 30% da vh aprox
    
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          pos.push(x * 2, y * 0.45, z * 0.45) // Centrado
          rnd.push(Math.random() * Math.PI * 2) // Fase random
        }
      }
    }
    return {
      positions: new Float32Array(pos),
      initialPositions: new Float32Array(pos),
      randomData: new Float32Array(rnd)
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const geo = pointsRef.current.geometry
    const posAttr = geo.attributes.position
    
    for (let i = 0; i < posAttr.count; i++) {
      const phase = randomData[i]
      const cycle = (t * (Math.PI * 2)) / 4 // Ciclo de 4s
      
      // Movimento aleatório nos 3 eixos (amplitude 10% da área)
      posAttr.setX(i, initialPositions[i * 3] + Math.sin(cycle + phase) * 0.05)
      posAttr.setY(i, initialPositions[i * 3 + 1] + Math.cos(cycle + phase * 0.5) * 0.05)
      posAttr.setZ(i, initialPositions[i * 3 + 2] + Math.sin(cycle * 0.5 + phase) * 0.05)
    }
    posAttr.needsUpdate = true
    
    // Atualizar as linhas da lattice para seguir os pontos
    if (linesRef.current) {
      linesRef.current.geometry.attributes.position.copy(posAttr)
      linesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  // Textura para o Glow "Ghost"
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <group>
      {/* Os Vértices (Círculos com Glow) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={positions.length / 3} 
            array={positions} 
            itemSize={3} 
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.15} // Aprox 7px dependendo da camera
          map={glowTexture}
          transparent
          alphaTest={0.001}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* As Arestas (1px) */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="white" transparent opacity={0.2} />
      </lineSegments>

      {/* Energia (Path dinâmico) */}
      <EnergyFlow sourcePositions={initialPositions} />
    </group>
  )
}