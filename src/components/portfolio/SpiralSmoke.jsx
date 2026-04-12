import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - ESTRUTURA E FLUIDO                              ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  PARTICLE_COUNT: 200,      // Por cada ramificação
  FLOW_SPEED: 0.12,         // Velocidade média
  ROTATION_SPEED: 2.5,      // Rotação das partículas em suspensão
  VESSEL_RADIUS: 0.35,
  
  // Material "Glass Shell"
  SHELL_COLOR: "#ffffff",
  TRANSMISSION: 1.0,
  IOR: 1.45,                // Índice de refração do vidro
  THICKNESS: 0.8,           // Espessura da "casca"
  
  // Cores das Partículas
  PARTICLE_START: "#ff0000",
  PARTICLE_END: "#440000"
};

const VesselBranch = ({ curve, delay = 0 }) => {
  const meshRef = useRef();
  const particlesRef = useRef();
  
  // Geometria da veia
  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 100, C.VESSEL_RADIUS, 12, false), [curve]);

  // Dados das partículas: posição, rotação e eixos aleatórios
  const particleData = useMemo(() => {
    return Array.from({ length: C.PARTICLE_COUNT }, () => ({
      t: Math.random(),
      speed: 0.8 + Math.random() * 0.4,
      // Rotação inicial e eixos aleatórios para o efeito de suspensão
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      // Afastamento do centro (espessura do fluido)
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      )
    }));
  }, []);

  const dummy = new THREE.Object3D();

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    particleData.forEach((p, i) => {
      // 1. Movimento ao longo do fluido (Flow)
      p.t = (p.t + delta * C.FLOW_SPEED * p.speed) % 1;
      
      const pos = curve.getPointAt(p.t);
      const tangent = curve.getTangentAt(p.t);
      
      // 2. Rotação Multi-eixo (Suspensão)
      dummy.position.copy(pos).add(p.offset);
      dummy.quaternion.setFromAxisAngle(p.rotAxis, time * C.ROTATION_SPEED * p.speed);
      
      // 3. Escala irregular para parecer orgânico
      const s = 0.04 + Math.random() * 0.02;
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
    
    // Pequena pulsação na casca de vidro
    const pulse = 1 + Math.sin(time * 1.5 + delay) * 0.02;
    meshRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group>
      {/* Casca de Vidro (Shell) */}
      <mesh ref={meshRef} geometry={tubeGeo}>
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={512}
          thickness={C.THICKNESS}
          roughness={0.05}
          ior={C.IOR}
          color={C.SHELL_COLOR}
          transmission={C.TRANSMISSION}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Partículas em Suspensão */}
      <instancedMesh ref={particlesRef} args={[null, null, C.PARTICLE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} /> {/* Cubos irregulares para notar a rotação */}
        <meshStandardMaterial 
          color={C.PARTICLE_START} 
          emissive={C.PARTICLE_END} 
          emissiveIntensity={0.5} 
        />
      </instancedMesh>
    </group>
  );
};

const BiologicalNetwork = () => {
  // Criação de uma rede mais longa e ramificada
  const branches = useMemo(() => {
    const main = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, -1, 0),
      new THREE.Vector3(-4, 0, 1),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4, 1, -1),
      new THREE.Vector3(8, 0, 0),
    ]);

    const b1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), // Ponto de união
      new THREE.Vector3(1, 2, 0.5),
      new THREE.Vector3(3, 4, 2),
    ]);

    const b2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 0, 1), // Ponto de união
      new THREE.Vector3(-5, -2, 2),
      new THREE.Vector3(-7, -4, 1.5),
    ]);

    return [main, b1, b2];
  }, []);

  return (
    <group>
      {/* Iluminação específica para destacar o vidro */}
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, -10, -10]} color="red" intensity={1} />
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {branches.map((path, i) => (
          <VesselBranch key={i} curve={path} delay={i * 0.8} />
        ))}
      </Float>

      {/* O ambiente é vital para o material de transmissão (vidro) */}
      <Environment preset="city" />
    </group>
  );
};

export default BiologicalNetwork;