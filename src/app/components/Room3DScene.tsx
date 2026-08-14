import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { DirectionalLight } from "three";
import type { Room3DLayout, PlacedItem, MeshKind } from "@/app/lib/room3dLayout";
import type { RoomEquipmentStatus } from "@/app/lib/room3dLayout";

type Room3DSceneProps = {
  layout: Room3DLayout;
};

function statusColor(status: RoomEquipmentStatus, base: string): string {
  if (status === "BROKEN") return "#ff4d4f";
  if (status === "RETIRED") return "#bfbfbf";
  return base;
}

function Leg({
  x,
  z,
  height,
  color,
}: {
  x: number;
  z: number;
  height: number;
  color: string;
}) {
  return (
    <mesh position={[x, height / 2, z]} castShadow>
      <boxGeometry args={[0.06, height, 0.06]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function ItemMesh({ item }: { item: PlacedItem }) {
  const rotation = item.rotation ?? [0, 0, 0];
  const color = useMemo(() => {
    switch (item.kind) {
      case "table":
        return statusColor(item.status, "#8B6914");
      case "chair":
        return statusColor(item.status, "#434343");
      case "projector":
        return statusColor(item.status, "#434343");
      case "display":
        return statusColor(item.status, "#1f1f1f");
      case "audio":
        return statusColor(item.status, "#595959");
      case "vc":
        return statusColor(item.status, "#1677ff");
      default:
        return statusColor(item.status, "#13c2c2");
    }
  }, [item.kind, item.status]);

  return (
    <group position={item.position} rotation={rotation}>
      {meshForKind(item.kind, color, item.scale)}
    </group>
  );
}

function meshForKind(
  kind: MeshKind,
  color: string,
  scale?: [number, number],
) {
  switch (kind) {
    case "table": {
      const len = scale?.[0] ?? 2.4;
      const depth = scale?.[1] ?? 1.2;
      const topY = 0.74;
      const topThick = 0.06;
      const legH = topY - topThick / 2;
      const insetX = len / 2 - 0.12;
      const insetZ = depth / 2 - 0.12;
      return (
        <>
          <mesh position={[0, topY, 0]} castShadow receiveShadow>
            <boxGeometry args={[len, topThick, depth]} />
            <meshStandardMaterial color={color} roughness={0.45} metalness={0.05} />
          </mesh>
          <Leg x={-insetX} z={-insetZ} height={legH} color="#5c4010" />
          <Leg x={insetX} z={-insetZ} height={legH} color="#5c4010" />
          <Leg x={-insetX} z={insetZ} height={legH} color="#5c4010" />
          <Leg x={insetX} z={insetZ} height={legH} color="#5c4010" />
        </>
      );
    }
    case "chair": {
      const seatY = 0.42;
      const seatThick = 0.05;
      const backH = 0.38;
      const legH = seatY - seatThick / 2;
      return (
        <>
          <mesh position={[0, seatY, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, seatThick, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>
          <mesh position={[0, seatY + backH / 2, -0.17]} castShadow>
            <boxGeometry args={[0.42, backH, 0.05]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>
          <Leg x={-0.15} z={-0.14} height={legH} color="#262626" />
          <Leg x={0.15} z={-0.14} height={legH} color="#262626" />
          <Leg x={-0.15} z={0.14} height={legH} color="#262626" />
          <Leg x={0.15} z={0.14} height={legH} color="#262626" />
        </>
      );
    }
    case "projector":
      return (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.12, 0.28]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
            <meshStandardMaterial color="#8c8c8c" />
          </mesh>
        </>
      );
    case "display":
      // Wall-mounted: group origin is screen center
      return (
        <>
          <mesh castShadow>
            <boxGeometry args={[1.25, 0.75, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <boxGeometry args={[1.1, 0.62, 0.01]} />
            <meshStandardMaterial
              color="#111827"
              emissive="#0a1628"
              emissiveIntensity={0.15}
            />
          </mesh>
        </>
      );
    case "audio":
      return (
        <>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.28, 0.9, 0.28]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.55, 0.12]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
            <meshStandardMaterial color="#262626" />
          </mesh>
        </>
      );
    case "vc":
      return (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.1, 0.1]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.02, 0.06]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial
              color="#69b1ff"
              emissive="#1677ff"
              emissiveIntensity={0.2}
            />
          </mesh>
        </>
      );
    default:
      return (
        <>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.35, 0.7, 0.25]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[0.4, 0.04, 0.3]} />
            <meshStandardMaterial color="#8c8c8c" />
          </mesh>
        </>
      );
  }
}

function RoomShell({ layout }: { layout: Room3DLayout }) {
  const [w, d] = layout.floorSize;
  const h = layout.wallHeight;
  const wallTint = layout.isVip ? "#d4b106" : "#d9d9d9";
  const floorColor = layout.isVip ? "#fffbe6" : "#ebebeb";
  const halfW = w / 2;
  const halfD = d / 2;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      {/* Back + sides translucent (open front for bird-eye view — no opaque rails). */}
      <mesh position={[0, h / 2, -halfD]}>
        <boxGeometry args={[w, h, 0.03]} />
        <meshStandardMaterial
          color={wallTint}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-halfW, h / 2, 0]}>
        <boxGeometry args={[0.03, h, d]} />
        <meshStandardMaterial
          color={wallTint}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[halfW, h / 2, 0]}>
        <boxGeometry args={[0.03, h, d]} />
        <meshStandardMaterial
          color={wallTint}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function SoftLight({ maxSpan, wallHeight }: { maxSpan: number; wallHeight: number }) {
  const lightRef = useRef<DirectionalLight>(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    const cam = light.shadow.camera;
    const extent = maxSpan * 0.75;
    cam.left = -extent;
    cam.right = extent;
    cam.top = extent;
    cam.bottom = -extent;
    cam.near = 0.5;
    cam.far = maxSpan * 4;
    cam.updateProjectionMatrix();
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0002;
  }, [maxSpan]);

  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#f5f5f5", "#d9d9d9", 0.35]} />
      <directionalLight
        ref={lightRef}
        castShadow
        intensity={0.55}
        position={[maxSpan * 0.6, wallHeight + maxSpan * 0.8, maxSpan * 0.5]}
      />
    </>
  );
}

function CameraRig({ maxSpan }: { maxSpan: number }) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls as OrbitControlsImpl | null);
  const height = maxSpan * 1.15;
  const dist = maxSpan * 0.95;

  useEffect(() => {
    if (!controls) return;
    const frame = requestAnimationFrame(() => {
      camera.position.set(dist * 0.75, height, dist * 0.75);
      controls.target.set(0, 0.2, 0);
      controls.update();
    });
    return () => cancelAnimationFrame(frame);
  }, [camera, controls, dist, height]);

  return null;
}

function SceneContent({ layout }: { layout: Room3DLayout }) {
  const maxSpan = Math.max(layout.floorSize[0], layout.floorSize[1]);

  return (
    <>
      <color attach="background" args={["#f0f0f0"]} />
      <SoftLight maxSpan={maxSpan} wallHeight={layout.wallHeight} />
      <RoomShell layout={layout} />
      {layout.items.map((item) => (
        <ItemMesh key={item.id} item={item} />
      ))}
      <OrbitControls
        makeDefault
        enablePan={false}
        target={[0, 0.2, 0]}
        minDistance={maxSpan * 0.55}
        maxDistance={maxSpan * 2.4}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.6}
      />
      <CameraRig maxSpan={maxSpan} />
    </>
  );
}

export function Room3DScene({ layout }: Room3DSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const maxSpan = Math.max(layout.floorSize[0], layout.floorSize[1]);
  const camY = maxSpan * 1.15;
  const camDist = maxSpan * 0.95;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sync = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width: Math.round(width), height: Math.round(height) });
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: [camDist * 0.75, camY, camDist * 0.75],
            fov: 42,
            near: 0.1,
            far: 80,
          }}
          style={{
            display: "block",
            width: size.width,
            height: size.height,
          }}
        >
          <Suspense fallback={null}>
            <SceneContent layout={layout} />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
