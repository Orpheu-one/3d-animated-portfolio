import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - GRELHA GEOMÉTRICA (HIGH CONTRAST)                ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  GRID_SIZE: 8,          
  NESTING_LEVELS: 4,     
  NESTING_REDUCTION: 0.25, 
  
  CHANGE_SPEED: 0.5,     
  EASE_FACTOR: 0.3,      
  
  // Usamos strings hex para garantir pureza antes da conversão
  PALETTE: [
    "#00ffff", // Ciano Puro
    "#ff00ff", // Magenta Puro
    "#ffff00", // Amarelo Puro
    "#ffffff", // Branco Total
    "#000000", // Preto Absoluto
  ],

  Z_OFFSET: -2.5,
  PLANE_DIM: 8          
};

const GeometricGrid = () => {
  const meshRef = useRef();
  const totalInstances = C.GRID_SIZE * C.GRID_SIZE * C.NESTING_LEVELS;
  
  // 1. Convertemos a paleta garantindo que o Three.js não aplica gestão de cor indesejada aqui
  const paletteColors = useMemo(() => 
    C.PALETTE.map(hex => new THREE.Color(hex)), []
  );

  const colors = useMemo(() => ({
    current: Array.from({ length: totalInstances }, () => new THREE.Color()),
    target: Array.from({ length: totalInstances }, () => paletteColors[Math.floor(Math.random() * paletteColors.length)])
  }), [totalInstances, paletteColors]);

  const lastChange = useRef(0);
  const tempObject = new THREE.Object3D();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (t - lastChange.current > C.CHANGE_SPEED) {
      for (let i = 0; i < totalInstances; i++) {
        colors.target[i] = paletteColors[Math.floor(Math.random() * paletteColors.length)];
      }
      lastChange.current = t;
    }

    let idx = 0;
    const cellSize = C.PLANE_DIM / C.GRID_SIZE;

    for (let x = 0; x < C.GRID_SIZE; x++) {
      for (let y = 0; y < C.GRID_SIZE; y++) {
        for (let level = 0; level < C.NESTING_LEVELS; level++) {
          
          const scale = cellSize * (1 - level * C.NESTING_REDUCTION);
          const posX = (x - (C.GRID_SIZE - 1) / 2) * cellSize;
          const posY = (y - (C.GRID_SIZE - 1) / 2) * cellSize;

          tempObject.position.set(posX, posY, C.Z_OFFSET + level * 0.01); 
          tempObject.scale.set(scale, scale, 1);
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(idx, tempObject.matrix);

          colors.current[idx].lerp(colors.target[idx], C.EASE_FACTOR);
          meshRef.current.setColorAt(idx, colors.current[idx]);

          idx++;
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, totalInstances]}>
      <planeGeometry args={[1, 1]} /> 
      {/* toneMapped={false} é a chave! 
          Impede que o renderer "lave" a cor para parecer realista.
      */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

export default GeometricGrid;