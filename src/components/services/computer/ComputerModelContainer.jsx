import { Canvas } from "@react-three/fiber"
import { ComputerModel } from "./ComputerModel"
import { Suspense } from "react"
import { PerspectiveCamera, OrbitControls, Stage } from "@react-three/drei"



const ComputerModelContainer = () => {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, -2, -5]} intensity={0.4} />
      <Suspense fallback={null}>
        <Stage environment="night" intensity={0.7}>
          <ComputerModel scale={0.60} default />
        </Stage>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.3} />
        <PerspectiveCamera position={[-1, 0, 1.8]} zoom={0.80} makeDefault/>
      </Suspense>
    </Canvas>
    
  )
}

export default ComputerModelContainer
