import React from "react";
import OrphicPortal from "./OrphicPortal";

const Portfolio = () => {
  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", // Forçamos a altura total para o mergulho
      position: "relative", 
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }}>
      {/* O Portal é agora o protagonista da secção */}
      <OrphicPortal />
      
      {/* Nota: Se quiseres o Canvas 3D no futuro, ele deve ser 
         posicionado como absolute com z-index inferior para não 
         bloquear a funcionalidade do portal.
      */}
    </div>
  );
};

export default Portfolio;