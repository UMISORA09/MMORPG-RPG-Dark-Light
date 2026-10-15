// ==============================================================================
// World Atmosphere, Cinematic Lighting & Ambient Magic Sparkles
// Atmospheric fog, dual-zone magical particles, and calibrated shadow biases
// ==============================================================================

import { memo } from "react";
import { Sparkles } from "@react-three/drei";

export const WorldAtmosphere = memo(function WorldAtmosphere() {
  return (
    <group>
      {/* ── Atmospheric Fog: Deep mysterious night sky covering horizon ── */}
      <fogExp2 attach="fog" args={["#080414", 0.015]} />

      {/* ── Key Directional Moonbeam Light with crisp 2048 shadow map ── */}
      <directionalLight
        position={[25, 45, 20]}
        intensity={1.6}
        color="#e0e7ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={130}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.0005}
      />

      {/* ── Secondary Cool Blue Fill Light ── */}
      <directionalLight
        position={[-30, 25, -20]}
        intensity={0.45}
        color="#60a5fa"
      />

      {/* ── Ambient & Dark Fantasy Hemisphere Sky/Ground Light ── */}
      <ambientLight color="#181534" intensity={0.65} />
      <hemisphereLight args={["#7928ca", "#0a0518", 0.6]} />

      {/* ── Ambient Magic Particles Across Biomes ── */}
      {/* Safe Village Zone (Radiant Cyan & Gold stardust) */}
      <Sparkles
        count={50}
        scale={[32, 10, 32]}
        position={[0, 3.5, 0]}
        color="#00f2ff"
        size={3}
        speed={0.4}
        opacity={0.6}
      />
      <Sparkles
        count={30}
        scale={[24, 8, 24]}
        position={[0, 2.5, 0]}
        color="#fbbf24"
        size={2.5}
        speed={0.3}
        opacity={0.5}
      />

      {/* Wilderness Zone (Deep Purple Night Mist) */}
      <Sparkles
        count={70}
        scale={[90, 8, 90]}
        position={[0, 3, 0]}
        color="#a855f7"
        size={2.8}
        speed={0.35}
        opacity={0.4}
      />

      {/* Boss Raid Altar (Molten Fiery Ash & Cinders) */}
      <Sparkles
        count={65}
        scale={[40, 12, 40]}
        position={[0, 5, -70]}
        color="#ff3366"
        size={4}
        speed={0.8}
        opacity={0.75}
      />
      <Sparkles
        count={45}
        scale={[36, 10, 36]}
        position={[0, 4, -70]}
        color="#ffaa00"
        size={3.2}
        speed={0.7}
        opacity={0.7}
      />
    </group>
  );
});
