import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

const DeathClock = () => {
  const { showDeathClock } = useTheme();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Data de Nascimento: 12/10/1970 às 19:00
    const birthDate = new Date("1970-10-12T19:00:00");
    // Expectativa de vida: 80 anos (2522880000000 ms)
    const deathDate = new Date(birthDate.getTime() + (80 * 365.25 * 24 * 60 * 60 * 1000));

    const timer = setInterval(() => {
      const now = new Date();
      const distance = deathDate - now;

      if (distance < 0) {
        setTimeLeft("TEMPO ESGOTADO");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!showDeathClock) return null;

  return (
    <div style={{
      position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)",
      color: "#fa1905ff", fontFamily: "'Share Tech Mono', monospace", fontSize: "24px",
      textShadow: "0 0 10px rgba(250,5,5,0.7)", zIndex: 10
    }}>
      {timeLeft}
    </div>
  );
};

export default DeathClock;