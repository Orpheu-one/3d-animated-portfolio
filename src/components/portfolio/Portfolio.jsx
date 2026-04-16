import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Vessel_002_Test from "./Vessel_002_Test";

// ─────────────────────────────────────────────────────────────────────────────
//  NOTA SOBRE O CANVAS & DISPLACEMENT
//
//  Como vens do Maya, lembra-te que a densidade de polígonos (Subdivision) 
//  está definida dentro do componente Vessel_002_Test na geometria da esfera.
//  Se sentires que o relevo está "facetado", é lá que aumentamos os segmentos.
// ─────────────────────────────────────────────────────────────────────────────

const Portfolio = () => {
  return (
    <div style={{ width: "100%", height: "700px", position: "relative", background: "#050000" }}>
      <Canvas
        gl={{ 
          alpha: true, 
          antialias: true,
          // Importante para garantir que o displacement não sofra com precisão de profundidade
          logarithmicDepthBuffer: true 
        }}
        style={{ background: "transparent" }}
        // Ajustei a câmara ligeiramente para a esfera de teste (está no centro 0,0,0)
        camera={{ position: [0, 0, 8], fov: 45 }}
      >
        <Suspense fallback={null}>
          {/* O componente que utiliza o teu file Vessel_002.png */}
          <Vessel_002_Test />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={4}
          maxDistance={20}
          makeDefault
        />
      </Canvas>
    </div>
  );
};

export default Portfolio;