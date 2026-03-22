import * as THREE from 'three'

export const PsychedelicShader = {
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uIntensity: { value: 1.0 }
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
    uniform vec2 uResolution;
    uniform float uIntensity;
    varying vec2 vUv;

    // Função mágica para criar o efeito "Liquid Marble"
    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.2;
      
      // Criamos distorções em cascata (FBM simplificado)
      for(float i = 1.0; i < 4.0; i++){
        uv.x += 0.3 / i * sin(i * 3.0 * uv.y + t);
        uv.y += 0.3 / i * sin(i * 3.0 * uv.x + t);
      }
      
      // Cores psicadélicas baseadas no movimento das ondas
      vec3 color = vec3(
        0.5 + 0.5 * sin(uv.x + t),
        0.5 + 0.5 * sin(uv.y + t + 2.0),
        0.5 + 0.5 * sin(uv.x + uv.y + t + 4.0)
      );

      gl_FragColor = vec4(color * uIntensity, 1.0);
    }
  `
}