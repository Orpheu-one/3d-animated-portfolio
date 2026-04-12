import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";


const C = {
  RADIUS:           0.9,
  DETAIL:           64,
  OUTLINE_STRENGTH: 3.5,
  DEFAULT_MODE:     0,

  // --- Tunables de Dinâmica (A alma do Choco) ---
  FLOW_SPEED:     1.5,
  WAVE_FREQUENCY: 8.0,
  WAVE_WIDTH:     0.08,

  // --- GeometricGrid — valores idênticos ao GeometricGrid.jsx ---
  GEO_GRID_SIZE:       8.0,   // deve ser igual a GRID_SIZE em GeometricGrid.jsx
  GEO_NESTING_LEVELS:  4.0,   // CORRIGIDO: era 2.0, deve ser 4.0
  GEO_NESTING_REDUC:   2,  // igual a NESTING_REDUCTION
  GEO_PLANE_DIM:       8.0,   // NOVO: igual a PLANE_DIM — escala posY corretamente
  GEO_WAVE_SPEED:      12,
  GEO_WAVE_FREQ:       9,
  GEO_WAVE_WIDTH:      0.28,
  GEO_WAVE_PHASE:      0.2,

  // Intensidade e Volume
  BUMP_STRENGTH: 0.6,
  CONTRAST:      1.3,
  VIBRANCE:      1.1
};


const PREDATOR_SETTINGS = {
  ROT_SPEED: 0.8,
  AGITAÇÃO:  1.5
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
  vNormal   = normalize(normalMatrix * normal);
  vLocalPos = position;
  vUv       = uv;
  vNoise    = noise(position * 2.5 + uTime * 0.5);
  float d   = noise(position * 1.8 + uTime * 0.8) * 0.12;
  vec3 pos  = position + normalize(position) * d;
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
  float shadow = mix(1.0, vNoise, ${C.BUMP_STRENGTH.toFixed(2)});
  float t = uTime * ${C.FLOW_SPEED.toFixed(2)};

  // MODO 0: ORGÂNICO (CUTTLEFISH ORIGINAL)
  if(uMode == 0) {
    float wavePattern = vLocalPos.y * ${C.WAVE_FREQUENCY.toFixed(2)} - t * 4.0;
    float wave = smoothstep(-${C.WAVE_WIDTH.toFixed(3)}, ${C.WAVE_WIDTH.toFixed(3)}, sin(wavePattern + vNoise * 2.0));
    finalColor = getPaleta(wave * 2.5 + t);
    finalColor *= shadow;
  }

  // MODO 1: GEOMÉTRICO — reprodução fiel do GeometricGrid.jsx
  else if(uMode == 1) {

    // Coordenada local dentro de cada célula (0..1)
    vec2 gridUv = fract(vUv * ${C.GEO_GRID_SIZE.toFixed(1)});

    // Distância de Chebyshev ao centro da célula (0=centro, 0.5=borda)
    float d = max(abs(gridUv.x - 0.5), abs(gridUv.y - 0.5));

    // Nível de nesting: mesmo algoritmo do GeometricGrid (corrigido)
    // Em GeometricGrid: nivel L tem meia-largura = 0.5 * (1 - L * REDUCTION)
    // → level = floor((0.5 - d) / (0.5 * REDUCTION))
    float level = floor((0.5 - d) / (0.5 * ${C.GEO_NESTING_REDUC.toFixed(2)}));
    level = clamp(level, 0.0, ${C.GEO_NESTING_LEVELS.toFixed(1)} - 1.0);

    // posY em unidades de mundo (igual ao GeometricGrid que usa PLANE_DIM = 8)
    // vUv.y vai de 0 a 1 → mapear para [-PLANE_DIM/2, +PLANE_DIM/2]
    float posY = (vUv.y - 0.5) * ${C.GEO_PLANE_DIM.toFixed(1)};

    // Fórmula de onda idêntica ao GeometricGrid.jsx
    float wavePattern = posY * ${C.GEO_WAVE_FREQ.toFixed(2)}
                      - uTime * ${C.GEO_WAVE_SPEED.toFixed(2)}
                      + level * ${C.GEO_WAVE_PHASE.toFixed(2)};
    float wave = smoothstep(-${C.GEO_WAVE_WIDTH.toFixed(3)}, ${C.GEO_WAVE_WIDTH.toFixed(3)}, sin(wavePattern));

    // Mapeamento de cor idêntico ao GeometricGrid.jsx: getPaletaColor(wave*0.8 + t*0.05)
    finalColor = getPaleta((wave * 0.8 + uTime * 0.05) * 5.0);
    finalColor *= shadow;
  }

  // MODO 2: GALAXY (NEBULOSA DINÂMICA)
  else {
    float n = vNoise * 5.0 + t;
    finalColor = getPaleta(n);
    finalColor *= shadow;
  }

  // Outline e Iridiscência (comum a todos os modos)
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
  float outline = pow(1.0 - max(0.0, dot(vNormal, vec3(0,0,1))), ${C.OUTLINE_STRENGTH.toFixed(1)});
  finalColor += fresnel * 0.5;
  finalColor = mix(finalColor, vec3(1.0), outline);
  finalColor = pow(finalColor, vec3(${C.CONTRAST.toFixed(2)})) * ${C.VIBRANCE.toFixed(2)};

  gl_FragColor = vec4(finalColor, 1.0);
}`;


const MorphingCuttlefish = ({ mode = C.DEFAULT_MODE }) => {
  const matRef  = useRef();
  const meshRef = useRef();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMode: { value: mode }
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uMode.value = mode;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t * 0.7 * PREDATOR_SETTINGS.ROT_SPEED) * PREDATOR_SETTINGS.AGITAÇÃO;
      meshRef.current.rotation.y = Math.cos(t * 0.4 * PREDATOR_SETTINGS.ROT_SPEED) * PREDATOR_SETTINGS.AGITAÇÃO;
      meshRef.current.rotation.z += 0.01;
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
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
};

export default MorphingCuttlefish;
