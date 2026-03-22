import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { PsychedelicShader } from './materials/PsychedelicMaterial'

const PsychedelicBackground = () => {
  const mountRef = useRef(null)
  
  useEffect(() => {
    const W = window.innerWidth
    const H = window.innerHeight
    
    // 1. Setup básico
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    mountRef.current.appendChild(renderer.domElement)

    // 2. Criar o Plano que cobre tudo
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      ...PsychedelicShader,
      transparent: true,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // 3. Animação
    let rafId
    const animate = (time) => {
      material.uniforms.uTime.value = time * 0.001
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    // 4. Resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, 
        zIndex: -2, // Fica atrás da NeuralBg
        pointerEvents: 'none' 
      }} 
    />
  )
}

export default PsychedelicBackground