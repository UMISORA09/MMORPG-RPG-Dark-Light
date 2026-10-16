// ==============================================================================
// PixelGrassPathGenerator.ts
// 4-Step Grass & Natural Dirt Path Pixel Art Texture Generator (3/4 Top-Down RPG)
// Palette:
//   Light Resting Green:  #8ae65c
//   Mid Green:            #6bc950
//   Shaded Leaf Green:    #3ca370
//   Deep Teal Shadow:     #2e6f73
//   Deep Slate/Root:      #28354a
//   Petal Cream White:    #fff9e6
//   Flower Core Gold:     #ffda66
//   Fresh Sprout Green:   #b8f26b
//   Warm Dirt Trail:      #f5e1a4
//   Path Pebble/Shadow:   #d9b872, #a68249
// ==============================================================================

import * as THREE from "three";

let cachedGrassTexture: THREE.CanvasTexture | null = null;
let cachedTerrainSheetTexture: THREE.CanvasTexture | null = null;

/**
 * Generates a seamless 128x128 Pixel Art Grass Texture with the strict 4-layer rule:
 * 1. Base light resting green (#8ae65c)
 * 2. Winding horizontal shaded bands (#3ca370, #2e6f73)
 * 3. V-shaped grass tufts & fresh sprouts (#b8f26b) along shade borders
 * 4. 4-petal white/gold flowers (#fff9e6, #ffda66) & deep root shadows (#28354a)
 */
export function createPixelGrassTexture(size = 128): THREE.CanvasTexture {
  if (cachedGrassTexture) return cachedGrassTexture;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = false;

  // ── LỚP 1: Phủ nền xanh sáng chủ đạo (#8ae65c) tạo vùng nghỉ cho mắt ──
  ctx.fillStyle = "#8ae65c";
  ctx.fillRect(0, 0, size, size);

  // Thêm vi hạt xanh trung gian phân tán nhẹ để không bị bệt
  ctx.fillStyle = "#7edb53";
  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      if ((x * 13 + y * 29) % 7 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // ── LỚP 2: Vẽ các dải bóng râm ngang uốn lượn (#3ca370 & #2e6f73) ──
  // Vẽ các luống bóng râm ngang (wavy horizontal shading bands)
  const bands = [
    { baseY: 16, amp: 6, freq: 0.05, height: 14 },
    { baseY: 48, amp: 8, freq: 0.04, height: 18 },
    { baseY: 84, amp: 7, freq: 0.06, height: 16 },
    { baseY: 112, amp: 5, freq: 0.05, height: 12 },
  ];

  bands.forEach((band) => {
    // Vùng râm vừa (#3ca370)
    ctx.fillStyle = "#3ca370";
    for (let x = 0; x < size; x += 2) {
      const wave = Math.sin(x * band.freq) * band.amp + Math.cos(x * band.freq * 2.1) * 3;
      const startY = Math.floor((band.baseY + wave) % size);
      for (let h = 0; h < band.height; h += 2) {
        const py = (startY + h) % size;
        ctx.fillRect(x, py, 2, 2);
      }
    }

    // Lõi bóng tối lạnh (#2e6f73) ở phần đáy của dải bóng râm
    ctx.fillStyle = "#2e6f73";
    for (let x = 0; x < size; x += 2) {
      const wave = Math.sin(x * band.freq) * band.amp + Math.cos(x * band.freq * 2.1) * 3;
      const startY = Math.floor((band.baseY + wave + band.height * 0.45) % size);
      const coreH = Math.floor(band.height * 0.45);
      for (let h = 0; h < coreH; h += 2) {
        const py = (startY + h) % size;
        ctx.fillRect(x, py, 2, 2);
      }
    }
  });

  // ── LỚP 3: Tỉa cụm lá cỏ hình chữ V & ngọn cỏ non (#b8f26b) ──
  // Đặt các cụm cỏ V-shape dọc theo đường viền giữa sáng và râm
  const drawVGrassTuft = (gx: number, gy: number, isBright = false) => {
    const x = Math.floor(gx % size);
    const y = Math.floor(gy % size);

    // Thân tối sâu ở đáy (#28354a)
    ctx.fillStyle = "#28354a";
    ctx.fillRect(x + 2, y + 4, 2, 2);

    // Cánh trái nhánh cỏ
    ctx.fillStyle = isBright ? "#b8f26b" : "#6bc950";
    ctx.fillRect(x, y + 2, 2, 2);
    ctx.fillRect(x - 2, y, 2, 2);

    // Cánh phải nhánh cỏ
    ctx.fillRect(x + 4, y + 2, 2, 2);
    ctx.fillRect(x + 6, y, 2, 2);

    // Ngọn cỏ chính giữa vươn cao
    ctx.fillStyle = isBright ? "#b8f26b" : "#8ae65c";
    ctx.fillRect(x + 2, y, 2, 2);
    ctx.fillRect(x + 2, y - 2, 2, 2);
  };

  // Rải cụm V-shaped tufts
  const tuftPositions = [
    [10, 14], [26, 12], [44, 22], [72, 18], [98, 14], [118, 20],
    [14, 46], [38, 42], [62, 54], [86, 46], [108, 48],
    [8, 82], [32, 78], [56, 90], [80, 84], [104, 80], [120, 86],
    [20, 110], [48, 108], [76, 116], [96, 110]
  ];

  tuftPositions.forEach(([tx, ty], idx) => {
    drawVGrassTuft(tx, ty, idx % 3 === 0);
  });

  // ── LỚP 4: Rải các cụm hoa 4 cánh trắng nhụy vàng (#fff9e6 & #ffda66) ──
  const draw4PetalFlower = (fx: number, fy: number) => {
    const x = Math.floor(fx % size);
    const y = Math.floor(fy % size);

    // Bóng tối đáy hoa
    ctx.fillStyle = "#28354a";
    ctx.fillRect(x + 2, y + 4, 2, 2);

    // 4 cánh hoa trắng kem (#fff9e6)
    ctx.fillStyle = "#fff9e6";
    ctx.fillRect(x + 2, y, 2, 2);     // Trên
    ctx.fillRect(x, y + 2, 2, 2);     // Trái
    ctx.fillRect(x + 4, y + 2, 2, 2); // Phải
    ctx.fillRect(x + 2, y + 4, 2, 2); // Dưới

    // Nhụy vàng rực rỡ ở giữa (#ffda66)
    ctx.fillStyle = "#ffda66";
    ctx.fillRect(x + 2, y + 2, 2, 2);
  };

  // Rải hoa ở các vùng sáng nghỉ mắt
  const flowerSpots = [
    [18, 30], [54, 34], [88, 32], [112, 36],
    [24, 66], [68, 70], [100, 64],
    [36, 98], [82, 102], [114, 96],
  ];

  flowerSpots.forEach(([fx, fy]) => {
    draw4PetalFlower(fx, fy);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedGrassTexture = texture;
  return texture;
}

/**
 * Generates an expanded 512x512 Seamless World Texture containing:
 * - Lush Pixel Grass with the 4-step shading
 * - Warm Dirt Crossroads (#f5e1a4) with pebbled specks (#d9b872)
 * - Jagged Pixel grass borders cutting naturally into the path (Auto-tile effect)
 * - Ancient Village Carved Stone Core
 * - Volcanic Lava Veins for Boss Arena
 */
export function createSeamlessWorldPixelTexture(): THREE.CanvasTexture {
  if (cachedTerrainSheetTexture) return cachedTerrainSheetTexture;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = false;

  // 1. Fill entire terrain with Base Grass
  const grassTile = createPixelGrassTexture(128).image as HTMLCanvasElement;
  for (let y = 0; y < size; y += 128) {
    for (let x = 0; x < size; x += 128) {
      ctx.drawImage(grassTile, x, y);
    }
  }

  // 2. Draw Natural Dirt Paths (North-South & East-West Crossroad)
  const drawDirtRoadSegment = (centerX: number, isVertical: boolean, width = 36) => {
    for (let i = 0; i < size; i += 2) {
      // Curve offset
      const curve = Math.sin(i * 0.02) * 8 + Math.cos(i * 0.05) * 4;
      const roadCenter = centerX + curve;
      const left = Math.floor(roadCenter - width / 2);
      const right = Math.floor(roadCenter + width / 2);

      // Main warm dirt body (#f5e1a4)
      ctx.fillStyle = "#f5e1a4";
      for (let p = left; p <= right; p += 2) {
        if (isVertical) {
          ctx.fillRect(p, i, 2, 2);
        } else {
          ctx.fillRect(i, p, 2, 2);
        }
      }

      // Dirt texture specks and pebbles (#d9b872, #a68249)
      if ((i * 17) % 5 === 0) {
        ctx.fillStyle = "#d9b872";
        const speckOffset = (i * 7) % (width - 8) - width / 2 + 4;
        if (isVertical) {
          ctx.fillRect(Math.floor(roadCenter + speckOffset), i, 2, 2);
        } else {
          ctx.fillRect(i, Math.floor(roadCenter + speckOffset), 2, 2);
        }
      }
      if ((i * 31) % 9 === 0) {
        ctx.fillStyle = "#a68249";
        const pebbleOffset = (i * 13) % (width - 12) - width / 2 + 6;
        if (isVertical) {
          ctx.fillRect(Math.floor(roadCenter + pebbleOffset), i, 4, 2);
        } else {
          ctx.fillRect(i, Math.floor(roadCenter + pebbleOffset), 2, 4);
        }
      }

      // ── Jagged Grass Border (Cỏ lẹm vào đường mòn tự nhiên) ──
      const jagLeft = Math.floor((Math.sin(i * 0.1) * 3 + (i % 4)) * 2);
      const jagRight = Math.floor((Math.cos(i * 0.12) * 3 + ((i + 2) % 4)) * 2);

      // Green grass overlap left
      ctx.fillStyle = "#3ca370";
      if (isVertical) {
        ctx.fillRect(left, i, Math.max(2, jagLeft), 2);
      } else {
        ctx.fillRect(i, left, 2, Math.max(2, jagLeft));
      }

      // Green grass overlap right
      ctx.fillStyle = "#6bc950";
      if (isVertical) {
        ctx.fillRect(right - Math.max(2, jagRight), i, Math.max(2, jagRight), 2);
      } else {
        ctx.fillRect(i, right - Math.max(2, jagRight), 2, Math.max(2, jagRight));
      }
    }
  };

  // Draw Crossroad Paths through wilderness
  drawDirtRoadSegment(size * 0.5, true, 44);  // North-South Path
  drawDirtRoadSegment(size * 0.5, false, 40); // East-West Path

  // 3. Central Village Safe Haven Sanctuary Pavement (Square/Circle stone at center)
  const center = size / 2;
  const villageRadius = 72;
  for (let y = center - villageRadius; y <= center + villageRadius; y += 4) {
    for (let x = center - villageRadius; x <= center + villageRadius; x += 4) {
      const dist = Math.hypot(x - center, y - center);
      if (dist <= villageRadius) {
        // Ancient carved stone brick (#221834 base with #00f2ff cyan seams)
        const brickId = Math.floor(x / 12) + Math.floor(y / 12) * 17;
        const isSeam = (x % 12 === 0) || (y % 12 === 0);
        if (isSeam) {
          ctx.fillStyle = dist < 25 ? "#00f2ff" : "#120a20";
        } else {
          ctx.fillStyle = brickId % 2 === 0 ? "#281e3a" : "#1f1730";
        }
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  // Golden Rune Ring at village boundary
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center, center, villageRadius - 2, 0, Math.PI * 2);
  ctx.stroke();

  // 4. North Boss Altar (Obsidian & Molten Lava at top region: y < 90)
  for (let y = 0; y < 85; y += 4) {
    for (let x = 0; x < size; x += 4) {
      // Obsidian base (#12081c)
      ctx.fillStyle = "#12081c";
      ctx.fillRect(x, y, 4, 4);

      // Molten orange/red lava veins (#ff3300, #ffaa00)
      const lavaNoise = Math.sin(x * 0.08) + Math.cos(y * 0.09) + Math.sin((x + y) * 0.05);
      if (lavaNoise > 1.2) {
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(x, y, 4, 4);
      } else if (lavaNoise > 0.8) {
        ctx.fillStyle = "#e6192e";
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4); // 4x4 tiling across 180m world
  texture.needsUpdate = true;

  cachedTerrainSheetTexture = texture;
  return texture;
}
