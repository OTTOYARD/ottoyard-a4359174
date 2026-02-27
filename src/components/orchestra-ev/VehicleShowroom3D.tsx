import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { Skeleton } from "@/components/ui/skeleton";

interface VehicleShowroom3DProps {
  vehicleStatus: string;
  soc: number; // 0..1
}

/* ── status → spotlight color mapping ── */
const statusColors: Record<string, string> = {
  ready: "#22c55e",
  charging: "#3b82f6",
  at_depot: "#3b82f6",
  at_home: "#22c55e",
  in_service: "#f59e0b",
  en_route_depot: "#3b82f6",
};

/* ── Vehicle textured plane ── */
function VehicleCard3D() {
  const texture = useLoader(THREE.TextureLoader, "/tesla-model-3.png");
  const meshRef = useRef<THREE.Mesh>(null);

  // slight hover animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.15 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    }
  });

  // Compute aspect ratio from texture
  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : 2.5;
  const planeWidth = 3.2;
  const planeHeight = planeWidth / aspect;

  return (
    <mesh ref={meshRef} position={[0, 0.15, 0]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── Reflective floor ── */
function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial
        color="#111118"
        metalness={0.9}
        roughness={0.15}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

/* ── Ambient particles ── */
function AmbientParticles({ count, speed }: { count: number; speed: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 1] = Math.random() * 3 - 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return arr;
  }, [count]);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speed * 0.3;
      if (arr[i * 3 + 1] > 2.5) arr[i * 3 + 1] = -0.5;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#a78bfa"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

/* ── Status-reactive spotlights ── */
function SpotlightRig({ status }: { status: string }) {
  const light1Ref = useRef<THREE.SpotLight>(null);
  const light2Ref = useRef<THREE.SpotLight>(null);
  const color = statusColors[status] || "#3b82f6";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (light1Ref.current) {
      light1Ref.current.intensity = 1.5 + Math.sin(t * 0.5) * 0.3;
    }
    if (light2Ref.current) {
      light2Ref.current.intensity = 1.0 + Math.cos(t * 0.7) * 0.2;
    }
  });

  return (
    <>
      <spotLight
        ref={light1Ref}
        position={[3, 4, 2]}
        angle={0.5}
        penumbra={0.8}
        color={color}
        intensity={1.5}
        castShadow
      />
      <spotLight
        ref={light2Ref}
        position={[-3, 3, -1]}
        angle={0.6}
        penumbra={0.9}
        color="#ffffff"
        intensity={1.0}
      />
      <spotLight
        position={[0, 5, -3]}
        angle={0.4}
        penumbra={1}
        color={color}
        intensity={0.6}
      />
    </>
  );
}

/* ── Fallback ── */
function ShowroomFallback() {
  return (
    <div className="w-full h-48 md:h-56 flex items-center justify-center">
      <Skeleton className="w-[280px] md:w-[340px] h-28 rounded-xl" />
    </div>
  );
}

/* ── Main export ── */
export const VehicleShowroom3D: React.FC<VehicleShowroom3DProps> = ({
  vehicleStatus,
  soc,
}) => {
  const particleCount = Math.max(15, Math.round(soc * 50));
  const particleSpeed = 0.3 + soc * 0.7;

  return (
    <div className="w-full h-48 md:h-56 relative">
      <Suspense fallback={<ShowroomFallback />}>
        <Canvas
          camera={{ position: [0, 1.2, 4], fov: 40 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.25} />
          <SpotlightRig status={vehicleStatus} />
          <VehicleCard3D />
          <ReflectiveFloor />
          <AmbientParticles count={particleCount} speed={particleSpeed} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.3}
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
