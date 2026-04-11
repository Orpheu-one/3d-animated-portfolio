import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- TUNABLES: CONTROLO ESTRUTURAL ---
const C = {
  WAVE_SPEED: 4.5,       
  WAVE_FREQUENCY: 65.0,  
  WAVE_WIDTH: 0.02,      
  NOISE_SCALE: 3.0,
  Z_OFFSET_BG: -8.5,
  
  // Intensidade
  CONTRAST: 1.5,         
  VIBRANCE: 1.8          
};

const BG_VERT = `
varying vec2 vUv;
varying float vNoise;
uniform float uTime;

float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}

void main() {
  vUv = uv;
  vNoise = noise(vec3(uv * ${C.NOISE_SCALE.toFixed(2)}, uTime * 0.3));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const BG_FRAG = `
varying vec2 vUv;
varying float vNoise;
uniform float uTime;

vec3 getPaleta(float t) {
  float m = mod(t, 5.0);
  if (m < 1.0) return vec3(1.0, 1.0, 1.0); 
  if (m < 2.0) return vec3(1.0, 0.0, 1.0); 
  if (m < 3.0) return vec3(0.0, 1.0, 1.0); 
  if (m < 4.0) return vec3(1.0, 1.0, 0.0); 
  return vec3(0.01);                       
}

void main() {
  float pattern = vUv.y * ${C.WAVE_FREQUENCY.toFixed(2)} + vUv.x * 3.0 - uTime * ${C.WAVE_SPEED.toFixed(2)};
  float wave = smoothstep(-${C.WAVE_WIDTH.toFixed(3)}, ${C.WAVE_WIDTH.toFixed(3)}, sin(pattern));
  
  vec3 col = getPaleta(wave * 2.0 + uTime * 0.2);
  col *= mix(0.4, 1.0, vNoise);

  col = pow(col, vec3(${C.CONTRAST.toFixed(2)})) * ${C.VIBRANCE.toFixed(2)};
  gl_FragColor = vec4(col, 1.0);
}`;

const CuttlefishBG = () => {
  const bgMatRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (bgMatRef.current) bgMatRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh position={[0, 0, C.Z_OFFSET_BG]}>
      <planeGeometry args={[45, 45]} />
      <shaderMaterial 
        ref={bgMatRef} 
        vertexShader={BG_VERT} 
        fragmentShader={BG_FRAG} 
        uniforms={uniforms} 
        toneMapped={false} 
        depthWrite={false}
      />
    </mesh>
  );
};

export default CuttlefishBG;