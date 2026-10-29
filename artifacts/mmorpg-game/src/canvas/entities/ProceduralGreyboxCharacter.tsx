import { memo } from "react";
import { RPGCharacterModel3D } from "./RPGCharacterModel3D";
import type { EntityAnimationState } from "../sprites/SpriteBillboard25D";
import type { WeaponType } from "./WeaponSocket3D";

export interface ProceduralGreyboxCharacterProps {
  classId?: string;
  gender?: "male" | "female";
  animState?: EntityAnimationState;
  facingLeft?: boolean;
  color?: string;
  weaponType?: WeaponType;
}

/**
 * ProceduralGreyboxCharacter: Redirected to Authentic 2.5D Pixel Art Character
 * Loại bỏ khối hộp xám cũ, luôn hiển thị đồ họa Pixel Art chuẩn Chiến Long Bá.
 */
export const ProceduralGreyboxCharacter = memo(function ProceduralGreyboxCharacter(
  props: ProceduralGreyboxCharacterProps
) {
  return <RPGCharacterModel3D {...props} />;
});

export default ProceduralGreyboxCharacter;
