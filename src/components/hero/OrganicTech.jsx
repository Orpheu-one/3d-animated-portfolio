import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * ORGANIC TECH - CLUSTER READY
 * Propriedades dinâmicas para permitir múltiplos clones com comportamentos únicos.
 */
const OrganicTech = ({
  top = "0px",
  left = "50%",
  baseHeight = 300,      // Comprimento base
  amplitude = 15,       // Balanço horizontal
  frequency = 0.02,     // Curvatura
  speed = 0.06,         // Velocidade da onda
  strokeStart = 8,      // Espessura no topo
  strokeEnd = 2,        // Espessura na bola
  ballRadius = 30,
  pulseAmplitude = 0,   // 2º Motor: 0 = desligado, >0 ativa a oscilação de comprimento
  pulseSpeed = 0.02     // Velocidade da "respiração" do comprimento
}) => {
  const [phase, setPhase] = useState(0);
  const [pulse, setPulse] = useState(0);
  const requestRef = useRef();

  // Dimensões internas do SVG para garantir que nada corta
  const svgWidth = 200; 
  const centerX = svgWidth / 2;

  const animate = () => {
    setPhase((prev) => prev + speed);
    setPulse((prev) => prev + pulseSpeed);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [speed, pulseSpeed]);

  // ─── LÓGICA DO 2º MOTOR (COMPRIMENTO DINÂMICO) ───
  const currentHeight = baseHeight + Math.sin(pulse) * pulseAmplitude;

  // Função matemática para o movimento horizontal (X)
  const calculateX = (y, currentPhase) => {
    const attenuation = Math.min(y / 50, 1);
    return centerX + (amplitude * attenuation) * Math.sin(frequency * y - currentPhase);
  };

  // Geração da "Tripa" (Espessura Variável)
  const generateVariablePath = (currentPhase) => {
    let leftSide = "";
    let rightSide = "";
    const points = 60;

    for (let i = 0; i <= points; i++) {
      const y = (i / points) * currentHeight;
      const xPos = calculateX(y, currentPhase);
      
      const thickness = strokeStart - (i / points) * (strokeStart - strokeEnd);
      const half = thickness / 2;

      leftSide += `${xPos - half},${y} `;
      rightSide = `${xPos + half},${y} ` + rightSide;
    }
    return `M ${leftSide} ${rightSide} Z`;
  };

  const ballX = calculateX(currentHeight, phase);
  const ballY = currentHeight + ballRadius;

  return (
    <div style={{
      position: 'absolute',
      top: top,
      left: left,
      transform: 'translateX(-50%)', // Alinha a origem exata ao 'left'
      pointerEvents: 'none',
      zIndex: 10
    }}>
      <svg
        width={svgWidth}
        height={currentHeight + (ballRadius * 2) + 20}
        style={{ overflow: 'visible' }}
      >
        {/* Linha Orgânica Tapered */}
        <motion.path
          d={generateVariablePath(phase)}
          fill="#000000"
        />

        {/* Esfera Principal */}
        <circle 
          cx={ballX} 
          cy={ballY} 
          r={ballRadius} 
          fill="#000000" 
        />
        
        {/* Núcleo Vital */}
        <circle 
          cx={ballX} 
          cy={ballY} 
          r={ballRadius * 0.3} // 30% do raio atual
          fill="#FF0000" 
        />
      </svg>
    </div>
  );
};

export default OrganicTech;