import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera, MeshTransmissionMaterial, Float,
  Environment, ContactShadows, OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../../context/ThemeContext";
import ComputerModelContainer from "./computer/ComputerModelContainer";
import HarmonicRefractor from "./HarmonicRefractor";
import Manifesto from "./Manifesto";
import "./services.css";


// ——— TUNABLES ——————————————————————————————————————————————————————————————————
const YOLK_RADIUS   = 0.33;         // normal / uno
const YOLK_Y_LOCAL  = -0.48;        // normal / uno centre Y
const YOLK_R_DARK   = 0.495;        // dark: 50% maior (0.33 × 1.5)
const YOLK_Y_DARK   = -0.315;       // dark: fundo da gema mantém-se em -0.81

const FLUID_RADIUS  = 0.73;
const ENV_INTENSITY = 0.55;
const EGG_SCALE_Y   = 1.35;
const MASTER_SCALE  = 0.60;

const BACKLIGHT_NORMAL = "#00ff44";
const BACKLIGHT_DARK   = "#ff2200";
const BACKLIGHT_INT    = 50;

// Neural Yolk pulses — mais rápidos
const NP_MAX        = 16;
const NP_SPEED      = 0.040;        // era 0.022
const NP_SPAWN_RATE = 0.18;         // era 0.10
const NP_CHAIN_PROB = 0.65;
const NP_SEED       = 6;


// ——— TETRAKIS HEXAHEDRON (inalterado) —————————————————————————————————————————
const INV3 = 1 / Math.sqrt(3);
const TKH_NODES = (() => {
  const n = [];
  for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1])
    n.push(new THREE.Vector3(sx*INV3, sy*INV3, sz*INV3));
  n.push(
    new THREE.Vector3( 0, 1, 0), new THREE.Vector3( 0,-1, 0),
    new THREE.Vector3( 0, 0, 1), new THREE.Vector3( 0, 0,-1),
    new THREE.Vector3( 1, 0, 0), new THREE.Vector3(-1, 0, 0),
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
  const fg=[{ap:8,ring:[2,6,7,3]},{ap:9,ring:[0,4,5,1]},{ap:10,ring:[1,5,7,3]},{ap:11,ring:[0,2,6,4]},{ap:12,ring:[4,6,7,5]},{ap:13,ring:[0,1,3,2]}];
  const pos=[];
  fg.forEach(({ap,ring})=>{const apV=TKH_NODES[ap].clone().multiplyScalar(r);for(let i=0;i<4;i++){const v0=TKH_NODES[ring[i]].clone().multiplyScalar(r);const v1=TKH_NODES[ring[(i+1)%4]].clone().multiplyScalar(r);pos.push(...apV.toArray(),...v0.toArray(),...v1.toArray());}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));geo.computeVertexNormals();return geo;
}


// ——— DARK YOLK SHADER ——————————————————————————————————————————————————————————
// Mudanças: granulação fbm*4.0 (era 7.2, grão maior/mais subtil), gran*0.22 (era 0.42),
// spots fbm*1.6 (era 3.1, manchas maiores), drift 0.020/0.012 (era 0.008/0.004, mais rápido),
// spots2 fbm*2.5 (era 5.5)
const DARK_VERT = `varying vec3 vPos; varying vec3 vNormal; void main() { vPos = position; vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DARK_FRAG = `varying vec3 vPos; varying vec3 vNormal; uniform float uTime; float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); } float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;} return v; } void main() { vec3 p = normalize(vPos); float lon = atan(p.z, p.x) / 6.2832 + 0.5; float lat = asin(clamp(p.y,-1.0,1.0)) / 3.1416 + 0.5; vec2 uv = vec2(lon + uTime * 0.025, lat); float gran = fbm(uv * 4.0 + uTime * 0.045); vec2 suv = vec2(lon + uTime * 0.020, lat + uTime * 0.012 + 0.7); float spots = fbm(suv * 1.6 + 0.9); float spotMask = smoothstep(0.60, 0.42, spots); float spots2 = fbm(suv * 2.5 + 1.7); float spot2M = smoothstep(0.64, 0.50, spots2) * 0.55; vec3 base = vec3(0.82, 0.02, 0.01); vec3 col = mix(base, vec3(0.95, 0.14, 0.04), gran * 0.22); col = mix(col, vec3(0.015, 0.0, 0.0), spotMask * 0.94); col = mix(col, vec3(0.04, 0.005, 0.005), spot2M); float limb = abs(dot(vNormal, vec3(0.0,0.0,1.0))); col *= 0.52 + 0.48 * limb; gl_FragColor = vec4(col, 1.0); }`;


// ——— FLUID SHADER ——————————————————————————————————————————————————————————————
// Mudanças: uv scale 2.4 (era 1.8), t speed 0.35 (era 0.18), pow 1.6 (era 2.8),
// alpha -10%: 0.036 / 0.081 / 0.108 (era 0.04 / 0.09 / 0.12)
const FLUID_VERT = `varying vec3 vPos; varying vec3 vNormal; void main() { vPos = position; vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FLUID_FRAG = `varying vec3 vPos; varying vec3 vNormal; uniform float uTime; void main() { vec3 p = normalize(vPos); float lon = atan(p.z, p.x); float lat = asin(clamp(p.y,-1.0,1.0)); vec2 uv = vec2(lon, lat) * 2.4; float t = uTime * 0.35; float c1 = sin(uv.x*3.1 + t) * cos(uv.y*2.7 + t*0.8); float c2 = sin(uv.x*1.9 + t*1.3+1.1) * cos(uv.y*3.5 + t*0.5+2.4); float c3 = sin(uv.x*4.7 - t*0.7+3.0) * cos(uv.y*1.8 - t*1.1+1.6); float caust = (c1+c2+c3) / 3.0 * 0.5 + 0.5; caust = pow(caust, 1.6); float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0))); fresnel = pow(fresnel, 2.5); vec3 col = vec3(1.0, 0.96, 0.78); float alpha = 0.036 + caust * 0.081 + fresnel * 0.108; gl_FragColor = vec4(col * (0.85 + caust * 0.35), alpha); }`;

const FluidMesh = () => {
  const matRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => { if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime(); });
  return (
    <mesh>
      <sphereGeometry args={[FLUID_RADIUS, 48, 48]} />
      <shaderMaterial ref={matRef} vertexShader={FLUID_VERT} fragmentShader={FLUID_FRAG} uniforms={uniforms} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};


// ——— NEURAL YOLK 3D (normal) ——————————————————————————————————————————————————
// Mudanças: opacity 0.30 (era 0.60), pointLight 0.6 (era 4.0 → -85%),
// rotation y 0.009 (era 0.005), x 0.004 (era 0.0015)
const NeuralYolk3D = () => {
  const meshRef=useRef(), linesRef=useRef(), instRef=useRef(), pulsesRef=useRef([]), litRef=useRef({}), startedRef=useRef(false), tmpMat=useRef(new THREE.Matrix4()), tmpVec=useRef(new THREE.Vector3());
  const tkhGeo = useMemo(() => buildTKHGeo(YOLK_RADIUS), []);
  const linesGeo = useMemo(() => {
    const pts=[],cols=[];
    TKH_EDGES.forEach(([a,b])=>{pts.push(TKH_NODES[a].clone().multiplyScalar(YOLK_RADIUS));pts.push(TKH_NODES[b].clone().multiplyScalar(YOLK_RADIUS));cols.push(1.0,0.82,0.0,1.0,0.82,0.0);});
    const geo=new THREE.BufferGeometry().setFromPoints(pts);geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(cols),3));return geo;
  }, []);
  const spawnPulse = (fromNode=null, fromEdge=null, depth=0) => {
    if (pulsesRef.current.length>=NP_MAX) return;
    let edgeIdx;
    if (fromNode!==null) { const cands=TKH_EDGES.map((_,i)=>i).filter(i=>i!==fromEdge&&TKH_EDGES[i].includes(fromNode)); if (!cands.length) return; edgeIdx=cands[Math.floor(Math.random()*cands.length)]; }
    else { edgeIdx=Math.floor(Math.random()*TKH_EDGES.length); }
    const [a,b]=TKH_EDGES[edgeIdx]; const dir=fromNode===b?-1:(fromNode===a?1:(Math.random()>0.5?1:-1));
    pulsesRef.current.push({edgeIdx,t:dir>0?0:1,dir,depth}); litRef.current[edgeIdx]=performance.now();
  };
  useFrame(() => {
    const now=performance.now();
    if (!startedRef.current) { startedRef.current=true; for(let i=0;i<NP_SEED;i++) spawnPulse(); }
    if (meshRef.current) { meshRef.current.rotation.y+=0.009; meshRef.current.rotation.x+=0.004; }
    if (Math.random()<NP_SPAWN_RATE) spawnPulse();
    const remove=[];
    pulsesRef.current.forEach((p,pi)=>{p.t+=p.dir*NP_SPEED;if(p.dir>0?p.t>=1:p.t<=0){const arr=p.dir>0?TKH_EDGES[p.edgeIdx][1]:TKH_EDGES[p.edgeIdx][0];if(p.depth<4&&Math.random()<NP_CHAIN_PROB)spawnPulse(arr,p.edgeIdx,p.depth+1);remove.push(pi);}});
    remove.reverse().forEach(i=>pulsesRef.current.splice(i,1));
    if (instRef.current) { for(let i=0;i<NP_MAX;i++){const p=pulsesRef.current[i];if(p){const[a,b]=TKH_EDGES[p.edgeIdx];tmpVec.current.lerpVectors(TKH_NODES[a],TKH_NODES[b],p.t).multiplyScalar(YOLK_RADIUS);tmpMat.current.makeTranslation(tmpVec.current.x,tmpVec.current.y,tmpVec.current.z);}else{tmpMat.current.makeScale(0,0,0);}instRef.current.setMatrixAt(i,tmpMat.current);}instRef.current.instanceMatrix.needsUpdate=true; }
    if (linesRef.current) { const col=linesRef.current.geometry.attributes.color;TKH_EDGES.forEach((_,i)=>{const age=now-(litRef.current[i]||0);const bright=0.15+0.85*Math.max(0,1-age/1400);col.setXYZ(i*2,bright*1.0,bright*0.84,0);col.setXYZ(i*2+1,bright*1.0,bright*0.84,0);});col.needsUpdate=true; }
  });
  return (
    <group position={[0, YOLK_Y_LOCAL, 0]}>
      <mesh ref={meshRef} geometry={tkhGeo}>
        <meshPhysicalMaterial color="#ffcc00" metalness={0.30} roughness={0.08} transparent opacity={0.30} flatShading side={THREE.DoubleSide} emissive="#442200" emissiveIntensity={0.55} envMapIntensity={1.4} />
      </mesh>
      <lineSegments ref={linesRef} geometry={linesGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.85} linewidth={1.5} />
      </lineSegments>
      <instancedMesh ref={instRef} args={[undefined, undefined, NP_MAX]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
      {/* Luz interior: -85% (4.0 → 0.60) */}
      <pointLight color="#ffaa00" intensity={0.60} distance={1.4} />
    </group>
  );
};


// ——— DARK YOLK ————————————————————————————————————————————————————————————————
// Mudanças: YOLK_R_DARK / YOLK_Y_DARK (50% maior, fundo fixo)
// Rotação 2× mais rápida: x ±0.028, y ±0.024, z ±0.016 (era ±0.014/±0.012/±0.008)
const DarkYolk = () => {
  const meshRef=useRef(), matRef=useRef();
  const uniforms=useMemo(()=>({uTime:{value:0}}),[]);
  const rotSpeed=useMemo(()=>({
    x:(Math.random()-0.5)*0.028,
    y:(Math.random()-0.5)*0.024,
    z:(Math.random()-0.5)*0.016,
  }),[]);
  useFrame(({clock})=>{
    if(matRef.current) matRef.current.uniforms.uTime.value=clock.getElapsedTime();
    if(meshRef.current){meshRef.current.rotation.x+=rotSpeed.x;meshRef.current.rotation.y+=rotSpeed.y;meshRef.current.rotation.z+=rotSpeed.z;}
  });
  return (
    <group position={[0, YOLK_Y_DARK, 0]} scale={[1, 1/EGG_SCALE_Y, 1]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[YOLK_R_DARK, 48, 48]} />
        <shaderMaterial ref={matRef} vertexShader={DARK_VERT} fragmentShader={DARK_FRAG} uniforms={uniforms} />
      </mesh>
      <pointLight color="#ff2200" intensity={3.0} distance={1.0} />
    </group>
  );
};


// ——— UNO YOLK ————————————————————————————————————————————————————————————————
// Mudança: intensidade da pointLight pulsa aleatoriamente via useFrame
const UnoYolk = () => {
  const meshRef  = useRef();
  const lightRef = useRef();
  const phase    = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003;
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      // Duas frequências sobrepostas para variação orgânica
      const pulse = 2.8
        + Math.sin(t * 0.9  + phase)        * 1.4
        + Math.sin(t * 2.7  + phase * 1.3)  * 0.6
        + Math.sin(t * 5.1  + phase * 0.7)  * 0.25;
      lightRef.current.intensity = Math.max(0.5, pulse);
    }
  });
  return (
    <group position={[0, YOLK_Y_LOCAL, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[YOLK_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight ref={lightRef} color="#ffffff" intensity={4} distance={1.5} />
    </group>
  );
};


// ——— ALIEN EGG SCENE ——————————————————————————————————————————————————————————
// Mudança: isUno não renderiza FluidMesh
const AlienEgg = () => {
  const { isDark, isUno } = useTheme();
  const shellRef = useRef();
  useFrame(({ clock }) => { if (shellRef.current) shellRef.current.rotation.y = clock.getElapsedTime() * 0.05; });
  const groupScaleY = isDark ? EGG_SCALE_Y : 1;
  const groupScale  = [MASTER_SCALE, MASTER_SCALE * groupScaleY, MASTER_SCALE];
  const rimColor    = isDark ? BACKLIGHT_DARK : BACKLIGHT_NORMAL;
  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight position={[1.5, 2, 3]} intensity={1.6} color="#ffffff" />
      <spotLight position={[3.5, 0.5, 0.8]} angle={0.38} penumbra={0.65} intensity={BACKLIGHT_INT} color={rimColor} distance={14} />
      <pointLight position={[2.5, 0.2, -2.5]} intensity={7} color={rimColor} distance={9} />
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
        <group scale={groupScale}>
          <mesh ref={shellRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshTransmissionMaterial
              backside samples={12} thickness={0.28}
              chromaticAberration={isDark ? 0.07 : 0.04} anisotropy={0.05}
              distortion={0.08} distortionScale={0.10}
              color={isDark ? "#fff0f0" : isUno ? "#f5f0ff" : "#ffffff"}
              transmission={isDark ? 0.96 : 0.97}
              roughness={isDark ? 0.55 : 0.35}
              metalness={0.0} ior={1.38}
              attenuationColor={isDark ? "#ffdddd" : "#fffce8"}
              attenuationDistance={0.9} transparent
            />
          </mesh>

          {/* Fluido: apenas em normal e dark — Uno usa só a gema de luz */}
          {!isUno && <FluidMesh />}

          {!isDark && !isUno && <NeuralYolk3D />}
          {isDark             && <DarkYolk />}
          {isUno              && <UnoYolk />}
        </group>
      </Float>
      <Environment preset="night" environmentIntensity={ENV_INTENSITY} />
    </>
  );
};

const AlienEggContainer = () => (
  <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
    <Canvas shadows gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}>
      <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={35} />
      <AlienEgg />
      <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={10} blur={3} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  </div>
);


// ——— SERVICES ——————————————————————————————————————————————————————————————————
const items = [
  { id: 2, title: "Manisfesto",     description: "A criação do pensamento  para o futuro" },
  { id: 1, title: "Bio-Interface", description: "Organic Gestation Systems" },
  { id: 3, title: "Thinktank lαβ", description: "Dissociative Original Ideas" },
];

const Services = () => {
  const { isDark, isUno } = useTheme();
  const [activeItemId, setActiveItemId] = useState(2);
  const [hoveredId, setHoveredId]       = useState(null);  // hover simples sem motion
  const [showManifesto, setShowManifesto] = useState(false);

  const themeColor = useMemo(() => {
    if (isUno) return "#ff00ff";
    if (isDark) return "#ff2200";
    return "#15ed7a";
  }, [isDark, isUno]);

  const bgActive = `${themeColor}0D`;

  const handleItemClick = (id) => {
    if (id === 2 && isDark) { setShowManifesto(true); }
    else { setActiveItemId(id); }
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

      <div className="sSection left">
        <h1 className="sTitle" style={{ color: themeColor }}>Hefeistus Forge</h1>

        {/* sLeftC — motion removido. Hover e active via estado local + CSS inline */}
        <div className="sLeftC">
          {items.map(item => {
            const isActive  = activeItemId === item.id;
            const isHovered = hoveredId    === item.id;
            return (
              <div
                key={item.id}
                className="serviceItem"
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  cursor: "pointer",
                  border: (isActive || isHovered)
                    ? `1px solid ${themeColor}`
                    : "1px solid rgba(255,255,255,0.1)",
                  padding: "20px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                  background: isActive ? bgActive : "transparent",
                  transform: isHovered ? "translateX(10px)" : "translateX(0)",
                  transition: "transform 0.08s ease-out, border-color 0.08s ease-out, background 0.08s ease-out",
                }}
              >
                <h2 style={{ fontSize: "1.5rem", margin: 0, color: themeColor }}>{item.title}</h2>
                <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>{item.description}</p>
              </div>
            );
          })}
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
