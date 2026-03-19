import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ╔══════════════════════════════════════════════════════════╗
// ║                  TUNE ME — CONSTANTS                     ║
// ╚══════════════════════════════════════════════════════════╝
const NEON_GREEN   = '#15ed7a';    // wireframe color
const ORBIT_SPEED  = 0.5;         // rad/s — orbit speed
const ORBIT_TILT   = Math.PI;     // rad   — X-axis tilt (PI = 180deg, flat XZ plane)
const ORBIT_RADIUS = 10;         // units — orbit radius
const RING_OPACITY = 0.35;        // 0-1   — orbit ring opacity
const RING_TUBE_R  = 0.0;       // units — ring tube thickness
const RING_SEGS    = 128;         // int   — ring smoothness
const BOX_SEGS     = 6;           // int   — wireframe box subdivisions
const GLOW_SCALE   = 1.4;         // x     — max scale when facing camera
const GLOW_OPACITY = 0.22;        // 0-1   — max halo opacity
const LERP_SPEED   = 0.12;        // 0-1   — lerp speed (scale + glow)
const SPIN_CHANCE  = 0.004;       // prob/frame of sudden spin (~4s avg @ 60fps)
const SPIN_SPEED   = 10.0;        // rad/s — initial spin impulse
const SPIN_DAMPING = 0.88;        // damping factor per normalized frame
// ══════════════════════════════════════════════════════════

const ANGLES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
const orbitPos = (a) => [
  ORBIT_RADIUS * Math.cos(a),
  0,
  ORBIT_RADIUS * Math.sin(a),
];
const lerpVal = (a, b, t) => a + (b - a) * t;

const OrbitingGroup = () => {
  const groupRef = useRef();

  const item0 = useRef(), item1 = useRef(), item2 = useRef();
  const wire0 = useRef(), wire1 = useRef(), wire2 = useRef();
  const glow0 = useRef(), glow1 = useRef(), glow2 = useRef();

  const itemRefs = [item0, item1, item2];
  const wireRefs = [wire0, wire1, wire2];
  const glowRefs = [glow0, glow1, glow2];

  const spinVels = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);

  const _wp = new THREE.Vector3();
  const _cd = new THREE.Vector3();
  const _tm = new THREE.Vector3();

  useFrame(({ camera }, delta) => {
    // orbit rotation
    groupRef.current.rotation.y += delta * ORBIT_SPEED;

    // camera direction
    camera.getWorldDirection(_cd);

    // find which object faces camera most
    let maxDot = -Infinity;
    let frontIdx = 0;
    itemRefs.forEach((ref, i) => {
      ref.current.getWorldPosition(_wp);
      _tm.subVectors(_wp, camera.position).normalize();
      const d = _tm.dot(_cd);
      if (d > maxDot) { maxDot = d; frontIdx = i; }
    });

    const dNorm = Math.min(delta * 60, 3);

    itemRefs.forEach((ref, i) => {
      const isFront = i === frontIdx;

      // smooth scale
      const tScale = isFront ? GLOW_SCALE : 1.0;
      const s = ref.current.scale;
      s.x = lerpVal(s.x, tScale, LERP_SPEED);
      s.y = lerpVal(s.y, tScale, LERP_SPEED);
      s.z = lerpVal(s.z, tScale, LERP_SPEED);

      // halo opacity
      if (glowRefs[i].current) {
        const tOp = isFront ? GLOW_OPACITY : 0.03;
        glowRefs[i].current.material.opacity = lerpVal(
          glowRefs[i].current.material.opacity,
          tOp,
          LERP_SPEED
        );
      }

      // sudden spin impulse
      const vel = spinVels.current[i];
      if (Math.random() < SPIN_CHANCE) {
        vel.set(
          (Math.random() - 0.5) * SPIN_SPEED,
          (Math.random() - 0.5) * SPIN_SPEED,
          (Math.random() - 0.5) * SPIN_SPEED
        );
      }

      if (wireRefs[i].current) {
        wireRefs[i].current.rotation.x += vel.x * delta;
        wireRefs[i].current.rotation.y += vel.y * delta;
        wireRefs[i].current.rotation.z += vel.z * delta;
      }

      // dampen spin
      const damp = Math.pow(SPIN_DAMPING, dNorm);
      vel.x *= damp;
      vel.y *= damp;
      vel.z *= damp;
    });
  });

  return (
    <group ref={groupRef} rotation={[ORBIT_TILT, 0, 0]}>

      {/* Orbit ring */}
      <mesh>
        <torusGeometry args={[ORBIT_RADIUS, RING_TUBE_R, 8, RING_SEGS]} />
        <meshBasicMaterial color={NEON_GREEN} transparent opacity={RING_OPACITY} />
      </mesh>

      {/* 1. Phone — 0deg */}
      <group ref={item0} position={orbitPos(ANGLES[0])}>
        <mesh ref={wire0}>
          <boxGeometry args={[0.5, 0.9, 0.1, BOX_SEGS, BOX_SEGS, 2]} />
          <meshBasicMaterial color={NEON_GREEN} wireframe />
        </mesh>
        <mesh ref={glow0}>
          <boxGeometry args={[0.6, 1.0, 0.2, 1, 1, 1]} />
          <meshBasicMaterial color={NEON_GREEN} transparent opacity={0.03} depthWrite={false} />
        </mesh>
      </group>

      {/* 2. Desktop — 120deg */}
      <group ref={item1} position={orbitPos(ANGLES[1])}>
        <mesh ref={wire1}>
          <boxGeometry args={[1.2, 0.8, 0.05, BOX_SEGS, BOX_SEGS, 1]} />
          <meshBasicMaterial color={NEON_GREEN} wireframe />
        </mesh>
        <mesh ref={glow1}>
          <boxGeometry args={[1.32, 0.92, 0.15, 1, 1, 1]} />
          <meshBasicMaterial color={NEON_GREEN} transparent opacity={0.03} depthWrite={false} />
        </mesh>
      </group>

      {/* 3. Sphere — 240deg */}
      <group ref={item2} position={orbitPos(ANGLES[2])}>
        <mesh ref={wire2}>
          <sphereGeometry args={[0.4, 24, 24]} />
          <meshBasicMaterial color={NEON_GREEN} wireframe />
        </mesh>
        <mesh ref={glow2}>
          <sphereGeometry args={[0.52, 8, 8]} />
          <meshBasicMaterial color={NEON_GREEN} transparent opacity={0.03} depthWrite={false} />
        </mesh>
      </group>

    </group>
  );
};

const OrbitScene = () => (
  <div style={{ width: '100%', maxWidth: '1024px', height: '200px', margin: '0 auto' }}>
    <Canvas camera={{ position: [0, 0,16 ], fov: 35 }}>
      <ambientLight intensity={0.5} />
      <OrbitingGroup />
    </Canvas>
  </div>
);

export default OrbitScene;