import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Mantendo os teus Tunables
const C = {
  MAX_PARTICLES: 150,
  SPAWN_PER_ARM: 5,
  LIFETIME: 4.0,
  WAVE_INTERVAL: 2.5,
  SIZE_MIN: 0.02,
  SIZE_MAX: 0.20,
  SIZE_DECAY: 0.85,
  VELOCITY_BASE: 0.6,
  ROTATION_SPEED: 0.8,
  OPACITY_MAX: 0.8,
  Z_OFFSET: 0.15,
  GEOM_DETAIL: 32
};

const PALETTE = [
  new THREE.Color(0xffffff), new THREE.Color(0x000000),
  new THREE.Color(0xff00ff), new THREE.Color(0x00ffff), new THREE.Color(0xffff00),
];

const bell = (t) => {
  const eio = x => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2;
  return eio(Math.min(t*2,1)) - eio(Math.max(t*2-1,0));
};

const GalaxyEmitter = ({ yPos = -0.6 }) => {
  const meshRef = useRef();
  const particles = useRef([]);
  const lastWaveTs = useRef(-99);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Garante que no primeiro render, tudo está invisível e fora do centro
  useMemo(() => {
    dummy.scale.setScalar(0);
    dummy.position.set(1000, 1000, 1000); 
    dummy.updateMatrix();
  }, [dummy]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (t - lastWaveTs.current >= C.WAVE_INTERVAL) {
      lastWaveTs.current = t;
      const galaxyAngle = -C.ROTATION_SPEED * t;
      
      for (let arm = 0; arm < 6; arm++) {
        const armAngle = arm * (Math.PI * 2 / 6) + galaxyAngle;
        for (let p = 0; p < C.SPAWN_PER_ARM; p++) {
          const slot = particles.current.findIndex(s => !s || !s.active);
          const pData = {
            active: true,
            born: t + p * 0.15,
            lifetime: C.LIFETIME,
            startX: Math.cos(armAngle) * 0.4,
            startY: yPos + Math.sin(armAngle) * 0.4,
            vx: Math.cos(armAngle) * C.VELOCITY_BASE,
            vy: Math.sin(armAngle) * C.VELOCITY_BASE,
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            baseScale: (C.SIZE_MIN + Math.random() * (C.SIZE_MAX - C.SIZE_MIN)) * Math.pow(C.SIZE_DECAY, p)
          };
          if (slot === -1 && particles.current.length < C.MAX_PARTICLES) particles.current.push(pData);
          else if (slot !== -1) particles.current[slot] = pData;
        }
      }
    }

    // Processamento das instâncias
    for (let i = 0; i < C.MAX_PARTICLES; i++) {
      const p = particles.current[i];
      
      if (!p || !p.active) {
        dummy.scale.setScalar(0);
        dummy.position.set(1000, 1000, 1000); // Move para longe por segurança
      } else {
        const age = t - p.born;
        const lifeRatio = age / p.lifetime;

        if (lifeRatio >= 1 || age < 0) {
          if (lifeRatio >= 1) p.active = false;
          dummy.scale.setScalar(0);
        } else {
          const b = bell(lifeRatio);
          dummy.position.set(p.startX + p.vx * age, p.startY + p.vy * age, C.Z_OFFSET);
          dummy.scale.setScalar(p.baseScale * b);
          meshRef.current.setColorAt(i, p.color);
        }
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, C.MAX_PARTICLES]} renderOrder={10}>
      <circleGeometry args={[1, C.GEOM_DETAIL]} />
      <meshBasicMaterial transparent depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
};

export default GalaxyEmitter;