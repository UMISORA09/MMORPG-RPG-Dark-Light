// ==============================================================================
// PixelWorldEnvironmentProps.tsx
// Renders Ancient Lush Trees with falling leaves, Gnarled Dead Trees,
// 16-variant Grass Tufts, and Grounded Pixel Rocks with grass hugging bases
// ==============================================================================

import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import {
  createPixelLushTreeTexture,
  createPixelDeadTreeTexture,
  createPixelGrassTuftsAtlas,
  createPixelRocksAtlas,
} from "./PixelVegetationRockGenerator";

// ── Vị trí Cây Cổ Thụ & Cây Khô ──
const LUSH_TREE_POSITIONS: [number, number, number, number][] = [
  [-22, 0, -26, 1.25],
  [-32, 0, -18, 1.35],
  [22, 0, -28, 1.3],
  [30, 0, -16, 1.4],
  [-26, 0, 12, 1.2],
  [-36, 0, 24, 1.45],
  [24, 0, 18, 1.25],
  [34, 0, 26, 1.35],
  [-12, 0, -32, 1.15],
  [14, 0, -34, 1.2],
  [-40, 0, 2, 1.4],
  [38, 0, 4, 1.3],
];

const DEAD_TREE_POSITIONS: [number, number, number, number][] = [
  [-18, 0, -48, 1.3],
  [18, 0, -48, 1.35],
  [-24, 0, -60, 1.4],
  [24, 0, -60, 1.4],
  [-8, 0, -56, 1.2],
  [8, 0, -56, 1.2],
];

// ── Vị trí 4 Biến thể Đá Tảng ôm cỏ chân ──
const ROCK_PROPS_DATA: { pos: [number, number, number]; variant: number; scale: number }[] = [
  { pos: [-16, 0, -14], variant: 0, scale: 1.4 }, // Đá lớn
  { pos: [-28, 0, 6], variant: 2, scale: 1.5 },   // Đá cao
  { pos: [20, 0, -12], variant: 1, scale: 1.2 },  // Đá nhỏ
  { pos: [28, 0, 8], variant: 3, scale: 1.6 },   // Đá dẹt
  { pos: [-14, 0, 28], variant: 0, scale: 1.3 },
  { pos: [16, 0, 26], variant: 2, scale: 1.4 },
  { pos: [-34, 0, -24], variant: 3, scale: 1.5 },
  { pos: [32, 0, -20], variant: 1, scale: 1.3 },
];

// ── Vị trí Bụi Cỏ & Hoa ──
const GRASS_TUFT_POSITIONS: [number, number, number, number][] = [
  [-6, 0, -12, 0], [-10, 0, -8, 2], [8, 0, -10, 5], [12, 0, -14, 8],
  [-14, 0, 10, 3], [-8, 0, 14, 9], [10, 0, 12, 12], [15, 0, 8, 14],
  [-20, 0, -6, 6], [-25, 0, -12, 11], [22, 0, -8, 4], [26, 0, -14, 7],
  [-5, 0, 22, 1], [6, 0, 24, 10], [-18, 0, 20, 13], [18, 0, 22, 15],
  [-2, 0, -24, 5], [3, 0, -26, 8], [-4, 0, 30, 2], [4, 0, 32, 11]
];

export const PixelWorldEnvironmentProps = memo(function PixelWorldEnvironmentProps() {
  const lushTexture = useMemo(() => createPixelLushTreeTexture(), []);
  const deadTexture = useMemo(() => createPixelDeadTreeTexture(), []);
  const grassAtlas = useMemo(() => createPixelGrassTuftsAtlas(), []);
  const rocksAtlas = useMemo(() => createPixelRocksAtlas(), []);

  // ── Hiệu ứng Lá Rơi từ Tán Cây (Falling Leaves Particles) ──
  // Lá rơi lắc lư theo hàm sin: x += Math.sin(time * 3) * amplitude và tự xoay vòng
  const leavesGroupRef = useRef<THREE.Group>(null);
  const leavesData = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const treeIdx = i % LUSH_TREE_POSITIONS.length;
      const [tx, , tz] = LUSH_TREE_POSITIONS[treeIdx];
      return {
        baseX: tx + (Math.sin(i * 1.7) * 2.8),
        baseZ: tz + (Math.cos(i * 2.3) * 2.8),
        y: 2.0 + (i % 7) * 0.9,
        speed: 0.8 + (i % 5) * 0.2,
        swayAmp: 0.4 + (i % 4) * 0.2,
        swayFreq: 2.5 + (i % 3) * 0.8,
        rotSpeed: 1.5 + (i % 4) * 0.5,
        phase: i * 0.8,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!leavesGroupRef.current) return;
    const time = clock.getElapsedTime();

    leavesGroupRef.current.children.forEach((leafMesh, i) => {
      const data = leavesData[i];
      if (!data) return;

      // Cập nhật vị trí Y rơi xuống
      const currentY = ((data.y - time * data.speed) % 5.5 + 5.5) % 5.5 + 0.15;
      const swayX = Math.sin(time * data.swayFreq + data.phase) * data.swayAmp;
      const swayZ = Math.cos(time * data.swayFreq * 0.8 + data.phase) * (data.swayAmp * 0.6);

      leafMesh.position.set(data.baseX + swayX, currentY, data.baseZ + swayZ);
      leafMesh.rotation.z = time * data.rotSpeed;
      leafMesh.rotation.y = time * 0.5;
    });
  });

  return (
    <group>
      {/* ── 1. CÂY CỔ THỤ XANH RẬM RẠP (LUSH ANCIENT TREES) ── */}
      {LUSH_TREE_POSITIONS.map(([tx, ty, tz, scale], idx) => {
        const treeWidth = 4.8 * scale;
        const treeHeight = 6.0 * scale;
        // Y anchor at foot: position Y is half-height
        return (
          <Billboard
            key={`lush-tree-${idx}`}
            position={[tx, ty + treeHeight / 2, tz]}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <planeGeometry args={[treeWidth, treeHeight]} />
            <meshStandardMaterial
              map={lushTexture}
              transparent={true}
              alphaTest={0.45}
              depthWrite={true}
              roughness={0.8}
            />
          </Billboard>
        );
      })}

      {/* ── 2. CÂY KHÔ TRƠ CÀNH Ở KHU VỰC ĐẤU TRƯỜNG BOSS (DEAD GNARLED TREES) ── */}
      {DEAD_TREE_POSITIONS.map(([tx, ty, tz, scale], idx) => {
        const treeWidth = 3.6 * scale;
        const treeHeight = 4.8 * scale;
        return (
          <Billboard
            key={`dead-tree-${idx}`}
            position={[tx, ty + treeHeight / 2, tz]}
            follow={true}
          >
            <planeGeometry args={[treeWidth, treeHeight]} />
            <meshStandardMaterial
              map={deadTexture}
              transparent={true}
              alphaTest={0.45}
              depthWrite={true}
              roughness={0.9}
            />
          </Billboard>
        );
      })}

      {/* ── 3. HIỆU ỨNG LÁ RƠI TỪ TÁN CÂY (FALLING LEAVES PARTICLES) ── */}
      <group ref={leavesGroupRef}>
        {leavesData.map((_, i) => (
          <mesh key={`falling-leaf-${i}`}>
            <planeGeometry args={[0.22, 0.22]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? "#b8f26b" : i % 2 === 0 ? "#7de346" : "#52b83b"}
              side={THREE.DoubleSide}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* ── 4. ĐÁ TẢNG ÔM CỎ CHÂN (GROUNDED PIXEL ROCKS) ── */}
      {ROCK_PROPS_DATA.map(({ pos, variant, scale }, idx) => {
        const [rx, ry, rz] = pos;
        const rockW = 2.4 * scale;
        const rockH = 2.4 * scale;

        // Clone texture for independent UV per rock variant (1 of 4 columns)
        const rockTex = rocksAtlas.clone();
        rockTex.magFilter = THREE.NearestFilter;
        rockTex.minFilter = THREE.NearestFilter;
        rockTex.generateMipmaps = false;
        rockTex.repeat.set(1 / 4, 1);
        rockTex.offset.set(variant * (1 / 4), 0);
        rockTex.needsUpdate = true;

        return (
          <Billboard
            key={`rock-${idx}`}
            position={[rx, ry + rockH * 0.42, rz]}
            follow={true}
          >
            <planeGeometry args={[rockW, rockH]} />
            <meshStandardMaterial
              map={rockTex}
              transparent={true}
              alphaTest={0.5}
              depthWrite={true}
              roughness={0.85}
            />
          </Billboard>
        );
      })}

      {/* ── 5. BỤI CỎ VÀ HOA TỪ ATLAS 4x4 (GRASS TUFTS & BUSHES) ── */}
      {GRASS_TUFT_POSITIONS.map(([gx, gy, gz, variant], idx) => {
        const tuftW = 1.3;
        const tuftH = 1.3;
        const col = variant % 4;
        const row = Math.floor(variant / 4);

        const tuftTex = grassAtlas.clone();
        tuftTex.magFilter = THREE.NearestFilter;
        tuftTex.minFilter = THREE.NearestFilter;
        tuftTex.generateMipmaps = false;
        tuftTex.repeat.set(1 / 4, 1 / 4);
        tuftTex.offset.set(col * (1 / 4), (3 - row) * (1 / 4));
        tuftTex.needsUpdate = true;

        return (
          <Billboard
            key={`tuft-${idx}`}
            position={[gx, gy + tuftH * 0.4, gz]}
            follow={true}
          >
            <planeGeometry args={[tuftW, tuftH]} />
            <meshStandardMaterial
              map={tuftTex}
              transparent={true}
              alphaTest={0.4}
              depthWrite={true}
              roughness={0.9}
            />
          </Billboard>
        );
      })}
    </group>
  );
});
