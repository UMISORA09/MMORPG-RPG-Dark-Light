import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { ZoneDetector } from "./ZoneDetector";
import { useGameStore } from "@/game/useGameStore";

// ==============================================================================
// 3 Seamless Interconnected Zones in 1 Scene
// Zone 1: Safe Village (r < 18m)
// Zone 2: Wilderness Arena (18m <= r < 50m)
// Zone 3: Boss Raid Altar (z < -50m, accessed via Stone Bridge)
// ==============================================================================

export const SeamlessWorldMap = memo(function SeamlessWorldMap() {
  const bossRingRef = useRef<THREE.Mesh>(null);
  const portalRuneRef = useRef<THREE.Mesh>(null);
  const setActiveModal = useGameStore((s) => s.setActiveModal);

  // Rotating Magic Runes effect
  useFrame((_, delta) => {
    if (bossRingRef.current) {
      bossRingRef.current.rotation.z += delta * 0.4;
    }
    if (portalRuneRef.current) {
      portalRuneRef.current.rotation.z -= delta * 0.25;
    }
  });

  return (
    <group>
      {/* ── REAL-TIME ZONE DETECTOR & AUDIO / HUD SIGNALS ── */}
      <ZoneDetector />

      {/* ── ATMOSPHERIC LIGHTING & FOG ── */}
      <ambientLight color="#1e1b4b" intensity={0.75} />
      
      {/* Moonlit Key Directional Light */}
      <directionalLight
        position={[25, 45, 20]}
        intensity={1.8}
        color="#e0e7ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
      />

      {/* Subtle Blue Fill Light */}
      <directionalLight position={[-30, 20, -30]} intensity={0.4} color="#60a5fa" />

      {/* ── ZONE 1: LÀNG LONG TỘC (SAFE VILLAGE ZONE - radius < 18m) ── */}
      <group position={[0, 0, 0]}>
        {/* Village Granite Cobblestone Plaza Floor */}
        <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[18, 48]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        {/* Outer Rune Ring Border (Safe Zone boundary indicator) */}
        <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[17.4, 18.2, 48]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
        </mesh>

        {/* Central Dragon Healing Fountain */}
        <group position={[0, 0, 0]}>
          {/* Stone Basin */}
          <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
            <cylinderGeometry args={[3.2, 3.6, 0.8, 24]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>
          {/* Healing Radiant Water */}
          <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.8, 24]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#0891b2"
              emissiveIntensity={0.8}
              roughness={0.1}
            />
          </mesh>
          {/* Dragon Obelisk at Center */}
          <mesh castShadow position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.4, 0.9, 3.6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          {/* Healing Core Gem */}
          <mesh position={[0, 4.6, 0]}>
            <octahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={1.5}
            />
          </mesh>
          {/* Fountain Healing Light */}
          <pointLight position={[0, 3.5, 0]} color="#38bdf8" intensity={3.5} distance={15} />
        </group>

        {/* 4 Dark Fantasy Lantern Posts around village */}
        {[
          [-10, 0, -10],
          [10, 0, -10],
          [-10, 0, 10],
          [10, 0, 10],
        ].map(([lx, ly, lz], i) => (
          <group key={`lamp-${i}`} position={[lx, ly, lz]}>
            <mesh castShadow position={[0, 2.0, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 4, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
              <boxGeometry args={[0.7, 0.9, 0.7]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#d97706"
                emissiveIntensity={2.0}
              />
            </mesh>
            <pointLight position={[0, 4.2, 0]} color="#f59e0b" intensity={2.2} distance={14} castShadow />
          </group>
        ))}

        {/* 2 Ancient Magic Guardian Trees */}
        {[-14, 14].map((tx, idx) => (
          <group key={`tree-${idx}`} position={[tx, 0, 5]}>
            <mesh castShadow position={[0, 3, 0]}>
              <cylinderGeometry args={[0.5, 0.9, 6, 8]} />
              <meshStandardMaterial color="#2d1d11" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 6.5, 0]}>
              <sphereGeometry args={[2.8, 12, 12]} />
              <meshStandardMaterial color="#064e3b" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* NPC 1: Thương Gia Long Tộc (Opens Shop Modal) */}
        <group position={[-7, 0, -4]}>
          <SpriteBillboard25D
            position={[0, 0, 0]}
            textureKey="npc_shop"
            color="#f59e0b"
            secondaryColor="#fbbf24"
            weaponType="shield"
            name="🪙 Thương Nhân Bảo Khố"
            level={99}
            hp={9999}
            maxHp={9999}
            onClick={() => setActiveModal("shop")}
          />
          {/* Clickable prompt text */}
          <Text
            position={[0, 2.9, 0]}
            fontSize={0.24}
            color="#fbbf24"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000"
          >
            [Click hoặc phím B: Mở Shop]
          </Text>
        </group>

        {/* NPC 2: Bia Vinh Danh Long Tộc (Opens Leaderboard Modal) */}
        <group position={[7, 0, -4]}>
          <SpriteBillboard25D
            position={[0, 0, 0]}
            textureKey="npc_leaderboard"
            color="#a855f7"
            secondaryColor="#c084fc"
            weaponType="sword"
            name="🏆 Đại Sứ Vinh Danh"
            level={99}
            hp={9999}
            maxHp={9999}
            onClick={() => setActiveModal("leaderboard")}
          />
          <Text
            position={[0, 2.9, 0]}
            fontSize={0.24}
            color="#c084fc"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000"
          >
            [Click hoặc phím L: Bảng Xếp Hạng]
          </Text>
        </group>

        {/* NPC 3: Trưởng Lão Làng Long Tộc */}
        <group position={[0, 0, -7.5]}>
          <SpriteBillboard25D
            position={[0, 0, 0]}
            textureKey="npc_elder"
            color="#10b981"
            secondaryColor="#34d399"
            weaponType="gun"
            name="📜 Trưởng Lão Làng"
            level={100}
            hp={9999}
            maxHp={9999}
          />
        </group>
      </group>

      {/* ── ZONE 2: ĐẤU TRƯỜNG HOANG DÃ (WILDERNESS ZONE - 18m <= radius < 50m) ── */}
      <group position={[0, 0, 0]}>
        {/* Dark Wilderness Ring Ground */}
        <mesh receiveShadow position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[18, 50, 64]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>

        {/* Ancient Broken Pillars & Boulders in Wilderness */}
        {[
          [-22, 0, -15],
          [-28, 0, 10],
          [-18, 0, 26],
          [24, 0, -18],
          [32, 0, 8],
          [20, 0, 24],
          [0, 0, 32],
          [-12, 0, 35],
          [12, 0, 35],
        ].map(([px, py, pz], idx) => {
          const height = 2.5 + (idx % 3) * 1.5;
          return (
            <group key={`ruin-${idx}`} position={[px, py, pz]}>
              {/* Broken Stone Pillar */}
              <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <cylinderGeometry args={[0.7, 0.9, height, 8]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Mossy Cap Rock */}
              <mesh castShadow position={[0, height + 0.3, 0]}>
                <dodecahedronGeometry args={[0.9, 0]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
            </group>
          );
        })}

        {/* Wilderness Monster Spawn Gate / Altar Indicators */}
        {[
          [-22, 0, -22],
          [22, 0, -22],
          [-26, 0, 16],
          [26, 0, 16],
        ].map(([sx, sy, sz], sidx) => (
          <group key={`spawner-${sidx}`} position={[sx, sy, sz]}>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[2.5, 16]} />
              <meshBasicMaterial color="#6366f1" transparent opacity={0.35} />
            </mesh>
            <pointLight position={[0, 1.2, 0]} color="#6366f1" intensity={1.5} distance={8} />
          </group>
        ))}
      </group>

      {/* ── STONE BRIDGE TO BOSS RAID (z from -40 to -52) ── */}
      <group position={[0, 0, 0]}>
        {/* Bridge Floor */}
        <mesh receiveShadow castShadow position={[0, -0.04, -46]}>
          <boxGeometry args={[7, 0.4, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Bridge Left Railing */}
        <mesh castShadow position={[-3.3, 0.6, -46]}>
          <boxGeometry args={[0.4, 1.2, 14]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Bridge Right Railing */}
        <mesh castShadow position={[3.3, 0.6, -46]}>
          <boxGeometry args={[0.4, 1.2, 14]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Bridge Torches */}
        {[-42, -50].map((bz) => (
          <group key={`bridge-torch-${bz}`}>
            <pointLight position={[-3.3, 2, bz]} color="#f97316" intensity={2.5} distance={10} />
            <pointLight position={[3.3, 2, bz]} color="#f97316" intensity={2.5} distance={10} />
          </group>
        ))}
      </group>

      {/* ── ZONE 3: CẤM ĐỊA SĂN BOSS (BOSS RAID ALTAR - z < -50m) ── */}
      <group position={[0, 0, -70]}>
        {/* Boss Obsidian Octagon Arena */}
        <mesh receiveShadow position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[18, 32]} />
          <meshStandardMaterial
            color="#090514"
            roughness={0.6}
            metalness={0.3}
          />
        </mesh>

        {/* Outer Molten Lava Moat */}
        <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[17.5, 26, 32]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* Spinning Fiery Magic Rune Ring on Floor */}
        <mesh
          ref={bossRingRef}
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[8, 14, 32]} />
          <meshBasicMaterial color="#dc2626" transparent opacity={0.65} />
        </mesh>

        {/* Inner Pentagram / Dragon Core Seal */}
        <mesh
          ref={portalRuneRef}
          position={[0, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[5, 6]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.5} wireframe />
        </mesh>

        {/* 6 Giant Dragon Horn Obelisks bounding the Boss Arena */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const ox = Math.cos(rad) * 16.5;
          const oz = Math.sin(rad) * 16.5;
          return (
            <group key={`boss-pillar-${deg}`} position={[ox, 0, oz]}>
              <mesh castShadow position={[0, 4.5, 0]}>
                <cylinderGeometry args={[0.5, 1.3, 9, 6]} />
                <meshStandardMaterial
                  color="#1c1917"
                  emissive="#7f1d1d"
                  emissiveIntensity={0.6}
                  roughness={0.7}
                />
              </mesh>
              {/* Flaming Brazier at top of obelisk */}
              <pointLight position={[0, 9.2, 0]} color="#ef4444" intensity={3.5} distance={18} />
            </group>
          );
        })}

        {/* Core Boss Ambient Aura */}
        <pointLight position={[0, 4, 0]} color="#ef4444" intensity={4.5} distance={30} />
      </group>
    </group>
  );
});
