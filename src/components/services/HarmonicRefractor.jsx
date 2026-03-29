import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../../context/ThemeContext";


const HarmonicRefractor = () => {
  const { isDark, isUno } = useTheme();
  const { camera } = useThree();
  const meshRef   = useRef();
  const orbitsRef = useRef([]);

  useEffect(() => {
    camera.position.z = 12;
    camera.updateProjectionMatrix();
  }, [camera]);

  const orbitColor = useMemo(() => {
    if (isUno) return "#e879f9"; // fúcsia-lavanda etéreo
    if (isDark) return "#ff2200"; // vermelho
    return "#15ed7a";             // verde
  }, [isDark, isUno]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.23;
      meshRef.current.rotation.z = t * 0.115;
    }
    orbitsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x = t * (0.4 + i * 0.1);
        ring.rotation.y = t * (0.2 + i * 0.1);
      }
    });
  });

  return (
    <group scale={0.825}>
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

        {/* Sistema de 3 Órbitas
            FIX: emissiveIntensity 15 → 3.5
            Com 15 o canal satura e tudo vira branco independentemente da cor.
            Com 3.5 o anel brilha intensamente mas mantém a tonalidade correta. */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(el) => (orbitsRef.current[i] = el)}
            rotation={[(i * Math.PI) / 1.5, 0, 0]}
          >
            <torusGeometry args={[2.2 + i * 0.2, 0.09, 16, 100]} />
            <meshStandardMaterial
              color={orbitColor}
              emissive={orbitColor}
              emissiveIntensity={0.5}
              transparent
              opacity={0.9}
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
