import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Environment, Float } from "@react-three/drei";

// ════════════════════════════════════════════════════════════════════════════════════════════
//  TUNABLES
// ════════════════════════════════════════════════════════════════════════════════════════════
const C = {
  PARTICLE_COUNT:        1200, // Aumentado ligeiramente para cobrir os ramos
  PRESSURE:              0.42,
  SPEED_VARIANCE:        0.50,
  DISPERSION_RATIO:      0.55,

  CELL_RADIUS:           0.085,
  CELL_SEGMENTS:         7,

  VESSEL_RADIUS_BOTTOM:  0.62,
  VESSEL_TAPER:          0.40, 
  FLUID_RADIUS_RATIO:    0.85,
  VESSEL_PATH_SEGS:      120,
  VESSEL_RADIAL_SEGS:    22,
  FRENET_SEGS:           200,

  MAT_SAMPLES:           10, // Otimizado
  MAT_IOR:               1.08,
  MAT_ROUGHNESS:         0.25, // Aumentado para base
  MAT_THICKNESS:         0.60,
  MAT_DISTORTION:        0.20,
  MAT_DIST_SCALE:        0.40,
  MAT_TEMPORAL_DIST:     0.10,
  MAT_CHROMATIC_AB:      0.15,
  MAT_ANISOTROPY:        0.30,

  FLUID_OPACITY:         0.35,

  INTERNAL_INTENSITY:    3.5,
  INTERNAL_DISTANCE:     15,
  SPOT_ROSE_INT:         12,
  SPOT_ROSE2_INT:        8,
  RIM_INTENSITY:         20,
  AMBIENT_INTENSITY:     0.6,

  COLORS: {
    BG:            "#050000",
    VESSEL_SHELL:  "#f30a0a",
    VESSEL_GLOW:   "#ff2200",
    FLUID:         "#4a1000",
    CELL_A:        "#ee1100",
    CELL_B:        "#45150e",
    SPOT_ROSE:     "#4f0d23",
    SPOT_ROSE2:    "#ec740c",
    RIM:           "#45150e",
    AMBIENT:       "#080000",
  },
};

// ════════════════════════════════════════════════════════════════════════════════════════════
//  HELPERS & SINGLETONS
// ════════════════════════════════════════════════════════════════════════════════════════════
const _dummy  = new THREE.Object3D();
const _up     = new THREE.Vector3(0, 1, 0);
const _col    = new THREE.Color();

function buildTaperedTube(path, tubularSegs, radialSegs, rBottom, rTop, frames) {
  const positions = [];
  const normals_  = [];
  const uvs       = [];
  const indices   = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t      = i / tubularSegs;
    const radius = THREE.MathUtils.lerp(rBottom, rTop, t);
    const pt     = path.getPointAt(t);
    const fIdx   = Math.min(Math.floor(t * (frames.normals.length - 1)), frames.normals.length - 1);
    const N      = frames.normals[fIdx];
    const B      = frames.binormals[fIdx];

    for (let j = 0; j <= radialSegs; j++) {
      const angle = (j / radialSegs) * Math.PI * 2;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const nx = c * N.x + s * B.x;
      const ny = c * N.y + s * B.y;
      const nz = c * N.z + s * B.z;

      positions.push(pt.x + radius * nx, pt.y + radius * ny, pt.z + radius * nz);
      normals_.push(nx, ny, nz);
      uvs.push(j / radialSegs, t);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = (radialSegs + 1) * i + j;
      const b = (radialSegs + 1) * (i + 1) + j;
      const c = (radialSegs + 1) * (i + 1) + j + 1;
      const d = (radialSegs + 1) * i + j + 1;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal",   new THREE.Float32BufferAttribute(normals_, 3));
  geo.setAttribute("uv",       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
//  BloodVessel
// ════════════════════════════════════════════════════════════════════════════════════════════
const BloodVessel = () => {
  const particlesRef = useRef();

  // --- Ruído Procedural para o Roughness (absorver brilho) ---
  const noiseTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 12);
    return tex;
  }, []);

  // --- Paths Fluídas e Inclinadas ---
  const paths = useMemo(() => {
    // Tronco principal inclinado
    const main = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.0, -7.0, -1.0),
      new THREE.Vector3(-0.5, -3.0,  0.5),
      new THREE.Vector3( 1.5,  1.0, -0.5),
      new THREE.Vector3( 0.5,  5.0,  1.0),
      new THREE.Vector3( 2.0,  8.5,  0.0),
    ]);
    
    // Ramo 1 (sai do meio do tronco)
    const b1 = new THREE.CatmullRomCurve3([
      main.getPointAt(0.4),
      new THREE.Vector3( 2.5,  2.5,  1.5),
      new THREE.Vector3( 3.5,  6.0,  0.5),
      new THREE.Vector3( 4.0,  9.0, -1.0),
    ]);

    // Ramo 2 (mais curto)
    const b2 = new THREE.CatmullRomCurve3([
      main.getPointAt(0.65),
      new THREE.Vector3(-2.5,  4.5,  0.0),
      new THREE.Vector3(-3.0,  7.5,  1.0),
      new THREE.Vector3(-2.5,  9.5,  0.5),
    ]);

    return [main, b1, b2];
  }, []);

  const data = useMemo(() => {
    return paths.map((p, idx) => {
      const f = p.computeFrenetFrames(C.FRENET_SEGS, false);
      const isMain = idx === 0;
      const rB = isMain ? C.VESSEL_RADIUS_BOTTOM : C.VESSEL_RADIUS_BOTTOM * 0.5;
      const rT = rB * C.VESSEL_TAPER;

      return {
        path: p,
        frames: f,
        vesselGeo: buildTaperedTube(p, C.VESSEL_PATH_SEGS, C.VESSEL_RADIAL_SEGS, rB, rT, f),
        fluidGeo:  buildTaperedTube(p, C.VESSEL_PATH_SEGS, C.VESSEL_RADIAL_SEGS, rB * C.FLUID_RADIUS_RATIO, rT * C.FLUID_RADIUS_RATIO, f),
        rBottom: rB,
        rTop: rT
      };
    });
  }, [paths]);

  const particles = useMemo(() =>
    Array.from({ length: C.PARTICLE_COUNT }, () => {
      const pathIdx = Math.random() > 0.4 ? 0 : (Math.random() > 0.5 ? 1 : 2);
      return {
        pathIdx,
        t: Math.random(),
        speed: 1 - C.SPEED_VARIANCE / 2 + Math.random() * C.SPEED_VARIANCE,
        radialAngle: Math.random() * Math.PI * 2,
        radialDist:  Math.sqrt(Math.random()),
        spinSpeed: (Math.random() - 0.5) * 0.8,
      };
    }), []);

  useFrame(({ clock }, delta) => {
    if (!particlesRef.current) return;
    const time = clock.getElapsedTime();

    particles.forEach((p, i) => {
      const d = data[p.pathIdx];
      p.t += delta * C.PRESSURE * p.speed * 0.04;
      if (p.t >= 1) p.t -= 1;

      const tangent = d.path.getTangentAt(p.t);
      const fIdx = Math.min(Math.floor(p.t * C.FRENET_SEGS), C.FRENET_SEGS - 1);
      const localR = THREE.MathUtils.lerp(d.rBottom, d.rTop, p.t) * C.DISPERSION_RATIO;

      _dummy.position
        .copy(d.path.getPointAt(p.t))
        .addScaledVector(d.frames.normals[fIdx],   Math.cos(p.radialAngle) * p.radialDist * localR)
        .addScaledVector(d.frames.binormals[fIdx], Math.sin(p.radialAngle) * p.radialDist * localR);

      _dummy.quaternion.setFromUnitVectors(_up, tangent);
      _dummy.rotateOnAxis(tangent, time * p.spinSpeed);
      _dummy.updateMatrix();

      particlesRef.current.setMatrixAt(i, _dummy.matrix);
      _col.lerpColors(new THREE.Color(C.COLORS.CELL_A), new THREE.Color(C.COLORS.CELL_B), p.t);
      particlesRef.current.setColorAt(i, _col);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
    if (particlesRef.current.instanceColor) particlesRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <color attach="background" args={[C.COLORS.BG]} />
      <ambientLight intensity={C.AMBIENT_INTENSITY} color={C.COLORS.AMBIENT} />

      <spotLight position={[-12, 10, 10]} angle={0.3} penumbra={1} intensity={C.SPOT_ROSE_INT} color={C.COLORS.SPOT_ROSE} />
      <spotLight position={[12, -5, 5]} angle={0.3} penumbra={1} intensity={C.SPOT_ROSE2_INT} color={C.COLORS.SPOT_ROSE2} />
      <pointLight position={[8, 4, -10]} intensity={C.RIM_INTENSITY} color={C.COLORS.RIM} />

      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.1}>
        <group>
          {data.map((d, i) => (
            <group key={i}>
              <pointLight position={d.path.getPointAt(0.5)} intensity={C.INTERNAL_INTENSITY} color={C.COLORS.VESSEL_GLOW} distance={C.INTERNAL_DISTANCE} />
              
              <mesh geometry={d.vesselGeo}>
                <MeshTransmissionMaterial
                  backside
                  samples={C.MAT_SAMPLES}
                  transmission={1.0}
                  color={C.COLORS.VESSEL_SHELL}
                  thickness={C.MAT_THICKNESS}
                  roughness={C.MAT_ROUGHNESS}
                  roughnessMap={noiseTex} // Ruído para absorver especular
                  ior={C.MAT_IOR}
                  chromaticAberration={C.MAT_CHROMATIC_AB}
                  anisotropy={C.MAT_ANISOTROPY}
                  distortion={C.MAT_DISTORTION}
                  distortionScale={C.MAT_DIST_SCALE}
                  temporalDistortion={C.MAT_TEMPORAL_DIST}
                />
              </mesh>

              <mesh geometry={d.fluidGeo} renderOrder={-1}>
                <meshStandardMaterial color={C.COLORS.FLUID} transparent opacity={C.FLUID_OPACITY} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

          <instancedMesh ref={particlesRef} args={[null, null, C.PARTICLE_COUNT]}>
            <circleGeometry args={[C.CELL_RADIUS, C.CELL_SEGMENTS]} />
            <meshStandardMaterial side={THREE.DoubleSide} roughness={0.3} metalness={0.05} toneMapped={false} />
          </instancedMesh>
        </group>
      </Float>

      <Environment preset="city" />
    </group>
  );
};

export default BloodVessel;