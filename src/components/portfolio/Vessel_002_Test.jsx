import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { Environment, PerspectiveCamera, OrbitControls } from "@react-three/drei";

// Conversor de Graus para Radianos (Maya Style)
const toRad = (deg) => (deg * Math.PI) / 180;

const C = {
  // --- CAMERA ---
  CAM_POS: [0, 0, 7.5],
  CAM_FOV: 45,

  // --- TRANSFORM (OBJETO) ---
  ROT_X: 0, 
  ROT_Y: 0,
  ROT_Z: 0,
  SCALE: 1.3,

  // --- GEOMETRIA ---
  WIDTH: 5.0,
  HEIGHT: 5.0,
  DEPTH: 0.4,
  SEGMENTS: 1024, // Aumentado para garantir curvatura perfeita no displacement

  // --- LAYER 1: VESSELS (Vessels_002.png) ---
  V_COLOR: "#3a0000",    // Vermelho escuro/sangue coagulado (Dark Red)
  V_REPEAT: [1, 1],
  V_OFFSET: [0, 0],      
  V_ROUGHNESS: 0.05,     // Quase 0 = Altamente brilhante/líquido e especular
  V_DISP_SCALE: 0.45,    // Força da extrusão

  V_DISP_BIAS: -0.15,    // 🔴 O SEGREDO: Afunda a base para que o topo curve em vez de ficar achatado

  // --- LAYER 2: TISSUE (Vessels_003.png) ---
  T_COLOR: "#ffbaba",
  T_REPEAT: [1, 1],
  T_OFFSET: [0, 0],      
  T_ROT_TEX: 0,        
  T_ROUGHNESS: 0.85,     // Baço para contrastar fortemente com a veia
  T_OPACITY: 0.85,
  
  // --- PROCEDURAL BUMP MAP (Pele/Poros) ---
  BUMP_SCALE: 0.02,      // Força do ruído fino na pele
  BUMP_REPEAT: 8.0,      // Frequência do ruído

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

  // Gerador de Noise (Shokunin: Bump map gerado via Canvas sem carregar imagens extra)
  const noiseBump = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 60000; i++) {
      const val = Math.random() * 255;
      ctx.fillStyle = `rgb(${val},${val},${val})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(C.BUMP_REPEAT, C.BUMP_REPEAT);
    return tex;
  }, []);

  // Update de texturas (UV Mapping)
  useMemo(() => {
    mapVeins.wrapS = mapVeins.wrapT = THREE.RepeatWrapping;
    mapVeins.repeat.set(C.V_REPEAT[0], C.V_REPEAT[1]);
    mapVeins.offset.set(C.V_OFFSET[0], C.V_OFFSET[1]);

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
      
      // Displacement da Veia
      displacementMap: mapVeins,
      displacementScale: C.V_DISP_SCALE,
      displacementBias: C.V_DISP_BIAS,
      
      // Bump map procedural para a pele
      bumpMap: noiseBump,
      bumpScale: C.BUMP_SCALE,

      transparent: true,
      opacity: C.T_OPACITY,
      transmission: C.TRANSMISSION,
      ior: 1.45,
      thickness: 3.0,
      attenuationColor: C.ATT_COLOR,
      attenuationDistance: C.ATT_DIST,
      roughness: C.T_ROUGHNESS, // Base (baço)
      side: THREE.DoubleSide,
    });

    // Injeção de Shader para o Splatting de Cor e Especularidade (Roughness)
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
        // Extrai a máscara baseada no canal vermelho da textura das veias
        float mask = texture2D(uVeinMap, vMapUv).r;
        mask = smoothstep(0.1, 0.9, mask); 
        
        // Mistura a cor: Onde tem veia (mask=1), fica vermelho escuro
        diffuseColor.rgb = mix(diffuseColor.rgb, uVesselColor, mask);
        `
      ).replace(
        `#include <roughnessmap_fragment>`,
        `
        #include <roughnessmap_fragment>
        // Mistura o brilho: Onde tem veia, usa o V_ROUGHNESS (quase 0, super especular)
        roughnessFactor = mix(roughnessFactor, uVesselRough, mask);
        `
      );
    };
    return mat;
  }, [mapVeins, mapTissue, noiseBump]);

  return (
    <group>
      {/* Controlo de Câmara integrado no componente */}
      <PerspectiveCamera 
        makeDefault 
        position={C.CAM_POS} 
        fov={C.CAM_FOV} 
      />
      <OrbitControls enableZoom={false} enablePan={false} />

      <group 
        position={[0, 0, 0]} 
        rotation={[toRad(C.ROT_X), toRad(C.ROT_Y), toRad(C.ROT_Z)]}
        scale={C.SCALE}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, -10]} intensity={10} />
        <pointLight position={[0, 0, 0]} intensity={30} color="#ff3300" distance={6} />

        <mesh material={mainMat}>
          <boxGeometry args={[C.WIDTH, C.HEIGHT, C.DEPTH, C.SEGMENTS, C.SEGMENTS, 5]} />
        </mesh>

        <Environment preset={C.ENV_PRESET} />
      </group>
    </group>
  );
};

export default Vessel_002_Test;
