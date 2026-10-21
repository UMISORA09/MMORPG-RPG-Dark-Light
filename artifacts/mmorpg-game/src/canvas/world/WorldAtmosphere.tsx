// ==============================================================================
// World Atmosphere, Cinematic Lighting & Ambient Magic Sparkles
// Atmospheric fog, dual-zone magical particles, and calibrated shadow biases
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { Sparkles } from "@react-three/drei";

export const WorldAtmosphere = memo(function WorldAtmosphere() {
  return (
    <group>
      {/* ── Key Directional Sunlight with crisp shadow map ── */}
      <directionalLight
        position={[30, 50, 25]}
        intensity={1.8}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.0005}
      />

      {/* ── Secondary Warm Fill Light ── */}
      <directionalLight
        position={[-30, 30, -20]}
        intensity={0.65}
        color="#fef3c7"
      />

      {/* ── High Intensity Ambient Light for Crisp Pixel Art Readability ── */}
      <ambientLight color="#ffffff" intensity={1.4} />
      <hemisphereLight args={["#8ae65c", "#fef3c7", 0.65]} />

      {/* ── Ambient Magic Particles Across Biomes (Optimized) ── */}
      {/* Safe Village Zone (Radiant Cyan & Gold stardust) */}
      <Sparkles
        count={18}
        scale={[32, 10, 32]}
        position={[0, 3.5, 0]}
        color="#00f2ff"
        size={3}
        speed={0.4}
        opacity={0.6}
      />
      <Sparkles
        count={10}
        scale={[24, 8, 24]}
        position={[0, 2.5, 0]}
        color="#fbbf24"
        size={2.5}
        speed={0.3}
        opacity={0.5}
      />

      {/* Wilderness Zone (Deep Purple Night Mist) */}
      <Sparkles
        count={24}
        scale={[90, 8, 90]}
        position={[0, 3, 0]}
        color="#a855f7"
        size={2.8}
        speed={0.35}
        opacity={0.4}
      />

      {/* Boss Raid Altar (Molten Fiery Ash & Cinders) */}
      <Sparkles
        count={20}
        scale={[40, 12, 40]}
        position={[0, 5, -70]}
        color="#ff3366"
        size={4}
        speed={0.8}
        opacity={0.75}
      />
      <Sparkles
        count={15}
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
