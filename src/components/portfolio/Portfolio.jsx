import "./portfolio.css";
import SinusoidalVine from "./SinusoidalVine";
import OrganicTech from './OrganicTech';
import WhiteRabbit from "../services/whiteRabbit";

const Portfolio = () => {
  return (
    <div className="portfolio">
      <h1>Portfolio</h1>
      
      {/* Componente Horizontal que fizemos antes */}
      <SinusoidalVine />

      {/* Contentor do Cluster Vertical */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh', 
        background: 'transparent', // Fundo escuro para destacar o núcleo vermelho
        overflow: 'hidden',
        marginTop: '50px'     // Separação visual do título
      }}>

        {/* Clone 1: Balanço suave */}
        <OrganicTech 
          left="20%" 
          top="0px" 
          baseHeight={350} 
          amplitude={12} 
        />

        {/* Clone 2: Mais curto e rápido */}
        <OrganicTech 
          left="25%" 
          top="0px" 
          baseHeight={280} 
          amplitude={20} 
          speed={0.08} 
        />

      </div>
      <WhiteRabbit />

      
    </div>
  );
};

export default Portfolio;