import React, { useState, useRef, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera, MeshTransmissionMaterial, MeshDistortMaterial,
  Float, Environment, ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../../context/ThemeContext";
import ComputerModelContainer from "./computer/ComputerModelContainer";
import HarmonicRefractor from "./HarmonicRefractor";
import Manifesto from "./Manifesto";
import WhiteRabbit from "./whiteRabbit";  
import "./services.css";


// ╔══════════════════════════════════════════════════════════════╗
// ║  TUNABLES                                                    ║
// ╚══════════════════════════════════════════════════════════════╝

// ── CÂMARA (partilhada) ────────────────────────────────────────
const CAM_FOV = 45;
const CAM_Z   = 4.5;

// ── NORMAL — Geometria ─────────────────────────────────────────
const NRM_RADIUS   = 3.50;   // raio do objecto — preenche ~70% do canvas
const NRM_DETAIL   = 1;      // IcosahedronGeometry detail: 1=80 faces, 0=20 faces
//   Nota: THREE não tem subdivisão nativa para exatamente 62 faces.
//   detail=1 → 80 faces triangulares (flat-shaded) é o mais próximo visualmente.

// ── NORMAL — Material ─────────────────────────────────────────
const NRM_COLOR         = "#15ed7a";
const NRM_OPACITY       = 0.50;    // 60% transparente (opacity = 1 - transparência)
const NRM_METALNESS     = 0.85;    // alto → reflexivo
const NRM_ROUGHNESS     = 0.05;    // baixo → reflexos nítidos
const NRM_EMISSIVE      = "#0bf45cff";
const NRM_EMISSIVE_INT  = 0.40;
const NRM_ENV_INTENSITY = 0.80;    // reflexos do environment

// ── NORMAL — Distort ─────────────────────────────────────────
const NRM_DISTORT_SPEED  = 2.2;    // velocidade média
const NRM_DISTORT_AMOUNT = 0.35;   // amplitude média
const NRM_DISTORT_RADIUS = 0.25;   // raio de acção por ponto

// ── NORMAL — Animação ─────────────────────────────────────────
const NRM_AUTOROTATE_Y = 0.004;    // rotação y por frame
const NRM_AUTOROTATE_X = 0.001;    // rotação x por frame (leve tumble)
const NRM_SCALEIN_DUR  = 1.4;      // duração da animação de entrada (s)
const NRM_FLOAT_SPEED  = 1.2;
const NRM_FLOAT_ROT    = 0.3;
const NRM_FLOAT_INT    = 0.3;

// ── NORMAL — Luzes ─────────────────────────────────────────────
const NRM_AMBIENT      = 0.08;
const NRM_FILL_INT     = 2.2;      // directional fill branco
const NRM_SPOT_INT     = 60;       // spot verde — recorte dramático
const NRM_SPOT_COLOR   = "#00ff66";
const NRM_BACK_INT     = 8;        // contra-luz verde traseira
const NRM_BACK_COLOR   = "#f2f8f4ff";

// ── DARK — posição do ovo (ajusta aqui) ───────────────────────
const DRK_EGG_POS_X = 0.0;
const DRK_EGG_POS_Y = -0.50;
const DRK_EGG_POS_Z = 0.0;

// ── DARK — Yolk ───────────────────────────────────────────────
const DRK_YOLK_RADIUS  = 0.495;
const DRK_YOLK_Y       = -0.315;
const DRK_ROT_X_MAX    = 0.028;
const DRK_ROT_Y_MAX    = 0.024;
const DRK_ROT_Z_MAX    = 0.016;
const DRK_DISTORT_SPD  = 0.35;
const DRK_DISTORT_AMT  = 0.22;

// ── DARK — Shell ──────────────────────────────────────────────
const DRK_SCALE_Y      = 1.35;
const DRK_SHELL_ROUGH  = 0.30;
const DRK_SHELL_TRANS  = 0.96;
const DRK_SHELL_THICK  = 0.55;
const DRK_MASTER_SCALE = 0.75;
const DRK_ENV_INT      = 0.55;

// ── DARK — Filamentos ─────────────────────────────────────────
const DRK_FIL_COUNT = 250;
const DRK_FIL_SIZE  = 5.0;
const DRK_FIL_SPEED = 0.18;
const DRK_FIL_RISE  = 1.80;
const DRK_FIL_TURB  = 0.30;

// ── UNO ───────────────────────────────────────────────────────
const UNO_RADIUS         = 1.5;   // raio do núcleo interno — preenche ~65% do canvas
const UNO_YOLK_Y         = -0.6;
const UNO_DISTORT_SPEED  = 1.5;
const UNO_DISTORT_AMOUNT = 0.18;
const UNO_DISTORT_RADIUS = 0.32;
const UNO_SAT_MAX        = 0.70;
const UNO_BRIGHTNESS     = 0.60;

// ── Cena geral ─────────────────────────────────────────────────
const BACKLIGHT_DARK = "#ff2200";
const BACKLIGHT_UNO  = "#ff00ff";
const BACKLIGHT_INT  = 50;


// ╔══════════════════════════════════════════════════════════════╗
// ║  SCALE-IN WRAPPER                                            ║
// ╚══════════════════════════════════════════════════════════════╝
const ScaleIn = ({ to = [1,1,1], duration = NRM_SCALEIN_DUR, children }) => {
  const ref     = useRef();
  const elapsed = useRef(0);
  const target  = useMemo(() => new THREE.Vector3(...to), []);
  useFrame((_, dt) => {
    elapsed.current = Math.min(elapsed.current + dt, duration);
    const p = 1 - Math.pow(1 - elapsed.current / duration, 3);
    if (ref.current) ref.current.scale.set(target.x*p, target.y*p, target.z*p);
  });
  return <group ref={ref}>{children}</group>;
};


// ╔══════════════════════════════════════════════════════════════╗
// ║  NORMAL YOLK — começo do zero                               ║
// ║  IcosahedronGeometry detail=1 → 80 faces triangulares       ║
// ║  MeshDistortMaterial reflexivo, transparente, auto-rotate    ║
// ╚══════════════════════════════════════════════════════════════╝
const NormalYolk = () => {
  const meshRef = useRef();
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += NRM_AUTOROTATE_Y;
      meshRef.current.rotation.x += NRM_AUTOROTATE_X;
    }
  });

  return (
    <>
      {/* Iluminação — alien / misterioso */}
      <ambientLight intensity={NRM_AMBIENT} />

      {/* Fill branco suave */}
      <directionalLight position={[2, 3, 4]} intensity={NRM_FILL_INT} color="#ffffff" />

      {/* Spot verde — recorte dramático lateral direita */}
      <spotLight
        position={[4, 1, 1]}
        angle={0.35}
        penumbra={0.7}
        intensity={NRM_SPOT_INT}
        color={NRM_SPOT_COLOR}
        distance={16}
      />

      {/* Contra-luz verde traseira */}
      <pointLight
        position={[-2, 0.5, -3]}
        intensity={NRM_BACK_INT}
        color={NRM_BACK_COLOR}
        distance={10}
      />

      <Float speed={NRM_FLOAT_SPEED} rotationIntensity={NRM_FLOAT_ROT} floatIntensity={NRM_FLOAT_INT}>
        <ScaleIn to={[1, 1, 1]} duration={NRM_SCALEIN_DUR}>
          <mesh ref={meshRef}>
            {/* 80 faces triangulares flat-shaded */}
            <icosahedronGeometry args={[NRM_RADIUS, NRM_DETAIL]} />
            <MeshDistortMaterial
              color={NRM_COLOR}
              speed={NRM_DISTORT_SPEED}
              distort={NRM_DISTORT_AMOUNT}
              radius={NRM_DISTORT_RADIUS}
              metalness={NRM_METALNESS}
              roughness={NRM_ROUGHNESS}
              emissive={NRM_EMISSIVE}
              emissiveIntensity={NRM_EMISSIVE_INT}
              envMapIntensity={NRM_ENV_INTENSITY}
              transparent
              opacity={NRM_OPACITY}
              flatShading
              side={THREE.DoubleSide}
            />
          </mesh>
        </ScaleIn>
      </Float>

      <Environment preset="night" environmentIntensity={NRM_ENV_INTENSITY} />
    </>
  );
};

const NormalContainer = () => (
  <div style={{ width: "100%", height: "100%" }}>
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
    >
      <PerspectiveCamera makeDefault position={[0, 0, CAM_Z]} fov={CAM_FOV} />
      <NormalYolk />
    </Canvas>
  </div>
);


// ╔══════════════════════════════════════════════════════════════╗
// ║  DARK SHADERS — vertex displacement + FBM solar (sem seam)  ║
// ╚══════════════════════════════════════════════════════════════╝
const DARK_VERT = `
varying vec3 vPos; varying vec3 vNormal; uniform float uTime;
float hash3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise3(vec3 p){
  vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),
    f.z);
}
void main() {
  vPos = position;
  vec3 n = normalize(position);
  float disp = noise3(position * 2.8 + uTime * ${DRK_DISTORT_SPD}) * ${DRK_DISTORT_AMT};
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + n*disp, 1.0);
}`;

const DARK_FRAG = `
varying vec3 vPos; varying vec3 vNormal; uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm3(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){v+=a*noise(vec2(p.x+p.z,p.y+p.z)); p=p.yzx*2.1; a*=0.5;} return v; }
void main() {
  vec3 p=normalize(vPos);
  float gran    = fbm3(p*4.0 + vec3(uTime*0.025,uTime*0.015,uTime*0.010));
  vec3  pS      = p  + vec3(uTime*0.050,uTime*0.028,uTime*0.020);
  float spotMask= smoothstep(0.50,0.38,fbm3(pS*1.6+0.9));
  float spot2M  = smoothstep(0.56,0.44,fbm3(pS*2.5+1.7))*0.55;
  vec3  col     = mix(vec3(0.82,0.02,0.01),vec3(0.95,0.14,0.04),gran*0.22);
  col = mix(col,vec3(0.015,0.0,0.0),spotMask*0.94);
  col = mix(col,vec3(0.04,0.005,0.005),spot2M);
  col *= 0.52 + 0.48*abs(dot(vNormal,vec3(0,0,1)));
  gl_FragColor = vec4(col,1.0);
}`;

// ── Dark Filaments shader ─────────────────────────────────────
const FIL_VERT = `
uniform float uTime; attribute float aSeed; varying float vAlpha;
float hash(float n){ return fract(sin(n)*43758.5453); }
float nF(float t){ float i=floor(t),f=fract(t); f=f*f*(3.0-2.0*f); return mix(hash(i),hash(i+1.0),f); }
void main() {
  float phase = fract(uTime*${DRK_FIL_SPEED}+aSeed);
  vec3  pos   = position;
  float rise  = phase*${DRK_FIL_RISE};
  float tx = (nF(aSeed*7.3 +uTime*0.22+phase*1.8)*2.0-1.0);
  float tz = (nF(aSeed*13.7+uTime*0.19+phase*2.1)*2.0-1.0);
  pos.y += rise;
  pos.x += tx*rise*${DRK_FIL_TURB};
  pos.z += tz*rise*${DRK_FIL_TURB};
  vAlpha = sin(phase*3.14159)*0.55;
  gl_PointSize = ${DRK_FIL_SIZE.toFixed(1)}*(1.6-phase*0.9);
  gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}`;
const FIL_FRAG = `
varying float vAlpha;
void main() {
  vec2 uv=gl_PointCoord-0.5; if(length(uv)>0.5) discard;
  float glow=1.0-length(uv)*2.0;
  gl_FragColor=vec4(mix(vec3(0.04,0.01,0.01),vec3(0.16,0.05,0.05),glow), glow*glow*vAlpha);
}`;


// ╔══════════════════════════════════════════════════════════════╗
// ║  DARK YOLK                                                   ║
// ╚══════════════════════════════════════════════════════════════╝
const DarkYolk = () => {
  const meshRef  = useRef();
  const matRef   = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const rot      = useMemo(() => ({
    x: (Math.random()-0.5)*DRK_ROT_X_MAX,
    y: (Math.random()-0.5)*DRK_ROT_Y_MAX,
    z: (Math.random()-0.5)*DRK_ROT_Z_MAX,
  }), []);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x += rot.x;
      meshRef.current.rotation.y += rot.y;
      meshRef.current.rotation.z += rot.z;
    }
  });
  return (
    <group position={[0, DRK_YOLK_Y, 0]} scale={[1, 1/DRK_SCALE_Y, 1]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[DRK_YOLK_RADIUS, 64, 64]} />
        <shaderMaterial ref={matRef} vertexShader={DARK_VERT} fragmentShader={DARK_FRAG} uniforms={uniforms} />
      </mesh>
      <pointLight color="#ff2200" intensity={3.0} distance={1.0} />
    </group>
  );
};

const DarkFilaments = () => {
  const matRef   = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => { if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime(); });
  const geo = useMemo(() => {
    const g   = new THREE.BufferGeometry();
    const pos = new Float32Array(DRK_FIL_COUNT * 3);
    const seed= new Float32Array(DRK_FIL_COUNT);
    for (let i = 0; i < DRK_FIL_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2*Math.random()-1);
      const r     = DRK_YOLK_RADIUS * (0.2 + Math.random()*0.85);
      pos[i*3]   = Math.sin(phi)*Math.cos(theta)*r;
      pos[i*3+1] = DRK_YOLK_Y + Math.cos(phi)*r*0.55;
      pos[i*3+2] = Math.sin(phi)*Math.sin(theta)*r;
      seed[i]    = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed',    new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={FIL_VERT} fragmentShader={FIL_FRAG}
        uniforms={uniforms} transparent depthWrite={false}
      />
    </points>
  );
};


// ╔══════════════════════════════════════════════════════════════╗
// ║  DARK EGG SCENE                                              ║
// ╚══════════════════════════════════════════════════════════════╝
const DarkEgg = () => {
  const shellRef = useRef();
  useFrame(({ clock }) => {
    if (shellRef.current) shellRef.current.rotation.y = clock.getElapsedTime() * 0.05;
  });
  const scale = [DRK_MASTER_SCALE, DRK_MASTER_SCALE*DRK_SCALE_Y, DRK_MASTER_SCALE];
  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight position={[1.5,2,3]} intensity={1.6} color="#ffffff" />
      <spotLight position={[3.5,0.5,0.8]} angle={0.38} penumbra={0.65} intensity={BACKLIGHT_INT} color={BACKLIGHT_DARK} distance={14} />
      <pointLight position={[2.5,0.2,-2.5]} intensity={7} color={BACKLIGHT_DARK} distance={9} />
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
        {/* Posição ajustável via DRK_EGG_POS_X/Y/Z */}
        <ScaleIn to={scale} duration={1.4}>
          <group position={[DRK_EGG_POS_X, DRK_EGG_POS_Y, DRK_EGG_POS_Z]}>
            <mesh ref={shellRef}>
              <sphereGeometry args={[1, 64, 64]} />
              <MeshTransmissionMaterial
                backside samples={12}
                thickness={DRK_SHELL_THICK}
                chromaticAberration={0.07} anisotropy={0.05}
                distortion={0.25} distortionScale={0.25}
                color="#fff0f0"
                transmission={DRK_SHELL_TRANS}
                roughness={DRK_SHELL_ROUGH}
                metalness={0.0} ior={1.38}
                attenuationColor="#ffdddd" attenuationDistance={0.9}
                transparent
              />
            </mesh>
            <DarkYolk />
            <DarkFilaments />
          </group>
        </ScaleIn>
      </Float>
      <ContactShadows position={[0,-2.5,0]} opacity={0.15} scale={10} blur={3} />
      <Environment preset="night" environmentIntensity={DRK_ENV_INT} />
    </>
  );
};

const DarkEggContainer = () => (
  <div style={{ width: "100%", height: "100%" }}>
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
    >
      <PerspectiveCamera makeDefault position={[0, 0, CAM_Z]} fov={CAM_FOV} />
      <DarkEgg />
    </Canvas>
  </div>
);


// ╔══════════════════════════════════════════════════════════════╗
// ║  UNO YOLK                                                    ║
// ╚══════════════════════════════════════════════════════════════╝
const UnoYolk = () => {
  const meshRef  = useRef();
  const lightRef = useRef();
  const scaleRef = useRef();
  const phase    = useMemo(() => Math.random() * Math.PI * 2, []);
  const tmpCol   = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 2.8
      + Math.sin(t*0.9 +phase)*1.4
      + Math.sin(t*2.7 +phase*1.3)*0.6
      + Math.sin(t*5.1 +phase*0.7)*0.25;
    const intensity = Math.max(0.5, pulse);
    if (lightRef.current) lightRef.current.intensity = intensity;
    if (scaleRef.current) scaleRef.current.scale.setScalar(0.85 + (intensity/5.05)*0.30);
    const norm = Math.max(0,(intensity-0.5)/4.55);
    tmpCol.setHSL((t*0.08+phase*0.25)%1, norm*UNO_SAT_MAX, UNO_BRIGHTNESS+norm*(0.90-UNO_BRIGHTNESS));
    if (meshRef.current?.material) meshRef.current.material.color.copy(tmpCol);
  });
  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight position={[1.5,2,3]} intensity={1.6} color="#ffffff" />
      <spotLight position={[3.5,0.5,0.8]} angle={0.38} penumbra={0.65} intensity={BACKLIGHT_INT} color={BACKLIGHT_UNO} distance={14} />
      <pointLight position={[2.5,0.2,-2.5]} intensity={7} color={BACKLIGHT_UNO} distance={9} />
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
        <ScaleIn to={[1,1,1]} duration={1.4}>
          <group position={[0, UNO_YOLK_Y, 0]}>
            <group ref={scaleRef}>
              <mesh ref={meshRef}>
                <sphereGeometry args={[UNO_RADIUS, 32, 32]} />
                <MeshDistortMaterial
                  color="#ffffff"
                  speed={UNO_DISTORT_SPEED}
                  distort={UNO_DISTORT_AMOUNT}
                  radius={UNO_DISTORT_RADIUS}
                  transparent opacity={0.95}
                />
              </mesh>
            </group>
            <pointLight ref={lightRef} color="#ffffff" intensity={4} distance={1.5} />
          </group>
        </ScaleIn>
      </Float>
      <Environment preset="night" environmentIntensity={0.55} />
    </>
  );
};

const UnoContainer = () => (
  <div style={{ width: "100%", height: "100%" }}>
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
    >
      <PerspectiveCamera makeDefault position={[0, 0, CAM_Z]} fov={CAM_FOV} />
      <UnoYolk />
    </Canvas>
  </div>
);


// ╔══════════════════════════════════════════════════════════════╗
// ║  SCENE TITLES & DARK LINKS                                   ║
// ╚══════════════════════════════════════════════════════════════╝
const SCENE_TITLES = {
  1: { normal: "Organic Gestation",    dark: "Dark forces incubating...", uno: "Life in Motion"   },
  2: { normal: "Inorganic Structures", dark: "The Manifesto",             uno: "Digital Dreams"  },
  3: { normal: "Dissociative Ideas",   dark: "Void Constructs",           uno: "lab ideas"       },
};
const DARK_LINKS = [
  { id: "d1", title: "The Manifesto",    desc: "A declaration of intent. The void has a voice.",  href: "/dark/manifesto" },
  { id: "d2", title: "Orpheu's Descent", desc: "A journey into digital consciousness.",           href: "/dark/orpheu"    },
  { id: "d3", title: "Void Constructs",  desc: "Entities assembled from the absence of light.",   href: "/dark/void"      },
];


// ╔══════════════════════════════════════════════════════════════╗
// ║  ITEMS — menu esquerdo                                       ║
// ╚══════════════════════════════════════════════════════════════╝
const items = [
  { id: 2, titleDark:"Manifesto",     titleOther:"Tech-Core",     titleUno:"Tech-Core",
           descDark:"A criação do pensamento para o futuro", descOther:"Inorganic Structures",    descUno:"Inorganic Structures"   },
  { id: 1, titleDark:"Bio-Interface", titleOther:"Bio-Interface", titleUno:"Bio-Interface",
           descDark:"Organic Gestation Systems",             descOther:"Organic Gestation Systems",descUno:"Organic Gestation Systems"},
  { id: 3, titleDark:"Thinktank lαβ", titleOther:"Thinktank lαβ",titleUno:"lab ideas",
           descDark:"Dissociative Original Ideas",           descOther:"Dissociative Original Ideas",descUno:"Where ideas become alive"},
];


// ╔══════════════════════════════════════════════════════════════╗
// ║  SERVICES                                                    ║
// ╚══════════════════════════════════════════════════════════════╝
const Services = () => {
  const { isDark, isUno } = useTheme();
  const [activeItemId, setActiveItemId]   = useState(2);
  const [hoveredId, setHoveredId]         = useState(null);
  const [showManifesto, setShowManifesto] = useState(false);

  const themeColor = React.useMemo(() => {
    if (isUno) return "#ff00ff";
    if (isDark) return "#ff2200";
    return "#15ed7a";
  }, [isDark, isUno]);

  const bgActive  = `${themeColor}0D`;
  const borderW   = isUno ? "2px" : "1px";
  const pageTitle = isDark ? "Hephaestus Forge" : isUno ? "laβ" : "Services";
  const sceneTitle = SCENE_TITLES[activeItemId]
    ? (isDark ? SCENE_TITLES[activeItemId].dark : isUno ? SCENE_TITLES[activeItemId].uno : SCENE_TITLES[activeItemId].normal)
    : "";
  const titleFont = isDark
    ? { fontFamily:"'Teko','Share Tech Mono',monospace", fontWeight:600, letterSpacing:"0.06em" }
    : isUno
    ? { fontFamily:"'Fredoka',sans-serif", fontWeight:700 }
    : { fontWeight:300 };

  const handleItemClick = (id) => {
    if (id === 2 && isDark) setShowManifesto(true);
    else setActiveItemId(id);
  };

  return (
    <div className="services">
      <AnimatePresence>
        {showManifesto && (
          <Manifesto
            themeColor={themeColor}
            onClose={() => setShowManifesto(false)}
            onProceed={() => { setShowManifesto(false); setActiveItemId(2); }}
          />
        )}
      </AnimatePresence>

      {/* ——— LEFT ——— */}
      <div className="sSection left">
        <h1 className="sTitle" style={{ color: themeColor }}>{pageTitle}</h1>
        <div className="sLeftC">
          {items.map(item => {
            const isActive  = activeItemId === item.id;
            const isHovered = hoveredId    === item.id;
            const title = isDark ? item.titleDark : isUno ? item.titleUno : item.titleOther;
            const desc  = isDark ? item.descDark  : isUno ? item.descUno  : item.descOther;
            return (
              <div key={item.id} className="serviceItem"
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  cursor:"pointer",
                  border:(isActive||isHovered) ? `${borderW} solid ${themeColor}` : `${borderW} solid rgba(255,255,255,0.1)`,
                  padding:"20px", marginBottom:"15px", borderRadius:"8px",
                  background: isActive ? bgActive : "transparent",
                  transform: isHovered ? "translateX(10px)" : "translateX(0)",
                  transition:"transform 0.08s ease-out, border-color 0.08s ease-out, background 0.08s ease-out",
                }}
              >
                <h2 style={{ fontSize:"1.5rem", margin:0, color:themeColor }}>{title}</h2>
                <p style={{ opacity:0.6, fontSize:"0.9rem" }}>{desc}</p>
              </div>
            );
          })}
          <div className="counters" /> {/* visit counter — implementação futura */}
          
        </div>
        <WhiteRabbit />
      </div>

      {/* ——— RIGHT ——— */}
      <div className="sSection right">

        <div style={{ width:"100%", height:"55vh" }}>
          {activeItemId === 1 && (
            isDark   ? <DarkEggContainer /> :
            isUno    ? <UnoContainer />     :
                       <NormalContainer />
          )}
          {activeItemId === 2 && <ComputerModelContainer />}
          {activeItemId === 3 && (
            <div style={{ width:"100%", height:"100%" }}>
              <Canvas shadows camera={{ position:[0,0,CAM_Z], fov:CAM_FOV }}>
                <HarmonicRefractor />
              </Canvas>
            </div>
          )}
        </div>

        <h2 style={{
          fontSize:"clamp(28px, 4vw, 62px)",
          color:themeColor, textAlign:"center",
          margin:"20px 0 16px", ...titleFont,
        }}>
          {sceneTitle}
        </h2>

        {isDark && (
          <div style={{ display:"flex", gap:"14px", flexWrap:"wrap", padding:"0 8px" }}>
            {DARK_LINKS.map(link => (
              <a key={link.id} href={link.href} style={{
                flex:"1 1 140px", textDecoration:"none",
                border:`1px solid ${themeColor}44`, borderRadius:"6px",
                padding:"14px", background:`${themeColor}08`,
                transition:"border-color 0.15s, background 0.15s", display:"block",
              }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=themeColor; e.currentTarget.style.background=`${themeColor}16`; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${themeColor}44`; e.currentTarget.style.background=`${themeColor}08`; }}
              >
                <h3 style={{ color:themeColor, margin:"0 0 6px", fontSize:"0.95rem", fontFamily:"'Teko','Share Tech Mono',monospace", fontWeight:600, letterSpacing:"0.06em" }}>
                  {link.title}
                </h3>
                <p style={{ color:"rgba(255,255,255,0.50)", margin:0, fontSize:"0.78rem", lineHeight:1.5 }}>
                  {link.desc}
                </p>
              </a>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Services;
