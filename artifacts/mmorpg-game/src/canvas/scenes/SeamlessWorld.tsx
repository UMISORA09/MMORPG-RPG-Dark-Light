import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  SAFE_ZONE_RADIUS,
  WILDERNESS_RADIUS,
  BOSS_ZONE_Z,
  BOSS_SPAWN,
  NPC_SHOP_POS,
  NPC_LEADERBOARD_POS,
  NPC_ELDER_POS,
} from "../../game/constants";
import { useGameStore } from "../../stores";

const SeamlessWorld = memo(function SeamlessWorld() {
  return (
    <group>
      {/* ── 1. Sky & Environment Lights ── */}
      <ambientLight intensity={0.65} color="#dbeafe" />
      <directionalLight
        position={[25, 45, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* ── 2. Unified Terrain & Ground Meshes ── */}
      <WorldGround />

      {/* ── 3. Zone 1: Làng Long Tộc (Safe Zone) ── */}
      <VillagePlaza />
      <FountainOfLife />
      <VillageNPCs />

      {/* ── 4. Zone 2: Đấu Trường Hoang Dã (Wilderness) ── */}
      <WildernessRuins />

      {/* ── 5. Zone 3: Cấm Địa Săn Boss (Boss Raid Sanctuary) ── */}
      <BossSanctuary />
    </group>
  );
});

export default SeamlessWorld;

// ==============================================================================
// 1. Unified Multi-Textured Ground Base
// ==============================================================================
function WorldGround() {
  return (
    <group>
      {/* Massive seamless base plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -20]} receiveShadow>
        <planeGeometry args={[140, 180, 1, 1]} />
        <meshStandardMaterial color="#2d3748" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Zone 1: Village Lawn (Green grass disk) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[SAFE_ZONE_RADIUS, 64]} />
        <meshLambertMaterial color="#487332" />
      </mesh>

      {/* Village Protective Rune Barrier Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[SAFE_ZONE_RADIUS - 0.35, SAFE_ZONE_RADIUS + 0.35, 64]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Zone 2: Wilderness Rugged Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <ringGeometry args={[SAFE_ZONE_RADIUS, WILDERNESS_RADIUS, 48]} />
        <meshStandardMaterial color="#3b332a" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Zone 3: Boss Volcanic Magma Plate (North of z = -45) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -68]} receiveShadow>
        <planeGeometry args={[90, 50, 16, 16]} />
        <meshStandardMaterial color="#1a0808" roughness={0.8} />
      </mesh>

      {/* Glowing Magma Strips in Boss Zone */}
      {[-24, -8, 8, 24].map((x, i) => (
        <mesh key={`lava-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -68]}>
          <planeGeometry args={[3, 44]} />
          <meshBasicMaterial color="#ff3b00" />
        </mesh>
      ))}
    </group>
  );
}

// ==============================================================================
// 2. Zone 1: Làng Long Tộc (Safe Zone Components)
// ==============================================================================
function VillagePlaza() {
  return (
    <group>
      {/* Cobblestone Central Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshStandardMaterial color="#718096" roughness={0.8} />
      </mesh>

      {/* Cozy Village Houses */}
      <House position={[-12, 0, -8]} rotation={0.3} color="#854d0e" />
      <House position={[12, 0, -8]} rotation={-0.3} color="#854d0e" />
      <House position={[-12, 0, 8]} rotation={0.8} color="#78350f" />
      <House position={[12, 0, 8]} rotation={-0.8} color="#78350f" />

      {/* Path to the North Wilderness */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, -12]}>
        <planeGeometry args={[6, 14]} />
        <meshStandardMaterial color="#a0aec0" roughness={0.7} />
      </mesh>

      {/* Village Torches / Lanterns */}
      <Lantern position={[-6, 0, 2]} />
      <Lantern position={[6, 0, 2]} />
      <Lantern position={[-6, 0, -10]} />
      <Lantern position={[6, 0, -10]} />
    </group>
  );
}

function House({ position, rotation, color }: { position: [number, number, number]; rotation: number; color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* House Body */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[5, 4, 5]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.2, 2.5, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.2, 2.52]}>
        <planeGeometry args={[1.4, 2.4]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Warm Window Light */}
      <mesh position={[1.5, 2.2, 2.52]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 3, 8]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <pointLight position={[0, 2.8, 0]} color="#fef08a" intensity={1.8} distance={8} decay={2} />
    </group>
  );
}

function FountainOfLife() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

function VillageNPCs() {
  const setActiveModal = useGameStore((s) => s.setActiveModal);

  return (
    <group>
      {/* NPC 1: Thương Gia Trang Bị (Shop) */}
      <group
        position={[NPC_SHOP_POS.x, NPC_SHOP_POS.y, NPC_SHOP_POS.z]}
        onClick={() => setActiveModal("shop")}
      >
        {/* NPC Body */}
        <mesh position={[0, 1, 0]} castShadow>
          <capsuleGeometry args={[0.45, 1, 8, 16]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        {/* Merchant Hat */}
        <mesh position={[0, 1.8, 0]}>
          <coneGeometry args={[0.7, 0.6, 12]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        {/* Overhead Icon */}
        <mesh position={[0, 2.6, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <pointLight position={[0, 2.6, 0]} color="#38bdf8" intensity={2} distance={4} decay={2} />
      </group>

      {/* NPC 2: Đài Vinh Danh (Leaderboard Monument) */}
      <group
        position={[NPC_LEADERBOARD_POS.x, NPC_LEADERBOARD_POS.y, NPC_LEADERBOARD_POS.z]}
        onClick={() => setActiveModal("leaderboard")}
      >
        {/* Monument Pedestal */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.8, 1.2, 1.8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Golden Trophy Column */}
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.6, 2, 8]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Overhead Golden Orb */}
        <mesh position={[0, 3.4, 0]}>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial color="#facc15" roughness={0.1} metalness={0.9} />
        </mesh>
        <pointLight position={[0, 3.4, 0]} color="#facc15" intensity={2.5} distance={6} decay={2} />
      </group>

      {/* NPC 3: Trưởng Làng Long Tộc (Elder) */}
      <group
        position={[NPC_ELDER_POS.x, NPC_ELDER_POS.y, NPC_ELDER_POS.z]}
        onClick={() => setActiveModal("battle_logs")}
      >
        <mesh position={[0, 1, 0]} castShadow>
          <capsuleGeometry args={[0.45, 1, 8, 16]} />
          <meshStandardMaterial color="#7e22ce" />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
        <pointLight position={[0, 2.2, 0]} color="#c084fc" intensity={1.5} distance={5} decay={2} />
      </group>
    </group>
  );
}

// ==============================================================================
// 3. Zone 2: Đấu Trường Hoang Dã (Wilderness Zone Components)
// ==============================================================================
function WildernessRuins() {
  const pillars: [number, number][] = [
    [24, 18], [-24, 18], [32, -12], [-32, -12],
    [28, -32], [-28, -32], [16, -42], [-16, -42],
  ];

  return (
    <group>
      {pillars.map(([x, z], i) => (
        <group key={`pillar-${i}`} position={[x, 0, z]}>
          {/* Ancient Dragon Pillar */}
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.8, 1.1, 6, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          {/* Broken Cap */}
          <mesh position={[0, 6.2, 0]} rotation={[0.2, 0.4, 0]}>
            <boxGeometry args={[2, 0.6, 2]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          {/* Torch Fire atop pillar */}
          <pointLight position={[0, 6.8, 0]} color="#f97316" intensity={2.2} distance={10} decay={2} />
        </group>
      ))}

      {/* Scattered Rocks & Boulders */}
      {[
        [20, 0, 5], [-20, 0, 8], [30, 0, -20], [-30, 0, -22],
        [8, 0, -28], [-8, 0, -28],
      ].map(([x, y, z], i) => (
        <mesh key={`rock-${i}`} position={[x, 0.8, z]} castShadow>
          <dodecahedronGeometry args={[1.2 + (i % 3) * 0.4]} />
          <meshStandardMaterial color="#4b5563" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ==============================================================================
// 4. Zone 3: Cấm Địa Săn Boss (Boss Raid Sanctuary Components)
// ==============================================================================
function BossSanctuary() {
  const flameRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (flameRef.current) {
      flameRef.current.intensity = 3.5 + Math.sin(clock.getElapsedTime() * 8) * 0.8;
    }
  });

  return (
    <group position={[BOSS_SPAWN.x, BOSS_SPAWN.y, BOSS_SPAWN.z]}>
      {/* Grand Elevated Stone Altar */}
      <mesh position={[0, 0.8, 0]} receiveShadow>
        <cylinderGeometry args={[14, 16, 1.6, 32]} />
        <meshStandardMaterial color="#1c1917" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Altar Rune Inset */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.65, 0]}>
        <circleGeometry args={[11, 32]} />
        <meshStandardMaterial color="#450a0a" roughness={0.5} />
      </mesh>

      {/* Dragon Altar Flame Pillars */}
      {[
        [-10, -10], [10, -10], [-10, 10], [10, 10],
      ].map(([px, pz], i) => (
        <group key={`altar-pillar-${i}`} position={[px, 0, pz]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.9, 1.2, 6, 8]} />
            <meshStandardMaterial color="#292524" />
          </mesh>
          <mesh position={[0, 6.3, 0]}>
            <coneGeometry args={[1.2, 1, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <pointLight position={[0, 6.5, 0]} color="#ef4444" intensity={2.8} distance={14} decay={2} />
        </group>
      ))}

      {/* Roaring Heart of Dragon Flame Light */}
      <pointLight ref={flameRef} position={[0, 4, 0]} color="#ff4500" intensity={4} distance={30} decay={2} />
    </group>
  );
}
