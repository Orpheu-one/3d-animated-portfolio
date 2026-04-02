import { useGLTF } from '@react-three/drei'

export function PirateSkullModel(props) {
  const { scene } = useGLTF('/pirate_skull.glb')

  return <primitive object={scene} {...props} />
}

useGLTF.preload('/pirate_skull.glb')
