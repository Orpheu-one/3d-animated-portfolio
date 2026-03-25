const AlienEgg = () => {
  return (
    <>
      {/* Luzes Globais */}
      <ambientLight intensity={0.5} /> 
      
      {/* Luz de Recorte (Rim Light) - Verde Alien */}
      <spotLight 
        position={[-10, 10, 10]} 
        angle={0.15} 
        penumbra={1} 
        intensity={5} 
        color="#15ed7a" 
      />

      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.4}>
        <group scale={[1, 1.35, 1]}> 
          
          {/* 1. LUZ INTERNA: Faz o ovo brilhar de dentro para fora */}
          <pointLight position={[0, 0, 0]} intensity={2.5} color="#15ed7a" distance={5} />

          {/* 2. CASCA EXTERIOR (O Ovo) */}
          <mesh>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshTransmissionMaterial
              backside
              samples={16}
              thickness={0.1} // Reduzi a espessura para ser mais transparente
              chromaticAberration={0.2}
              anisotropy={0.3}
              distortion={0.5}
              distortionScale={0.5}
              temporalDistortion={0.1}
              color="#3a4d3a" // Um verde escuro, mas não preto
              transmission={1.0} // Totalmente transmissivo
              roughness={0.1} // Mais brilhante/húmido
              ior={1.2} // Índice de refração (1.2 é perto da água/gel)
              thickness={0.5}
            />
          </mesh>

          {/* 3. NÚCLEO "VIVO" (A Esfera Interior) */}
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#15ed7a" 
              speed={4} 
              distort={0.4} 
              radius={1}
              emissive="#0a3d1a" // Faz a esfera interna emitir luz própria
              emissiveIntensity={2}
            />
          </mesh>
          
        </group>
      </Float>

      {/* IMPORTANTE: Sem isto, materiais de transmissão ficam pretos em muitas cenas */}
      <Environment preset="city" /> 
    </>
  );
};