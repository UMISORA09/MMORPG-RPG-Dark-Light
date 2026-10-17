import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { OverheadChatBubble } from "./OverheadChatBubble";
import { WeaponEnhanceAura } from "./WeaponEnhanceAura";

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
  };
}

export const RemotePlayerEntity25D = memo(function RemotePlayerEntity25D({ player }: RemotePlayerProps) {
  const currentPos = useRef(new THREE.Vector3(player.posX, 0, player.posZ));
  const targetPos = useRef(new THREE.Vector3(player.posX, 0, player.posZ));

  useFrame((_, delta) => {
    targetPos.current.set(player.posX, 0, player.posZ);
    currentPos.current.lerp(targetPos.current, Math.min(delta * 12.0, 1.0));
  });

  const classColor = {
    fighter: "#ff3366",
    tank: "#f59e0b",
    assassin: "#9d4edd",
    gunner: "#00f2ff",
  }[player.classId] || "#00f2ff";

  return (
    <group position={currentPos.current}>
      {/* ── Weapon Enhancement Aura if high level ── */}
      {player.enhanceLevel >= 7 && (
        <WeaponEnhanceAura
          enhanceLevel={player.enhanceLevel}
          position={new THREE.Vector3(0, 0, 0)}
        />
      )}

      {/* ── 2.5D Sprite Billboard ── */}
      <SpriteBillboard25D
        position={new THREE.Vector3(0, 0, 0)}
        state={player.animState === "run" ? "run" : player.animState === "attack" ? "attack1" : "idle"}
        facingLeft={Boolean(player.facingLeft)}
        textureKey={`player_${player.classId}`}
        color={classColor}
        hairStyle={(player as any).hairStyle}
        hairColor={(player as any).hairColor}
        outfitId={(player as any).outfitId}
        auraIds={(player as any).auraIds}
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
          position={new THREE.Vector3(0, 0, 0)}
        />
      )}
    </group>
  );
});

