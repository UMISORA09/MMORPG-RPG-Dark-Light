import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

export type WeaponType = "sword" | "daggers" | "gun" | "shield";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface WeaponSocket3DProps {
  weaponType?: WeaponType;
  rarity?: ItemRarity;
  isAttacking?: boolean;
}

export const WeaponSocket3D = memo(function WeaponSocket3D({
  weaponType: overrideType,
  rarity: overrideRarity,
  isAttacking = false,
}: WeaponSocket3DProps) {
  const inventoryItems = useGameWorldStore((s) => s.inventoryItems);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);

  // Detect equipped weapon from player inventory
  const equippedWeapon = useMemo(() => {
    return inventoryItems.find((it) => it.equipped && it.type === "weapon");
  }, [inventoryItems]);

  const weaponType: WeaponType =
    overrideType ||
    (playerClassId === "gunner"
      ? "gun"
      : playerClassId === "assassin"
      ? "daggers"
      : playerClassId === "tank"
      ? "shield"
      : "sword");

  const rarity: ItemRarity =
    overrideRarity ||
    ((equippedWeapon?.rarity as ItemRarity) || "rare");

  const auraLightRef = useRef<THREE.PointLight>(null);

  // Visual Palette based on Rarity Tier
  const rarityColors = useMemo(() => {
    switch (rarity) {
      case "common":
        return {
          blade: "#cbd5e1",
          hilt: "#334155",
          glow: "#94a3b8",
          emissiveIntensity: 0.1,
          lightColor: "#cbd5e1",
          lightIntensity: 0.2,
        };
      case "uncommon":
        return {
          blade: "#34d399",
          hilt: "#064e3b",
          glow: "#10b981",
          emissiveIntensity: 0.35,
          lightColor: "#10b981",
          lightIntensity: 0.8,
        };
      case "rare":
        return {
          blade: "#c084fc",
          hilt: "#3b0764",
          glow: "#a855f7",
          emissiveIntensity: 0.6,
          lightColor: "#a855f7",
          lightIntensity: 1.5,
        };
      case "epic":
        return {
          blade: "#fbbf24",
          hilt: "#78350f",
          glow: "#f59e0b",
          emissiveIntensity: 0.85,
          lightColor: "#f59e0b",
          lightIntensity: 2.2,
        };
      case "legendary":
        return {
          blade: "#f87171",
          hilt: "#450a0a",
          glow: "#ef4444",
          emissiveIntensity: 1.4,
          lightColor: "#ef4444",
          lightIntensity: 3.5,
        };
    }
  }, [rarity]);

  // Pulsating glow on legendary & epic weapons
  useFrame(({ clock }) => {
    if (auraLightRef.current && (rarity === "legendary" || rarity === "epic")) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.3;
      auraLightRef.current.intensity = rarityColors.lightIntensity * pulse;
    }
  });

  return (
    <group name="WeaponSocketRoot">
      {/* ── 1. SWORD / GREATSWORD (Fighter) ── */}
      {weaponType === "sword" && (
        <group position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 8]}>
          {/* Blade */}
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[0.08, 0.9, 0.03]} />
            <meshStandardMaterial
              color={rarityColors.blade}
              emissive={rarityColors.glow}
              emissiveIntensity={rarityColors.emissiveIntensity}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Crossguard */}
          <mesh castShadow position={[0, 0.05, 0]}>
            <boxGeometry args={[0.24, 0.04, 0.06]} />
            <meshStandardMaterial color={rarityColors.hilt} metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Hilt */}
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.22, 8]} />
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
          </mesh>
          {/* Pommel Gem */}
          <mesh position={[0, -0.24, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={rarityColors.glow}
              emissive={rarityColors.glow}
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      )}

      {/* ── 2. TWIN DAGGERS (Assassin) ── */}
      {weaponType === "daggers" && (
        <group position={[0, 0, 0]}>
          {/* Main Hand Dagger */}
          <group position={[0, 0.15, 0]} rotation={[Math.PI / 4, 0, 0]}>
            <mesh castShadow position={[0, 0.22, 0]}>
              <boxGeometry args={[0.05, 0.45, 0.02]} />
              <meshStandardMaterial
                color={rarityColors.blade}
                emissive={rarityColors.glow}
                emissiveIntensity={rarityColors.emissiveIntensity}
                metalness={0.85}
                roughness={0.15}
              />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.14, 6]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          </group>
          {/* Off-Hand Reverse Dagger (Reverse Grip) */}
          <group position={[-0.35, 0.1, -0.1]} rotation={[-Math.PI / 3, 0, Math.PI / 6]}>
            <mesh castShadow position={[0, -0.22, 0]}>
              <boxGeometry args={[0.05, 0.42, 0.02]} />
              <meshStandardMaterial
                color={rarityColors.blade}
                emissive={rarityColors.glow}
                emissiveIntensity={rarityColors.emissiveIntensity}
                metalness={0.85}
                roughness={0.15}
              />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.14, 6]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── 3. QUANTUM BLASTER / GUN (Gunner) ── */}
      {weaponType === "gun" && (
        <group position={[0, 0, 0]}>
          {/* Main Hand Blaster */}
          <group position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh castShadow position={[0.2, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.045, 0.45, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.05, 0.05, 0]}>
              <boxGeometry args={[0.16, 0.12, 0.08]} />
              <meshStandardMaterial
                color={rarityColors.glow}
                emissive={rarityColors.glow}
                emissiveIntensity={rarityColors.emissiveIntensity * 1.5}
              />
            </mesh>
            <mesh position={[-0.05, -0.08, 0]} rotation={[0, 0, -Math.PI / 6]}>
              <boxGeometry args={[0.04, 0.16, 0.04]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          </group>
          {/* Off-Hand Plasma Blaster */}
          <group position={[-0.35, -0.05, -0.15]} rotation={[0, -Math.PI / 2, 0.2]}>
            <mesh castShadow position={[0.18, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.045, 0.42, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.05, 0.05, 0]}>
              <boxGeometry args={[0.15, 0.11, 0.08]} />
              <meshStandardMaterial
                color={rarityColors.glow}
                emissive={rarityColors.glow}
                emissiveIntensity={rarityColors.emissiveIntensity * 1.5}
              />
            </mesh>
            <mesh position={[-0.05, -0.08, 0]} rotation={[0, 0, -Math.PI / 6]}>
              <boxGeometry args={[0.04, 0.15, 0.04]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── 4. HOLY SHIELD & WAR HAMMER (Tank) ── */}
      {weaponType === "shield" && (
        <group position={[0, 0, 0]}>
          {/* Large Kite Shield */}
          <mesh castShadow position={[0, 0.15, 0.12]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.55, 0.8, 0.06]} />
            <meshStandardMaterial
              color={rarityColors.blade}
              emissive={rarityColors.glow}
              emissiveIntensity={rarityColors.emissiveIntensity * 0.7}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          {/* Golden Boss Emblem on Shield */}
          <mesh position={[0, 0.15, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.04, 8]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#d97706"
              emissiveIntensity={0.8}
              metalness={0.9}
            />
          </mesh>
          {/* Spiked War Hammer in hand */}
          <group position={[-0.32, 0.25, -0.08]} rotation={[0, 0, -Math.PI / 6]}>
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0, 0.18, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.18]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.13, 0.18, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.06, 0.12, 6]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} />
            </mesh>
          </group>
        </group>
      )}

      {/* Rarity Aura Ambient Light */}
      <pointLight
        ref={auraLightRef}
        color={rarityColors.lightColor}
        intensity={rarityColors.lightIntensity}
        distance={2.5}
        decay={2}
      />
    </group>
  );
});

export default WeaponSocket3D;
