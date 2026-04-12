import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import SpiralSmoke from "./SpiralSmoke";

const Portfolio = () => {
  return (
    // Definimos uma altura para a secção, senão o Canvas fica com 0px
    <div style={{ width: "100%", height: "600px", position: "relative" }}>
      <Canvas
        camera={{ position: [8, 8, 8], fov: 45 }}
        shadows
      >
        {/* Fundo Branco para teste - vamos remover depois */}
        <color attach="background" args={["#ffffff"]} />
        
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        
        <Suspense fallback={null}>
          <group position={[0, -2, 0]}> {/* Ajusta a posição da base aqui */}
            <SpiralSmoke />
          </group>
          
          {/* Sombra suave no "chão" para dar volume */}
          <ContactShadows 
            opacity={0.4} 
            scale={10} 
            blur={2.5} 
            far={4} 
          />
        </Suspense>

        <OrbitControls enableZoom={false} makeDefault />
      </Canvas>
    </div>
  );
};

export default Portfolio;