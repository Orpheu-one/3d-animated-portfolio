import React, { useState, useRef, useMemo } from "react";

import { motion } from "framer-motion";

import { Canvas, useFrame } from "@react-three/fiber";

import { 
  PerspectiveCamera, 
  MeshTransmissionMaterial, 
  MeshDistortMaterial, 
  Float, 
  Environment,
  ContactShadows,
  OrbitControls,
} from "@react-three/drei";

import * as THREE from "three";

import { useTheme } from "../../context/ThemeContext";

import ComputerModelContainer from "./computer/ComputerModelContainer";

import "./services.css";


// ─── TUNABLES ────────────────────────────────────────────────────────────────
const YOLK_RADIUS            = 0.33;
const YOLK_Y_LOCAL           = -0.58;

const FLUID_RADIUS           = 0.73;    // fluido: 73% do raio da casca

const DISTORT_RADIUS         = 0.2;
const DISTORT_MIN            = 0.05;
const DISTORT_MAX            = 0.10;
const DISTORT_CHANGE_LO      = 0.5;
const DISTORT_CHANGE_HI      = 2.0;

const ENV_INTENSITY          = 0.50;    // environment — moderado

const EGG_SCALE_Y            = 1.35;    // oval Y stretch (dark only)
const MASTER_SCALE           = 0.75;    // 75% da escala anterior
const BASE_WIDEN             = 0.30;    // base 30% mais larga

// Backlight / rim light
const BACKLIGHT_NORMAL       = "#00ff44";
const BACKLIGHT_DARK         = "#ff2200";
const BACKLIGHT_INTENSITY    = 50;
// ─────────────────────────────────────────────────────────────────────────────


// ─── GEOMETRIA CUSTOM: base alargada 30% ─────────────────────────────────────
// Modifica vértices abaixo do equador — fator cresce de 0 (equador) até 1 (polo sul)
function buildWideBaseGeo(radius, wSeg, hSeg) {
  const geo = new THREE.SphereGeometry(radius, wSeg, hSeg);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) {
      const t      = Math.abs(y) / radius; // 0..1
      const factor = 1 + BASE_WIDEN * t;
      pos.setX(i, pos.getX(i) * factor);
      pos.setZ(i, pos.getZ(i) * factor);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
// ─────────────────────────────────────────────────────────────────────────────


const AlienEgg = () => {
  const { isDark } = useTheme();

  const shellRef   = useRef();
  const yolkRef    = useRef();
  const yolkMatRef = useRef();

  const distortVal = useRef(0.07);
  const nextChange = useRef(0);

  // Geometrias geradas uma única vez
  const shellGeo = useMemo(() => buildWideBaseGeo(1,           64, 64), []);
  const fluidGeo = useMemo(() => buildWideBaseGeo(FLUID_RADIUS, 48, 48), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (shellRef.current) shellRef.current.rotation.y = t * 0.05;
    if (yolkRef.current)  yolkRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    if (yolkMatRef.current && t > nextChange.current) {
      distortVal.current = DISTORT_MIN + Math.random() * (DISTORT_MAX - DISTORT_MIN);
      yolkMatRef.current.distort = distortVal.current;
      nextChange.current = t + DISTORT_CHANGE_LO + Math.random() * (DISTORT_CHANGE_HI - DISTORT_CHANGE_LO);
    }
  });

  // Normal = esfera  |  Dark = ovo oval
  const groupScale = isDark
    ? [MASTER_SCALE, MASTER_SCALE * EGG_SCALE_Y, MASTER_SCALE]
    : [MASTER_SCALE, MASTER_SCALE,               MASTER_SCALE];

  // Contra-escala da gema: anula o stretch em dark mode
  const yolkCounterY = isDark ? 1 / EGG_SCALE_Y : 1;

  const rimColor = isDark ? BACKLIGHT_DARK : BACKLIGHT_NORMAL;

  return (
    <>
      {/* Luz ambiente mínima — só complemento geral */}
      <ambientLight intensity={0.04} />

      {/* Fill branco frontal — suave, não ofusca */}
      <directionalLight position={[1.5, 2, 3]} intensity={1.6} color="#ffffff" />

      {/* RIM LIGHT lateral direita — dramático, acento verde/vermelho */}
      <spotLight
        position={[3.5, 0.5, 0.8]}
        angle={0.38}
        penumbra={0.65}
        intensity={BACKLIGHT_INTENSITY}
        color={rimColor}
        distance={14}
      />

      {/* Contra-luz traseira suave — reforça o rim pelo lado traseiro */}
      <pointLight position={[2.5, 0.2, -2.5]} intensity={7} color={rimColor} distance={9} />

      {/* Destaque subtil da gema */}
      <pointLight position={[0, -0.9, 0.5]} intensity={1.8} color="#ffcc00" distance={2} />

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
        <group scale={groupScale}>

          {/* ── CASCA EXTERIOR ─────────────────────────────────────────────
              +30% transparência (transmission 0.88 vs 0.78 anterior).
              Base mais larga via geometria custom.
          ─────────────────────────────────────────────────────────────────── */}
          <mesh ref={shellRef} geometry={shellGeo}>
            <MeshTransmissionMaterial
              backside
              samples={12}
              thickness={0.45}
              chromaticAberration={0.03}
              anisotropy={0.05}
              distortion={0.12}
              distortionScale={0.15}
              color="#ffffff"
              transmission={0.88}
              roughness={0.50}
              metalness={0.0}
              ior={1.38}
              attenuationColor="#fffce8"
              attenuationDistance={0.7}
              transparent={true}
            />
          </mesh>

          {/* ── FLUIDO VISCOSO — 70-75% interior ───────────────────────────
              Alta transmissão, espessura elevada e attenuationColor quente
              simulam o líquido viscoso entre casca e gema.
          ─────────────────────────────────────────────────────────────────── */}
          <mesh geometry={fluidGeo}>
            <MeshTransmissionMaterial
              samples={8}
              thickness={1.4}
              transmission={0.95}
              roughness={0.05}
              ior={1.52}
              color="#fffef0"
              attenuationColor="#ffd97a"
              attenuationDistance={1.8}
              chromaticAberration={0.01}
              transparent
            />
          </mesh>

          {/* ── GEMA ────────────────────────────────────────────────────────
              scale Y invertido anula o stretch do grupo → esfera perfeita.
          ─────────────────────────────────────────────────────────────────── */}
          <mesh
            ref={yolkRef}
            position={[0, YOLK_Y_LOCAL, 0]}
            scale={[1, yolkCounterY, 1]}
          >
            <sphereGeometry args={[YOLK_RADIUS, 64, 64]} />
            <MeshDistortMaterial
              ref={yolkMatRef}
              color="#ffcc00"
              speed={1.5}
              distort={distortVal.current}
              radius={DISTORT_RADIUS}
              emissive="#553300"
              emissiveIntensity={1.2}
            />
          </mesh>

        </group>
      </Float>

      <Environment preset="night" environmentIntensity={ENV_INTENSITY} />
    </>
  );
};


// --- 2. CONTAINER DA CANVAS ---
const AlienEggContainer = () => {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={35} />
        <AlienEgg />
        <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={10} blur={3} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
};


// --- 3. COMPONENTE SERVICES ---
// Animações de ENTRADA removidas. Hover mantém-se com retorno imediato (0.08s).
const items = [
  { id: 1, title: "Bio-Interface", description: "Organic Gestation Systems" },
  { id: 2, title: "Tech-Core",     description: "Inorganic Structures" },
  { id: 3, title: "Neural-Link",   description: "Synaptic Integration" },
];

const Services = () => {
  const [activeItemId, setActiveItemId] = useState(1);

  return (
    <div className="services">

      <div className="sSection left">

        {/* Sem animação de entrada — título estático */}
        <h1 className="sTitle">Services</h1>

        <div className="sLeftC">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="serviceItem"
              onClick={() => setActiveItemId(item.id)}
              whileHover={{ x: 10, borderColor: "#15ed7a" }}
              // retorno imediato (0.08s) tanto na entrada como na saída do hover
              transition={{ duration: 0.08, ease: "easeOut" }}
              style={{
                cursor: "pointer",
                border: activeItemId === item.id
                  ? "1px solid #15ed7a"
                  : "1px solid rgba(255,255,255,0.1)",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
                background: activeItemId === item.id
                  ? "rgba(21, 237, 122, 0.05)"
                  : "transparent",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{item.title}</h2>
              <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>{item.description}</p>
            </motion.div>
          ))}
        </div>

      </div>

      <div className="sSection right">
        {activeItemId === 1 && <AlienEggContainer />}
        {activeItemId === 2 && <ComputerModelContainer />}
        {activeItemId === 3 && (
          <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>
            Nexus Coming Soon
          </div>
        )}
      </div>

    </div>
  );
};

export default Services;
