// ==============================================================================
// Interactive Mysterious Continental Relics (Chiến Long Bá MMORPG)
// Ancient Rune Monolith, Golden Sarcophagus, Astral Mana Crystal & Mysterious Shrine
// ==============================================================================

import { memo, useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import type { BiomeType } from "@/world/WorldMapRegistry";

export type RelicType = "monolith" | "sarcophagus" | "crystal" | "shrine";

export interface InteractiveRelicInstance {
  id: string;
  type: RelicType;
  name: string;
  position: THREE.Vector3;
  color: string;
  lightColor: string;
  isUsed: boolean;
  cooldownTimer: number;
}

interface Props {
  currentZone: string;
  biome?: BiomeType;
}

export const InteractiveRelics = memo(function InteractiveRelics({ currentZone, biome = "continent" }: Props) {
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const [nearbyRelic, setNearbyRelic] = useState<InteractiveRelicInstance | null>(null);

  // Generate 4 deterministic relics per zone
  const relics = useMemo<InteractiveRelicInstance[]>(() => {
    const isEgypt = biome === "egypt";
    const isDesert = biome === "desert";
    const isOcean = biome === "ocean";
    const isSnow = biome === "snow";
    const isVoid = biome === "void";

    const sarcophagusName = isEgypt
      ? "Quách Vàng Hoàng Gia Pharaoh"
      : isOcean
      ? "Rương Báu Đại Dương Chìm Sâu"
      : isSnow
      ? "Rương Băng Pha Lê Ngàn Năm"
      : isVoid
      ? "Rương Hư Không Tinh Tú"
      : "Rương Kho Báu Bị Phong Ấn";

    return [
      {
        id: `${currentZone}_monolith`,
        type: "monolith",
        name: isEgypt ? "Cột Obelisk Thần Mặt Trời Ra" : "Đài Cổ Ngữ Bí Ẩn",
        position: new THREE.Vector3(-14, 0, -12),
        color: isEgypt ? "#f59e0b" : "#00f2ff",
        lightColor: isEgypt ? "#fbbf24" : "#38bdf8",
        isUsed: false,
        cooldownTimer: 0,
      },
      {
        id: `${currentZone}_sarcophagus`,
        type: "sarcophagus",
        name: sarcophagusName,
        position: new THREE.Vector3(15, 0, -14),
        color: "#eab308",
        lightColor: "#fde047",
        isUsed: false,
        cooldownTimer: 0,
      },
      {
        id: `${currentZone}_crystal`,
        type: "crystal",
        name: isOcean ? "Tinh Thể Thủy Tinh Ngầm" : "Tinh Thể Linh Mạch Đại Lục",
        position: new THREE.Vector3(-12, 0, 16),
        color: isOcean ? "#2dd4bf" : isSnow ? "#38bdf8" : "#c084fc",
        lightColor: isOcean ? "#2dd4bf" : isSnow ? "#bae6fd" : "#e879f9",
        isUsed: false,
        cooldownTimer: 0,
      },
      {
        id: `${currentZone}_shrine`,
        type: "shrine",
        name: isDesert ? "Giếng Thần Ốc Đảo Sa Mạc" : isEgypt ? "Điện Thờ Thần Anubis" : "Tượng Thần Cổ Đại",
        position: new THREE.Vector3(14, 0, 15),
        color: isDesert ? "#f59e0b" : "#10b981",
        lightColor: "#34d399",
        isUsed: false,
        cooldownTimer: 0,
      },
    ];
  }, [currentZone, biome]);

  const [activeRelics, setActiveRelics] = useState<InteractiveRelicInstance[]>(relics);

  useEffect(() => {
    setActiveRelics(relics);
  }, [relics]);

  // Proximity Check & Hover animation
  useFrame((_, delta) => {
    let closest: InteractiveRelicInstance | null = null;
    let minDist = 3.6;

    for (const r of activeRelics) {
      if (r.cooldownTimer > 0) {
        r.cooldownTimer = Math.max(0, r.cooldownTimer - delta);
      }
      const dist = playerPosition.distanceTo(r.position);
      if (dist < minDist && r.cooldownTimer <= 0) {
        minDist = dist;
        closest = r;
      }
    }
    if (closest?.id !== nearbyRelic?.id) {
      setNearbyRelic(closest);
    }
  });

  // Handle Interaction Logic
  const handleInteract = (relic: InteractiveRelicInstance) => {
    if (relic.cooldownTimer > 0) return;

    const s = useGameWorldStore.getState();
    playCombatSFX("buff");

    // Put on 45s cooldown
    setActiveRelics((prev) =>
      prev.map((r) => (r.id === relic.id ? { ...r, cooldownTimer: 45 } : r))
    );

    if (relic.type === "monolith") {
      s.claimRewardBonus(350, 200, "🔮 ĐÀI CỔ NGỮ: Giải ấn thành công! Nhận bùa hộ mệnh +30% ATK & +50% EXP!");
      s.addFloatingText("⚡ BÙA LỢI CỔ NGỮ +30% ATK", relic.position.clone().add(new THREE.Vector3(0, 3, 0)), "#00f2ff");
      // Restore HP & MP
      s.healPlayer(s.playerMaxHealth);
      useGameWorldStore.setState({ playerPp: s.playerMaxPp });
    } else if (relic.type === "sarcophagus") {
      const bonusGold = Math.floor(600 + Math.random() * 800);
      s.claimRewardBonus(500, bonusGold, `👑 MỞ THÀNH CÔNG: ${relic.name}! Nhận +${bonusGold} Vàng & Bảo Thạch!`);
      s.addFloatingText(`💎 +${bonusGold} VÀNG HOÀNG KIM`, relic.position.clone().add(new THREE.Vector3(0, 3, 0)), "#fbbf24");
    } else if (relic.type === "crystal") {
      s.claimRewardBonus(850, 150, "💎 KHAI THÁC LINH MẠCH: Hấp thụ Tinh Thể Linh Mạch Đại Lục (+850 EXP)!");
      s.addFloatingText("✨ +850 EXP LINH MẠCH", relic.position.clone().add(new THREE.Vector3(0, 3, 0)), "#c084fc");
    } else if (relic.type === "shrine") {
      s.claimRewardBonus(450, 300, `🙏 TƯƠNG TÁC THÀNH CÔNG: ${relic.name} ban phúc lành vĩnh cửu +5 HP!`);
      s.addFloatingText("❤️ PHÚC LÀNH: +5 MAX HP", relic.position.clone().add(new THREE.Vector3(0, 3, 0)), "#10b981");
    }
  };

  // Listen for keyboard 'F'
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && nearbyRelic) {
        handleInteract(nearbyRelic);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearbyRelic]);

  return (
    <group>
      {activeRelics.map((relic) => {
        const isNearby = nearbyRelic?.id === relic.id;
        const isOnCooldown = relic.cooldownTimer > 0;

        return (
          <group
            key={relic.id}
            position={relic.position}
            onClick={() => handleInteract(relic)}
            onPointerOver={() => {
              if (playerPosition.distanceTo(relic.position) < 3.8) {
                document.body.style.cursor = "pointer";
              }
            }}
            onPointerOut={() => {
              document.body.style.cursor = "default";
            }}
          >
            {/* Base platform */}
            <mesh position={[0, 0.15, 0]} receiveShadow>
              <cylinderGeometry args={[1.5, 1.8, 0.3, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
            </mesh>

            {/* Glowing Rune Ring at Feet */}
            <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.2, 1.45, 24]} />
              <meshBasicMaterial
                color={isOnCooldown ? "#64748b" : relic.color}
                transparent
                opacity={isOnCooldown ? 0.2 : 0.75}
              />
            </mesh>

            {/* 3D Geometry per Relic Type */}
            {relic.type === "monolith" && (
              <MonolithMesh color={relic.color} isOnCooldown={isOnCooldown} />
            )}
            {relic.type === "sarcophagus" && (
              <SarcophagusMesh color={relic.color} isOnCooldown={isOnCooldown} />
            )}
            {relic.type === "crystal" && (
              <CrystalMesh color={relic.color} isOnCooldown={isOnCooldown} />
            )}
            {relic.type === "shrine" && (
              <ShrineMesh color={relic.color} isOnCooldown={isOnCooldown} />
            )}

            {/* Point Light Glow */}
            {!isOnCooldown && (
              <pointLight color={relic.lightColor} intensity={1.8} distance={7} decay={2} position={[0, 1.6, 0]} />
            )}

            {/* Overhead Title Label & Proximity Interaction Prompt */}
            <Html center position={[0, 3.2, 0]} distanceFactor={14} style={{ pointerEvents: "none" }}>
              <div className="flex flex-col items-center select-none pointer-events-none whitespace-nowrap">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-[0_4px_16px_rgba(0,0,0,0.85)] border backdrop-blur-md"
                  style={{
                    backgroundColor: isOnCooldown ? "rgba(15, 23, 42, 0.9)" : "rgba(2, 132, 199, 0.92)",
                    borderColor: isOnCooldown ? "#475569" : "#38bdf8",
                    color: isOnCooldown ? "#94a3b8" : "#ffffff",
                  }}
                >
                  {isOnCooldown ? `⌛ Đang Hồi Phục (${Math.ceil(relic.cooldownTimer)}s)` : relic.name}
                </span>

                {isNearby && !isOnCooldown && (
                  <span className="mt-1 px-3 py-1 rounded-lg bg-emerald-500/95 border border-emerald-300 text-white font-black text-xs shadow-lg animate-bounce">
                    ⚡ [F] TƯƠNG TÁC
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
});

// ── 1. Monolith Runic Column ──
function MonolithMesh({ color, isOnCooldown }: { color: string; isOnCooldown: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current && !isOnCooldown) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group position={[0, 1.4, 0]}>
      {/* Ancient Obelisk Column */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 2.2, 0.9]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Top Pyramidion */}
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.65, 0.7, 4]} />
        <meshStandardMaterial color={isOnCooldown ? "#475569" : color} roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Floating Rotating Rune Core */}
      <mesh ref={meshRef} position={[0, 0.4, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshBasicMaterial color={isOnCooldown ? "#64748b" : color} wireframe={isOnCooldown} />
      </mesh>
    </group>
  );
}

// ── 2. Sarcophagus Chest ──
function SarcophagusMesh({ color, isOnCooldown }: { color: string; isOnCooldown: boolean }) {
  return (
    <group position={[0, 0.7, 0]}>
      {/* Gilded Chest Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.6, 0.9, 1.0]} />
        <meshStandardMaterial
          color={isOnCooldown ? "#713f12" : "#ca8a04"}
          roughness={0.4}
          metalness={isOnCooldown ? 0.2 : 0.85}
        />
      </mesh>
      {/* Curved Lid */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Golden Lock Gem */}
      <mesh position={[0, 0.2, 0.52]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color={isOnCooldown ? "#78350f" : "#fef08a"} />
      </mesh>
    </group>
  );
}

// ── 3. Astral Mana Crystal ──
function CrystalMesh({ color, isOnCooldown }: { color: string; isOnCooldown: boolean }) {
  const crystalRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.5;
      crystalRef.current.position.y = 1.3 + Math.sin(state.clock.elapsedTime * 2.2) * 0.15;
    }
  });

  return (
    <group ref={crystalRef} position={[0, 1.3, 0]}>
      {/* Central Large Shard */}
      <mesh>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          color={isOnCooldown ? "#64748b" : color}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* 3 Orbiting Mini Shards */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((rad, idx) => (
        <mesh key={idx} position={[Math.cos(rad) * 0.85, (idx - 1) * 0.25, Math.sin(rad) * 0.85]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// ── 4. Ancient Shrine ──
function ShrineMesh({ color, isOnCooldown }: { color: string; isOnCooldown: boolean }) {
  return (
    <group position={[0, 0.9, 0]}>
      {/* 4 Pillars */}
      {[-0.6, 0.6].map((x) =>
        [-0.6, 0.6].map((z, i) => (
          <mesh key={`${x}-${z}-${i}`} position={[x, 0, z]}>
            <cylinderGeometry args={[0.12, 0.15, 1.6, 12]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
        ))
      )}
      {/* Canopy Roof */}
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[1.2, 0.6, 4]} />
        <meshStandardMaterial color={isOnCooldown ? "#334155" : color} roughness={0.5} />
      </mesh>
      {/* Glowing Wishing Well Basin */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.6, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 16]} />
        <meshBasicMaterial color={isOnCooldown ? "#334155" : "#34d399"} />
      </mesh>
    </group>
  );
}
