import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - CUTTLEFISH BIOLOGY                               ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  WAVE_SPEED: 5.8,       
  WAVE_FREQUENCY: 8.0,   
  PIGMENT_STRENGTH: 0.9, 
  IRID_GLOW: 0.9,        
  DISTORT_SPEED: 0.8,
  DISTORT_AMOUNT: 0.12,
  RADIUS: 0.9,
  DETAIL: 64             
};

const CUTTLE_VERT = `
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec2 vUv;
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
  vUv = uv;
  
  float d = noise(position * 2.0 + uTime * ${C.DISTORT_SPEED.toFixed(2)}) * ${C.DISTORT_AMOUNT.toFixed(2)};
  vec3 pos = position + normalize(position) * d;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const CUTTLE_FRAG = `
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec2 vUv;
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
  // CAMADA 1: CROMATÓFOROS (Ondas de Choque)
  // Corrigido: 4 agora é 4.0 para evitar erro de tipo
  float wave = sin(vLocalPos.y * ${C.WAVE_FREQUENCY.toFixed(2)} + vLocalPos.z * 2.0 - uTime * ${C.WAVE_SPEED.toFixed(2)});
  wave = smoothstep(-0.2, 0.2, wave); 
  
  vec3 pigment = getPaleta(wave * 2.0 + uTime * 0.5);

  // CAMADA 2: IRIDÓFOROS (Brilho Metálico)
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
  vec3 iridColor = mix(vec3(1.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), sin(uTime) * 0.5 + 0.5);
  
  // CAMADA 3: LEUCÓFORO (Base)
  vec3 base = vec3(0.05); 
  
  vec3 finalColor = mix(base, pigment, ${C.PIGMENT_STRENGTH.toFixed(2)});
  finalColor += iridColor * fresnel * ${C.IRID_GLOW.toFixed(2)};

  gl_FragColor = vec4(finalColor, 1.0);
}`;

const CuttlefishSphere = () => {
  const matRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh>
      <sphereGeometry args={[C.RADIUS, C.DETAIL, C.DETAIL]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={CUTTLE_VERT}
        fragmentShader={CUTTLE_FRAG}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

export default CuttlefishSphere;