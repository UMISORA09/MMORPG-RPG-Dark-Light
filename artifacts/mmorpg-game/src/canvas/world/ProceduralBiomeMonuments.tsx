// ==============================================================================
// Procedural Biome Monuments & 3D Architectural Marvels (Chiến Long Bá MMORPG)
// Active Zone Culling: Renders only current biome structures:
// - Continent: Expanded Village 2.5x (Dragon Palace, Bell Tower, Smithy, Holy Fountain)
// - Desert: Dragon Skeleton, Giant Cacti, Sinking Sands, Oasis
// - Egypt: Stepped Giza Great Pyramid, Great Sphinx, Obelisks, Anubis Temple
// - Ocean: Poseidon Palace, Sunken Shipwreck, Glowing Corals, Bubbles
// - Snow: Crystal Ice Fortress, Ice Spires, Frost Lake
// - Void: Floating Star Islands, Molten Lava Veins, Divine Arena
// ==============================================================================

import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BiomeType } from "@/world/WorldMapRegistry";

interface Props {
  biome: BiomeType;
  isSafeVillage?: boolean;
}

export const ProceduralBiomeMonuments = memo(function ProceduralBiomeMonuments({
  biome,
  isSafeVillage = false,
}: Props) {
  if (isSafeVillage) {
    return <VillageExpandedPlaza3D />;
  }

  switch (biome) {
    case "continent":
      return <ContinentRuins3D />;
    case "desert":
      return <DesertMonuments3D />;
    case "egypt":
      return <EgyptPyramidMonuments3D />;
    case "ocean":
      return <AtlantisOceanMonuments3D />;
    case "snow":
      return <FrostFortressMonuments3D />;
    case "void":
      return <VoidCosmicMonuments3D />;
    default:
      return null;
  }
});

// ==============================================================================
// 1. Quần xã 1: Làng Long Tộc Mở Rộng 2.5x (Safe Village Expanded 3D)
// ==============================================================================
function VillageExpandedPlaza3D() {
  const bellRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (bellRef.current) {
      bellRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
    if (waterRef.current) {
      waterRef.current.position.y = 1.1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group>
      {/* ── 1.1 ĐẠI ĐIỆN LONG TỘC (Trung Tâm Phía Bắc z = -32) ── */}
      <group position={[0, 0, -32]}>
        {/* Main Pavilion Base */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 3, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Ornate Red & Gold Roof (Tier 1) */}
        <mesh position={[0, 4.0, 0]} castShadow>
          <boxGeometry args={[18, 1.2, 14]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Upper Tier Pavilion */}
        <mesh position={[0, 6.2, 0]} castShadow>
          <boxGeometry args={[11, 3.2, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Top Gold Dragon Curved Eaves Roof */}
        <mesh position={[0, 8.5, 0]} castShadow>
          <coneGeometry args={[9, 2.5, 4]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* 6 Front Pillars */}
        {[-6, -3.6, -1.2, 1.2, 3.6, 6].map((x, i) => (
          <mesh key={`dragon-pillar-${i}`} position={[x, 2.8, 5.5]} castShadow>
            <cylinderGeometry args={[0.3, 0.35, 3.8, 16]} />
            <meshStandardMaterial color="#991b1b" metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ── 1.2 ĐÀI PHUN NƯỚC THẦN THÁNH (Trung Tâm Làng x = 0, z = 0) ── */}
      <group position={[0, 0, 0]}>
        {/* Basin Base */}
        <mesh position={[0, 0.4, 0]} receiveShadow>
          <cylinderGeometry args={[4.2, 4.6, 0.8, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* Inner Water Mesh */}
        <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.8, 24]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.2} transparent opacity={0.85} />
        </mesh>
        {/* Central Fountain Tier */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[1.6, 1.2, 1.2, 16]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Floating Water Spout Orb */}
        <mesh ref={waterRef} position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <pointLight color="#38bdf8" intensity={1.5} distance={9} position={[0, 2.5, 0]} />
      </group>

      {/* ── 1.3 THÁP CHUÔNG CỔ (Phía Đông x = 28, z = 12) ── */}
      <group position={[28, 0, 12]}>
        {/* Stone Tower Base */}
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[4.5, 10, 4.5]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Belfry Open Room */}
        <mesh position={[0, 11, 0]}>
          <boxGeometry args={[3.8, 2.5, 3.8]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        {/* Bronze Bell */}
        <mesh ref={bellRef} position={[0, 10.8, 0]}>
          <cylinderGeometry args={[0.5, 0.9, 1.4, 16]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Steeple Peak */}
        <mesh position={[0, 13.5, 0]} castShadow>
          <coneGeometry args={[2.8, 3.5, 4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      </group>

      {/* ── 1.4 KHU LÒ RÈN LỬA ĐỎ (Phía Tây x = -28, z = 12) ── */}
      <group position={[-28, 0, 12]}>
        {/* Blacksmith Hut */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[7, 4, 6]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        {/* Chimney */}
        <mesh position={[2.5, 4.8, -1.8]} castShadow>
          <boxGeometry args={[1.4, 3, 1.4]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Fiery Chimney Top Glow */}
        <mesh position={[2.5, 6.4, -1.8]}>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshBasicMaterial color="#ff4500" />
        </mesh>
        <pointLight color="#ff4500" intensity={2.5} distance={12} position={[2.5, 6.5, -1.8]} />
        {/* Anvil Base outside */}
        <mesh position={[0, 0.5, 3.8]} castShadow>
          <boxGeometry args={[1.2, 1.0, 0.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ==============================================================================
// 2. Quần xã 1 (Ngoài Làng): Rừng Cổ Thụ & Phế Tích Lục Địa
// ==============================================================================
function ContinentRuins3D() {
  return (
    <group>
      {/* Broken Ancient Stone Arches */}
      {[-18, 18].map((x, idx) => (
        <group key={`arch-${idx}`} position={[x, 0, -20]}>
          <mesh position={[-2, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 5, 12]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[2, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 5, 12]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 5.2, 0]} castShadow>
            <boxGeometry args={[5, 0.8, 1]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==============================================================================
// 3. Quần xã 2: Đại Sa Mạc Cát Cháy (Dragon Skeleton & Giant Cacti)
// ==============================================================================
function DesertMonuments3D() {
  return (
    <group>
      {/* Colossal Dragon Skull Buried in Sand (z = -22) */}
      <group position={[0, 0.8, -22]}>
        {/* Skull Head */}
        <mesh position={[0, 2.2, 0]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[4.2, 3.0, 7.5]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.85} />
        </mesh>
        {/* Horns */}
        <mesh position={[-2.2, 4.2, -1.8]} rotation={[-0.4, 0, -0.5]} castShadow>
          <coneGeometry args={[0.5, 4.2, 8]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[2.2, 4.2, -1.8]} rotation={[-0.4, 0, 0.5]} castShadow>
          <coneGeometry args={[0.5, 4.2, 8]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        {/* Rib Cage Arches */}
        {[-8, -5, -2, 2, 5, 8].map((z, idx) => (
          <group key={`rib-${idx}`} position={[0, 1.8, z + 6]}>
            <mesh position={[-3.2, 0, 0]} rotation={[0, 0, -0.4]}>
              <cylinderGeometry args={[0.22, 0.22, 4.5, 8]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.9} />
            </mesh>
            <mesh position={[3.2, 0, 0]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.22, 0.22, 4.5, 8]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Giant Desert Cacti Clusters */}
      {[-24, 25].map((x, idx) => (
        <group key={`cactus-${idx}`} position={[x, 0, 10]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.85, 6, 12]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[-1.2, 3.8, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.4, 0.4, 2.4, 8]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
          <mesh position={[1.2, 4.4, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.4, 0.4, 2.2, 8]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
        </group>
      ))}

      {/* Emerald Oasis Lake (x = -16, z = 18) */}
      <group position={[-16, 0.05, 18]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7.5, 24]} />
          <meshStandardMaterial color="#059669" roughness={0.1} metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// ==============================================================================
// 4. Quần xã 3: Vương Quốc Ai Cập & Kim Tự Tháp (Great Pyramid & Sphinx)
// ==============================================================================
function EgyptPyramidMonuments3D() {
  return (
    <group>
      {/* ── 4.1 ĐẠI KIM TỰ THÁP KHUFU (Khối Đá Xếp Tầng Khổng Lồ Phía Bắc z = -38) ── */}
      <group position={[0, 0, -38]}>
        {/* Tier 1 Base */}
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[32, 6, 32]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.85} />
        </mesh>
        {/* Tier 2 */}
        <mesh position={[0, 8, 0]} castShadow receiveShadow>
          <boxGeometry args={[24, 5, 24]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>
        {/* Tier 3 */}
        <mesh position={[0, 12.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 4.5, 16]} />
          <meshStandardMaterial color="#eab308" roughness={0.75} />
        </mesh>
        {/* Golden Apex Capstone */}
        <mesh position={[0, 16.5, 0]} castShadow>
          <coneGeometry args={[6, 4, 4]} />
          <meshStandardMaterial color="#fef08a" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Entrance Portal Tunnel */}
        <mesh position={[0, 1.8, 16.1]}>
          <boxGeometry args={[4, 3.6, 2]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* ── 4.2 TƯỢNG NHÂN SƯ GREAT SPHINX (Phía Đông x = 24, z = 0) ── */}
      <group position={[24, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[5, 4.4, 9]} />
          <meshStandardMaterial color="#d97706" roughness={0.9} />
        </mesh>
        {/* Front Paws */}
        <mesh position={[-1.5, 0.7, 5.5]} castShadow>
          <boxGeometry args={[1.4, 1.4, 4]} />
          <meshStandardMaterial color="#ca8a04" />
        </mesh>
        <mesh position={[1.5, 0.7, 5.5]} castShadow>
          <boxGeometry args={[1.4, 1.4, 4]} />
          <meshStandardMaterial color="#ca8a04" />
        </mesh>
        {/* Pharaoh Human Head & Nemes Headdress */}
        <mesh position={[0, 5.4, 2.5]} castShadow>
          <boxGeometry args={[3.2, 3.6, 3]} />
          <meshStandardMaterial color="#eab308" roughness={0.7} />
        </mesh>
      </group>

      {/* ── 4.3 CỘT ĐÁ OBELISK KHẮC PHÙ HIỆU (4 Hướng) ── */}
      {[-18, 18].map((x, idx) => (
        <group key={`obelisk-${idx}`} position={[x, 0, -14]}>
          <mesh position={[0, 4.5, 0]} castShadow>
            <boxGeometry args={[1.4, 9, 1.4]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 9.6, 0]}>
            <coneGeometry args={[0.95, 1.4, 4]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} />
          </mesh>
          <pointLight color="#f59e0b" intensity={2} distance={8} position={[0, 9.8, 0]} />
        </group>
      ))}
    </group>
  );
}

// ==============================================================================
// 5. Quần xã 4: Đại Dương Sâu Thẳm & Thủy Cung Atlantis
// ==============================================================================
function AtlantisOceanMonuments3D() {
  const bubblesGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (bubblesGroup.current) {
      bubblesGroup.current.children.forEach((b, i) => {
        b.position.y = (b.position.y + 0.05 + (i % 3) * 0.02) % 12;
      });
    }
  });

  return (
    <group>
      {/* ── 5.1 CUNG ĐIỆN CẨM THẠCH HẢI VƯƠNG POSEIDON (z = -30) ── */}
      <group position={[0, 0, -30]}>
        {/* Pure White Marble Pavilion Base */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[20, 3, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* 8 Marble Columns */}
        {[-8, -5.5, -3, 3, 5.5, 8].map((x, i) => (
          <mesh key={`column-${i}`} position={[x, 4.5, 6]} castShadow>
            <cylinderGeometry args={[0.4, 0.45, 6, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
        ))}
        {/* Triangular Pediment */}
        <mesh position={[0, 8.2, 6]}>
          <coneGeometry args={[11, 2.2, 4]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
        </mesh>
        {/* Poseidon Golden Trident Symbol */}
        <mesh position={[0, 9.5, 6.2]}>
          <cylinderGeometry args={[0.1, 0.1, 2.8, 8]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} />
        </mesh>
      </group>

      {/* ── 5.2 XÁC THUYỀN BUỒM ĐẮM CỔ ĐẠI (x = -24, z = 10) ── */}
      <group position={[-24, 0, 10]} rotation={[0.2, 0.4, 0.3]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[4.5, 3.2, 10]} />
          <meshStandardMaterial color="#422006" roughness={0.9} />
        </mesh>
        {/* Broken Mast */}
        <mesh position={[0, 4.5, 0]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.2, 0.25, 7, 8]} />
          <meshStandardMaterial color="#291403" />
        </mesh>
      </group>

      {/* ── 5.3 RẠN SAN HÔ PHÁT QUANG DẠ QUANG & BONG BÓNG KHÍ ── */}
      <group ref={bubblesGroup}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh
            key={`bubble-${i}`}
            position={[(i % 4 - 2) * 8 + (i % 3), (i * 1.1) % 10, (i % 5 - 2) * 7]}
          >
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ==============================================================================
// 6. Quần xã 5: Đỉnh Tuyết Sơn & Pháo Đài Băng Pha Lê
// ==============================================================================
function FrostFortressMonuments3D() {
  return (
    <group>
      {/* Colossal Crystal Ice Citadel (z = -32) */}
      <group position={[0, 0, -32]}>
        {/* Central Spire */}
        <mesh position={[0, 8, 0]} castShadow>
          <coneGeometry args={[4, 16, 6]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.8} transparent opacity={0.88} />
        </mesh>
        {/* Left & Right Flanking Spires */}
        <mesh position={[-6, 6, 0]} castShadow>
          <coneGeometry args={[2.5, 12, 6]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
        </mesh>
        <mesh position={[6, 6, 0]} castShadow>
          <coneGeometry args={[2.5, 12, 6]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* Frozen Mirror Lake Decal */}
      <mesh position={[0, 0.05, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.05} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ==============================================================================
// 7. Quần xã 6: Hư Không Thần Vực & Cấm Địa Hoả Ngục
// ==============================================================================
function VoidCosmicMonuments3D() {
  const asteroidRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (asteroidRef.current) {
      asteroidRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {/* Floating Space Asteroids (z = -30) */}
      <group ref={asteroidRef} position={[0, 8, -30]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[5, 1]} />
          <meshStandardMaterial color="#31102f" roughness={0.8} />
        </mesh>
        {/* Orbiting Satellite Shards */}
        {[-8, 8].map((x, i) => (
          <mesh key={i} position={[x, i * 2, (i - 1) * 4]}>
            <dodecahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color="#1e1b4b" />
          </mesh>
        ))}
      </group>

      {/* Molten Lava Veins on ground */}
      {[-18, 0, 18].map((x, idx) => (
        <mesh key={`lava-vein-${idx}`} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 50]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
      ))}
    </group>
  );
}
