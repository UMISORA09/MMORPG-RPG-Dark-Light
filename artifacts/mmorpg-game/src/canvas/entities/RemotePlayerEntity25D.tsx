import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { OverheadChatBubble } from "./OverheadChatBubble";
import { WeaponEnhanceAura } from "./WeaponEnhanceAura";
import { MountVisual25D } from "./MountVisual25D";

export interface RemotePlayerProps {
  player: {
    characterId: number;
    name: string;
    classId: string;
    level: number;
    gender: "male" | "female";
    posX: number;
    posZ: number;
    facing: number;
    facingLeft?: boolean;
    animState: string;
    enhanceLevel: number;
    hp: number;
    maxHp: number;
    chatBubble?: string | null;
    isBot?: boolean;
    hairStyle?: string;
    hairColor?: string;
    outfitId?: string;
    auraIds?: string | string[];
    isMounted?: boolean;
    mountId?: string;
    petId?: string;
  };
}

const _zeroVec = new THREE.Vector3(0, 0, 0);

export const RemotePlayerEntity25D = memo(function RemotePlayerEntity25D({ player }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(player.posX, 0, player.posZ));
  const targetPos = useRef(new THREE.Vector3(player.posX, 0, player.posZ));

  useFrame((_, delta) => {
    targetPos.current.set(player.posX, 0, player.posZ);
    currentPos.current.lerp(targetPos.current, Math.min(delta * 12.0, 1.0));
    if (groupRef.current) {
      groupRef.current.position.copy(currentPos.current);
    }
  });

  const parsedAuras: string[] | undefined = useMemo(() => {
    if (!player.auraIds) return undefined;
    if (Array.isArray(player.auraIds)) return player.auraIds;
    try {
      const parsed = JSON.parse(player.auraIds);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return [player.auraIds];
    }
  }, [player.auraIds]);

  const classColor = {
    fighter: "#ff3366",
    tank: "#f59e0b",
    assassin: "#9d4edd",
    gunner: "#00f2ff",
  }[player.classId] || "#00f2ff";

  return (
    <group ref={groupRef} position={[player.posX, 0, player.posZ]}>
      {/* ── Mount Visual if mounted ── */}
      {player.isMounted && (
        <MountVisual25D
          position={_zeroVec}
          facingLeft={Boolean(player.facingLeft)}
          isRunning={player.animState === "run"}
        />
      )}

      {/* ── Weapon Enhancement Aura if +7 or above ── */}
      {player.enhanceLevel >= 7 && (
        <WeaponEnhanceAura
          enhanceLevel={player.enhanceLevel}
          position={_zeroVec}
        />
      )}

      {/* ── 2.5D Sprite Billboard ── */}
      <SpriteBillboard25D
        position={_zeroVec}
        state={player.animState === "run" ? "run" : player.animState === "attack" ? "attack1" : "idle"}
        facingLeft={Boolean(player.facingLeft)}
        textureKey={`player_${player.classId}`}
        color={classColor}
        hairStyle={player.hairStyle}
        hairColor={player.hairColor}
        outfitId={player.outfitId}
        auraIds={parsedAuras}
        weaponType={
          player.classId === "gunner"
            ? "gun"
            : player.classId === "assassin"
            ? "daggers"
            : player.classId === "tank"
            ? "shield"
            : "sword"
        }
        name={`${player.isBot ? "🤖 " : ""}${player.name}`}
        level={player.level}
        hp={player.hp}
        maxHp={player.maxHp}
        isPlayer={false}
      />

      {/* ── Overhead Chat Speech Bubble ── */}
      {player.chatBubble && (
        <OverheadChatBubble
          message={player.chatBubble}
          position={_zeroVec}
        />
      )}
    </group>
  );
});
