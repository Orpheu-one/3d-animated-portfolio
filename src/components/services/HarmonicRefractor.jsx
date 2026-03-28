import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../../context/ThemeContext";

const HarmonicRefractor = () => {
  const { isDark, isUno } = useTheme();
  const meshRef = useRef();
  const orbitsRef = useRef([]);

  // Definição de cores por tema
  const orbitColor = useMemo(() => {
    if (isUno) return "#ffffff";
    if (isDark) return "#ff2200";
    return "#15ed7a";
  }, [isDark, isUno]);

  // Aceleração de 15% na rotação base (0.2 * 1.15 = 0.23)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.23;
      meshRef.current.rotation.z = t * 0.115;
    }
    
    // Animar os 3 anéis de forma independente
    orbitsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x = t * (0.4 + i * 0.1);
        ring.rotation.y = t * (0.2 + i * 0.1);
      }
    });
  });

  return (
    // Escala global reduzida para 60% (0.6)
    <group scale={0.6}>
      <Float speed={3} rotationIntensity={0.8} floatIntensity={0.8}>
        
        {/* Núcleo de Refração */}
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.5, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={1.2}
            chromaticAberration={0.08}
            distortion={0.4}
            color={isDark ? "#fff0f0" : "#f0fff5"}
            transmission={0.98}
          />
        </mesh>

        {/* Sistema de 3 Órbitas a 120º */}
        {[0, 1, 2].map((i) => (
          <mesh 
            key={i} 
            ref={(el) => (orbitsRef.current[i] = el)}
            rotation={[ (i * Math.PI) / 1.5, 0, 0 ]} // Separação de 120º (PI / 1.5 rad)
          >
            <torusGeometry args={[2.2 + i * 0.2, 0.015, 16, 100]} />
            <meshStandardMaterial 
              color={orbitColor} 
              emissive={orbitColor} 
              emissiveIntensity={8} 
              transparent 
              opacity={0.8} 
            />
          </mesh>
        ))}

      </Float>

      <pointLight position={[0, 0, 0]} intensity={5} color={orbitColor} />
      <Environment preset="city" />
    </group>
  );
};

export default HarmonicRefractor;