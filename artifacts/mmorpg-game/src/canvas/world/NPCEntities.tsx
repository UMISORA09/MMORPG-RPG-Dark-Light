import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

interface NPCConfig {
  id: string;
  name: string;
  title: string;
  position: [number, number, number];
  color: string;
  secondaryColor: string;
  weaponType: "sword" | "shield" | "gun" | "daggers" | "claws" | "dragon";
  textureKey: string;
}

// Spaced >= 4.5m away from fountain [0, 0, 0] and from each other
const NPCS: NPCConfig[] = [
  {
    id: "npc_truong_lang",
    name: "Trưởng Làng Huyền Vũ",
    title: "Tiếp Nhận Nhiệm Vụ Chính Tuyến",
    position: [-6.0, 0, -3.5], // Clear from fountain center [0,0,0], spacing 6.95m
    color: "#f59e0b",
    secondaryColor: "#fbbf24",
    weaponType: "sword",
    textureKey: "npc_quest",
  },
  {
    id: "npc_tho_ren",
    name: "Đại Sư Thiết Tâm",
    title: "Lò Rèn Thần Binh & Cường Hóa",
    position: [-14, 0, -7],
    color: "#ff5500",
    secondaryColor: "#ffaa00",
    weaponType: "shield",
    textureKey: "npc_blacksmith",
  },
  {
    id: "npc_thuong_nhan",
    name: "Thương Nhân Bảo Vật",
    title: "Trao Đổi Kỳ Trân Dị Bảo",
    position: [14, 0, -7],
    color: "#38bdf8",
    secondaryColor: "#0ea5e9",
    weaponType: "sword",
    textureKey: "npc_shop",
  },
  {
    id: "npc_gac_cong",
    name: "Người Gác Cổng Phó Bản",
    title: "Thám Hiểm Cấm Địa & Hang Động",
    position: [0, 0, -43],
    color: "#a855f7",
    secondaryColor: "#c084fc",
    weaponType: "gun",
    textureKey: "npc_gatekeeper",
  },
];

export const NPCEntities = memo(function NPCEntities() {
  const trackedQuest = useGameWorldStore((s) => s.trackedQuest);
  const playerPos = useGameWorldStore((s) => s.playerPosition);
  const badgeFloatRef = useRef<THREE.Group>(null);

  // Floating quest badge oscillation
  useFrame((state) => {
    if (badgeFloatRef.current) {
      badgeFloatRef.current.position.y = 2.8 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    }
  });

  const handleNPCClick = (npc: NPCConfig) => {
    playCombatSFX("holy_bell", 0.4);

    if (npc.id === "npc_tho_ren") {
      useGameWorldStore.getState().setActiveModal("blacksmith");
    } else if (npc.id === "npc_thuong_nhan") {
      useGameWorldStore.getState().setActiveModal("shop");
    } else if (npc.id === "npc_gac_cong") {
      useGameWorldStore.getState().openDungeonModal();
    } else {
      useGameWorldStore.getState().setActiveModal("quests");
    }
  };

  const getStatusBadge = (npcId: string) => {
    if (!trackedQuest) return "❗";
    if (trackedQuest.npcId === npcId) {
      if (trackedQuest.status === "READY_TO_CLAIM") return "❓";
      if (trackedQuest.status === "IN_PROGRESS") return "❔";
    }
    return "❗";
  };

  return (
    <group>
      {NPCS.map((npc) => {
        const badge = getStatusBadge(npc.id);
        const isReady = badge === "❓";

        // Distance check: Only show overhead 3D UI when player <= 12m
        const distToPlayer = Math.hypot(npc.position[0] - playerPos.x, npc.position[2] - playerPos.z);
        const isNear = distToPlayer <= 12;

        return (
          <group key={npc.id} position={npc.position}>
            {/* ── Ground Pedestal ── */}
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.9, 1.3, 32]} />
              <meshBasicMaterial
                color={npc.color}
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>

            {/* ── 2.5D NPC Sprite Billboard ── */}
            <SpriteBillboard25D
              position={new THREE.Vector3(0, 0, 0)}
              textureKey={npc.textureKey}
              color={npc.color}
              secondaryColor={npc.secondaryColor}
              weaponType={npc.weaponType}
              name={npc.name}
              level={99}
              hp={9999}
              maxHp={9999}
              onClick={() => handleNPCClick(npc)}
            />

            {/* ── 3D Overhead Quest Icon (Strictly low zIndex [10, 0], only visible within 12m) ── */}
            {isNear && (
              <group ref={badgeFloatRef} position={[0, 2.7, 0]}>
                <Html
                  center
                  distanceFactor={15}
                  zIndexRange={[10, 0]}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-lg select-none cursor-pointer transition-transform shadow-lg ${
                      isReady
                        ? "bg-amber-400 text-slate-950 border-2 border-yellow-200 shadow-[0_0_18px_rgba(251,191,36,0.8)] animate-bounce"
                        : badge === "❔"
                        ? "bg-slate-700/80 text-slate-300 border-2 border-slate-500"
                        : "bg-amber-500/90 text-amber-100 border-2 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    }`}
                  >
                    {badge}
                  </div>
                </Html>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
});
