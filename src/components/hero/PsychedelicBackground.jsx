import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { PsychedelicShader } from './materials/PsychedelicMaterial'

const PsychedelicBackground = () => {
  const mountRef = useRef(null)

  useEffect(() => {
    const W = window.innerWidth
    const H = window.innerHeight

    // 1. Setup básico
    const scene    = new THREE.Scene()
    const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // 2. Plano fullscreen
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      ...PsychedelicShader,
      // Clonar uniforms para evitar partilha entre instâncias
      uniforms: {
        uTime:       { value: 0 },
        uResolution: { value: new THREE.Vector2(W, H) },
        uIntensity:  { value: 1.0 },
      },
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

    // 4. Resize — actualiza renderer E uResolution (fix do bug anterior)
    const handleResize = () => {
      const nW = window.innerWidth
      const nH = window.innerHeight
      renderer.setSize(nW, nH)
      material.uniforms.uResolution.value.set(nW, nH)
    }
    window.addEventListener('resize', handleResize)

    // 5. Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: -2,        // fica atrás do NeuralBg
        pointerEvents: 'none',
      }}
    />
  )
}

export default PsychedelicBackground
