import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";

const C = {
  RADIUS: 0.9,
  DETAIL: 64,
  OUTLINE_STRENGTH: 3.5,
  DEFAULT_MODE: 0,
  
  // --- Tunables de Dinâmica (A alma do Choco) ---
  FLOW_SPEED: 1.5,       // Velocidade global da ondulação
  WAVE_FREQUENCY: 8.0,   // Quantidade de ondas na pele
  WAVE_WIDTH: 0.08,      // Nitidez da borda da onda
  
  // Complexidade Geométrica (Agora Dinâmica)
  GEO_GRID_SIZE: 4.0,    
  GEO_NESTING: 3.0,      
  
  // Intensidade e Volume
  BUMP_STRENGTH: 0.6,    // Relevo 3D
  CONTRAST: 1.3,         
  VIBRANCE: 1.1          
};

const PREDATOR_SETTINGS = {
  ROT_SPEED: 0.8,
  AGITAÇÃO: 1.5
};

const MORPH_VERT = `
varying vec3 vNormal;
varying vec3 vLocalPos;
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
  vNormal = normalize(normalMatrix * normal);
  vLocalPos = position;
  vUv = uv;
  // O ruído base para o bump e distorção
  vNoise = noise(vec3(position * 2.5 + uTime * 0.5));
  
  // Distorção subtil comum a todos os modos (A Esfera "respira")
  float d = noise(position * 1.8 + uTime * 0.8) * 0.12;
  vec3 pos = position + normalize(position) * d;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const MORPH_FRAG = `
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec2 vUv;
varying float vNoise;
uniform float uTime;
uniform int uMode;

vec3 getPaleta(float t) {
  float m = mod(t, 5.0);
  if (m < 1.0) return vec3(1.0, 1.0, 1.0); 
  if (m < 2.0) return vec3(1.0, 0.0, 1.0); 
  if (m < 3.0) return vec3(0.0, 1.0, 1.0); 
  if (m < 4.0) return vec3(1.0, 1.0, 0.0); 
  return vec3(0.02);                      
}

void main() {
  vec3 finalColor = vec3(0.0);
  // O Relevo 3D (vNoise) que unifica os modos
  float shadow = mix(1.0, vNoise, ${C.BUMP_STRENGTH.toFixed(2)});
  float t = uTime * ${C.FLOW_SPEED.toFixed(2)};
  
  // MODO 0: ORGÂNICO (CUTTLEFISH ORIGINAL - RECUPERADO)
  if(uMode == 0) {
    // A fórmula original da nossa animação orgânica
    float wavePattern = vLocalPos.y * ${C.WAVE_FREQUENCY.toFixed(2)} - t * 4.0;
    float wave = smoothstep(-${C.WAVE_WIDTH.toFixed(3)}, ${C.WAVE_WIDTH.toFixed(3)}, sin(wavePattern + vNoise * 2.0));
    finalColor = getPaleta(wave * 2.5 + t);
    finalColor *= shadow; // Aplica relevo orgânico
  }
  
  // MODO 1: GEOMÉTRICO (NESTING FRACTAL + DINÂMICA DE CHOCO)
  else if(uMode == 1) {
    vec2 gridUv = fract(vUv * ${C.GEO_GRID_SIZE.toFixed(2)});
    float mask = 0.0;
    float scale = 1.0;
    
    // Injetamos a dinâmica do Choco (wavePattern) no cálculo do Nesting
    float wavePattern = vUv.y * ${C.WAVE_FREQUENCY.toFixed(2)} - t * 3.0;
    float dynamicShift = sin(wavePattern + vNoise);
    
    for(float i = 0.0; i < ${C.GEO_NESTING.toFixed(1)}; i++) {
        // O nesting agora oscila e ondula dinamicamente
        vec2 localUv = fract(gridUv * scale + dynamicShift * 0.1);
        float d = max(abs(localUv.x - 0.5), abs(localUv.y - 0.5));
        mask = mix(mask, step(0.25, d), 0.5);
        scale *= 1.5;
    }
    
    finalColor = getPaleta(mask * 5.0 + t * 1.5);
    finalColor *= shadow; // Relevo 3D no geométrico
  }
  
  // MODO 2: GALAXY (NEBULOSA DINÂMICA)
  else {
    // Usamos o vNoise e o t para criar um fluxo contínuo
    float n = vNoise * 5.0 + t;
    finalColor = getPaleta(n);
    finalColor *= shadow; // Relevo 3D na nebulosa
  }

  // Outline e Iridiscência (Comum para garantir profundidade)
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
  float outline = pow(1.0 - max(0.0, dot(vNormal, vec3(0,0,1))), ${C.OUTLINE_STRENGTH.toFixed(1)});
  
  finalColor += fresnel * 0.5;
  finalColor = mix(finalColor, vec3(1.0), outline);

  // --- CONTROLO DE INTENSIDADE DA ESFERA ---
  finalColor = pow(finalColor, vec3(${C.CONTRAST.toFixed(2)})) * ${C.VIBRANCE.toFixed(2)};

  gl_FragColor = vec4(finalColor, 1.0);
}`;

const MorphingCuttlefish = ({ mode = C.DEFAULT_MODE }) => {
  const matRef = useRef();
  const meshRef = useRef();
  
  // A CORREÇÃO ESTÁ AQUI: Array de dependências vazio. 
  // Nunca destruímos os uniforms, apenas os atualizamos no useFrame!
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMode: { value: mode }
  }), []); 

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uMode.value = mode; // O uMode é injetado a cada frame em tempo real
    }

    if (meshRef.current) {
      // ROTAÇÃO TIPO PREDADOR (imprevisível)
      meshRef.current.rotation.x = Math.sin(t * 0.7 * PREDATOR_SETTINGS.ROT_SPEED) * PREDATOR_SETTINGS.AGITAÇÃO;
      meshRef.current.rotation.y = Math.cos(t * 0.4 * PREDATOR_SETTINGS.ROT_SPEED) * PREDATOR_SETTINGS.AGITAÇÃO;
      meshRef.current.rotation.z += 0.01; // Rotação contínua subtil
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[C.RADIUS, C.DETAIL, C.DETAIL]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={MORPH_VERT}
          fragmentShader={MORPH_FRAG}
          uniforms={uniforms}
          toneMapped={false} // Garante cores neon puras
        />
      </mesh>
    </Float>
  );
};

export default MorphingCuttlefish;