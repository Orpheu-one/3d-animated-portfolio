import React, { useState, useRef } from "react";

import { motion } from "framer-motion";

import { Canvas, useFrame } from "@react-three/fiber";

import { 
  PerspectiveCamera, 
  MeshTransmissionMaterial, 
  MeshDistortMaterial, 
  Float, 
  Environment,
  ContactShadows,
  OrbitControls,           // ADDED
} from "@react-three/drei";

import * as THREE from "three";

import { useTheme } from "../../context/ThemeContext"; // ADDED — igual ao Hero.jsx

import ComputerModelContainer from "./computer/ComputerModelContainer";

import "./services.css";


// ─── TUNABLES ────────────────────────────────────────────────────────────────
const YOLK_RADIUS       = 0.33;    // ~33% do raio da casca (30-35%)
const YOLK_Y_LOCAL      = -0.58;   // posição centro gema no espaço local do grupo (~5% do fundo do ovo)
const YOLK_COUNTER_Y    = 1 / 1.35;// anula a deformação do grupo → gema esfera, não oval

const DISTORT_RADIUS    = 0.2;     // área de distorção: 20% da esfera
const DISTORT_MIN       = 0.05;    // amplitude mínima (5%)
const DISTORT_MAX       = 0.10;    // amplitude máxima (10%)
const DISTORT_CHANGE_LO = 0.5;     // intervalo min entre mudanças (s)
const DISTORT_CHANGE_HI = 2.0;     // intervalo max entre mudanças (s)

const ENV_INTENSITY     = 0.7;     // environment — ligeiramente mais intenso

const BACKLIGHT_NORMAL  = "#00ff44"; // verde — normal theme
const BACKLIGHT_DARK    = "#ff2200"; // vermelho — dark theme
const BACKLIGHT_INTENSITY = 70;
// ─────────────────────────────────────────────────────────────────────────────


const AlienEgg = () => {
  const { isDark } = useTheme(); // ← lê o theme exactamente como o Hero.jsx

  const shellRef   = useRef();
  const yolkRef    = useRef();
  const yolkMatRef = useRef();        // ref direto no MeshDistortMaterial

  const distortVal    = useRef(0.07);
  const nextChange    = useRef(0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // rotação lenta da casca
    if (shellRef.current) {
      shellRef.current.rotation.y = t * 0.05;
    }

    // pulsação orgânica da gema
    if (yolkRef.current) {
      yolkRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    }

    // randomização periódica do distort (5–10%)
    if (yolkMatRef.current && t > nextChange.current) {
      distortVal.current = DISTORT_MIN + Math.random() * (DISTORT_MAX - DISTORT_MIN);
      yolkMatRef.current.distort = distortVal.current;
      nextChange.current = t + DISTORT_CHANGE_LO + Math.random() * (DISTORT_CHANGE_HI - DISTORT_CHANGE_LO);
    }
  });

  const backlightColor = isDark ? BACKLIGHT_DARK : BACKLIGHT_NORMAL;

  return (
    <>
      {/* Luz ambiente baixa */}
      <ambientLight intensity={0.15} />

      {/* BACKLIGHT traseiro — verde (normal) ou vermelho (dark) */}
      <pointLight
        position={[-0.3, 0, 2.5]}
        intensity={BACKLIGHT_INTENSITY}
        color={backlightColor}
        distance={9}
      />

      {/* FILL branco frontal — ilumina bem a cena */}
      <directionalLight position={[2, 3, 3]} intensity={2.5} color="#ffffff" />

      {/* Destaque subtil da gema */}
      <pointLight position={[0, -0.9, 0.3]} intensity={2} color="#ffcc00" distance={2} />

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
        <group scale={[1, 1.35, 1]}>

          {/* ── CASCA EXTERIOR ─────────────────────────────────────────────
              Translúcida (não totalmente transparente), branca, menos reflexiva.
              attenuationColor + attenuationDistance dão a ilusão de líquido
              viscoso entre casca e gema.
          ─────────────────────────────────────────────────────────────────── */}
          <mesh ref={shellRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshTransmissionMaterial
              backside
              samples={12}
              thickness={0.45}
              chromaticAberration={0.03}
              anisotropy={0.05}
              distortion={0.15}
              distortionScale={0.2}
              color="#ffffff"
              transmission={0.78}      // menos transparente (era 1.0)
              roughness={0.55}         // mais baço (era 0.4)
              metalness={0.0}
              ior={1.38}
              attenuationColor="#fffce8" // leve amarelo quente → sugere viscosidade
              attenuationDistance={0.7}
              transparent={true}
            />
          </mesh>

          {/* ── GEMA ──────────────────────────────────────────────────────
              scale Y invertido para anular deformação do grupo → esfera perfeita.
              Posição: ~5% do fundo do ovo (espaço local).
          ─────────────────────────────────────────────────────────────────── */}
          <mesh
            ref={yolkRef}
            position={[0, YOLK_Y_LOCAL, 0]}
            scale={[1, YOLK_COUNTER_Y, 1]}
          >
            <sphereGeometry args={[YOLK_RADIUS, 64, 64]} />
            <MeshDistortMaterial
              ref={yolkMatRef}
              color="#ffcc00"          // amarelo
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
        {/* OrbitControls sem zoom */}
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
};


// --- 3. COMPONENTE SERVICES (inalterado) ---
const items = [
  { id: 1, title: "Bio-Interface", description: "Organic Gestation Systems" },
  { id: 2, title: "Tech-Core",     description: "Inorganic Structures" },
  { id: 3, title: "Neural-Link",   description: "Synaptic Integration" },
];

const fromLeft = (delay) => ({
  hidden:  { x: -60, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { delay, duration: 0.8 } },
});

const Services = () => {
  const [activeItemId, setActiveItemId] = useState(1);

  return (
    <motion.div className="services" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }}>
      <div className="sSection left">
        <motion.h1 className="sTitle" variants={fromLeft(0)}>Services</motion.h1>
        <div className="sLeftC">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="serviceItem"
              variants={fromLeft(1.0 + index * 0.3)}
              onClick={() => setActiveItemId(item.id)}
              whileHover={{ x: 10, borderColor: "#15ed7a" }}
              style={{
                cursor: "pointer",
                border: activeItemId === item.id ? "1px solid #15ed7a" : "1px solid rgba(255,255,255,0.1)",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
                background: activeItemId === item.id ? "rgba(21, 237, 122, 0.05)" : "transparent",
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
        {activeItemId === 3 && <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>Nexus Coming Soon</div>}
      </div>
    </motion.div>
  );
};

export default Services;
