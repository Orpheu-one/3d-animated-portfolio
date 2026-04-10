import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - GALAXY EMITTER COM PERLIN E LUZ                  ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  NOISE_SCALE: 3.5,      
  FLOW_SPEED: 0.25,       
  
  // --- Nova Iluminação Atmosférica
  LIGHT_INTENSITY: 1.4,  // Brilho do centro
  LIGHT_RADIUS: 0.6,     // Tamanho da aura central
  
  // --- Textura Perlin (Granularidade)
  PERLIN_STRENGTH: 0.25, // Força da textura de fundo
  
  COLOR_DENSITY: 7.0,    
  COLOR_RATIO: 1.4,      
  VARIANCE: 0.6,         
  
  OCTAVES: 5,            
  SMOOTHNESS: 0.18,      
  BORDER_WIDTH: 0.015,    
  
  Z_OFFSET_BG: -2.0      // Afastado mais um pouco para dar profundidade
};

const BG_VERT = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const BG_FRAG = `
varying vec2 vUv;
varying vec3 vWorldPos;
uniform float uTime;

// Perlin Noise Clássico para o Fundo
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yxz+33.33);
  return fract((p3.xxy + p3.yxx)*p3.zyx);
}

float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(dot(hash33(i+vec3(0,0,0)),f-vec3(0,0,0)),dot(hash33(i+vec3(1,0,0)),f-vec3(1,0,0)),f.x),
                 mix(dot(hash33(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash33(i+vec3(1,1,0)),f-vec3(1,1,0)),f.x),f.y),
               mix(mix(dot(hash33(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash33(i+vec3(1,0,1)),f-vec3(1,0,1)),f.x),
                   mix(dot(hash33(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash33(i+vec3(1,1,1)),f-vec3(1,1,1)),f.x),f.y),f.z);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * ${C.FLOW_SPEED.toFixed(2)};
    
    // 1. Camada de Ruído Perlin para Textura
    float pNoise = noise(vec3(uv * ${C.NOISE_SCALE.toFixed(2)}, t * 0.5));
    
    // 2. FBM Dinâmico (Manchas de Cor)
    float n = pNoise; // Usamos o perlin como base do FBM
    n = n * 0.5 + 0.5;

    // Paleta Original
    vec3 magenta = vec3(1.0, 0.0, 1.0);
    vec3 ciano   = vec3(0.0, 1.0, 1.0);
    vec3 amarelo = vec3(1.0, 1.0, 0.0);
    vec3 branco  = vec3(1.0, 1.0, 1.0);
    vec3 preto   = vec3(0.01, 0.01, 0.01);

    float val = mod(n * (5.0 * ${C.COLOR_DENSITY.toFixed(2)}) + t * 0.3, 5.0 * ${C.COLOR_RATIO.toFixed(2)});
    float idx = mod(val, 5.0); 

    vec3 col;
    float s = ${C.SMOOTHNESS.toFixed(3)};
    if (idx < 1.0)      col = mix(preto, magenta, smoothstep(0.0, s, idx));
    else if (idx < 2.0) col = mix(magenta, ciano, smoothstep(1.0, 1.0+s, idx));
    else if (idx < 3.0) col = mix(ciano, amarelo, smoothstep(2.0, 2.0+s, idx));
    else if (idx < 4.0) col = mix(amarelo, branco, smoothstep(3.0, 3.0+s, idx));
    else                col = mix(branco, preto, smoothstep(4.0, 4.0+s, idx));

    // 3. Sistema de Luz Central (Backlight)
    float dist = length(uv);
    float light = smoothstep(${C.LIGHT_RADIUS.toFixed(2)}, 0.0, dist);
    vec3 lightCol = mix(col, branco, light * 0.5);
    
    // Mistura final com a luz e o ruído perlin para grão
    col = mix(col, lightCol, ${C.LIGHT_INTENSITY.toFixed(2)});
    col += pNoise * ${C.PERLIN_STRENGTH.toFixed(2)};

    // Vinheta para focar no centro
    float vgn = 1.0 - dist * 0.5;
    gl_FragColor = vec4(col * vgn, 1.0);
}`;

const GalaxyEmitter = () => {
  const bgMatRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (bgMatRef.current) bgMatRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh position={[0, 0, C.Z_OFFSET_BG]}>
      <planeGeometry args={[40, 40]} /> 
      <shaderMaterial
        ref={bgMatRef}
        vertexShader={BG_VERT}
        fragmentShader={BG_FRAG}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
};

export default GalaxyEmitter;