// ==============================================================================
// 3D Instanced Environment Props (Optimized World Props)
// Village Dark Fantasy Houses, Wooden Perimeter Fence, Central Healing Fountain,
// 8 Village Lanterns, Ancient Archway Gates, Crystal Rocks, Broken Pillars,
// Stone Bridge, 6 Dragon Horn Obelisks & 3D Glowing Dungeon Portal
// ==============================================================================

import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance, Html } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

// ── 4 Dark Fantasy Wooden Houses in Village ──
const VILLAGE_HOUSE_DATA = [
  {
    name: "Nhà Thợ Rèn Hắc Thiết",
    pos: [-11.5, 0, -10.5] as [number, number, number],
    rotY: Math.PI / 4,
    width: 6.2,
    depth: 5.6,
    roofColor: "#221526",
    chimney: true,
  },
  {
    name: "Hiệu Thuốc Giả Kim Cổ",
    pos: [11.5, 0, -10.5] as [number, number, number],
    rotY: -Math.PI / 4,
    width: 6.2,
    depth: 5.6,
    roofColor: "#1a1829",
    chimney: true,
  },
  {
    name: "Quán Trọ Bão Tuyết",
    pos: [-12.0, 0, 9.5] as [number, number, number],
    rotY: Math.PI * 0.75,
    width: 5.8,
    depth: 5.2,
    roofColor: "#2a151b",
    chimney: false,
  },
  {
    name: "Kho Khí Tài Quân Nhu",
    pos: [12.0, 0, 9.5] as [number, number, number],
    rotY: -Math.PI * 0.75,
    width: 5.8,
    depth: 5.2,
    roofColor: "#1a221f",
    chimney: false,
  },
];

// ── 8 Lantern Positions around Village Perimeter (r = 17.5m) ──
const LANTERN_POSITIONS: [number, number, number][] = [
  0, 45, 90, 135, 180, 225, 270, 315,
].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return [Math.cos(rad) * 17.5, 0, Math.sin(rad) * 17.5];
});

// ── Village Wooden Fence Posts (r = 21.5m, leaving 4m gaps at 4 gates) ──
const FENCE_POST_POSITIONS: [number, number, number, number][] = [];
for (let deg = 0; deg < 360; deg += 12) {
  const isNearEastGate = Math.abs(deg - 0) <= 8 || Math.abs(deg - 360) <= 8;
  const isNearSouthGate = Math.abs(deg - 90) <= 8;
  const isNearWestGate = Math.abs(deg - 180) <= 8;
  const isNearNorthGate = Math.abs(deg - 270) <= 8;

  if (!isNearEastGate && !isNearSouthGate && !isNearWestGate && !isNearNorthGate) {
    const rad = (deg * Math.PI) / 180;
    FENCE_POST_POSITIONS.push([
      Math.cos(rad) * 21.5,
      0,
      Math.sin(rad) * 21.5,
      rad + Math.PI / 2, // Tangential rotation for cross beams
    ]);
  }
}

// ── Crystal Rocks in Wilderness ──
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

// ── Broken Pillars in Wilderness ──
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

// ── 6 Giant Dragon Horn Obelisks bounding Boss Arena at (0, -70) ──
const BOSS_OBELISKS: [number, number, number][] = [
  0, 60, 120, 180, 240, 300,
].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return [Math.cos(rad) * 16.5, 0, -70 + Math.sin(rad) * 16.5];
});

export const WorldEnvironmentProps = memo(function WorldEnvironmentProps() {
  const portalVortexRef = useRef<THREE.Mesh>(null);
  const portalRuneRingRef = useRef<THREE.Mesh>(null);
  const portalLightRef = useRef<THREE.PointLight>(null);

  // Rotating Portal Effects
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (portalVortexRef.current) {
      portalVortexRef.current.rotation.z = t * 1.5;
    }
    if (portalRuneRingRef.current) {
      portalRuneRingRef.current.rotation.z = -t * 0.8;
    }
    if (portalLightRef.current) {
      portalLightRef.current.intensity = 3.5 + Math.sin(t * 4.0) * 1.2;
    }
  });

  const handlePortalClick = () => {
    playCombatSFX("dragon_roar", 0.5);
    useGameWorldStore.getState().openDungeonModal();
  };

  const handleMemorialClick = () => {
    playCombatSFX("holy_bell", 0.5);
    useGameWorldStore.getState().setActiveModal("leaderboard");
  };

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

      {/* ── 2. DARK FANTASY WOODEN HOUSES IN VILLAGE ── */}
      {VILLAGE_HOUSE_DATA.map((house, hIdx) => (
        <group key={`house-${hIdx}`} position={house.pos} rotation={[0, house.rotY, 0]}>
          {/* Main House Wooden Walls */}
          <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
            <boxGeometry args={[house.width, 4.4, house.depth]} />
            <meshStandardMaterial color="#2a1f1b" roughness={0.85} />
          </mesh>

          {/* Dark Fantasy Pointed Roof */}
          <mesh castShadow receiveShadow position={[0, 5.2, 0]}>
            <coneGeometry args={[Math.max(house.width, house.depth) * 0.75, 2.4, 4]} />
            <meshStandardMaterial color={house.roofColor} roughness={0.7} />
          </mesh>

          {/* Wooden Entrance Door with Warm Glow */}
          <mesh position={[0, 1.4, house.depth * 0.5 + 0.05]}>
            <boxGeometry args={[1.6, 2.8, 0.15]} />
            <meshStandardMaterial color="#3d281a" roughness={0.9} />
          </mesh>
          <pointLight
            position={[0, 1.6, house.depth * 0.5 + 0.8]}
            color="#f59e0b"
            intensity={1.5}
            distance={5}
          />

          {/* Cozy Glowing Window */}
          <mesh position={[house.width * 0.28, 2.4, house.depth * 0.5 + 0.05]}>
            <boxGeometry args={[1.0, 1.0, 0.1]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.8}
            />
          </mesh>

          {/* Stone Chimney */}
          {house.chimney && (
            <group position={[house.width * 0.3, 5.2, -house.depth * 0.2]}>
              <mesh castShadow position={[0, 0, 0]}>
                <boxGeometry args={[0.9, 2.5, 0.9]} />
                <meshStandardMaterial color="#332e3a" roughness={0.95} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* ── 2.5 BIA TƯỞNG NIỆM & BẢNG XẾP HẠNG LÀNG TÂN THỦ (6.5, 0, 4.5) ── */}
      <group position={[6.5, 0, 4.5]} onClick={handleMemorialClick}>
        {/* Tiered Stone Pedestal */}
        <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[3.0, 0.5, 2.6]} />
          <meshStandardMaterial color="#1e1828" roughness={0.7} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[2.2, 0.4, 1.8]} />
          <meshStandardMaterial color="#2d223a" roughness={0.65} />
        </mesh>

        {/* Tall Carved Obsidian Monument Tablet */}
        <mesh castShadow position={[0, 2.6, 0]}>
          <boxGeometry args={[1.5, 3.8, 0.5]} />
          <meshStandardMaterial
            color="#0b0813"
            emissive="#1e1133"
            emissiveIntensity={0.6}
            roughness={0.4}
            metalness={0.4}
          />
        </mesh>

        {/* Golden Dragon Relief Crest on Top */}
        <mesh position={[0, 4.7, 0]}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#d97706"
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Glowing Runes Inscription */}
        <mesh position={[0, 2.6, 0.26]}>
          <planeGeometry args={[1.1, 2.8]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Ambient Gold Point Light */}
        <pointLight position={[0, 3.2, 1.2]} color="#fbbf24" intensity={2.8} distance={8} />

        {/* 3D Floating Interactive Pill */}
        <Html position={[0, 5.5, 0]} center distanceFactor={14}>
          <button
            onClick={handleMemorialClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f131c]/95 border-2 border-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] text-amber-300 font-bold text-xs tracking-wider uppercase hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer pointer-events-auto"
          >
            <span>🏆</span>
            <span>Bia Tưởng Niệm & Xếp Hạng</span>
            <span className="bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/40 font-mono">
              [F / Click]
            </span>
          </button>
        </Html>
      </group>

      {/* ── 3. VILLAGE WOODEN PERIMETER FENCE & WATER MOAT ── */}
      {/* Village Water Moat Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[20.5, 23.5, 64]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0e3a47"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.4}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* ── 3.5 4 WOODEN CANAL BRIDGES (NORTH, SOUTH, EAST, WEST) ── */}
      {[
        { pos: [0, 0.06, -22.0] as [number, number, number], rot: 0, size: [4.4, 0.25, 4.4] as [number, number, number] },
        { pos: [0, 0.06, 22.0] as [number, number, number], rot: 0, size: [4.4, 0.25, 4.4] as [number, number, number] },
        { pos: [22.0, 0.06, 0] as [number, number, number], rot: Math.PI / 2, size: [4.4, 0.25, 4.4] as [number, number, number] },
        { pos: [-22.0, 0.06, 0] as [number, number, number], rot: Math.PI / 2, size: [4.4, 0.25, 4.4] as [number, number, number] },
      ].map((bridge, bIdx) => (
        <group key={`canal-bridge-${bIdx}`} position={bridge.pos} rotation={[0, bridge.rot, 0]}>
          {/* Bridge Planks Deck */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={bridge.size} />
            <meshStandardMaterial color="#3b2b1f" roughness={0.85} />
          </mesh>
          {/* Left Handrail */}
          <mesh castShadow position={[-bridge.size[0] * 0.48, 0.5, 0]}>
            <boxGeometry args={[0.2, 0.8, bridge.size[2]]} />
            <meshStandardMaterial color="#221812" roughness={0.9} />
          </mesh>
          {/* Right Handrail */}
          <mesh castShadow position={[bridge.size[0] * 0.48, 0.5, 0]}>
            <boxGeometry args={[0.2, 0.8, bridge.size[2]]} />
            <meshStandardMaterial color="#221812" roughness={0.9} />
          </mesh>
          {/* Lantern Posts on Bridge Ends */}
          <pointLight position={[-bridge.size[0] * 0.48, 1.2, 0]} color="#f59e0b" intensity={1.8} distance={6} />
          <pointLight position={[bridge.size[0] * 0.48, 1.2, 0]} color="#f59e0b" intensity={1.8} distance={6} />
        </group>
      ))}

      {/* Wooden Fence Posts & Crossbeams */}
      {FENCE_POST_POSITIONS.map(([fx, fy, fz, fRot], fIdx) => (
        <group key={`fence-${fIdx}`} position={[fx, fy, fz]} rotation={[0, fRot, 0]}>
          {/* Vertical Post */}
          <mesh castShadow position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 2.2, 6]} />
            <meshStandardMaterial color="#2e221d" roughness={0.9} />
          </mesh>
          {/* Pointed Post Top */}
          <mesh castShadow position={[0, 2.3, 0]}>
            <coneGeometry args={[0.18, 0.4, 6]} />
            <meshStandardMaterial color="#1f1613" roughness={0.9} />
          </mesh>
          {/* Horizontal Cross Beams */}
          <mesh castShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[2.5, 0.12, 0.14]} />
            <meshStandardMaterial color="#3a2b24" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 1.6, 0]}>
            <boxGeometry args={[2.5, 0.12, 0.14]} />
            <meshStandardMaterial color="#3a2b24" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* ── 4. 8 VILLAGE LANTERN POSTS (Warm Amber Light around Perimeter) ── */}
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

      {/* ── 5. ANCIENT GATE ARCHWAYS (North Gate to Bridge & South Gate) ── */}
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

      {/* ── 6. 3D GLOWING DUNGEON PORTAL GATE (North at [0, 0, -48]) ── */}
      <group position={[0, 0, -48]} onClick={handlePortalClick}>
        {/* Left Stone Obelisk Portal Frame */}
        <mesh castShadow receiveShadow position={[-3.8, 3.8, 0]}>
          <boxGeometry args={[1.4, 7.6, 1.4]} />
          <meshStandardMaterial color="#1b1229" roughness={0.6} />
        </mesh>
        {/* Right Stone Obelisk Portal Frame */}
        <mesh castShadow receiveShadow position={[3.8, 3.8, 0]}>
          <boxGeometry args={[1.4, 7.6, 1.4]} />
          <meshStandardMaterial color="#1b1229" roughness={0.6} />
        </mesh>
        {/* Top Arch Stone */}
        <mesh castShadow receiveShadow position={[0, 7.8, 0]}>
          <boxGeometry args={[9.0, 1.4, 1.8]} />
          <meshStandardMaterial color="#28193d" roughness={0.65} />
        </mesh>

        {/* Swirling Mystical Portal Vortex Decal */}
        <mesh
          ref={portalVortexRef}
          position={[0, 3.8, 0]}
          rotation={[0, 0, 0]}
        >
          <planeGeometry args={[5.8, 6.8]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rotating Rune Ring at Portal Core */}
        <mesh
          ref={portalRuneRingRef}
          position={[0, 3.8, 0.05]}
        >
          <ringGeometry args={[2.2, 2.8, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Vertical Heavenly Light Beam to Sky */}
        <mesh position={[0, 16.0, 0]}>
          <cylinderGeometry args={[2.0, 2.5, 24.0, 16, 1, true]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Portal Base Rune Pedestal */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4.2, 32]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Portal Pulsing Ambient Light */}
        <pointLight
          ref={portalLightRef}
          position={[0, 4.0, 1.5]}
          color="#c084fc"
          intensity={4.0}
          distance={18}
        />

        {/* 3D Floating Interactive Pill */}
        <Html position={[0, 9.2, 0]} center distanceFactor={15}>
          <button
            onClick={handlePortalClick}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0f131c]/95 border-2 border-purple-500 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.6)] text-purple-300 font-bold text-xs tracking-wider uppercase hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer pointer-events-auto"
          >
            <span>🌀</span>
            <span>Cổng Hang Động Phó Bản</span>
            <span className="bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded text-[10px] border border-purple-500/40 font-mono">
              [F / Click]
            </span>
          </button>
        </Html>
      </group>

      {/* ── 6.5 2 SIDE ANCIENT DUNGEON PORTALS ([-22, -48] & [22, -48]) ── */}
      {/* Left Side Portal: Hang Nhện Độc (Lv.5 - Lv.8, Emerald Green) */}
      <group position={[-22, 0, -48]} onClick={handlePortalClick}>
        <mesh castShadow position={[-2.4, 3.0, 0]}>
          <boxGeometry args={[1.0, 6.0, 1.0]} />
          <meshStandardMaterial color="#0f2619" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[2.4, 3.0, 0]}>
          <boxGeometry args={[1.0, 6.0, 1.0]} />
          <meshStandardMaterial color="#0f2619" roughness={0.7} />
        </mesh>
        <mesh position={[0, 6.0, 0]}>
          <boxGeometry args={[5.8, 1.0, 1.2]} />
          <meshStandardMaterial color="#1a3d29" roughness={0.7} />
        </mesh>
        {/* Emerald Swirling Vortex */}
        <mesh position={[0, 3.0, 0]}>
          <planeGeometry args={[4.2, 5.2]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 3.0, 1.0]} color="#10b981" intensity={3.0} distance={12} />
        <Html position={[0, 7.2, 0]} center distanceFactor={15}>
          <button
            onClick={handlePortalClick}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#061e12]/95 border border-emerald-500 rounded-full text-emerald-300 font-bold text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.5)] whitespace-nowrap cursor-pointer pointer-events-auto"
          >
            <span>🕷️</span>
            <span>Hang Nhện Độc (Lv.5)</span>
          </button>
        </Html>
      </group>

      {/* Right Side Portal: Hầm Ngục Hắc Ám (Lv.10 - Lv.14, Crimson Red) */}
      <group position={[22, 0, -48]} onClick={handlePortalClick}>
        <mesh castShadow position={[-2.4, 3.0, 0]}>
          <boxGeometry args={[1.0, 6.0, 1.0]} />
          <meshStandardMaterial color="#260f14" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[2.4, 3.0, 0]}>
          <boxGeometry args={[1.0, 6.0, 1.0]} />
          <meshStandardMaterial color="#260f14" roughness={0.7} />
        </mesh>
        <mesh position={[0, 6.0, 0]}>
          <boxGeometry args={[5.8, 1.0, 1.2]} />
          <meshStandardMaterial color="#3d1a22" roughness={0.7} />
        </mesh>
        {/* Crimson Swirling Vortex */}
        <mesh position={[0, 3.0, 0]}>
          <planeGeometry args={[4.2, 5.2]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 3.0, 1.0]} color="#f43f5e" intensity={3.0} distance={12} />
        <Html position={[0, 7.2, 0]} center distanceFactor={15}>
          <button
            onClick={handlePortalClick}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1e060c]/95 border border-rose-500 rounded-full text-rose-300 font-bold text-[11px] shadow-[0_0_15px_rgba(244,63,94,0.5)] whitespace-nowrap cursor-pointer pointer-events-auto"
          >
            <span>💀</span>
            <span>Hầm Ngục Hắc Ám (Lv.10)</span>
          </button>
        </Html>
      </group>

      {/* ── 7. INSTANCED CRYSTAL ROCKS IN WILDERNESS ── */}
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

      {/* ── 8. ANCIENT STONE BRIDGE TO BOSS RAID (z from -38 to -54) ── */}
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

      {/* ── 9. 6 OBSIDIAN DRAGON HORN OBELISKS AT BOSS ALTAR ── */}
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

      {/* ── 10. DEAD MARSH TOMBSTONES, SKELETONS & TOXIC POOLS (x > 22) ── */}
      {[
        { x: 26, z: -8, rot: 0.2 },
        { x: 34, z: -4, rot: -0.4 },
        { x: 28, z: 12, rot: 0.35 },
        { x: 36, z: 18, rot: -0.15 },
        { x: 42, z: 2, rot: 0.5 },
      ].map((tomb, tIdx) => (
        <group key={`marsh-tomb-${tIdx}`} position={[tomb.x, 0, tomb.z]} rotation={[0, tomb.rot, 0.08]}>
          {/* Cracked Weathered Tombstone */}
          <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[0.9, 1.6, 0.3]} />
            <meshStandardMaterial color="#2d2836" roughness={0.9} />
          </mesh>
          {/* Weathered Inscription Slot */}
          <mesh position={[0, 0.9, 0.16]}>
            <boxGeometry args={[0.4, 0.8, 0.05]} />
            <meshStandardMaterial color="#493e59" roughness={0.8} />
          </mesh>
          {/* Scattered Skull & Bone */}
          <mesh castShadow position={[0.6, 0.15, 0.4]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[-0.5, 0.1, 0.5]} rotation={[0, 0.6, 0.2]}>
            <cylinderGeometry args={[0.06, 0.08, 0.7, 5]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.7} />
          </mesh>
          {/* Toxic Marsh Slime Puddle */}
          <mesh position={[0, 0.03, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.2, 16]} />
            <meshStandardMaterial
              color="#581c87"
              emissive="#3b0764"
              emissiveIntensity={0.8}
              roughness={0.2}
              transparent
              opacity={0.75}
            />
          </mesh>
          <pointLight position={[0, 0.8, 0.6]} color="#a855f7" intensity={1.2} distance={6} />
        </group>
      ))}
    </group>
  );
});
