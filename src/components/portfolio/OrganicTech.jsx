import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const CONFIG = {
  POINTS: 60,
  WIDTH: 200,
  HEIGHT: 400,
  AMPLITUDE: 15,
  FREQUENCY: 0.02,
  STROKE_START: 8,
  STROKE_END: 2,
  COLOR: "#000000",
  BALL_RADIUS: 30,
  BALL_COLOR: "#000000",
  OSCILLATION_SPEED: 0.06
};

const OrganicTech = ({ top = "0px", left = "50%", baseHeight = 300 }) => {
  const [phase, setPhase] = useState(0);
  const [irisScale, setIrisScale] = useState(0.7); 
  const requestRef = useRef();

  // ─── MOTOR DO DIAFRAGMA (FOCO) ───
  useEffect(() => {
    let timeoutId;
    const animateIris = () => {
      const nextScale = 0.3 + Math.random() * 0.4;
      const nextPause = 1000 + Math.random() * 2000;
      setIrisScale(nextScale);
      timeoutId = setTimeout(animateIris, nextPause);
    };
    animateIris();
    return () => clearTimeout(timeoutId);
  }, []);

  // ─── MOTOR DA CORDA ───
  const animate = () => {
    setPhase((prev) => prev + CONFIG.OSCILLATION_SPEED);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const calculateX = (y, p) => {
    const att = Math.min(y / 50, 1);
    return (CONFIG.WIDTH / 2) + (CONFIG.AMPLITUDE * att) * Math.sin(CONFIG.FREQUENCY * y - p);
  };

  const generatePath = (p) => {
    let l = "", r = "";
    for (let i = 0; i <= CONFIG.POINTS; i++) {
      const y = (i / CONFIG.POINTS) * baseHeight;
      const x = calculateX(y, p);
      const thick = CONFIG.STROKE_START - (i / CONFIG.POINTS) * (CONFIG.STROKE_START - CONFIG.STROKE_END);
      l += `${x - thick / 2},${y} `;
      r = `${x + thick / 2},${y} ` + r;
    }
    return `M ${l} ${r} Z`;
  };

  const bX = calculateX(baseHeight, phase);
  const bY = baseHeight + CONFIG.BALL_RADIUS;

  // Cálculos do "Olho"
  const irisRadius = CONFIG.BALL_RADIUS * irisScale;

  return (
    <div style={{ position: 'absolute', top, left, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
      <svg width={CONFIG.WIDTH} height={baseHeight + 100} style={{ overflow: 'visible' }}>
        
        {/* Corda/Tentáculo */}
        <motion.path d={generatePath(phase)} fill={CONFIG.COLOR} />

        {/* Círculo Exterior (Corpo da Câmara) */}
        <circle cx={bX} cy={bY} r={CONFIG.BALL_RADIUS} fill={CONFIG.BALL_COLOR} />

        {/* ─── EFEITO DE VERTICAL BLUR NA ÍRIS ─── */}
        {/* Usamos dois círculos fantasmas para simular o rasto vertical */}
        
        {/* Fantasma Superior (Estica para cima) */}
        <motion.circle
          cx={bX}
          cy={bY} // O centro Y original
          animate={{ r: irisRadius }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          fill="#FF0000"
          opacity="0.15" // Quase invisível
          style={{ filter: 'blur(3px)' }} // Blur uniforme mas fraco
          transform={`translate(0, -${irisRadius * 0.1})`} // Desloca ligeiramente para cima
        />

        {/* Fantasma Inferior (Estica para baixo) */}
        <motion.circle
          cx={bX}
          cy={bY}
          animate={{ r: irisRadius }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          fill="#FF0000"
          opacity="0.15"
          style={{ filter: 'blur(3px)' }}
          transform={`translate(0, ${irisRadius * 0.1})`} // Desloca ligeiramente para baixo
        />

        {/* Íris Vermelha Central (Sólida e Focada) */}
        <motion.circle
          cx={bX}
          cy={bY}
          animate={{ r: irisRadius }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          fill="#FF0000"
        />

        {/* REFLEXO DE VIDRO (Mantido) */}
        <g style={{ filter: 'blur(1px)' }}>
            <motion.rect
                x={bX - (irisRadius * 0.6)} 
                y={bY - (irisRadius * 0.6)}
                width="2"
                height="8"
                fill="white"
                opacity="0.6"
                animate={{ 
                    x: bX - (irisRadius * 0.6), 
                    y: bY - (irisRadius * 0.6),
                    height: irisRadius * 0.4 
                }}
            />
        </g>
      </svg>
    </div>
  );
};

export default OrganicTech;