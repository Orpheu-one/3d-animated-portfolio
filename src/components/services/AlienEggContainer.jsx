import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  PerspectiveCamera, 
  MeshTransmissionMaterial, 
  Sphere, 
  Environment, 
  Float,
  MeshDistortMaterial, 
  OrbitControls
} from "@react-three/drei";
import * as THREE from "three";

const AlienEgg = () => {
  const innerRef = useRef();
  const shellRef = useRef();

  // Animação ligeira para simular vida lá dentro
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (innerRef.current) {
      innerRef.current.position.y = Math.sin(t * 0.5) * 0.1;
      innerRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <>
      {/* Iluminação Customizada */}
      <ambientLight intensity={0.2} />
      {/* Luz principal à direita (Back scene) */}
      <pointLight position={[5, 5, -5]} intensity={2} color="#ffffff" />
      {/* Luz de recorte Verde (Rim light) */}
      <spotLight 
        position={[-5, 2, 2]} 
        angle={0.3} 
        penumbra={1} 
        intensity={3} 
        color="#15ed7a" 
        castShadow 
      />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group scale={[1, 1.35, 1]}> {/* Formato de Ovo */}
          
          {/* CASCA EXTERIOR (O Ovo) */}
          <mesh ref={shellRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshTransmissionMaterial
              backside
              samples={10}
              thickness={0.2}
              chromaticAberration={0.05}
              anisotropy={0.1}
              distortion={0.3}
              distortionScale={0.5}
              temporalDistortion={0.1}
              color="#2a3b2a"
              roughness={0.2}
              transmission={0.95}
              // Simulando a textura de "veias" ou orgânica
              normalMap={null} // Aqui poderias carregar um noise map
            />
          </mesh>

          {/* NÚCLEO INTERIOR (A Esfera Deformada) */}
          <mesh ref={innerRef} position={[0, 0, -0.2]}>
            <sphereGeometry args={[0.5, 64, 64]} />
            <MeshDistortMaterial
              color="#15ed7a"
              speed={2}
              distort={0.3} // Deformação ligeira
              radius={1}
              emissive="#052b12"
              roughness={0.4}
            />
          </mesh>
          
        </group>
      </Float>

      {/* Ambiente para reflexos orgânicos */}
      <Environment preset="night" />
    </>
  );
};

const AlienEggContainer = () => {
  return (
    <div style={{ width: "100%", height: "500px", position: "relative" }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 0, 5]} 
          fov={45} 
        />
        <color attach="background" args={["#050505"]} />
        
        <AlienEgg />
        <OrbitControls/> {/* Permite interação, pode ser removido para desativar */}
        
        {/* Desativamos o Zoom e controlamos a interação se necessário */}
      </Canvas>
    </div>
  );
};

export default AlienEggContainer;