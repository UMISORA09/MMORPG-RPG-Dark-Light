// ==============================================================================
// 3D Dimensional Portal Network Component (Chiến Long Bá MMORPG)
// Rotating magic concentric rings, ethereal energy cylinder beacon, and transition
// ==============================================================================

import { memo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { getMapById, type MapPortalDestination } from "@/world/WorldMapRegistry";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

interface Props {
  currentZone: string;
}

export const DimensionalPortals3D = memo(function DimensionalPortals3D({ currentZone }: Props) {
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const triggerZoneTransition = useGameWorldStore((s) => s.triggerZoneTransition);
  const [nearbyPortal, setNearbyPortal] = useState<MapPortalDestination | null>(null);

  const currentMap = getMapById(currentZone);
  const portals = currentMap.portals || [];

  // Proximity Check (< 3.2m)
  useFrame(() => {
    let closest: MapPortalDestination | null = null;
    let minDist = 3.2;

    for (const p of portals) {
      const pos = new THREE.Vector3(p.position[0], p.position[1], p.position[2]);
      const dist = playerPosition.distanceTo(pos);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    setNearbyPortal(closest);
  });

  // Teleport action
  const handleTeleport = (dest: MapPortalDestination) => {
    playCombatSFX("teleport");
    const targetMap = getMapById(dest.targetMapId);
    triggerZoneTransition(`BƯỚC VÀO: ${targetMap.name}`, () => {
      useGameWorldStore.setState({
        currentZone: dest.targetMapId as any,
        playerPosition: new THREE.Vector3(0, 0, 0),
        zoneNotification: `📍 ĐÃ ĐẾN: ${targetMap.name} (${targetMap.biomeName})`,
        zoneNotificationTimer: 4.5,
      });
    });
  };

  // Keyboard 'F' listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && nearbyPortal) {
        handleTeleport(nearbyPortal);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearbyPortal]);

  return (
    <group>
      {portals.map((portal, idx) => (
        <PortalInstance
          key={`${portal.targetMapId}-${idx}`}
          portal={portal}
          isNearby={nearbyPortal?.targetMapId === portal.targetMapId}
          onInteract={() => handleTeleport(portal)}
        />
      ))}
    </group>
  );
});

function PortalInstance({
  portal,
  isNearby,
  onInteract,
}: {
  portal: MapPortalDestination;
  isNearby: boolean;
  onInteract: () => void;
}) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const columnRef = useRef<THREE.Mesh>(null);

  const pos = new THREE.Vector3(portal.position[0], portal.position[1], portal.position[2]);

  useFrame((state, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.75;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 1.1;
    }
    if (columnRef.current) {
      columnRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.12;
    }
  });

  return (
    <group position={pos} onClick={onInteract}>
      {/* Stone Archway Base Frame */}
      <group position={[0, 0, 0]}>
        {/* Left Stone Pillar */}
        <mesh position={[-2.2, 2.2, 0]} castShadow>
          <boxGeometry args={[0.6, 4.4, 0.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Right Stone Pillar */}
        <mesh position={[2.2, 2.2, 0]} castShadow>
          <boxGeometry args={[0.6, 4.4, 0.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Top Arch Beam */}
        <mesh position={[0, 4.4, 0]} castShadow>
          <boxGeometry args={[5.0, 0.65, 0.7]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      {/* Rotating Outer Runic Circle */}
      <mesh ref={outerRingRef} position={[0, 2.2, 0]}>
        <ringGeometry args={[1.7, 2.1, 32]} />
        <meshBasicMaterial color={portal.color} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Inner Star Disk */}
      <mesh ref={innerRingRef} position={[0, 2.2, 0.02]}>
        <ringGeometry args={[0.8, 1.4, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical Ethereal Light Beacon Beam */}
      <mesh ref={columnRef} position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 4.2, 24, 1, true]} />
        <meshBasicMaterial color={portal.color} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>

      {/* Ground Glow Ring Decal */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.0, 32]} />
        <meshBasicMaterial color={portal.color} transparent opacity={0.35} />
      </mesh>

      {/* Point Light Radiance */}
      <pointLight color={portal.color} intensity={2.4} distance={8} decay={2} position={[0, 2.2, 0.5]} />

      {/* Overhead Target Map Label */}
      <Text
        position={[0, 5.3, 0]}
        fontSize={0.45}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#0f172a"
      >
        {portal.name}
      </Text>

      {/* Interaction Prompt when player is close */}
      {isNearby && (
        <group position={[0, 3.2, 0]}>
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[3.2, 0.75]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.92} />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={0.36}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#064e3b"
          >
            ⚡ [F] DỊCH CHUYỂN
          </Text>
        </group>
      )}
    </group>
  );
}
