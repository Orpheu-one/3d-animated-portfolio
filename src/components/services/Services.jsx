import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera, MeshTransmissionMaterial, Float,
  Environment, ContactShadows, OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../../context/ThemeContext";
import ComputerModelContainer from "./computer/ComputerModelContainer";
import HarmonicRefractor from "./HarmonicRefractor"; // Importação do novo componente
import "./services.css";


// ——— TUNABLES ——————————————————————————————————————————————————————
const YOLK_RADIUS      = 0.33;
const YOLK_Y_LOCAL     = -0.48;    // +0.10 vs anterior (gema mais acima)
const FLUID_RADIUS     = 0.73;
const ENV_INTENSITY    = 0.55;
const EGG_SCALE_Y      = 1.35;    // oval stretch — dark only
const MASTER_SCALE     = 0.60;

const BACKLIGHT_NORMAL = "#00ff44";
const BACKLIGHT_DARK   = "#ff2200";
const BACKLIGHT_INT    = 50;

// Neural Yolk pulses
const NP_MAX        = 16;          // mais pulsos simultâneos
const NP_SPEED      = 0.022;       // 3× mais rápido
const NP_SPAWN_RATE = 0.10;        // spawn mais frequente
const NP_CHAIN_PROB = 0.65;
const NP_SEED       = 6;           // pulsos iniciais no mount
// —————————————————————————————————————————————————————————————————————


// ——— TETRAKIS HEXAHEDRON —————————————————————————————————————————————
const INV3 = 1 / Math.sqrt(3);

const TKH_NODES = (() => {
  const n = [];
  for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1])
    n.push(new THREE.Vector3(sx*INV3, sy*INV3, sz*INV3));
  n.push(
    new THREE.Vector3( 0,  1,  0), new THREE.Vector3( 0, -1,  0),
    new THREE.Vector3( 0,  0,  1), new THREE.Vector3( 0,  0, -1),
    new THREE.Vector3( 1,  0,  0), new THREE.Vector3(-1,  0,  0),
  );
  return n;
})();

const TKH_EDGES = (() => {
  const e = [];
  [[8,[2,3,6,7]],[9,[0,1,4,5]],[10,[1,3,5,7]],[11,[0,2,4,6]],[12,[4,5,6,7]],[13,[0,1,2,3]]]
    .forEach(([ap,cs]) => cs.forEach(c => e.push([ap,c])));
  for (let i=0;i<8;i++) for (let j=i+1;j<8;j++) {
    const a=TKH_NODES[i],b=TKH_NODES[j];
    const d=(Math.abs(a.x-b.x)>0.1?1:0)+(Math.abs(a.y-b.y)>0.1?1:0)+(Math.abs(a.z-b.z)>0.1?1:0);
    if (d===1) e.push([i,j]);
  }
  return e;
})();

function buildTKHGeo(r) {
  const faceGroups = [
    {ap:8, ring:[2,6,7,3]},{ap:9, ring:[0,4,5,1]},{ap:10,ring:[1,5,7,3]},
    {ap:11,ring:[0,2,6,4]},{ap:12,ring:[4,6,7,5]},{ap:13,ring:[0,1,3,2]},
  ];
  const pos = [];
  faceGroups.forEach(({ap,ring}) => {
    const apV = TKH_NODES[ap].clone().multiplyScalar(r);
    for (let i=0;i<4;i++) {
      const v0=TKH_NODES[ring[i]].clone().multiplyScalar(r);
      const v1=TKH_NODES[ring[(i+1)%4]].clone().multiplyScalar(r);
      pos.push(...apV.toArray(),...v0.toArray(),...v1.toArray());
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  geo.computeVertexNormals();
  return geo;
}
// —————————————————————————————————————————————————————————————————————


// ——— DARK YOLK SHADERS ———————————————————————————————————————————————
// FBM-based solar surface: granulação de convecção + manchas solares dinâmicas
// + limb darkening + rotação randomizada
const DARK_VERT = `
varying vec3 vPos;
varying vec3 vNormal;
void main() {
  vPos    = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const DARK_FRAG = `
varying vec3 vPos;
varying vec3 vNormal;
uniform float uTime;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}

float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;}
  return v;
}

void main() {
  vec3 p   = normalize(vPos);
  float lon = atan(p.z, p.x) / 6.2832 + 0.5;
  float lat = asin(clamp(p.y,-1.0,1.0)) / 3.1416 + 0.5;

  // UV com drift temporal — superfície "roda"
  vec2 uv = vec2(lon + uTime * 0.025, lat);

  // Granulação solar: células de convecção pequenas e rápidas
  float gran  = fbm(uv * 7.2 + uTime * 0.045);

  // Manchas solares: mais largas, derivam lentamente
  vec2  suv   = vec2(lon + uTime * 0.008, lat + uTime * 0.004 + 0.7);
  float spots = fbm(suv * 3.1 + 0.9);
  // Máscara de mancha: regiões onde fbm < threshold são manchas escuras
  float spotMask = smoothstep(0.60, 0.42, spots);
  // Segunda camada de manchas menores para variedade
  float spots2   = fbm(suv * 5.5 + 1.7);
  float spot2M   = smoothstep(0.64, 0.50, spots2) * 0.55;

  // Cor base: vermelho solar profundo
  vec3 base = vec3(0.82, 0.02, 0.01);
  // Granulação: clareia ligeiramente
  vec3 col  = mix(base, vec3(0.95, 0.14, 0.04), gran * 0.42);
  // Manchas principais: quase preto
  col = mix(col, vec3(0.015, 0.0, 0.0), spotMask * 0.94);
  // Manchas secundárias
  col = mix(col, vec3(0.04, 0.005, 0.005), spot2M);

  // Limb darkening — borda mais escura (realismo solar)
  float limb = abs(dot(vNormal, vec3(0.0,0.0,1.0)));
  col *= 0.52 + 0.48 * limb;

  gl_FragColor = vec4(col, 1.0);
}`;
// —————————————————————————————————————————————————————————————————————


// ——— FLUID CAUSTIC SHADER ————————————————————————————————————————————
// Lightweight: 3 iterações de trig, sem loops, totalmente barato
const FLUID_VERT = `
varying vec3 vPos;
varying vec3 vNormal;
void main() {
  vPos    = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FLUID_FRAG = `
varying vec3 vPos;
varying vec3 vNormal;
uniform float uTime;

void main() {
  vec3 p   = normalize(vPos);
  float lon = atan(p.z, p.x);
  float lat = asin(clamp(p.y,-1.0,1.0));
  vec2 uv  = vec2(lon, lat) * 1.8;

  // Padrões de interferência — simulam caustics
  float t = uTime * 0.18;
  float c1 = sin(uv.x*3.1 + t       ) * cos(uv.y*2.7 + t*0.8);
  float c2 = sin(uv.x*1.9 + t*1.3+1.1) * cos(uv.y*3.5 + t*0.5+2.4);
  float c3 = sin(uv.x*4.7 - t*0.7+3.0) * cos(uv.y*1.8 - t*1.1+1.6);
  float caust = (c1+c2+c3) / 3.0 * 0.5 + 0.5;
  caust = pow(caust, 2.8);

  // Fresnel — bordas ligeiramente mais visíveis
  float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0)));
  fresnel = pow(fresnel, 2.5);

  // Tint âmbar quente (viscosidade)
  vec3 col   = vec3(1.0, 0.96, 0.78);
  float alpha = 0.04 + caust * 0.09 + fresnel * 0.12;

  gl_FragColor = vec4(col * (0.85 + caust * 0.35), alpha);
}`;
// —————————————————————————————————————————————————————————————————————


// ——— FLUID MESH COMPONENT ————————————————————————————————————————————
const FluidMesh = () => {
  const matRef   = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <mesh>
      <sphereGeometry args={[FLUID_RADIUS, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={FLUID_VERT}
        fragmentShader={FLUID_FRAG}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};
// —————————————————————————————————————————————————————————————————————


// ——— NEURAL YOLK 3D (normal mode) ————————————————————————————————————
const NeuralYolk3D = () => {
  const meshRef    = useRef();
  const linesRef   = useRef();
  const instRef    = useRef();
  const pulsesRef  = useRef([]);
  const litRef     = useRef({});
  const startedRef = useRef(false);
  const tmpMat     = useRef(new THREE.Matrix4());
  const tmpVec     = useRef(new THREE.Vector3());

  const tkhGeo  = useMemo(() => buildTKHGeo(YOLK_RADIUS), []);

  const linesGeo = useMemo(() => {
    const pts=[], cols=[];
    TKH_EDGES.forEach(([a,b]) => {
      pts.push(TKH_NODES[a].clone().multiplyScalar(YOLK_RADIUS));
      pts.push(TKH_NODES[b].clone().multiplyScalar(YOLK_RADIUS));
      cols.push(1.0,0.82,0.0, 1.0,0.82,0.0);
    });
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(cols),3));
    return geo;
  }, []);

  const spawnPulse = (fromNode=null, fromEdge=null, depth=0) => {
    if (pulsesRef.current.length >= NP_MAX) return;
    let edgeIdx;
    if (fromNode !== null) {
      const cands = TKH_EDGES.map((_,i)=>i).filter(i=>i!==fromEdge&&TKH_EDGES[i].includes(fromNode));
      if (!cands.length) return;
      edgeIdx = cands[Math.floor(Math.random()*cands.length)];
    } else {
      edgeIdx = Math.floor(Math.random()*TKH_EDGES.length);
    }
    const [a,b] = TKH_EDGES[edgeIdx];
    const dir = fromNode===b ? -1 : (fromNode===a ? 1 : (Math.random()>0.5?1:-1));
    pulsesRef.current.push({ edgeIdx, t: dir>0?0:1, dir, depth });
    litRef.current[edgeIdx] = performance.now();
  };

  useFrame(() => {
    const now = performance.now();

    // Seed inicial
    if (!startedRef.current) {
      startedRef.current = true;
      for (let i=0;i<NP_SEED;i++) spawnPulse();
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.0015;
    }

    if (Math.random() < NP_SPAWN_RATE) spawnPulse();

    const remove = [];
    pulsesRef.current.forEach((p,pi) => {
      p.t += p.dir * NP_SPEED;
      if (p.dir>0 ? p.t>=1 : p.t<=0) {
        const arr = p.dir>0 ? TKH_EDGES[p.edgeIdx][1] : TKH_EDGES[p.edgeIdx][0];
        if (p.depth<4 && Math.random()<NP_CHAIN_PROB) spawnPulse(arr,p.edgeIdx,p.depth+1);
        remove.push(pi);
      }
    });
    remove.reverse().forEach(i => pulsesRef.current.splice(i,1));

    // Pulse heads (InstancedMesh)
    if (instRef.current) {
      for (let i=0;i<NP_MAX;i++) {
        const p = pulsesRef.current[i];
        if (p) {
          const [a,b] = TKH_EDGES[p.edgeIdx];
          tmpVec.current.lerpVectors(TKH_NODES[a],TKH_NODES[b],p.t).multiplyScalar(YOLK_RADIUS);
          tmpMat.current.makeTranslation(tmpVec.current.x,tmpVec.current.y,tmpVec.current.z);
        } else {
          tmpMat.current.makeScale(0,0,0);
        }
        instRef.current.setMatrixAt(i,tmpMat.current);
      }
      instRef.current.instanceMatrix.needsUpdate = true;
    }

    // Edge glow via vertex colors
    if (linesRef.current) {
      const col = linesRef.current.geometry.attributes.color;
      TKH_EDGES.forEach((_,i) => {
        const age    = now - (litRef.current[i]||0);
        const bright = 0.15 + 0.85 * Math.max(0, 1 - age/1400);
        col.setXYZ(i*2,   bright*1.0, bright*0.84, 0);
        col.setXYZ(i*2+1, bright*1.0, bright*0.84, 0);
      });
      col.needsUpdate = true;
    }
  });

  return (
    <group position={[0, YOLK_Y_LOCAL, 0]}>

      {/* Sólido 24-faces — semi-transparente para ver o interior */}
      <mesh ref={meshRef} geometry={tkhGeo}>
        <meshPhysicalMaterial
          color="#ffcc00"
          metalness={0.30}
          roughness={0.08}
          transparent
          opacity={0.60}
          flatShading
          side={THREE.DoubleSide}
          emissive="#442200"
          emissiveIntensity={0.55}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Arestas com glow dinâmico */}
      <lineSegments ref={linesRef} geometry={linesGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.85} linewidth={1.5} />
      </lineSegments>

      {/* Cabeças dos pulsos */}
      <instancedMesh ref={instRef} args={[undefined, undefined, NP_MAX]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>

      {/* Coração de energia — amarelo quente */}
      <pointLight color="#ffaa00" intensity={4.0} distance={1.4} />

    </group>
  );
};
// —————————————————————————————————————————————————————————————————————


// ——— DARK YOLK ———————————————————————————————————————————————————————
const DarkYolk = () => {
  const meshRef  = useRef();
  const matRef   = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // Velocidades e direcções de rotação completamente aleatórias no mount
  const rotSpeed = useMemo(() => ({
    x: (Math.random()-0.5) * 0.014,
    y: (Math.random()-0.5) * 0.012,
    z: (Math.random()-0.5) * 0.008,
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current)  matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x += rotSpeed.x;
      meshRef.current.rotation.y += rotSpeed.y;
      meshRef.current.rotation.z += rotSpeed.z;
    }
  });

  return (
    <group position={[0, YOLK_Y_LOCAL, 0]} scale={[1, 1/EGG_SCALE_Y, 1]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[YOLK_RADIUS, 48, 48]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={DARK_VERT}
          fragmentShader={DARK_FRAG}
          uniforms={uniforms}
        />
      </mesh>
      {/* Coração de energia vermelho */}
      <pointLight color="#ff2200" intensity={3.0} distance={1.0} />
    </group>
  );
};
// —————————————————————————————————————————————————————————————————————


// ——— UNO YOLK ————————————————————————————————————————————————————————
const UnoYolk = () => {
  const meshRef = useRef();
  useFrame(() => { if (meshRef.current) meshRef.current.rotation.y += 0.003; });
  return (
    <group position={[0, YOLK_Y_LOCAL, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[YOLK_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight color="#ffffff" intensity={4} distance={1.5} />
    </group>
  );
};
// —————————————————————————————————————————————————————————————————————


// ——— ALIEN EGG SCENE —————————————————————————————————————————————————
const AlienEgg = () => {
  const { isDark, isUno } = useTheme();
  const shellRef = useRef();

  useFrame(({ clock }) => {
    if (shellRef.current) shellRef.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  const groupScaleY = isDark ? EGG_SCALE_Y : 1;
  const groupScale  = [MASTER_SCALE, MASTER_SCALE * groupScaleY, MASTER_SCALE];
  const rimColor    = isDark ? BACKLIGHT_DARK : BACKLIGHT_NORMAL;

  return (
    <>
      <ambientLight intensity={0.04} />

      <directionalLight position={[1.5, 2, 3]} intensity={1.6} color="#ffffff" />

      <spotLight
        position={[3.5, 0.5, 0.8]}
        angle={0.38}
        penumbra={0.65}
        intensity={BACKLIGHT_INT}
        color={rimColor}
        distance={14}
      />

      <pointLight position={[2.5, 0.2, -2.5]} intensity={7} color={rimColor} distance={9} />

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
        <group scale={groupScale}>

          {/* —— CASCA —————————————————————————————————————————————————————
              dark:        roughness 0.55 (textura rugosa recuperada) +
                           transmission 0.96
              normal/uno:  vidro puro (roughness 0.35, transmission 0.97)
          ————————————————————————————————————————————————————————————————— */}
          <mesh ref={shellRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshTransmissionMaterial
              backside
              samples={12}
              thickness={0.28}
              chromaticAberration={isDark ? 0.07 : 0.04}
              anisotropy={0.05}
              distortion={0.08}
              distortionScale={0.10}
              color={isDark ? "#fff0f0" : isUno ? "#f5f0ff" : "#ffffff"}
              transmission={isDark ? 0.96 : 0.97}
              roughness={isDark ? 0.55 : 0.35}   // rugose recuperado em dark
              metalness={0.0}
              ior={1.38}
              attenuationColor={isDark ? "#ffdddd" : "#fffce8"}
              attenuationDistance={0.9}
              transparent
            />
          </mesh>

          {/* —— FLUIDO VISCOSO com caustics lightweight ——————————————————— */}
          <FluidMesh />

          {/* —— GEMA por theme ———————————————————————————————————————————— */}
          {!isDark && !isUno && <NeuralYolk3D />}
          {isDark             && <DarkYolk />}
          {isUno              && <UnoYolk />}

        </group>
      </Float>

      <Environment preset="night" environmentIntensity={ENV_INTENSITY} />
    </>
  );
};
// —————————————————————————————————————————————————————————————————————


// ——— CANVAS CONTAINER ————————————————————————————————————————————————
const AlienEggContainer = () => (
  <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={35} />
      <AlienEgg />
      <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={10} blur={3} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  </div>
);


// ——— SERVICES ———————————————————————————————————————————————————————
const items = [
  { id: 1, title: "Bio-Interface", description: "Organic Gestation Systems" },
  { id: 2, title: "Tech-Core",     description: "Inorganic Structures" },
  { id: 3, title: "Thinktank lαβ", description: "Dissociative Original Ideas" },
];

const Services = () => {
  const [activeItemId, setActiveItemId] = useState(1);

  return (
    <div className="services">
      <div className="sSection left">
        <h1 className="sTitle">Services</h1>
        <div className="sLeftC">
          {items.map(item => (
            <motion.div
              key={item.id}
              className="serviceItem"
              onClick={() => setActiveItemId(item.id)}
              whileHover={{ x: 10, borderColor: "#15ed7a" }}
              transition={{ duration: 0.08, ease: "easeOut" }}
              style={{
                cursor: "pointer",
                border: activeItemId === item.id
                  ? "1px solid #15ed7a"
                  : "1px solid rgba(255,255,255,0.1)",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
                background: activeItemId === item.id
                  ? "rgba(21, 237, 122, 0.05)"
                  : "transparent",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{item.title}</h2>
              <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="sSection right">
  {activeItemId === 1 && <AlienEggContainer />}
  
  {activeItemId === 2 && <ComputerModelContainer />}
  
  {activeItemId === 3 && (
    <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 35 }}>
        <HarmonicRefractor />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )}
</div>
    </div>
  );
};

export default Services;