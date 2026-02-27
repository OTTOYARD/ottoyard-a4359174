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

/* ── Procedural 3D Sedan ── */
function ProceduralSedan({ paintColor }: { paintColor: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.15 + Math.sin(clock.elapsedTime * 0.6) * 0.03;
    }
  });

  const paintMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(paintColor),
        metalness: 0.85,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.2,
        reflectivity: 1.0,
      }),
    [paintColor]
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1a1a2e",
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.6,
        transparent: true,
        opacity: 0.7,
        ior: 1.5,
        thickness: 0.1,
      }),
    []
  );

  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#111111",
        metalness: 0.95,
        roughness: 0.15,
      }),
    []
  );

  const tireMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        metalness: 0.0,
        roughness: 0.9,
      }),
    []
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c0c0c0",
        metalness: 0.95,
        roughness: 0.1,
      }),
    []
  );

  const headlightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#ffffff",
        emissiveIntensity: 0.4,
        metalness: 0.3,
        roughness: 0.1,
      }),
    []
  );

  const taillightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cc0000",
        emissive: "#cc0000",
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.2,
      }),
    []
  );

  // Wheel component
  const Wheel = ({ position }: { position: [number, number, number] }) => (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Tire */}
      <mesh material={tireMat}>
        <torusGeometry args={[0.22, 0.1, 12, 24]} />
      </mesh>
      {/* Rim */}
      <mesh material={rimMat}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
      </mesh>
      {/* Hub */}
      <mesh material={trimMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.14, 12]} />
      </mesh>
      {/* Rim spokes */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          material={rimMat}
          rotation={[0, 0, (i * Math.PI * 2) / 5]}
          position={[0, 0, 0]}
        >
          <boxGeometry args={[0.03, 0.32, 0.04]} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group ref={groupRef} position={[0, -0.15, 0]} scale={[1.1, 1.1, 1.1]}>
      {/* ── Main body ── */}
      {/* Lower body - wider base */}
      <mesh material={paintMat} position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.6, 0.42, 3.4]} />
      </mesh>

      {/* Front hood slope */}
      <mesh material={paintMat} position={[0, 0.4, 1.25]} rotation={[0.15, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.9]} />
      </mesh>

      {/* Rear trunk slope */}
      <mesh material={paintMat} position={[0, 0.4, -1.25]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.8]} />
      </mesh>

      {/* ── Cabin/greenhouse ── */}
      {/* Cabin main */}
      <mesh material={paintMat} position={[0, 0.7, -0.1]} castShadow>
        <boxGeometry args={[1.38, 0.42, 1.6]} />
      </mesh>

      {/* Windshield */}
      <mesh material={glassMat} position={[0, 0.72, 0.72]} rotation={[-0.45, 0, 0]}>
        <boxGeometry args={[1.3, 0.02, 0.7]} />
      </mesh>

      {/* Rear window */}
      <mesh material={glassMat} position={[0, 0.72, -0.85]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[1.3, 0.02, 0.6]} />
      </mesh>

      {/* Side windows left */}
      <mesh material={glassMat} position={[0.7, 0.72, -0.1]}>
        <boxGeometry args={[0.02, 0.32, 1.4]} />
      </mesh>

      {/* Side windows right */}
      <mesh material={glassMat} position={[-0.7, 0.72, -0.1]}>
        <boxGeometry args={[0.02, 0.32, 1.4]} />
      </mesh>

      {/* ── Roof ── */}
      <mesh material={paintMat} position={[0, 0.92, -0.1]} castShadow>
        <boxGeometry args={[1.36, 0.04, 1.5]} />
      </mesh>

      {/* ── Trim details ── */}
      {/* Front bumper */}
      <mesh material={trimMat} position={[0, 0.15, 1.72]}>
        <boxGeometry args={[1.5, 0.2, 0.08]} />
      </mesh>

      {/* Rear bumper */}
      <mesh material={trimMat} position={[0, 0.15, -1.72]}>
        <boxGeometry args={[1.5, 0.2, 0.08]} />
      </mesh>

      {/* Front grille / intake */}
      <mesh material={trimMat} position={[0, 0.3, 1.72]}>
        <boxGeometry args={[1.2, 0.12, 0.06]} />
      </mesh>

      {/* Side skirts */}
      <mesh material={trimMat} position={[0.82, 0.1, 0]}>
        <boxGeometry args={[0.04, 0.08, 3.2]} />
      </mesh>
      <mesh material={trimMat} position={[-0.82, 0.1, 0]}>
        <boxGeometry args={[0.04, 0.08, 3.2]} />
      </mesh>

      {/* Window trim - A pillar hints */}
      <mesh material={trimMat} position={[0.69, 0.72, 0.55]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[0.03, 0.4, 0.04]} />
      </mesh>
      <mesh material={trimMat} position={[-0.69, 0.72, 0.55]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[0.03, 0.4, 0.04]} />
      </mesh>

      {/* ── Lights ── */}
      {/* Headlights */}
      <mesh material={headlightMat} position={[0.55, 0.38, 1.72]}>
        <boxGeometry args={[0.35, 0.1, 0.06]} />
      </mesh>
      <mesh material={headlightMat} position={[-0.55, 0.38, 1.72]}>
        <boxGeometry args={[0.35, 0.1, 0.06]} />
      </mesh>

      {/* Taillights */}
      <mesh material={taillightMat} position={[0.6, 0.38, -1.72]}>
        <boxGeometry args={[0.3, 0.08, 0.06]} />
      </mesh>
      <mesh material={taillightMat} position={[-0.6, 0.38, -1.72]}>
        <boxGeometry args={[0.3, 0.08, 0.06]} />
      </mesh>

      {/* Rear light bar (Tesla-style) */}
      <mesh material={taillightMat} position={[0, 0.38, -1.73]}>
        <boxGeometry args={[0.9, 0.03, 0.04]} />
      </mesh>

      {/* ── Wheels ── */}
      <Wheel position={[0.78, 0.0, 1.05]} />
      <Wheel position={[-0.78, 0.0, 1.05]} />
      <Wheel position={[0.78, 0.0, -1.05]} />
      <Wheel position={[-0.78, 0.0, -1.05]} />

      {/* ── Wheel arches ── */}
      {[
        [0.78, 0.22, 1.05],
        [-0.78, 0.22, 1.05],
        [0.78, 0.22, -1.05],
        [-0.78, 0.22, -1.05],
      ].map((pos, i) => (
        <mesh key={i} material={trimMat} position={pos as [number, number, number]}>
          <boxGeometry args={[0.12, 0.38, 0.52]} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Reflective floor with grid ── */
function ShowroomFloor({ accentColor }: { accentColor: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial
          color="#0a0a12"
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.69, 0]}>
        <ringGeometry args={[3.5, 3.6, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

/* ── Volumetric fog sphere ── */
function VolumetricFog({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, -1.5]} scale={[5, 3, 3]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.08}
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
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
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
    if (keyLightRef.current) {
      keyLightRef.current.intensity = 2.0 + Math.sin(t * 0.4) * 0.3;
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = 1.8 + Math.cos(t * 0.6) * 0.2;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = 0.8 + Math.sin(t * 0.5 + 1) * 0.15;
    }
  });

  return (
    <>
      <spotLight ref={keyLightRef} position={[4, 5, 3]} angle={0.45} penumbra={0.8} color="#ffffff" intensity={2.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <spotLight ref={rimLightRef} position={[-3, 4, -3]} angle={0.5} penumbra={0.9} color={color} intensity={1.8} />
      <spotLight ref={fillLightRef} position={[-4, 2, 2]} angle={0.6} penumbra={1} color="#e0e0ff" intensity={0.8} />
      <spotLight position={[0, 6, -2]} angle={0.35} penumbra={1} color={color} intensity={0.5} />
      <ambientLight intensity={0.15} color="#e8e8ff" />
    </>
  );
}

/* ── Fallback ── */
function ShowroomFallback() {
  return (
    <div className="w-full h-64 md:h-80 flex items-center justify-center">
      <Skeleton className="w-[300px] md:w-[380px] h-32 rounded-xl" />
    </div>
  );
}

/* ── Main export ── */
export const VehicleShowroom3D: React.FC<VehicleShowroom3DProps> = ({
  vehicleStatus,
  soc,
  vehicleColor,
}) => {
  const particleCount = Math.max(20, Math.round(soc * 60));
  const particleSpeed = 0.3 + soc * 0.8;
  const accentColor = statusColors[vehicleStatus] || "#3b82f6";

  return (
    <div className="w-full h-64 md:h-80 relative">
      <Suspense fallback={<ShowroomFallback />}>
        <Canvas
          camera={{ position: [3.5, 2.0, 5.0], fov: 35 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          dpr={[1, 2]}
          shadows
        >
          <CinematicLightRig status={vehicleStatus} />
          <ProceduralSedan paintColor={vehicleColor} />
          <ShowroomFloor accentColor={accentColor} />
          <VolumetricFog color={accentColor} />
          <AmbientParticles count={particleCount} speed={particleSpeed} color={accentColor} />
          <Environment preset="studio" environmentIntensity={0.3} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.4}
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
