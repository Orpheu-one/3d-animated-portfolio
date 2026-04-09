import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES - BACKGROUND PSICADÉLICO ULTRA-DINÂMICO            ║
// ╚══════════════════════════════════════════════════════════════╝
const C = {
  NOISE_SCALE: 4.2,      
  FLOW_SPEED: 0.2,       
  COLOR_INTENSITY: 1.1,  
  VIGNETTE: 0.4,         
  
  // --- Dinâmica de Formação
  OCTAVES: 3,            // Camadas de ruído (maior = mais complexidade/manchas pequenas)
  PERSISTENCE: 0.7,      // Quanto cada oitava contribui (0.1 a 0.9)
  CONTRAST: 1.2,         // Força a separação das manchas (evita fundos lisos)
  
  // --- Estética
  SMOOTHNESS: 0.18,      
  BORDER_WIDTH: 0.035,    
  
  Z_OFFSET_BG: -1.2      
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

// Função FBM para gerar complexidade e evitar áreas vazias
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  float shift = 100.0;
  for (int i = 0; i < ${Math.floor(C.OCTAVES)}; i++) {
    v += a * noise(p);
    p = p * 2.0 + vec3(shift);
    a *= ${C.PERSISTENCE.toFixed(2)};
  }
  return v;
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * ${C.FLOW_SPEED.toFixed(2)};
    
    // FBM em vez de noise simples para mais dinâmica
    float n = fbm(vec3(uv * ${C.NOISE_SCALE.toFixed(2)}, t));
    
    // Aplicar contraste para evitar que uma cor domine por muito tempo
    n = (n * ${C.CONTRAST.toFixed(2)});
    n = clamp(n * 0.5 + 0.5, 0.0, 1.0);

    vec3 magenta = vec3(1.0, 0.0, 1.0);
    vec3 ciano   = vec3(0.0, 1.0, 1.0);
    vec3 amarelo = vec3(1.0, 1.0, 0.0);
    vec3 branco  = vec3(1.0, 1.0, 1.0);
    vec3 preto   = vec3(0.02, 0.02, 0.02);
    vec3 borda   = branco;

    float val = mod(n * 5.0 + t * 0.15, 5.0);
    vec3 col;

    float s = ${C.SMOOTHNESS.toFixed(3)};
    float b = ${C.BORDER_WIDTH.toFixed(3)};

    if (val < 1.0)      col = mix(preto, magenta, smoothstep(0.0, s, val));
    else if (val < 2.0) col = mix(magenta, ciano, smoothstep(1.0, 1.0+s, val));
    else if (val < 3.0) col = mix(ciano, amarelo, smoothstep(2.0, 2.0+s, val));
    else if (val < 4.0) col = mix(amarelo, branco, smoothstep(3.0, 3.0+s, val));
    else                col = mix(branco, preto, smoothstep(4.0, 4.0+s, val));

    // Contorno dinâmico
    float distToEdge = abs(fract(val + 0.5) - 0.5);
    if (distToEdge < b) {
        col = mix(borda, col, smoothstep(b*0.5, b, distToEdge));
    }

    float vgn = 1.0 - length(uv * ${C.VIGNETTE.toFixed(2)});
    col *= vgn * ${C.COLOR_INTENSITY.toFixed(2)};

    gl_FragColor = vec4(col, 1.0);
}`;

const GalaxyEmitter = () => {
  const bgMatRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (bgMatRef.current) bgMatRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh position={[0, 0, C.Z_OFFSET_BG]}>
      <planeGeometry args={[25, 25]} /> 
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