import * as THREE from 'three'

export const PsychedelicShader = {

  uniforms: {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uIntensity:  { value: 1.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uIntensity;
    varying vec2  vUv;

    // ── Inigo Quilez colour palette ───────────────────────────────────────
    // Gera cores suaves e saturadas por todo o espectro.
    // Parâmetros afinados para a estética psicadélica:
    //   a + b * cos(2π (c*t + d))
    //   a,b  controlam brilho e contraste; c,d  controlam frequência/fase
    vec3 palette(float t) {
      vec3 a = vec3(0.50, 0.50, 0.50);
      vec3 b = vec3(0.50, 0.50, 0.50);
      vec3 c = vec3(1.00, 0.70, 0.40);   // frequências diferentes → espectro mais rico
      vec3 d = vec3(0.00, 0.15, 0.20);   // offsets de fase → magenta/verde/laranja/azul
      return a + b * cos(6.28318 * (c * t + d));
    }

    // Segunda paleta — mais roxa/ciana, para misturar com a primeira
    vec3 palette2(float t) {
      vec3 a = vec3(0.50, 0.50, 0.50);
      vec3 b = vec3(0.50, 0.50, 0.50);
      vec3 c = vec3(0.80, 1.00, 0.60);
      vec3 d = vec3(0.40, 0.00, 0.50);
      return a + b * cos(6.28318 * (c * t + d));
    }

    // ── Domain warp ───────────────────────────────────────────────────────
    // Distorce o UV com um campo sinusoidal multi-camada (marble / FBM leve)
    vec2 warp(vec2 p, float t, float amp, float freq) {
      vec2 q = p;
      for (float i = 1.0; i < 5.0; i++) {
        q.x += (amp / i) * sin(i * freq * q.y + t + i * 1.3);
        q.y += (amp / i) * sin(i * freq * q.x + t * 1.1 + i * 2.4);
      }
      return q;
    }

    void main() {
      // ── UV centrado + correcção de aspect ratio ───────────────────────
      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
      vec2 uv     = (vUv - 0.5) * aspect;          // centrado, com AR

      float t = uTime * 0.35;                       // velocidade (+75% vs original)

      // ── Domain warping em 2 passes ────────────────────────────────────
      // Pass 1: warp suave de grande escala
      vec2 q = warp(uv, t,       0.38, 2.4);
      // Pass 2: warp fino sobre o resultado do pass 1
      vec2 r = warp(q,  t * 0.8, 0.22, 3.8);

      // ── Campo de cor principal (marble + swirl) ───────────────────────
      float marbleField = length(r) * 0.55
                        + sin(r.x * 2.1 + t) * 0.18
                        + sin(r.y * 1.7 + t * 0.9) * 0.18;

      // Componente radial / swirl — cria profundidade em torno do centro
      float radius = length(uv);
      float angle  = atan(uv.y, uv.x);
      float swirl  = sin(angle * 4.0 + radius * 5.5 - t * 1.8) * 0.5 + 0.5;
      float swirl2 = sin(angle * 2.0 - radius * 3.2 + t * 1.1) * 0.5 + 0.5;

      // Blend dos campos
      float field = marbleField * 0.55 + swirl * 0.28 + swirl2 * 0.17;

      // ── Cores: duas paletas misturadas ───────────────────────────────
      vec3 col  = palette (field         + t * 0.12);
      vec3 col2 = palette2(field * 1.65  + t * 0.09 + 0.42);

      // Terceira "camada de brilho" baseada apenas no swirl → centros vivos
      vec3 col3 = palette(swirl2 * 0.8 + t * 0.18 + 0.8);

      vec3 color = mix(col, col2, 0.40);
      color      = mix(color, col3, swirl * 0.22);  // brilho selectivo

      // ── Vinheta subtil — bordas ligeiramente mais escuras ─────────────
      float vignette = smoothstep(1.1, 0.3, radius / 0.8);
      color = mix(color * 0.72, color, vignette);

      gl_FragColor = vec4(color * uIntensity, 0.88);
    }
  `,
}
