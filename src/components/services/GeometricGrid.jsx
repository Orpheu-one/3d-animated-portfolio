import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - GRELHA GEOMÉTRICA (HIGH CONTRAST)               ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  GRID_SIZE:         8,
  NESTING_LEVELS:    5,
  NESTING_REDUCTION: 0.25,
  EASE_FACTOR:       0.3,      // suavidade do lerp de cor

  // Paleta — igual à do CuttlefishSphere
  PALETTE: [
    "#00ffff",   // Ciano Puro
    "#ff00ff",   // Magenta Puro
    "#ffff00",   // Amarelo Puro
    "#ffffff",   // Branco Total
    "#000000",   // Preto Absoluto
  ],

  Z_OFFSET:   -2.5,
  PLANE_DIM:   8,

  // ── Wave direcional — mesma lógica do CuttlefishSphere ─────────────────
  // Movimento em direcção ao polo +Y (igual à animação do choco).
  // Ajusta aqui sem tocar em mais nada.
  WAVE_SPEED:     5.8,     // velocidade de deslocamento da onda (igual ao WAVE_SPEED do Cuttle)
  WAVE_FREQUENCY: 1.2,     // frequência espacial (bandas mais ou menos largas)
  WAVE_WIDTH:     0.08,    // nitidez da transição entre cores (0.01=duro, 0.4=suave)
  WAVE_PHASE_PER_LEVEL: 0.4, // offset de fase adicional por nível de nesting
};
// ──────────────────────────────────────────────────────────────────────────

const GeometricGrid = () => {
  const meshRef      = useRef();
  const totalInstances = C.GRID_SIZE * C.GRID_SIZE * C.NESTING_LEVELS;

  // Paleta convertida uma vez
  const paletteColors = useMemo(() =>
    C.PALETTE.map(hex => new THREE.Color(hex)), []
  );

  // Pool de cores (current lerpa em direcção ao target a cada frame)
  const colors = useMemo(() => ({
    current: Array.from({ length: totalInstances }, () => new THREE.Color()),
    target:  Array.from({ length: totalInstances }, () => new THREE.Color()),
  }), [totalInstances]);

  const tempObject = new THREE.Object3D();

  // Selecciona uma cor da paleta dado um valor contínuo 0..1
  // (espelha getPaleta() do CuttlefishSphere)
  const getPaletaColor = (t) => {
    const m = ((t % 1.0) + 1.0) % 1.0; // normaliza 0..1
    const idx = Math.floor(m * paletteColors.length);
    return paletteColors[idx];
  };

  useFrame(({ clock }) => {
    const t    = clock.getElapsedTime();
    const cell = C.PLANE_DIM / C.GRID_SIZE;

    let idx = 0;

    for (let x = 0; x < C.GRID_SIZE; x++) {
      for (let y = 0; y < C.GRID_SIZE; y++) {

        // Posição Y real desta célula na grelha (igual ao posY usado nas matrizes)
        const posY = (y - (C.GRID_SIZE - 1) / 2) * cell;

        for (let level = 0; level < C.NESTING_LEVELS; level++) {
          const scale = cell * (1 - level * C.NESTING_REDUCTION);
          const posX  = (x - (C.GRID_SIZE - 1) / 2) * cell;

          // ── Posição e escala (inalterado) ──────────────────────────────────
          tempObject.position.set(posX, posY, C.Z_OFFSET + level * 0.01);
          tempObject.scale.set(scale, scale, 1);
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(idx, tempObject.matrix);

          // ── Wave direcional — fórmula do CuttlefishSphere ──────────────────
          // wavePattern: cresce com posY e recua com t → onda move-se para +Y
          // level adiciona um desfasamento de fase → cada camada de nesting
          // está "adiantada" relativamente à anterior, criando profundidade visual
          const wavePattern = posY * C.WAVE_FREQUENCY
            - t * C.WAVE_SPEED
            + level * C.WAVE_PHASE_PER_LEVEL;

          // smoothstep igual ao do choco: 0 ou 1 com borda suave
          const raw  = Math.sin(wavePattern);
          const wave = THREE.MathUtils.smoothstep(raw, -C.WAVE_WIDTH, C.WAVE_WIDTH);

          // Mapeia 0..1 para a paleta (wave * escala dá variedade extra de cor)
          colors.target[idx] = getPaletaColor(wave * 0.8 + t * 0.05);

          // Lerp suave current → target (inalterado)
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
      {/* toneMapped={false} — impede que o renderer "lave" a cor */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

export default GeometricGrid;
