import { memo } from "react";
import { Sparkles } from "@react-three/drei";
import type { PedestalThemeId } from "./types";
import { PEDESTAL_CONFIGS } from "./CharacterPedestal";

interface AtmosphericEffectsProps {
  themeId?: PedestalThemeId;
  enabled?: boolean;
}

export const AtmosphericEffects = memo(function AtmosphericEffects({
  themeId = "dark_fantasy_runic",
  enabled = true,
}: AtmosphericEffectsProps) {
  if (!enabled) return null;

  const config = PEDESTAL_CONFIGS[themeId] || PEDESTAL_CONFIGS.dark_fantasy_runic;
  if (config.particles.count <= 0) return null;

  return (
    <group position={[0, 0, 0]} name="atmospheric-effects">
      {/* ── Rising magical sparkles around character pedestal ── */}
      <Sparkles
        count={config.particles.count}
        scale={[config.radius * 2.2, 2.8, config.radius * 2.2]}
        position={[0, 1.2, 0]}
        color={config.particles.color}
        size={2.5}
        speed={config.particles.speed}
        opacity={0.65}
      />

      {/* ── Core concentrated stardust near pedestal surface ── */}
      <Sparkles
        count={Math.round(config.particles.count * 0.6)}
        scale={[config.radius * 1.5, 0.8, config.radius * 1.5]}
        position={[0, config.height + 0.3, 0]}
        color={config.runeGlowColor}
        size={3.0}
        speed={config.particles.speed * 0.7}
        opacity={0.8}
      />
    </group>
  );
});

