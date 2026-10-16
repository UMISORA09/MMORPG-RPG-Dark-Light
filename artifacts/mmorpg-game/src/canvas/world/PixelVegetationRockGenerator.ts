// ==============================================================================
// PixelVegetationRockGenerator.ts
// Pixel Art Environmental Props Generator (3/4 Top-Down RPG)
// Generates:
// 1. Ancient Lush Tree & Dead Gnarled Tree (Warm-to-Cold Shading, Twisted Roots)
// 2. 4x4 Atlas of 16 Grass Tufts & Bush Variants
// 3. 4 Grounded Pixel Rocks with Dark Green Grass Tufts (#0d6914) Hugging Bases
// ==============================================================================

import * as THREE from "three";

// ── 1. CÂY CỔ THỤ & CÂY KHÔ PIXEL ART ──
let cachedLushTreeTexture: THREE.CanvasTexture | null = null;
let cachedDeadTreeTexture: THREE.CanvasTexture | null = null;

/**
 * Creates an Ancient Lush Tree Sprite (128x160)
 * - Twisted wood trunk (#7a4841, #4d2b32, #a66d58) with gripping ground roots
 * - Dome canopy with Warm Light (#7de346 -> #52b83b) on top ~50%
 * - Transitioning to Mid-tone (#2d8a54) and Cold Shadow (#1e5c4c -> #183042) at base
 * - Clean tiered layers with scalloped edges, NO orphan pixels
 */
export function createPixelLushTreeTexture(): THREE.CanvasTexture {
  if (cachedLushTreeTexture) return cachedLushTreeTexture;

  const w = 128;
  const h = 160;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = false;

  const cx = w / 2;
  const groundY = h - 16;

  // 1.1 Soft ground shadow below tree base
  ctx.fillStyle = "rgba(10, 15, 25, 0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 4, 42, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1.2 Gốc rễ cây xòe bám chặt xuống đất & Thân gỗ vặn xoắn
  // Rễ tối nhất & viền ngoài (#351c22)
  ctx.fillStyle = "#351c22";
  // Rễ trái
  ctx.fillRect(cx - 26, groundY - 4, 10, 8);
  ctx.fillRect(cx - 22, groundY - 10, 12, 10);
  // Rễ giữa & phải
  ctx.fillRect(cx - 6, groundY - 2, 14, 8);
  ctx.fillRect(cx + 12, groundY - 6, 14, 10);
  ctx.fillRect(cx + 18, groundY - 2, 8, 6);

  // Thân gỗ chính - Bóng râm sâu (#4d2b32)
  ctx.fillStyle = "#4d2b32";
  ctx.fillRect(cx - 16, groundY - 50, 32, 46);
  ctx.fillRect(cx - 20, groundY - 24, 40, 22);

  // Thân gỗ màu nâu ấm chủ đạo (#7a4841)
  ctx.fillStyle = "#7a4841";
  ctx.fillRect(cx - 12, groundY - 48, 24, 42);
  // Rễ bám trái - phải
  ctx.fillRect(cx - 18, groundY - 16, 8, 12);
  ctx.fillRect(cx + 8, groundY - 14, 10, 10);

  // Vân gỗ sáng đón sáng nhẹ (#a66d58) bên trái
  ctx.fillStyle = "#a66d58";
  ctx.fillRect(cx - 10, groundY - 46, 6, 36);
  ctx.fillRect(cx - 14, groundY - 20, 4, 12);

  // Hốc cây rỗng đen kỳ bí ở giữa thân
  ctx.fillStyle = "#221118";
  ctx.fillRect(cx - 2, groundY - 28, 6, 10);
  ctx.fillRect(cx - 1, groundY - 26, 4, 6);

  // Cỏ ôm gốc rễ cây (#0d6914 & #3ca370)
  ctx.fillStyle = "#0d6914";
  ctx.fillRect(cx - 28, groundY, 14, 4);
  ctx.fillRect(cx + 16, groundY - 2, 12, 4);
  ctx.fillStyle = "#3ca370";
  ctx.fillRect(cx - 26, groundY - 2, 4, 4);
  ctx.fillRect(cx + 20, groundY - 4, 4, 4);

  // 1.3 Tán lá cây cổ thụ hình vòm cầu nhiều tầng (Warm Top -> Cold Bottom)
  // Tâm vòm tán lá: (cx, 62), bán kính ~48
  const domeCy = 64;

  // LỚP ĐÁY BÓNG LẠNH TÍM / XANH LAM (#183042 & #1e5c4c)
  ctx.fillStyle = "#183042";
  for (let r = 40; r >= 0; r -= 4) {
    const y = domeCy + 14 + (40 - r) * 0.4;
    const halfW = Math.sqrt(Math.max(0, 44 * 44 - (y - domeCy) * (y - domeCy))) * 0.95;
    ctx.fillRect(Math.floor(cx - halfW), Math.floor(y), Math.floor(halfW * 2), 4);
  }

  // TẦNG GIỮA BÓNG RÂM (#1e5c4c & #2d8a54)
  ctx.fillStyle = "#1e5c4c";
  for (let y = domeCy - 10; y <= domeCy + 22; y += 4) {
    const dy = y - domeCy;
    const halfW = Math.sqrt(Math.max(0, 48 * 48 - dy * dy)) * 0.98;
    ctx.fillRect(Math.floor(cx - halfW), y, Math.floor(halfW * 2), 4);
  }

  // TẦNG LÁ XANH RÂM MÁT CHỦ ĐẠO (#2d8a54 & #52b83b)
  ctx.fillStyle = "#2d8a54";
  for (let y = domeCy - 28; y <= domeCy + 8; y += 4) {
    const dy = y - domeCy;
    const halfW = Math.sqrt(Math.max(0, 46 * 46 - dy * dy)) * 0.96;
    ctx.fillRect(Math.floor(cx - halfW), y, Math.floor(halfW * 2), 4);
  }

  // TẦNG ĐỈNH ĐÓN NẮNG ẤM VÀNG-XANH (GẦN 50% DIỆN TÍCH: #52b83b -> #7de346)
  ctx.fillStyle = "#52b83b";
  for (let y = domeCy - 44; y <= domeCy - 8; y += 4) {
    const dy = y - domeCy;
    const halfW = Math.sqrt(Math.max(0, 42 * 42 - dy * dy)) * 0.94;
    ctx.fillRect(Math.floor(cx - halfW), y, Math.floor(halfW * 2), 4);
  }

  ctx.fillStyle = "#7de346";
  for (let y = domeCy - 48; y <= domeCy - 22; y += 4) {
    const dy = y - domeCy;
    const halfW = Math.sqrt(Math.max(0, 36 * 36 - dy * dy)) * 0.88;
    // Điểm sáng ấm lệch về góc trên-trái đón nắng
    ctx.fillRect(Math.floor(cx - halfW - 2), y, Math.floor(halfW * 1.8), 4);
  }

  // Điểm ngọn lá non vàng chanh rực rỡ nhất ở đỉnh (#b8f26b)
  ctx.fillStyle = "#b8f26b";
  ctx.fillRect(cx - 18, domeCy - 44, 18, 10);
  ctx.fillRect(cx - 10, domeCy - 48, 14, 6);

  // 1.4 Viền răng cưa chi tiết ở rìa ngoài (Scalloped Leaf Edges - Clean Internals, NO orphan pixels)
  const drawScallopClump = (bx: number, by: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(bx, by, 6, 6);
    ctx.fillRect(bx - 2, by + 2, 10, 4);
  };

  // Scallops đỉnh sáng
  drawScallopClump(cx - 36, domeCy - 20, "#52b83b");
  drawScallopClump(cx + 28, domeCy - 16, "#52b83b");
  drawScallopClump(cx - 24, domeCy - 38, "#7de346");
  drawScallopClump(cx + 12, domeCy - 36, "#7de346");

  // Scallops đáy râm
  drawScallopClump(cx - 44, domeCy + 10, "#1e5c4c");
  drawScallopClump(cx + 36, domeCy + 8, "#183042");
  drawScallopClump(cx - 20, domeCy + 26, "#183042");
  drawScallopClump(cx + 16, domeCy + 28, "#183042");

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedLushTreeTexture = texture;
  return texture;
}

/**
 * Creates a Gnarled Dead Tree Sprite (96x128)
 * - Twisted branch silhouette without leaves
 * - Sharp angled broken boughs
 */
export function createPixelDeadTreeTexture(): THREE.CanvasTexture {
  if (cachedDeadTreeTexture) return cachedDeadTreeTexture;

  const w = 96;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = false;

  const cx = w / 2;
  const groundY = h - 12;

  // Ground shadow
  ctx.fillStyle = "rgba(10, 15, 25, 0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 4, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Roots
  ctx.fillStyle = "#2d1b22";
  ctx.fillRect(cx - 20, groundY - 4, 10, 6);
  ctx.fillRect(cx + 12, groundY - 4, 10, 6);
  ctx.fillStyle = "#4a2a32";
  ctx.fillRect(cx - 14, groundY - 26, 28, 24);

  // Main twisted trunk
  ctx.fillStyle = "#633842";
  ctx.fillRect(cx - 10, groundY - 60, 20, 36);

  // Left Gnarled Branch
  ctx.fillRect(cx - 28, groundY - 76, 20, 8);
  ctx.fillRect(cx - 36, groundY - 94, 10, 20);
  ctx.fillRect(cx - 42, groundY - 104, 8, 12);

  // Right Gnarled Branch
  ctx.fillRect(cx + 8, groundY - 72, 22, 8);
  ctx.fillRect(cx + 26, groundY - 90, 8, 20);
  ctx.fillRect(cx + 32, groundY - 106, 6, 18);

  // Top Spire Branch
  ctx.fillRect(cx - 4, groundY - 96, 8, 38);
  ctx.fillRect(cx - 2, groundY - 112, 4, 18);

  // Highlight along trunk edge (#8a525f)
  ctx.fillStyle = "#8a525f";
  ctx.fillRect(cx - 8, groundY - 58, 4, 30);
  ctx.fillRect(cx - 26, groundY - 74, 16, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedDeadTreeTexture = texture;
  return texture;
}

// ── 2. ATLAS 4x4: 16 BIẾN THỂ CỤM CỎ & BỤI CÂY (32x32 MỖI Ô) ──
let cachedGrassAtlasTexture: THREE.CanvasTexture | null = null;

export function createPixelGrassTuftsAtlas(): THREE.CanvasTexture {
  if (cachedGrassAtlasTexture) return cachedGrassAtlasTexture;

  const tileSize = 32;
  const cols = 4;
  const rows = 4;
  const canvas = document.createElement("canvas");
  canvas.width = tileSize * cols;
  canvas.height = tileSize * rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const ox = c * tileSize;
      const oy = r * tileSize;
      const tcx = ox + tileSize / 2;
      const ground = oy + tileSize - 4;

      ctx.save();

      // Shadow
      ctx.fillStyle = "rgba(15, 25, 35, 0.35)";
      ctx.beginPath();
      ctx.ellipse(tcx, ground + 2, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (idx < 4) {
        // Biến thể 0..3: Cỏ 3 lá & Cụm xòe nhỏ
        const wSpread = 4 + idx * 2;
        ctx.fillStyle = "#2e6f73";
        ctx.fillRect(tcx - 2, ground - 4, 4, 4);

        ctx.fillStyle = "#3ca370";
        ctx.fillRect(tcx - wSpread, ground - 8, 3, 6);
        ctx.fillRect(tcx + wSpread - 3, ground - 8, 3, 6);

        ctx.fillStyle = "#8ae65c";
        ctx.fillRect(tcx - 2, ground - 12 - idx, 4, 10);
        ctx.fillStyle = "#b8f26b";
        ctx.fillRect(tcx - 1, ground - 14 - idx, 2, 4);
      } else if (idx < 8) {
        // Biến thể 4..7: Cỏ cao nhọn & Cỏ xòe ngang rậm
        ctx.fillStyle = "#1e5c4c";
        ctx.fillRect(tcx - 8, ground - 6, 16, 6);

        ctx.fillStyle = "#3ca370";
        ctx.fillRect(tcx - 10, ground - 14, 4, 10);
        ctx.fillRect(tcx + 6, ground - 14, 4, 10);
        ctx.fillRect(tcx - 2, ground - 18, 4, 14);

        ctx.fillStyle = "#6bc950";
        ctx.fillRect(tcx - 8, ground - 12, 3, 8);
        ctx.fillRect(tcx + 5, ground - 12, 3, 8);
        ctx.fillRect(tcx - 1, ground - 16, 2, 12);

        ctx.fillStyle = "#b8f26b";
        ctx.fillRect(tcx, ground - 20, 2, 4);
      } else if (idx < 12) {
        // Biến thể 8..11: Bụi hoa dại & Nấm nhỏ
        // Thân cỏ
        ctx.fillStyle = "#3ca370";
        ctx.fillRect(tcx - 6, ground - 8, 12, 6);
        ctx.fillStyle = "#8ae65c";
        ctx.fillRect(tcx - 4, ground - 12, 8, 6);

        // Hoa nở (Trắng nhụy vàng hoặc Đỏ)
        const flowerColor = idx % 2 === 0 ? "#fff9e6" : "#ff5577";
        ctx.fillStyle = flowerColor;
        ctx.fillRect(tcx - 3, ground - 16, 6, 6);
        ctx.fillStyle = "#ffda66";
        ctx.fillRect(tcx - 1, ground - 14, 2, 2);
      } else {
        // Biến thể 12..15: Bụi cây tròn viền tối tâm sáng
        const radius = 6 + (idx - 12) * 2;
        // Viền tối (#1e5c4c)
        ctx.fillStyle = "#1e5c4c";
        ctx.beginPath();
        ctx.arc(tcx, ground - radius - 2, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // Lớp trung gian (#3ca370)
        ctx.fillStyle = "#3ca370";
        ctx.beginPath();
        ctx.arc(tcx, ground - radius - 2, radius, 0, Math.PI * 2);
        ctx.fill();

        // Tâm sáng ấm đón nắng (#7de346)
        ctx.fillStyle = "#7de346";
        ctx.beginPath();
        ctx.arc(tcx - 2, ground - radius - 4, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedGrassAtlasTexture = texture;
  return texture;
}

// ── 3. ĐÁ TẢNG ÔM CỎ CHÂN (4 BIẾN THỂ: ĐÁ LỚN, ĐÁ NHỎ, ĐÁ CAO, ĐÁ DẸT) ──
let cachedRocksAtlasTexture: THREE.CanvasTexture | null = null;

/**
 * Creates 4 Grounded Pixel Rocks Atlas (64x64 each, total 256x64):
 * - Sharp 1px black outline (#111111)
 * - Medium grey stone body (#6b6b6b)
 * - Top-left highlight reflection (#a8a8a8, #cfcfcf)
 * - Bottom-right shadow (#424242)
 * - MANDATORY: Deep green grass tufts (#0d6914 & #3ca370) hugging base
 */
export function createPixelRocksAtlas(): THREE.CanvasTexture {
  if (cachedRocksAtlasTexture) return cachedRocksAtlasTexture;

  const tileSize = 64;
  const cols = 4;
  const canvas = document.createElement("canvas");
  canvas.width = tileSize * cols;
  canvas.height = tileSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < cols; i++) {
    const ox = i * tileSize;
    const cx = ox + tileSize / 2;
    const ground = tileSize - 10;

    // Ground shadow
    ctx.fillStyle = "rgba(10, 15, 25, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx, ground + 2, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    let rw = 36;
    let rh = 28;
    if (i === 1) { rw = 24; rh = 20; }      // Đá nhỏ
    else if (i === 2) { rw = 26; rh = 38; } // Đá cao
    else if (i === 3) { rw = 44; rh = 18; } // Đá dẹt

    const rx = cx - rw / 2;
    const ry = ground - rh;

    // 1px Black outline
    ctx.fillStyle = "#111111";
    ctx.fillRect(rx - 2, ry - 2, rw + 4, rh + 4);

    // Bottom-right shadow body (#424242)
    ctx.fillStyle = "#424242";
    ctx.fillRect(rx, ry, rw, rh);

    // Stone base medium grey (#6b6b6b)
    ctx.fillStyle = "#6b6b6b";
    ctx.fillRect(rx + 2, ry + 2, rw - 6, rh - 6);

    // Top-left highlight sheen (#a8a8a8)
    ctx.fillStyle = "#a8a8a8";
    ctx.fillRect(rx + 2, ry + 2, Math.floor(rw * 0.55), Math.floor(rh * 0.55));

    // Specular corner glint (#cfcfcf)
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(rx + 4, ry + 4, 6, 6);
    ctx.fillRect(rx + 12, ry + 4, 4, 3);

    // ── BẮT BUỘC: CỤM CỎ XANH ĐẬM (#0d6914) ÔM CHẶT PHẦN ĐÁY VIÊN ĐÁ ──
    ctx.fillStyle = "#0d6914";
    // Cỏ ôm chân góc trái
    ctx.fillRect(rx - 4, ground - 6, 10, 8);
    ctx.fillRect(rx - 2, ground - 10, 4, 6);

    // Cỏ ôm chân góc phải
    ctx.fillRect(rx + rw - 6, ground - 8, 12, 10);
    ctx.fillRect(rx + rw - 4, ground - 12, 4, 6);

    // Cỏ non sáng vươn lên mép đá (#3ca370 & #8ae65c)
    ctx.fillStyle = "#3ca370";
    ctx.fillRect(rx - 2, ground - 8, 4, 4);
    ctx.fillRect(rx + rw - 2, ground - 10, 3, 4);
    ctx.fillStyle = "#8ae65c";
    ctx.fillRect(rx, ground - 10, 2, 3);
    ctx.fillRect(rx + rw - 2, ground - 12, 2, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedRocksAtlasTexture = texture;
  return texture;
}
