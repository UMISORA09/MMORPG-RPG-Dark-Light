// ==============================================================================
// 3D Instanced Environment Props (Optimized World Props)
// 8 Village Lanterns, Ancient Archway Gates, Crystal Rocks, Broken Pillars,
// Stone Bridge, and 6 Molten Dragon Horn Obelisks at Boss Altar
// ==============================================================================

import { memo, useMemo } from "react";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";

// 8 Lantern Positions around Village Perimeter (r = 17.5m)
const LANTERN_POSITIONS: [number, number, number][] = [
  0, 45, 90, 135, 180, 225, 270, 315,
].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return [Math.cos(rad) * 17.5, 0, Math.sin(rad) * 17.5];
});

// Crystal Rocks in Wilderness
const CRYSTAL_POSITIONS: [number, number, number, number][] = [
  [-24, 0, -12, 1.4],
  [-30, 0, 18, 1.8],
  [28, 0, -22, 1.6],
  [34, 0, 14, 2.0],
  [-16, 0, 32, 1.5],
  [22, 0, 30, 1.7],
  [-35, 0, -28, 2.2],
  [38, 0, -10, 1.9],
];

// Broken Pillars in Wilderness
const PILLAR_POSITIONS: [number, number, number, number][] = [
  [-22, 0, -15, 3.5],
  [-28, 0, 10, 4.2],
  [-18, 0, 26, 3.8],
  [24, 0, -18, 4.0],
  [32, 0, 8, 3.2],
  [20, 0, 24, 4.5],
  [0, 0, 32, 3.0],
  [-12, 0, 36, 2.8],
  [12, 0, 36, 2.8],
];

// 6 Giant Dragon Horn Obelisks bounding Boss Arena at (0, -70)
const BOSS_OBELISKS: [number, number, number][] = [
  0, 60, 120, 180, 240, 300,
].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return [Math.cos(rad) * 16.5, 0, -70 + Math.sin(rad) * 16.5];
});

export const WorldEnvironmentProps = memo(function WorldEnvironmentProps() {
  return (
    <group>
      {/* ── 1. CENTRAL HEALING STATUE & FOUNTAIN AT VILLAGE CORE (0, 0, 0) ── */}
      <group position={[0, 0, 0]}>
        {/* Ground Healing Aura Decal (Z-Fighting Free with polygonOffset) */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.5, 32]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent
            opacity={0.35}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-1}
          />
        </mesh>

        {/* Fountain Stone Basin */}
        <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[3.2, 3.6, 0.9, 24]} />
          <meshStandardMaterial color="#2c2738" roughness={0.65} />
        </mesh>

        {/* Healing Glowing Pool Water */}
        <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.9, 24]} />
          <meshStandardMaterial
            color="#00f2ff"
            emissive="#0891b2"
            emissiveIntensity={1.2}
            roughness={0.15}
          />
        </mesh>

        {/* Golden Dragon Light Obelisk */}
        <mesh castShadow position={[0, 2.8, 0]}>
          <cylinderGeometry args={[0.45, 0.95, 3.8, 8]} />
          <meshStandardMaterial color="#1a1429" roughness={0.4} />
        </mesh>

        {/* Radiant Heart Gem at Core */}
        <mesh position={[0, 5.0, 0]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#00f2ff"
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Fountain Warm Ambient Light */}
        <pointLight position={[0, 4.0, 0]} color="#00f2ff" intensity={3.5} distance={16} />
      </group>

      {/* ── 2. ANCIENT GATE ARCHWAYS (North Gate to Bridge & South Gate) ── */}
      {[-17.5, 17.5].map((gz, gidx) => (
        <group key={`gate-${gidx}`} position={[0, 0, gz]}>
          {/* Left Arch Pillar */}
          <mesh castShadow receiveShadow position={[-3.2, 3.0, 0]}>
            <boxGeometry args={[1.2, 6.0, 1.2]} />
            <meshStandardMaterial color="#2d2238" roughness={0.7} />
          </mesh>
          {/* Right Arch Pillar */}
          <mesh castShadow receiveShadow position={[3.2, 3.0, 0]}>
            <boxGeometry args={[1.2, 6.0, 1.2]} />
            <meshStandardMaterial color="#2d2238" roughness={0.7} />
          </mesh>
          {/* Top Lintel Arch */}
          <mesh castShadow receiveShadow position={[0, 6.2, 0]}>
            <boxGeometry args={[8.0, 1.2, 1.6]} />
            <meshStandardMaterial color="#3b2b4a" roughness={0.65} />
          </mesh>
          {/* Dragon Crest on Gate Top */}
          <mesh position={[0, 7.3, 0]}>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={1.8} />
          </mesh>
          <pointLight position={[0, 5.5, 0]} color="#fbbf24" intensity={2.0} distance={10} />
        </group>
      ))}

      {/* ── 3. 8 VILLAGE LANTERN POSTS (Warm Amber Light around Perimeter) ── */}
      {LANTERN_POSITIONS.map(([lx, ly, lz], i) => (
        <group key={`lamp-${i}`} position={[lx, ly, lz]}>
          {/* Post Pillar */}
          <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.16, 0.28, 4.0, 8]} />
            <meshStandardMaterial color="#1f1b2b" roughness={0.8} />
          </mesh>
          {/* Lantern Cage */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[0.75, 1.0, 0.75]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={2.5}
            />
          </mesh>
          {/* Warm Light Cast */}
          <pointLight
            position={[0, 4.2, 0]}
            color="#f59e0b"
            intensity={2.8}
            distance={15}
            castShadow
          />
        </group>
      ))}

      {/* ── 4. INSTANCED CRYSTAL ROCKS IN WILDERNESS ── */}
      <Instances range={CRYSTAL_POSITIONS.length}>
        <dodecahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#7c3aed"
          emissiveIntensity={1.4}
          roughness={0.3}
          metalness={0.6}
        />
        {CRYSTAL_POSITIONS.map(([cx, cy, cz, scale], idx) => (
          <Instance
            key={`crystal-${idx}`}
            position={[cx, cy + scale * 0.5, cz]}
            scale={[scale, scale * 1.5, scale]}
          />
        ))}
      </Instances>

      {/* Point Lights on prominent crystals */}
      {CRYSTAL_POSITIONS.slice(0, 4).map(([cx, , cz], idx) => (
        <pointLight
          key={`c-light-${idx}`}
          position={[cx, 1.8, cz]}
          color="#c084fc"
          intensity={1.8}
          distance={10}
        />
      ))}

      {/* ── 5. INSTANCED BROKEN RUIN PILLARS IN WILDERNESS ── */}
      <Instances range={PILLAR_POSITIONS.length}>
        <cylinderGeometry args={[0.65, 0.85, 1.0, 8]} />
        <meshStandardMaterial color="#2d283d" roughness={0.8} metalness={0.2} />
        {PILLAR_POSITIONS.map(([px, py, pz, h], pidx) => (
          <Instance
            key={`pillar-${pidx}`}
            position={[px, py + h * 0.5, pz]}
            scale={[1, h, 1]}
          />
        ))}
      </Instances>

      {/* ── 6. ANCIENT STONE BRIDGE TO BOSS RAID (z from -38 to -54) ── */}
      <group position={[0, 0, -46]}>
        {/* Bridge Solid Deck */}
        <mesh receiveShadow castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[7.5, 0.6, 16]} />
          <meshStandardMaterial color="#1f182b" roughness={0.7} />
        </mesh>
        {/* Left Railing */}
        <mesh castShadow position={[-3.5, 0.9, 0]}>
          <boxGeometry args={[0.5, 1.4, 16]} />
          <meshStandardMaterial color="#332942" roughness={0.8} />
        </mesh>
        {/* Right Railing */}
        <mesh castShadow position={[3.5, 0.9, 0]}>
          <boxGeometry args={[0.5, 1.4, 16]} />
          <meshStandardMaterial color="#332942" roughness={0.8} />
        </mesh>
        {/* Bridge Fire Torches */}
        {[-6, 0, 6].map((tz, tidx) => (
          <group key={`bridge-t-${tidx}`} position={[0, 0, tz]}>
            <pointLight position={[-3.5, 2.2, 0]} color="#ff6600" intensity={3.0} distance={12} />
            <pointLight position={[3.5, 2.2, 0]} color="#ff6600" intensity={3.0} distance={12} />
          </group>
        ))}
      </group>

      {/* ── 7. 6 OBSIDIAN DRAGON HORN OBELISKS AT BOSS ALTAR ── */}
      {BOSS_OBELISKS.map(([ox, oy, oz], bidx) => (
        <group key={`boss-obelisk-${bidx}`} position={[ox, oy, oz]}>
          {/* Obelisk Horn Body */}
          <mesh castShadow position={[0, 4.5, 0]}>
            <cylinderGeometry args={[0.5, 1.4, 9.0, 6]} />
            <meshStandardMaterial
              color="#0f0714"
              emissive="#7f1d1d"
              emissiveIntensity={0.8}
              roughness={0.65}
              metalness={0.5}
            />
          </mesh>
          {/* Flaming Brazier at Top */}
          <mesh position={[0, 9.2, 0]}>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial
              color="#ff2244"
              emissive="#ffaa00"
              emissiveIntensity={3.0}
            />
          </mesh>
          <pointLight position={[0, 9.5, 0]} color="#ef4444" intensity={4.5} distance={20} />
        </group>
      ))}
    </group>
  );
});
