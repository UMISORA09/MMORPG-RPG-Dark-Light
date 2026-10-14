import { memo } from "react";
import * as THREE from "three";
import { SlashArcShader } from "./SlashArcShader";
import { ShockwaveRingShader } from "./ShockwaveRingShader";
import { CyberProjectileVFX } from "./CyberProjectileVFX";
import { HolyShieldDomeVFX } from "./HolyShieldDomeVFX";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import type { SkillVFXConfig } from "@/skills/types";

export interface ActiveVFXInstance {
  id: number;
  config: SkillVFXConfig;
  position: THREE.Vector3;
  direction: number;
}

export const VFXManager = memo(function VFXManager() {
  const activeVFXList = useGameWorldStore((s) => s.activeVFXList || []);
  const removeVFX = useGameWorldStore((s) => s.removeVFX);

  return (
    <group>
      {activeVFXList.map((item) => {
        const { id, config, position, direction } = item;

        switch (config.type) {
          case "SLASH_ARC":
          case "TWIN_SLASH":
          case "DASH_AFTERIMAGE":
            return (
              <SlashArcShader
                key={`vfx-${id}`}
                position={position}
                direction={direction}
                primaryColor={config.primaryColor}
                secondaryColor={config.secondaryColor}
                scale={config.scale}
                duration={config.duration}
                onComplete={() => removeVFX && removeVFX(id)}
              />
            );

          case "DRAGON_SHOCKWAVE":
          case "BOSS_METEOR_AOE":
            return (
              <ShockwaveRingShader
                key={`vfx-${id}`}
                position={position}
                primaryColor={config.primaryColor}
                secondaryColor={config.secondaryColor}
                radius={config.scale * 2.2}
                duration={config.duration}
                onComplete={() => removeVFX && removeVFX(id)}
              />
            );

          case "CYBER_PROJECTILE":
          case "LASER_BARRAGE": {
            const velX = Math.cos(direction) * 20.0;
            const velZ = Math.sin(direction) * 20.0;
            return (
              <CyberProjectileVFX
                key={`vfx-${id}`}
                position={position}
                velocity={[velX, 0, velZ]}
                primaryColor={config.primaryColor}
                secondaryColor={config.secondaryColor}
                scale={config.scale}
                duration={config.duration}
                onHit={() => removeVFX && removeVFX(id)}
              />
            );
          }

          case "HOLY_SHIELD_DOME":
            return (
              <HolyShieldDomeVFX
                key={`vfx-${id}`}
                position={position}
                primaryColor={config.primaryColor}
                secondaryColor={config.secondaryColor}
                radius={config.scale * 1.5}
                duration={config.duration}
                onComplete={() => removeVFX && removeVFX(id)}
              />
            );

          default:
            return null;
        }
      })}
    </group>
  );
});
