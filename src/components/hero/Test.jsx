import { MeshDistortMaterial, OrbitControls, Sphere } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

const Test = () => {
  return (
    <section
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    ><Suspense fallback={<div>Loading...</div>}>  
      <Canvas>
        <ambientLight intensity={0.3}/>
        <directionalLight position={[5,1,5]} intensity={0.6}/>
       
        
        {/* O primeiro argumento passou de 1.6 para 2.08 (aumento de 30%) */}
        <Sphere args={[2.08, 64, 64]}>
          <MeshDistortMaterial
            color="#15ed7a"
            distort={0.4}// intensidade da distorção (0 a 1)
            speed={2}        // velocidade da animação
          />
        </Sphere>
        
        {/* Adicionei OrbitControls apenas como utilitário caso queiras rodar a esfera no teste */}
        
      </Canvas>
      </Suspense>
    </section>
  );
};

export default Test;