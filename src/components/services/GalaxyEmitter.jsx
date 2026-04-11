import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const C = {
  NOISE_SCALE: 3.5,      
  FLOW_SPEED: 0.15,       
  Z_OFFSET_BG: -2.0, 
  
  // --- Painel de Controlo de Intensidade ---
  CONTRAST: 2.8,         // Sobe para 3.0+ para pretos absolutos e neon puro
  VIBRANCE: 2.2,         // Multiplicador de brilho pós-processamento
  COLOR_DENSITY: 8.0,    // Quantidade de faixas de cor visíveis
  COLOR_RATIO: 1.4,      
  VARIANCE: 0.4,         
  
  OCTAVES: 5,            
  SMOOTHNESS: 0.05,      // Valor baixo = transições nítidas (estilo corte laser)
  BORDER_WIDTH: 0.015    
};

const BG_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const BG_FRAG = `
varying vec2 vUv;
uniform float uTime;

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

float fbm(vec3 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < ${Math.floor(C.OCTAVES)}; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec3(10.0);
    a *= 0.55;
  }
  return v;
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * ${C.FLOW_SPEED.toFixed(2)};
    
    // Distorção de coordenadas para movimento fluído
    float var = noise(vec3(uv * 0.5, t * 0.2)) * ${C.VARIANCE.toFixed(2)};
    float n = fbm(vec3(uv * ${C.NOISE_SCALE.toFixed(2)} + var, t));
    n = n * 0.5 + 0.5;

    // Definição da Paleta High-Contrast
    vec3 magenta = vec3(1.0, 0.0, 1.0);
    vec3 ciano   = vec3(0.0, 1.0, 1.0);
    vec3 amarelo = vec3(1.0, 1.0, 0.0);
    vec3 branco  = vec3(1.0, 1.0, 1.0);
    vec3 preto   = vec3(0.0, 0.0, 0.0); // Preto puro para máximo contraste

    float val = mod(n * (5.0 * ${C.COLOR_DENSITY.toFixed(2)}) + t * 0.3, 5.0 * ${C.COLOR_RATIO.toFixed(2)});
    float idx = mod(val, 5.0); 

    vec3 col;
    float s = ${C.SMOOTHNESS.toFixed(3)};
    
    // Interpolação de cores baseada no índice do FBM
    if (idx < 1.0)      col = mix(preto, magenta, smoothstep(0.0, s, idx));
    else if (idx < 2.0) col = mix(magenta, ciano, smoothstep(1.0, 1.0+s, idx));
    else if (idx < 3.0) col = mix(ciano, amarelo, smoothstep(2.0, 2.0+s, idx));
    else if (idx < 4.0) col = mix(amarelo, branco, smoothstep(3.0, 3.0+s, idx));
    else                col = mix(branco, preto, smoothstep(4.0, 4.0+s, idx));

    // APLICAÇÃO DE INTENSIDADE: Contraste (Exponencial) e Vibrance (Multiplicador)
    col = pow(col, vec3(${C.CONTRAST.toFixed(2)})) * ${C.VIBRANCE.toFixed(2)};

    // Vinheta subtil para focar o centro
    float dist = length(uv);
    float vgn = smoothstep(1.5, 0.2, dist);
    
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
        toneMapped={false} 
      />
    </mesh>
  );
};

export default GalaxyEmitter;