import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - BIOLOGIA E COMPORTAMENTO                         ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  // --- Camada 1: Cromatóforos (Ondas)
  WAVE_SPEED: 5.8,       
  WAVE_FREQUENCY: 8.0,   
  WAVE_WIDTH: 0.08,      
  PIGMENT_STRENGTH: 0.9, 

  // --- Camada 2: Iridiscência
  IRID_GLOW: 0.9,        
  
  // --- Camada 3: Distorção Física
  DISTORT_SPEED: 0.8,
  DISTORT_AMOUNT: 0.20,
  DISTORT_RADIUS: 2.0,   

  // --- Comportamento (Rotação Contínua)
  ROT_SPEED_BASE: 2.2,
  ROT_CHANCE_CHANGE: 0.03, 
  
  // --- Novo: Contorno (Border)
  OUTLINE_COLOR: "#ffffff",
  OUTLINE_STRENGTH: 2.5,  // Grossura/Intensidade da borda

  // --- Geometria
  RADIUS: 0.9,
  DETAIL: 64             
};

const CUTTLE_VERT = `
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
uniform float uTime;

float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1.0,0.0,0.0)),f.x),mix(hash(i+vec3(0.0,1.0,0.0)),hash(i+vec3(1.0,1.0,0.0)),f.x),f.y),
             mix(mix(hash(i+vec3(0.0,0.0,1.0)),hash(i+vec3(1.0,0.0,1.0)),f.x),mix(hash(i+vec3(0.0,1.0,1.0)),hash(i+vec3(1.0,1.0,1.0)),f.x),f.y),f.z);
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vLocalPos = position;
  
  float d = noise(position * ${C.DISTORT_RADIUS.toFixed(2)} + uTime * ${C.DISTORT_SPEED.toFixed(2)}) * ${C.DISTORT_AMOUNT.toFixed(2)};
  vec3 pos = position + normalize(position) * d;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -mvPosition.xyz;
  vWorldNormal = normalize(normalMatrix * normal);
  
  gl_Position = projectionMatrix * mvPosition;
}`;

const CUTTLE_FRAG = `
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
uniform float uTime;

vec3 getPaleta(float t) {
  float m = mod(t, 5.0);
  if (m < 1.0) return vec3(1.0, 1.0, 1.0); 
  if (m < 2.0) return vec3(1.0, 0.0, 1.0); 
  if (m < 3.0) return vec3(0.0, 1.0, 1.0); 
  if (m < 4.0) return vec3(1.0, 1.0, 0.0); 
  return vec3(0.0, 0.0, 0.0);             
}

void main() {
  // CAMADA 1: CROMATÓFOROS
  float wavePattern = vLocalPos.y * ${C.WAVE_FREQUENCY.toFixed(2)} + vLocalPos.z * 2.0 - uTime * ${C.WAVE_SPEED.toFixed(2)};
  float wave = sin(wavePattern);
  float edge = ${C.WAVE_WIDTH.toFixed(2)};
  wave = smoothstep(-edge, edge, wave); 
  
  vec3 pigment = getPaleta(wave * 2.0 + uTime * 0.5);

  // CAMADA 2: IRIDISCÊNCIA
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
  vec3 iridColor = mix(vec3(1.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), sin(uTime * 0.5) * 0.5 + 0.5);
  
  // CAMADA 3: CONTORNO (BORDER)
  vec3 viewDir = normalize(vViewPosition);
  float outline = pow(1.0 - max(0.0, dot(normalize(vNormal), viewDir)), ${C.OUTLINE_STRENGTH.toFixed(2)});
  vec3 borderCol = vec3(1.0, 1.0, 1.0); // Branco puro para a borda

  // COMPOSIÇÃO FINAL
  vec3 base = vec3(0.05); 
  vec3 finalColor = mix(base, pigment, ${C.PIGMENT_STRENGTH.toFixed(2)});
  finalColor += iridColor * fresnel * ${C.IRID_GLOW.toFixed(2)};
  
  // Injeta o contorno para separar do fundo
  finalColor = mix(finalColor, borderCol, outline);

  gl_FragColor = vec4(finalColor, 1.0);
}`;

const CuttlefishSphere = () => {
  const meshRef = useRef();
  const matRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  
  const [behavior, setBehavior] = useState({
    rotationVector: new THREE.Vector3(0.5, 0.5, 0.5)
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (matRef.current) matRef.current.uniforms.uTime.value = t;

    if (meshRef.current) {
      if (Math.random() < C.ROT_CHANCE_CHANGE) {
        setBehavior({
          rotationVector: new THREE.Vector3(
            (Math.random() - 0.5) * C.ROT_SPEED_BASE,
            (Math.random() - 0.5) * C.ROT_SPEED_BASE,
            (Math.random() - 0.5) * C.ROT_SPEED_BASE
          )
        });
      }

      // Rotação contínua (paragens removidas)
      meshRef.current.rotation.x += behavior.rotationVector.x * 0.02;
      meshRef.current.rotation.y += behavior.rotationVector.y * 0.02;
      meshRef.current.rotation.z += behavior.rotationVector.z * 0.02;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[C.RADIUS, C.DETAIL, C.DETAIL]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={CUTTLE_VERT}
          fragmentShader={CUTTLE_FRAG}
          uniforms={uniforms}
          transparent
        />
      </mesh>
    </Float>
  );
};

export default CuttlefishSphere;