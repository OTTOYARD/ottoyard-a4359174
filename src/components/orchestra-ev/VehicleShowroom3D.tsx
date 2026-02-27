import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Skeleton } from "@/components/ui/skeleton";

interface VehicleShowroom3DProps {
  vehicleStatus: string;
  soc: number;
  imageUrl?: string;
}

const statusColors: Record<string, string> = {
  ready: "#22c55e",
  charging: "#3b82f6",
  at_depot: "#3b82f6",
  at_home: "#22c55e",
  in_service: "#f59e0b",
  en_route_depot: "#3b82f6",
};

/* ── Vehicle textured billboard ── */
function VehicleCard3D({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.2 + Math.sin(clock.elapsedTime * 0.6) * 0.03;
    }
  });

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;

  const aspect = texture.image ? texture.image.width / texture.image.height : 2.2;
  const planeWidth = 3.6;
  const planeHeight = planeWidth / aspect;

  return (
    <mesh ref={meshRef} position={[0, 0.2, 0]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.02}
        side={THREE.DoubleSide}
        envMapIntensity={0.4}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

/* ── Reflective floor with grid ── */
function ShowroomFloor({ accentColor }: { accentColor: string }) {
  return (
    <group>
      {/* Main reflective floor */}
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
      {/* Accent ring on floor */}
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
      {/* Key light - main illumination */}
      <spotLight
        ref={keyLightRef}
        position={[4, 5, 3]}
        angle={0.45}
        penumbra={0.8}
        color="#ffffff"
        intensity={2.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Rim light - status-colored backlight for depth */}
      <spotLight
        ref={rimLightRef}
        position={[-3, 4, -3]}
        angle={0.5}
        penumbra={0.9}
        color={color}
        intensity={1.8}
      />
      {/* Fill light - soft fill from opposite side */}
      <spotLight
        ref={fillLightRef}
        position={[-4, 2, 2]}
        angle={0.6}
        penumbra={1}
        color="#e0e0ff"
        intensity={0.8}
      />
      {/* Top accent */}
      <spotLight
        position={[0, 6, -2]}
        angle={0.35}
        penumbra={1}
        color={color}
        intensity={0.5}
      />
      {/* Subtle ambient */}
      <ambientLight intensity={0.15} color="#e8e8ff" />
    </>
  );
}

/* ── Fallback ── */
function ShowroomFallback() {
  return (
    <div className="w-full h-56 md:h-72 flex items-center justify-center">
      <Skeleton className="w-[300px] md:w-[380px] h-32 rounded-xl" />
    </div>
  );
}

/* ── Main export ── */
export const VehicleShowroom3D: React.FC<VehicleShowroom3DProps> = ({
  vehicleStatus,
  soc,
  imageUrl = "/tesla-model-3.png",
}) => {
  const particleCount = Math.max(20, Math.round(soc * 60));
  const particleSpeed = 0.3 + soc * 0.8;
  const accentColor = statusColors[vehicleStatus] || "#3b82f6";

  return (
    <div className="w-full h-56 md:h-72 relative">
      <Suspense fallback={<ShowroomFallback />}>
        <Canvas
          camera={{ position: [0, 1.4, 4.5], fov: 38 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          dpr={[1, 2]}
          shadows
        >
          <CinematicLightRig status={vehicleStatus} />
          <VehicleCard3D imageUrl={imageUrl} />
          <ShowroomFloor accentColor={accentColor} />
          <VolumetricFog color={accentColor} />
          <AmbientParticles count={particleCount} speed={particleSpeed} color={accentColor} />
          <Environment preset="city" environmentIntensity={0.15} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.25}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};
