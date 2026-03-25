import { useState } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, MeshTransmissionMaterial, MeshDistortMaterial, Float, Environment } from "@react-three/drei";
import ComputerModelContainer from "./computer/ComputerModelContainer";
import "./services.css";

// --- Sub-componente do Ovo Alien (R3F) ---
const AlienEgg = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, -5]} intensity={2} color="#ffffff" />
      <spotLight position={[-5, 2, 2]} angle={0.3} penumbra={1} intensity={3} color="#15ed7a" />

      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.4}>
        <group scale={[1, 1.35, 1]}> 
          {/* Casca Exterior */}
          <mesh>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshTransmissionMaterial
              backside
              samples={10}
              thickness={0.15}
              chromaticAberration={0.05}
              distortion={0.4}
              color="#2a3b2a"
              transmission={0.95}
              roughness={0.2}
            />
          </mesh>
          {/* Núcleo "Vivo" */}
          <mesh position={[0, 0, -0.1]}>
            <sphereGeometry args={[0.6, 64, 64]} />
            <MeshDistortMaterial color="#15ed7a" speed={3} distort={0.4} radius={1} />
          </mesh>
        </group>
      </Float>
      <Environment preset="night" />
    </>
  );
};

// --- Container da Scene ---
const AlienEggContainer = () => (
  <div style={{ width: "100%", height: "100%", minHeight: "400px" }}>
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
      <AlienEgg />
    </Canvas>
  </div>
);

// --- Componente Principal ---
const items = [
  { id: 1, title: "Service 1", description: "Ovo Alienígena", color: "#ce60f3" },
  { id: 2, title: "Service 2", description: "Computer Model", color: "#1d5d05" },
  { id: 3, title: "Service 3", description: "Em breve...", color: "#f4aa0a" },
];

const fromLeft = (delay, duration = 0.8) => ({
  hidden: { x: -80, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { delay, duration, ease: "easeInOut" } },
});

const Services = () => {
  // Adicionamos o estado para controlar qual cena mostrar
  const [activeItemId, setActiveItemId] = useState(1);

  return (
    <motion.div className="services" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }}>
      <div className="sSection left">
        <motion.h1 className="sTitle" variants={fromLeft(0, 1.0)}>How can I help?</motion.h1>

        <div className="sLeftC">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="serviceItem"
              variants={fromLeft(1.2 + index * 0.8)}
              onClick={() => setActiveItemId(item.id)} // Muda a cena ao clicar
              whileHover={{ x: 12, boxShadow: "4px 4px 20px rgba(21, 237, 122, 0.25)", borderColor: "#15ed7a" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
              style={{ cursor: "pointer", border: activeItemId === item.id ? "1px solid #15ed7a" : "1px solid transparent" }}
            >
              <div className="sTextContainer">
                <h2 className="serviceTitle">{item.title}</h2>
                <h3 className="serviceDescription">{item.description}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="sSection right">
        {/* Lógica de Troca de Scenes */}
        {activeItemId === 1 && <AlienEggContainer />}
        {activeItemId === 2 && <ComputerModelContainer />}
        {activeItemId === 3 && <div className="placeholder">Próxima Scene</div>}
      </div>
    </motion.div>
  );
};

export default Services;