// ==============================================================================
// Skills & Character Factory Registry
// ==============================================================================

import type { CharacterClassBlueprint } from "./types";
import { GUNNER_BLUEPRINT } from "./classes/gunner.skills";
import { ASSASSIN_BLUEPRINT } from "./classes/assassin.skills";
import { FIGHTER_BLUEPRINT } from "./classes/fighter.skills";
import { TANK_BLUEPRINT } from "./classes/tank.skills";

export * from "./types";
export * from "./classes/gunner.skills";
export * from "./classes/assassin.skills";
export * from "./classes/fighter.skills";
export * from "./classes/tank.skills";

export const CHARACTER_BLUEPRINTS: Record<string, CharacterClassBlueprint> = {
  gunner: GUNNER_BLUEPRINT,
  assassin: ASSASSIN_BLUEPRINT,
  fighter: FIGHTER_BLUEPRINT,
  tank: TANK_BLUEPRINT,
};

export function getCharacterBlueprint(classId?: string | null): CharacterClassBlueprint {
  if (!classId) return FIGHTER_BLUEPRINT;
  const key = classId.toLowerCase();
  return CHARACTER_BLUEPRINTS[key] || FIGHTER_BLUEPRINT;
}
