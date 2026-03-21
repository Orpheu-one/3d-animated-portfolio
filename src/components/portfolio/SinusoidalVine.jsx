import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ─── CONFIGURAÇÕES MASTER ────────────────────────────────────────────────────
const CONFIG = {
  POINTS: 60,           // Reduzi para 60 para performance (suficiente para o efeito)
  WIDTH: 200,
  HEIGHT: 400,
  AMPLITUDE: 15,
  FREQUENCY: 0.02,
  
  // ESPESSURA VARIÁVEL
  STROKE_START: 8,      // Diâmetro na Origem (Topo)
  STROKE_END: 2,        // Diâmetro no Anchor (Bola)
  
  COLOR: "#000000",
  BALL_RADIUS: 30,
  BALL_COLOR: "#000000",
  CORE_RADIUS: 9,
  CORE_COLOR: "#FF0000",
  OSCILLATION_SPEED: 0.06
};

const OrganicTechVertical = () => {
  const [phase, setPhase] = useState(0);
  const requestRef = useRef();

  const calculateX = (y, currentPhase) => {
    const attenuation = Math.min(y / 50, 1);
    return (CONFIG.WIDTH / 2) + (CONFIG.AMPLITUDE * attenuation) * Math.sin(CONFIG.FREQUENCY * y - currentPhase);
  };

  // ─── A MÁGICA DA ESPESSURA VARIÁVEL ───
  // Geramos um polígono que "contorna" a linha central com larguras diferentes
  const generateVariablePath = (currentPhase) => {
    let leftSide = "";
    let rightSide = "";

    for (let i = 0; i <= CONFIG.POINTS; i++) {
      const y = (i / CONFIG.POINTS) * CONFIG.HEIGHT;
      const centerX = calculateX(y, currentPhase);
      
      // Interpolação linear da espessura: começa em START e termina em END
      const currentThickness = CONFIG.STROKE_START - (i / CONFIG.POINTS) * (CONFIG.STROKE_START - CONFIG.STROKE_END);
      const half = currentThickness / 2;

      // Pontos da esquerda e direita da "tripa"
      leftSide += `${centerX - half},${y} `;
      rightSide = `${centerX + half},${y} ` + rightSide;
    }

    // Fecha o polígono (Lado esquerdo desce, lado direito sobe)
    return `M ${leftSide} ${rightSide} Z`;
  };

  const animate = () => {
    setPhase((prev) => prev + CONFIG.OSCILLATION_SPEED);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const edgeAnchorY = CONFIG.HEIGHT;
  const ballX = calculateX(edgeAnchorY, phase);
  const ballY = edgeAnchorY + CONFIG.BALL_RADIUS;

  return (
    <div style={{ width: 'fit-content' }}>
      <svg
        width={CONFIG.WIDTH}
        height={CONFIG.HEIGHT + (CONFIG.BALL_RADIUS * 2) + 20}
        viewBox={`0 0 ${CONFIG.WIDTH} ${CONFIG.HEIGHT + (CONFIG.BALL_RADIUS * 2) + 20}`}
        style={{ overflow: 'visible' }}
      >
        {/* A "Corda" com Espessura Variável (Usando Path preenchido) */}
        <motion.path
          d={generateVariablePath(phase)}
          fill={CONFIG.COLOR}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Esfera Principal */}
        <circle cx={ballX} cy={ballY} r={CONFIG.BALL_RADIUS} fill={CONFIG.BALL_COLOR} />
        
        {/* Núcleo Vermelho */}
        <circle cx={ballX} cy={ballY} r={CONFIG.CORE_RADIUS} fill={CONFIG.CORE_COLOR} />
      </svg>
    </div>
  );
};

export default OrganicTechVertical;