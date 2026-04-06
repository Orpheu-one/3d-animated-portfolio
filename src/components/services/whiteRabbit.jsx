import React from 'react';
import { motion } from 'framer-motion';

const WhiteRabbit = ({ isDark, onClick }) => {
  // Se não estiver em modo dark, o componente não renderiza nada
  if (!isDark) return null;

  return (
    <div
      style={{ 
        marginBottom: "30px", 
        alignSelf: "flex-start", 
        cursor: "pointer", 
        flexShrink: 0 
      }}
      onClick={onClick || (() => {})}
    >
      <div
        style={{ 
          position: "relative", 
          width: 150, 
          height: 150, 
          transition: "transform 0.3s ease, filter 0.3s ease" 
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.transform = "scale(1.08)"; 
          e.currentTarget.style.filter = "drop-shadow(0px 8px 15px rgba(0,0,0,0.5))"; 
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.transform = "scale(1)"; 
          e.currentTarget.style.filter = "none"; 
        }}
      >
        <motion.div
          style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: 150, 
            height: 150, 
            transformOrigin: "75px 75px", 
            pointerEvents: "none" 
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" width={150} height={150}>
            <circle cx="100" cy="100" r="89" fill="#ffffff" stroke="#000000" strokeWidth="3" />
            <circle cx="100" cy="100" r="46" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
            <path id="svcRabbitPath" fill="none" d="M 100,100 m -64,0 a 64,64 0 1,1 128,0 a 64,64 0 1,1 -128,0" />
            <text fontSize="18" fontWeight="700" fill="#000000" letterSpacing="2" fontFamily="'Share Tech Mono', monospace">
              <textPath href="#svcRabbitPath" startOffset="0%">Follow the white rabbit. •</textPath>
            </text>
          </svg>
        </motion.div>

        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: 150, 
          height: 150, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          pointerEvents: "none" 
        }}>
          <div style={{ 
            width: 90, 
            height: 90, 
            borderRadius: "50%", 
            overflow: "hidden", 
            backgroundColor: "#ffffff", 
            border: "1.5px solid #000000" 
          }}>
            <img 
              src="/white_rabbit_001.png" 
              alt="white rabbit" 
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteRabbit;