import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Skeleton } from "@/components/ui/skeleton";

interface VehicleShowroom3DProps {
  vehicleStatus: string;
  soc: number;
  vehicleColor: string;
}

const statusColors: Record<string, string> = {
  ready: "#22c55e",
  charging: "#3b82f6",
  at_depot: "#3b82f6",
  at_home: "#22c55e",
  in_service: "#f59e0b",
  en_route_depot: "#3b82f6",
};

/* ══════════════════════════════════════════════
   Procedural 2024 Tesla Model 3 Long Range
   Built with THREE.Shape + ExtrudeGeometry
   for smooth, organic body panels
   ══════════════════════════════════════════════ */

function TeslaModel3({ paintColor }: { paintColor: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.05 + Math.sin(clock.elapsedTime * 0.5) * 0.025;
    }
  });

  // ── Materials ──
  const paintMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(paintColor),
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5,
        reflectivity: 1.0,
      }),
    [paintColor]
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0a0a1a",
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.65,
        transparent: true,
        opacity: 0.75,
        ior: 1.52,
        thickness: 0.3,
        envMapIntensity: 1.0,
      }),
    []
  );

  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a0a0a",
        metalness: 0.85,
        roughness: 0.2,
      }),
    []
  );

  const chromeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d4d4d8",
        metalness: 0.98,
        roughness: 0.05,
      }),
    []
  );

  const tireMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        metalness: 0.0,
        roughness: 0.92,
      }),
    []
  );

  const aeroWheelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2a2e",
        metalness: 0.7,
        roughness: 0.3,
      }),
    []
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b0b0b8",
        metalness: 0.95,
        roughness: 0.08,
      }),
    []
  );

  const headlightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#e8eeff",
        emissiveIntensity: 0.5,
        metalness: 0.2,
        roughness: 0.08,
      }),
    []
  );

  const taillightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cc0000",
        emissive: "#cc0000",
        emissiveIntensity: 0.6,
        metalness: 0.3,
        roughness: 0.15,
      }),
    []
  );

  const underbodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#111111",
        metalness: 0.1,
        roughness: 0.95,
      }),
    []
  );

  // ── Body shape (side-profile silhouette extruded to width) ──
  const bodyGeom = useMemo(() => {
    const shape = new THREE.Shape();
    // Model 3 side-profile: low nose, steeply raked windshield, fastback roofline
    // All coords in local space, will be scaled
    // Start at front bottom
    shape.moveTo(-1.8, 0.0);
    // Front underbody to front bumper
    shape.lineTo(1.8, 0.0);
    // Front bumper rise
    shape.quadraticCurveTo(1.9, 0.0, 1.9, 0.15);
    // Front face up to hood line
    shape.quadraticCurveTo(1.9, 0.35, 1.85, 0.38);
    // Hood - very flat, slight downward slope (Tesla frunk)
    shape.lineTo(1.0, 0.42);
    // Windshield base
    shape.lineTo(0.7, 0.44);
    // Steeply raked windshield (Model 3 signature)
    shape.quadraticCurveTo(0.45, 0.75, 0.3, 0.88);
    // Roof peak - gentle arc
    shape.quadraticCurveTo(0.0, 0.95, -0.4, 0.92);
    // Rear window slope (fastback)
    shape.quadraticCurveTo(-0.7, 0.85, -1.05, 0.65);
    // Trunk deck
    shape.quadraticCurveTo(-1.2, 0.58, -1.4, 0.52);
    // Rear deck edge
    shape.lineTo(-1.65, 0.48);
    // Rear face
    shape.quadraticCurveTo(-1.85, 0.45, -1.88, 0.35);
    // Rear bumper
    shape.quadraticCurveTo(-1.9, 0.15, -1.88, 0.0);
    shape.lineTo(-1.8, 0.0);

    const extrudeSettings = {
      steps: 1,
      depth: 0.82, // half-width, we mirror
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 4,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  // ── Roof/greenhouse glass shape ──
  const roofGlassGeom = useMemo(() => {
    const shape = new THREE.Shape();
    // Panoramic glass roof silhouette
    shape.moveTo(0.65, 0.46);
    // Windshield
    shape.quadraticCurveTo(0.4, 0.77, 0.25, 0.90);
    // Roof glass
    shape.quadraticCurveTo(-0.05, 0.97, -0.45, 0.94);
    // Rear glass
    shape.quadraticCurveTo(-0.75, 0.87, -1.05, 0.67);
    // Bottom of glass back to front
    shape.lineTo(-0.95, 0.62);
    shape.quadraticCurveTo(-0.65, 0.78, -0.35, 0.84);
    shape.quadraticCurveTo(0.0, 0.86, 0.2, 0.80);
    shape.quadraticCurveTo(0.4, 0.68, 0.6, 0.48);
    shape.lineTo(0.65, 0.46);

    const extrudeSettings = {
      steps: 1,
      depth: 0.76,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  // ── Aero Wheel ──
  const AeroWheel = ({ position, side }: { position: [number, number, number]; side: "left" | "right" }) => {
    const wheelRotation: [number, number, number] = side === "right" 
      ? [0, 0, Math.PI / 2] 
      : [0, 0, -Math.PI / 2];

    return (
      <group position={position}>
        {/* Tire - proper 245/45R18 proportions */}
        <mesh material={tireMat} rotation={wheelRotation}>
          <torusGeometry args={[0.25, 0.09, 16, 32]} />
        </mesh>
        {/* Aero cover (flat disc) */}
        <mesh material={aeroWheelMat} rotation={wheelRotation}>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 32]} />
        </mesh>
        {/* Rim edge highlight */}
        <mesh material={rimMat} rotation={wheelRotation}>
          <torusGeometry args={[0.22, 0.012, 8, 32]} />
        </mesh>
        {/* Aero cover turbine detail - 5 segments */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            material={chromeMat}
            rotation={[
              wheelRotation[0],
              wheelRotation[1],
              wheelRotation[2] + (i * Math.PI * 2) / 5,
            ]}
          >
            <boxGeometry args={[0.018, 0.38, 0.025]} />
          </mesh>
        ))}
        {/* Center cap */}
        <mesh
          material={trimMat}
          rotation={wheelRotation}
          position={side === "right" ? [0.04, 0, 0] : [-0.04, 0, 0]}
        >
          <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        </mesh>
      </group>
    );
  };

  // ── Side Mirror ──
  const SideMirror = ({ position, side }: { position: [number, number, number]; side: "left" | "right" }) => {
    const mirrorAngle = side === "right" ? 0.15 : -0.15;
    return (
      <group position={position}>
        {/* Stalk */}
        <mesh material={trimMat}>
          <boxGeometry args={[side === "right" ? 0.12 : 0.12, 0.025, 0.03]} />
        </mesh>
        {/* Mirror housing */}
        <mesh
          material={paintMat}
          position={[side === "right" ? 0.08 : -0.08, 0, 0]}
          rotation={[0, mirrorAngle, 0]}
        >
          <boxGeometry args={[0.06, 0.05, 0.09]} />
        </mesh>
      </group>
    );
  };

  return (
    <group ref={groupRef} position={[0, -0.05, 0]} scale={[1.0, 1.0, 1.0]}>
      {/* ── Main body (extruded silhouette) ── */}
      <mesh geometry={bodyGeom} material={paintMat} castShadow />

      {/* ── Glass greenhouse (slightly offset up and in) ── */}
      <mesh
        geometry={roofGlassGeom}
        material={glassMat}
        position={[0, 0.02, 0]}
        scale={[1.0, 1.0, 0.97]}
      />

      {/* ── Front fascia (no-grille Tesla look) ── */}
      {/* Smooth nose cap */}
      <mesh material={paintMat} position={[0, 0.22, 1.85]} castShadow>
        <sphereGeometry args={[0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* ── Headlights (narrow, wrap-around LED) ── */}
      <mesh material={headlightMat} position={[0.38, 0.38, 1.82]}>
        <boxGeometry args={[0.42, 0.045, 0.06]} />
      </mesh>
      <mesh material={headlightMat} position={[-0.38, 0.38, 1.82]}>
        <boxGeometry args={[0.42, 0.045, 0.06]} />
      </mesh>
      {/* Headlight wrap-around corners */}
      <mesh material={headlightMat} position={[0.62, 0.38, 1.75]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
      </mesh>
      <mesh material={headlightMat} position={[-0.62, 0.38, 1.75]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
      </mesh>

      {/* ── DRL light bar (subtle) ── */}
      <mesh material={headlightMat} position={[0, 0.36, 1.84]}>
        <boxGeometry args={[0.5, 0.015, 0.03]} />
      </mesh>

      {/* ── Full-width rear taillight bar (Model 3 signature) ── */}
      <mesh material={taillightMat} position={[0, 0.42, -1.82]}>
        <boxGeometry args={[1.2, 0.04, 0.05]} />
      </mesh>
      {/* Taillight ends (thicker) */}
      <mesh material={taillightMat} position={[0.55, 0.42, -1.82]}>
        <boxGeometry args={[0.2, 0.07, 0.06]} />
      </mesh>
      <mesh material={taillightMat} position={[-0.55, 0.42, -1.82]}>
        <boxGeometry args={[0.2, 0.07, 0.06]} />
      </mesh>

      {/* ── Front bumper / lower intake ── */}
      <mesh material={trimMat} position={[0, 0.08, 1.86]}>
        <boxGeometry args={[1.1, 0.14, 0.06]} />
      </mesh>
      {/* Lower bumper side vents */}
      <mesh material={trimMat} position={[0.5, 0.08, 1.84]}>
        <boxGeometry args={[0.18, 0.1, 0.04]} />
      </mesh>
      <mesh material={trimMat} position={[-0.5, 0.08, 1.84]}>
        <boxGeometry args={[0.18, 0.1, 0.04]} />
      </mesh>

      {/* ── Rear bumper / diffuser ── */}
      <mesh material={trimMat} position={[0, 0.08, -1.86]}>
        <boxGeometry args={[1.1, 0.14, 0.06]} />
      </mesh>

      {/* ── Side skirts (subtle) ── */}
      <mesh material={trimMat} position={[0.42, 0.03, 0]}>
        <boxGeometry args={[0.02, 0.05, 3.2]} />
      </mesh>
      <mesh material={trimMat} position={[-0.42, 0.03, 0]}>
        <boxGeometry args={[0.02, 0.05, 3.2]} />
      </mesh>

      {/* ── Flush door handles (Model 3 style) ── */}
      {/* Driver side */}
      <mesh material={chromeMat} position={[0.44, 0.48, 0.5]}>
        <boxGeometry args={[0.008, 0.02, 0.14]} />
      </mesh>
      <mesh material={chromeMat} position={[0.44, 0.48, -0.25]}>
        <boxGeometry args={[0.008, 0.02, 0.14]} />
      </mesh>
      {/* Passenger side */}
      <mesh material={chromeMat} position={[-0.44, 0.48, 0.5]}>
        <boxGeometry args={[0.008, 0.02, 0.14]} />
      </mesh>
      <mesh material={chromeMat} position={[-0.44, 0.48, -0.25]}>
        <boxGeometry args={[0.008, 0.02, 0.14]} />
      </mesh>

      {/* ── Side mirrors ── */}
      <SideMirror position={[0.45, 0.58, 0.65]} side="right" />
      <SideMirror position={[-0.45, 0.58, 0.65]} side="left" />

      {/* ── Charging port (left rear quarter) ── */}
      <mesh material={trimMat} position={[-0.44, 0.42, -1.1]}>
        <boxGeometry args={[0.01, 0.06, 0.08]} />
      </mesh>

      {/* ── Underbody aero pan ── */}
      <mesh material={underbodyMat} position={[0, -0.02, 0]}>
        <boxGeometry args={[0.78, 0.02, 3.5]} />
      </mesh>

      {/* ── Wheels (Model 3 18" Aero) ── */}
      <AeroWheel position={[0.44, 0.0, 1.15]} side="right" />
      <AeroWheel position={[-0.44, 0.0, 1.15]} side="left" />
      <AeroWheel position={[0.44, 0.0, -1.1]} side="right" />
      <AeroWheel position={[-0.44, 0.0, -1.1]} side="left" />

      {/* ── Wheel arch surrounds ── */}
      {[
        [0.44, 0.15, 1.15],
        [-0.44, 0.15, 1.15],
        [0.44, 0.15, -1.1],
        [-0.44, 0.15, -1.1],
      ].map((pos, i) => (
        <mesh key={`arch-${i}`} material={trimMat} position={pos as [number, number, number]}>
          <torusGeometry args={[0.28, 0.02, 8, 16, Math.PI]} />
        </mesh>
      ))}

      {/* ── Tesla "T" badge hint (front) ── */}
      <mesh material={chromeMat} position={[0, 0.36, 1.87]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
      </mesh>

      {/* ── Tesla "TESLA" badge hint (rear) ── */}
      <mesh material={chromeMat} position={[0, 0.48, -1.84]}>
        <boxGeometry args={[0.2, 0.02, 0.01]} />
      </mesh>
    </group>
  );
}

/* ── Reflective showroom floor ── */
function ShowroomFloor({ accentColor }: { accentColor: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial
          color="#08080e"
          metalness={0.97}
          roughness={0.06}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.54, 0]}>
        <ringGeometry args={[3.5, 3.6, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

/* ── Volumetric fog ── */
function VolumetricFog({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.05 + Math.sin(clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, -1.5]} scale={[5, 3, 3]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.06}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Ambient particles ── */
function AmbientParticles({ count, speed, color }: { count: number; speed: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = Math.random() * 3.5 - 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speed * 0.25;
      if (arr[i * 3 + 1] > 3) arr[i * 3 + 1] = -0.5;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

/* ── Cinematic lighting rig ── */
function CinematicLightRig({ status }: { status: string }) {
  const keyLightRef = useRef<THREE.SpotLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);
  const fillLightRef = useRef<THREE.SpotLight>(null);
  const color = statusColors[status] || "#3b82f6";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (keyLightRef.current) keyLightRef.current.intensity = 2.2 + Math.sin(t * 0.4) * 0.2;
    if (rimLightRef.current) rimLightRef.current.intensity = 1.5 + Math.cos(t * 0.6) * 0.15;
    if (fillLightRef.current) fillLightRef.current.intensity = 0.7 + Math.sin(t * 0.5 + 1) * 0.1;
  });

  return (
    <>
      <spotLight ref={keyLightRef} position={[4, 5, 3]} angle={0.4} penumbra={0.8} color="#ffffff" intensity={2.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight ref={rimLightRef} position={[-3, 4, -3]} angle={0.5} penumbra={0.9} color={color} intensity={1.5} />
      <spotLight ref={fillLightRef} position={[-4, 2, 2]} angle={0.6} penumbra={1} color="#e0e0ff" intensity={0.7} />
      <spotLight position={[0, 6, -2]} angle={0.35} penumbra={1} color={color} intensity={0.4} />
      <spotLight position={[2, 1, -4]} angle={0.5} penumbra={0.9} color="#ffffff" intensity={0.5} />
      <ambientLight intensity={0.12} color="#e8e8ff" />
    </>
  );
}

/* ── Fallback ── */
function ShowroomFallback() {
  return (
    <div className="w-full h-72 md:h-96 flex items-center justify-center">
      <Skeleton className="w-[320px] md:w-[420px] h-40 rounded-xl" />
    </div>
  );
}

/* ── Main export ── */
export const VehicleShowroom3D: React.FC<VehicleShowroom3DProps> = ({
  vehicleStatus,
  soc,
  vehicleColor,
}) => {
  const particleCount = Math.max(20, Math.round(soc * 50));
  const particleSpeed = 0.3 + soc * 0.6;
  const accentColor = statusColors[vehicleStatus] || "#3b82f6";

  return (
    <div className="w-full h-72 md:h-96 relative">
      <Suspense fallback={<ShowroomFallback />}>
        <Canvas
          camera={{ position: [3.2, 1.8, 5.5], fov: 32 }}
          style={{ background: "transparent" }}
          gl={{
            alpha: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3,
          }}
          dpr={[1, 2]}
          shadows
        >
          <CinematicLightRig status={vehicleStatus} />
          <TeslaModel3 paintColor={vehicleColor} />
          <ShowroomFloor accentColor={accentColor} />
          <VolumetricFog color={accentColor} />
          <AmbientParticles count={particleCount} speed={particleSpeed} color={accentColor} />
          <Environment preset="studio" environmentIntensity={0.5} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.35}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3.5}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};
