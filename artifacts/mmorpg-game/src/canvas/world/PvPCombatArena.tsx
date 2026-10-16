import { memo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { WeaponEnhanceAura } from "../entities/WeaponEnhanceAura";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

export const PvPCombatArena = memo(function PvPCombatArena() {
  const pvpArenaActive = useGameWorldStore((s) => s.pvpArenaActive);
  const pvpOpponent = useGameWorldStore((s) => s.pvpOpponent);
  const pvpTimer = useGameWorldStore((s) => s.pvpTimer);
  const pvpOpponentHp = useGameWorldStore((s) => s.pvpOpponentHp);
  const pvpOpponentMaxHp = useGameWorldStore((s) => s.pvpOpponentMaxHp);
  const pvpResult = useGameWorldStore((s) => s.pvpResult);
  const closePvPArena = useGameWorldStore((s) => s.closePvPArena);
  const dealPvPDamageToOpponent = useGameWorldStore((s) => s.dealPvPDamageToOpponent);
  const dealPvPDamageToPlayer = useGameWorldStore((s) => s.dealPvPDamageToPlayer);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const playerAnimState = useGameWorldStore((s) => s.playerAnimState);
  const playerStr = useGameWorldStore((s) => s.playerStr);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);

  const isAttacking = playerAnimState.startsWith("attack") || playerAnimState === "air_attack";
  const playerAtk = (playerStr || 15) * 2.5 + (playerLevel || 1) * 4;

  const opponentPos = useRef(new THREE.Vector3(0, 0, -6));
  const [animState, setAnimState] = useState<"idle" | "run" | "attack1" | "death">("idle");
  const [facingLeft, setFacingLeft] = useState(false);
  const attackCooldown = useRef(1.5);
  const playerHitCooldown = useRef(0);
  const hasReportedResult = useRef(false);

  // Reset opponent position & result tracker when match begins
  useEffect(() => {
    if (pvpArenaActive) {
      opponentPos.current.set(0, 0, -6);
      hasReportedResult.current = false;
      useGameWorldStore.setState({ pvpTimer: 90, pvpResult: null });
      playCombatSFX("dragon_roar", 0.6);
    }
  }, [pvpArenaActive]);

  // PvP Combat Loop
  useFrame((_, delta) => {
    if (!pvpArenaActive || pvpResult) return;

    // Countdown match timer
    const currentTimer = useGameWorldStore.getState().pvpTimer;
    if (currentTimer > 0) {
      const nextTimer = Math.max(0, currentTimer - delta);
      useGameWorldStore.setState({ pvpTimer: nextTimer });

      if (nextTimer <= 0) {
        // Time expired: Compare HP percentages
        const playerHpPct = useGameWorldStore.getState().playerHealth / Math.max(1, useGameWorldStore.getState().playerMaxHealth);
        const oppHpPct = pvpOpponentHp / Math.max(1, pvpOpponentMaxHp);
        const outcome = playerHpPct >= oppHpPct ? "VICTORY" : "DEFEAT";
        useGameWorldStore.setState({ pvpResult: outcome });
      }
    }

    // AI Movement & Aggression
    const distToPlayer = opponentPos.current.distanceTo(playerPosition);
    const targetDir = new THREE.Vector3().subVectors(playerPosition, opponentPos.current).setY(0);

    setFacingLeft(playerPosition.x < opponentPos.current.x);

    if (distToPlayer > 2.0) {
      targetDir.normalize();
      opponentPos.current.addScaledVector(targetDir, delta * 3.8);
      setAnimState("run");
    } else {
      setAnimState("idle");
    }

    // AI Attack Player
    attackCooldown.current -= delta;
    if (distToPlayer <= 2.4 && attackCooldown.current <= 0) {
      attackCooldown.current = 1.3 + Math.random() * 0.4;
      setAnimState("attack1");

      const enemyAtk = (pvpOpponent?.combatPower || 1000) * 0.05 + 20;
      const finalDmg = Math.round(enemyAtk * (0.85 + Math.random() * 0.3));
      dealPvPDamageToPlayer(finalDmg);
      addFloatingText(`-${finalDmg}`, playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ef4444");
      playCombatSFX("blade_slash", 0.4);

      setTimeout(() => {
        if (!pvpResult) setAnimState("idle");
      }, 400);
    }

    // Check Player Attack Hitting Opponent
    if (isAttacking && playerHitCooldown.current <= 0 && distToPlayer <= 2.6) {
      playerHitCooldown.current = 0.35;
      const dealtDmg = Math.round(playerAtk * (1.1 + Math.random() * 0.4));
      dealPvPDamageToOpponent(dealtDmg);
      addFloatingText(`-${dealtDmg}`, opponentPos.current.clone().add(new THREE.Vector3(0, 2.4, 0)), "#38bdf8");
      playCombatSFX("heavy_slam", 0.4);
    }

    if (playerHitCooldown.current > 0) {
      playerHitCooldown.current -= delta;
    }
  });

  // Report match result to API once finished
  useEffect(() => {
    if (pvpResult && !hasReportedResult.current) {
      hasReportedResult.current = true;
      const victory = pvpResult === "VICTORY";

      fetch("/api/characters/1/pvp/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentName: pvpOpponent?.name || "Chiến Binh Ảo Mộng",
          victory,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.honorPoints) {
            useGameWorldStore.setState({
              honorPoints: data.honorPoints,
              arenaRank: data.arenaRank,
            });
          }
        })
        .catch(() => {});
    }
  }, [pvpResult, pvpOpponent]);

  if (!pvpArenaActive) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* ── 1. Circular Duel Ring Platform ── */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 14, 64]} />
        <meshBasicMaterial color="#0b0f19" transparent opacity={0.8} />
      </mesh>

      {/* Runic Outer Border Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.7, 14.2, 64]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.9} />
      </mesh>

      {/* Inner Duel Zone Ring */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.8, 7.1, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>

      {/* ── 2. Perimeter Braziers / Flame Pillars ── */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        const px = Math.cos(angle) * 13.8;
        const pz = Math.sin(angle) * 13.8;
        return (
          <group key={idx} position={[px, 0, pz]}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.3, 0.4, 1.6, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            <pointLight position={[0, 1.8, 0]} color="#f43f5e" intensity={2.5} distance={7} />
          </group>
        );
      })}

      {/* ── 3. Opponent Entity ── */}
      <group position={opponentPos.current}>
        <WeaponEnhanceAura enhanceLevel={9} position={new THREE.Vector3(0, 0, 0)} />

        <SpriteBillboard25D
          position={new THREE.Vector3(0, 0, 0)}
          state={animState}
          facingLeft={facingLeft}
          textureKey={`player_${pvpOpponent?.classId || "fighter"}`}
          color="#ff3366"
          weaponType={pvpOpponent?.classId === "tank" ? "shield" : pvpOpponent?.classId === "assassin" ? "daggers" : "sword"}
          name={`⚔️ ${pvpOpponent?.name || "Đối Thủ Đấu Trường"}`}
          level={pvpOpponent?.level || 12}
          hp={pvpOpponentHp}
          maxHp={pvpOpponentMaxHp}
          isPlayer={false}
        />
      </group>

      {/* ── 4. 3D Overhead Duel Countdown & Outcome Overlay ── */}
      <Html position={[0, 4.5, 0]} center>
        <div className="flex flex-col items-center select-none pointer-events-auto">
          {/* Match Timer */}
          {!pvpResult && (
            <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#0c101d]/90 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)]">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest">
                ĐẤU TRƯỜNG 1v1
              </span>
              <span className="text-xl font-mono font-black text-amber-300">
                {Math.ceil(pvpTimer)}s
              </span>
            </div>
          )}

          {/* Victory / Defeat Billboard */}
          {pvpResult && (
            <div className="p-6 rounded-3xl bg-[#0a0f1b]/95 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)] flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
              <span className={`text-3xl font-black ${pvpResult === "VICTORY" ? "text-amber-300" : "text-rose-400"}`}>
                {pvpResult === "VICTORY" ? "🏆 CHIẾN THẮNG TUYỆT ĐỐI!" : "☠️ THẤT BẠI QUYẾT ĐẤU!"}
              </span>
              <p className="text-xs text-slate-300 font-mono">
                {pvpResult === "VICTORY" ? "+35 Điểm Danh Vọng • Thăng Hạng Đấu Trường" : "+10 Điểm Khích Lệ"}
              </p>
              <button
                onClick={closePvPArena}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer hover:scale-105 transition"
              >
                Rời Đấu Trường
              </button>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
});

