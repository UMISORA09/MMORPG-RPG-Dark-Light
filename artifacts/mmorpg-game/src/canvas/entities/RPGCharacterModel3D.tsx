import { memo } from "react";
import { PixelArtCharacter25D } from "../character-environment/PixelArtCharacter25D";
import type { CharacterClassId, CharacterAnimationState } from "../character-environment/types";
import type { EntityAnimationState } from "../sprites/SpriteBillboard25D";
import type { WeaponType, ItemRarity } from "./WeaponSocket3D";

export interface RPGCharacterModel3DProps {
  classId?: string;
  gender?: "male" | "female";
  modelUrl?: string;
  animState?: EntityAnimationState;
  facingLeft?: boolean;
  color?: string;
  weaponType?: WeaponType;
  weaponRarity?: ItemRarity;
}

/**
 * RPGCharacterModel3D: Dedicated Pixel Art 2.5D Character Renderer
 * Chiến Long Bá là tựa game chuẩn HD Pixel Art 2.5D Action RPG.
 * Toàn bộ các model 3D khối hộp giả lập cũ đã được dọn sạch và thay thế hoàn toàn
 * bằng hệ thống nhân vật Pixel Art chất lượng cao.
 */
export const RPGCharacterModel3D = memo(function RPGCharacterModel3D({
  classId = "fighter",
  gender = "male",
  animState = "idle",
  facingLeft = false,
}: RPGCharacterModel3DProps) {
  // Map EntityAnimationState to CharacterAnimationState
  const mappedAnim: CharacterAnimationState =
    animState === "walk" || animState === "run"
      ? "run"
      : animState === "attack" ||
        animState === "attack1" ||
        animState === "attack2" ||
        animState === "attack3" ||
        animState === "attack4" ||
        animState === "air_attack"
      ? "attack_slash"
      : animState === "death" || animState === "hurt"
      ? "death"
      : "idle";

  const normClass: CharacterClassId =
    classId === "tank" || classId === "assassin" || classId === "gunner"
      ? classId
      : "fighter";

  return (
    <group name="rpg-character-pixel-model">
      <PixelArtCharacter25D
        classId={normClass}
        gender={gender}
        animState={mappedAnim}
        facingLeft={facingLeft}
      />
    </group>
  );
});

export default RPGCharacterModel3D;
