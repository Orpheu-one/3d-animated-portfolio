import { useGLTF, useTexture } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'

const SCREEN_TEXTURE_PATH = '/MacBookPro_baseColor.png'
const EMISSIVE_TEXTURE_PATH = '/MacBookPro_emissive.png' // ← Teu novo mapa emissivo

export function ComputerModel(props) {
  const { nodes, materials } = useGLTF('/computerModel.glb')
  const screenTex = useTexture(SCREEN_TEXTURE_PATH)
  const emissiveTex = useTexture(EMISSIVE_TEXTURE_PATH)

  useEffect(() => {
    // Configuração das texturas
    [screenTex, emissiveTex].forEach(tex => {
      tex.flipY = false
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
    })
  }, [screenTex, emissiveTex])

  useEffect(() => {
    if (materials.MacBookPro) {
      // Mapas
      materials.MacBookPro.map = screenTex
      materials.MacBookPro.emissiveMap = emissiveTex // ← Força o PNG externo como emissivo
      
      // Definições de Emissão
      materials.MacBookPro.emissive = new THREE.Color(0xffffff) // Branco para não tintar a imagem
      materials.MacBookPro.emissiveIntensity = 1 // Ajusta aqui se quiseres mais brilho

      // Blending e Renderização
      materials.MacBookPro.transparent = false
      materials.MacBookPro.blending = THREE.NormalBlending
      materials.MacBookPro.depthWrite = true
      
      materials.MacBookPro.needsUpdate = true
    }
  }, [screenTex, emissiveTex, materials])

  return (
    <group {...props} dispose={null}>
      <group position={[0.121, 0.007, 0]}>
        <mesh geometry={nodes.Object_6.geometry} material={materials.MacBookPro} />
        <mesh geometry={nodes.Object_8.geometry} material={materials.MacBookPro} />
      </group>
      <mesh geometry={nodes.Object_4.geometry} material={materials.MacBookPro} />
    </group>
  )
}

useGLTF.preload('/computerModel.glb')