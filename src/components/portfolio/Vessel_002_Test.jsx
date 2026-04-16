import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Conversor de Graus para Radianos (Maya Style)
const toRad = (deg) => (deg * Math.PI) / 180;

const C = {
  // --- TRANSFORM (OBJETO) ---
  // Agora 0,0,0 coloca o quadrado de frente para a camera
  ROT_X: 0, 
  ROT_Y: 0,
  ROT_Z: 0,
  SCALE: 1.3,

  // --- GEOMETRIA ---
  WIDTH: 5.0,
  HEIGHT: 5.0,
  DEPTH: 0.4,
  SEGMENTS: 512, 

  // --- LAYER 1: VESSELS (Vessels_002.png) ---
  // Controla o "Coração" do efeito: Cor, Relevo e Máscara
  V_COLOR: "#ff0000",
  V_REPEAT: [1, 1],
  V_OFFSET: [0, 0],      
  V_ROUGHNESS: 0.02,  // Brilho das veias
  V_DISP_SCALE: 0.4,   // Altura da secção redonda

  // --- LAYER 2: TISSUE (Vessels_003.png) ---
  // O tecido envolvente
  T_COLOR: "#ffbaba",
  T_REPEAT: [3, 3],
  T_OFFSET: [0, 0],      
  T_ROT_TEX: 0,        // Rotação da textura (Graus)
  T_ROUGHNESS: 0.7,    // Baço para contrastar com a veia
  T_OPACITY: 0.85,
  
  // --- MATERIAL FÍSICO (SUB-SURFACE LOOK) ---
  TRANSMISSION: 1.0,
  ATT_COLOR: "#ff1100",
  ATT_DIST: 0.8,
  ENV_PRESET: "forest"
};

const Vessel_002_Test = () => {
  const [mapVeins, mapTissue] = useLoader(THREE.TextureLoader, [
    "/Vessels_002.png",
    "/Vessels_003.png",
  ]);

  // Update de texturas (UV Mapping)
  useMemo(() => {
    // Layer 1 - Veias
    mapVeins.wrapS = mapVeins.wrapT = THREE.RepeatWrapping;
    mapVeins.repeat.set(C.V_REPEAT[0], C.V_REPEAT[1]);
    mapVeins.offset.set(C.V_OFFSET[0], C.V_OFFSET[1]);

    // Layer 2 - Tecido
    mapTissue.wrapS = mapTissue.wrapT = THREE.RepeatWrapping;
    mapTissue.repeat.set(C.T_REPEAT[0], C.T_REPEAT[1]);
    mapTissue.offset.set(C.T_OFFSET[0], C.T_OFFSET[1]);
    mapTissue.rotation = toRad(C.T_ROT_TEX);
    mapTissue.center.set(0.5, 0.5);
  }, [mapVeins, mapTissue]);

  const mainMat = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: C.T_COLOR,
      map: mapTissue,
      displacementMap: mapVeins,
      displacementScale: C.V_DISP_SCALE,
      alphaMap: mapVeins,
      transparent: true,
      opacity: C.T_OPACITY,
      transmission: C.TRANSMISSION,
      ior: 1.45,
      thickness: 3.0,
      attenuationColor: C.ATT_COLOR,
      attenuationDistance: C.ATT_DIST,
      roughness: C.T_ROUGHNESS,
      side: THREE.DoubleSide,
    });

    // Injeção de Shader para o Splatting de Cor/Rugosidade
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uVesselColor = { value: new THREE.Color(C.V_COLOR) };
      shader.uniforms.uVesselRough = { value: C.V_ROUGHNESS };
      shader.uniforms.uVeinMap = { value: mapVeins };

      shader.fragmentShader = `
        uniform vec3 uVesselColor;
        uniform float uVesselRough;
        uniform sampler2D uVeinMap;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <map_fragment>`,
        `
        #include <map_fragment>
        // Usamos vMapUv para garantir compatibilidade entre layers
        float mask = texture2D(uVeinMap, vMapUv).r;
        mask = smoothstep(0.1, 0.9, mask); 
        diffuseColor.rgb = mix(diffuseColor.rgb, uVesselColor, mask);
        `
      ).replace(
        `#include <roughnessmap_fragment>`,
        `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, uVesselRough, mask);
        `
      );
    };
    return mat;
  }, [mapVeins, mapTissue]);

  return (
    <group 
      position={[0, 0, 0]} 
      rotation={[toRad(C.ROT_X), toRad(C.ROT_Y), toRad(C.ROT_Z)]}
      scale={C.SCALE}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, -10]} intensity={10} />
      
      {/* Luz interna (Core) */}
      <pointLight position={[0, 0, 0]} intensity={30} color="#ff3300" distance={6} />

      <mesh material={mainMat}>
        <boxGeometry args={[C.WIDTH, C.HEIGHT, C.DEPTH, C.SEGMENTS, C.SEGMENTS, 5]} />
      </mesh>

      <Environment preset={C.ENV_PRESET} />
    </group>
  );
};

export default Vessel_002_Test;