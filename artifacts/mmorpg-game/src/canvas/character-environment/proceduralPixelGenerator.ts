/**
 * Chiến Long Bá — Bộ Sinh Nhân Vật Pixel Art Thuần Thủ Công & Thuật Toán (Pure Procedural Pixel Engine)
 * TỰ TẠO RA 100% BẰNG MÃ NGUỒN — KHÔNG SỬ DỤNG BẤT KỲ ẢNH MẪU ĐƯA SẴN NÀO!
 * 
 * Tuân thủ quy chuẩn:
 * - clb-character-art-style (HD 2.5D Pixel Art Sprite - JRPG Heroic Standard)
 * - 1px contour outline #231926
 * - Shading 3 lớp (Highlight, Base Midtone, Deep Shadow)
 * - Mắt anime có điểm sáng catchlight trắng
 * - Nam đam mỹ 6 múi cơ bắp, Nữ quyến rũ sexy đường cong chữ S & cơ số 11
 */

export interface CustomCharacterConfig {
  name: string;
  gender: "male" | "female";
  skinTone: string;         // Base skin hex
  hairStyle: "spiky" | "ponytail" | "undercut" | "wavy" | "short";
  hairColor: string;        // Base hair hex
  eyeColor: string;         // Iris hex
  torsoStyle: "abs_6pack" | "abs_11" | "dragon_plate" | "corset";
  clothPrimary: string;     // Main attire hex
  clothAccent: string;      // Trim/buckle/accessory hex
  weaponType: "greatsword" | "twin_blades" | "shield_sword" | "sniper_plasma" | "dual_pistols";
  weaponGlow: string;       // Aura / energy blade glow hex
}

export const PRESET_CUSTOM_CHARACTERS: CustomCharacterConfig[] = [
  {
    name: "Cuồng Long Kiếm Sĩ",
    gender: "male",
    skinTone: "#ffdab9",
    hairStyle: "spiky",
    hairColor: "#e11d48",
    eyeColor: "#ef4444",
    torsoStyle: "abs_6pack",
    clothPrimary: "#b91c1c",
    clothAccent: "#eab308",
    weaponType: "greatsword",
    weaponGlow: "#ef4444",
  },
  {
    name: "Long Huyết Nữ Hiệp",
    gender: "female",
    skinTone: "#ffe4c8",
    hairStyle: "ponytail",
    hairColor: "#ef4444",
    eyeColor: "#f97316",
    torsoStyle: "abs_11",
    clothPrimary: "#dc2626",
    clothAccent: "#facc15",
    weaponType: "twin_blades",
    weaponGlow: "#f97316",
  },
  {
    name: "Thần Thuẫn Bất Tử",
    gender: "male",
    skinTone: "#fad6b4",
    hairStyle: "spiky",
    hairColor: "#eab308",
    eyeColor: "#d97706",
    torsoStyle: "abs_6pack",
    clothPrimary: "#eab308",
    clothAccent: "#475569",
    weaponType: "shield_sword",
    weaponGlow: "#facc15",
  },
  {
    name: "Băng Phong Thánh Nữ",
    gender: "female",
    skinTone: "#ffe4cd",
    hairStyle: "wavy",
    hairColor: "#facc15",
    eyeColor: "#0ea5e9",
    torsoStyle: "corset",
    clothPrimary: "#eab308",
    clothAccent: "#f8fafc",
    weaponType: "shield_sword",
    weaponGlow: "#38bdf8",
  },
  {
    name: "Ảnh Vũ Đoạt Hồn",
    gender: "male",
    skinTone: "#f5d2b9",
    hairStyle: "undercut",
    hairColor: "#4c1d95",
    eyeColor: "#a855f7",
    torsoStyle: "abs_6pack",
    clothPrimary: "#18181b",
    clothAccent: "#a855f7",
    weaponType: "twin_blades",
    weaponGlow: "#c084fc",
  },
  {
    name: "Dạ Mỵ Sát Thủ",
    gender: "female",
    skinTone: "#ffe4d2",
    hairStyle: "wavy",
    hairColor: "#a855f7",
    eyeColor: "#c084fc",
    torsoStyle: "corset",
    clothPrimary: "#18181b",
    clothAccent: "#9333ea",
    weaponType: "twin_blades",
    weaponGlow: "#e879f9",
  },
  {
    name: "Pháo Thủ Lôi Đình",
    gender: "male",
    skinTone: "#f8d7b9",
    hairStyle: "undercut",
    hairColor: "#cbd5e1",
    eyeColor: "#00f2ff",
    torsoStyle: "abs_6pack",
    clothPrimary: "#1e293b",
    clothAccent: "#00f2ff",
    weaponType: "sniper_plasma",
    weaponGlow: "#00f2ff",
  },
  {
    name: "Lượng Tử Thiện Xạ",
    gender: "female",
    skinTone: "#ffe4cd",
    hairStyle: "short",
    hairColor: "#06b6d4",
    eyeColor: "#06b6d4",
    torsoStyle: "abs_11",
    clothPrimary: "#0f172a",
    clothAccent: "#06b6d4",
    weaponType: "dual_pistols",
    weaponGlow: "#22d3ee",
  },
];

// ── Color Utilities ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = ((num >> 8) & 0xf) * 17;
    const g = ((num >> 4) & 0xf) * 17;
    const b = (num & 0xf) * 17;
    return [r, g, b];
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

function adjustBrightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

// ── 16 Bounding boxes on 360x360 canvas for Modular Rig ──────────────────────
export const PART_BBOXES: Record<string, [number, number, number, number]> = {
  hips: [130, 210, 230, 255],
  torso: [120, 140, 240, 215],
  abs: [140, 175, 220, 225],
  head: [135, 75, 225, 145],
  hair_spikes: [115, 30, 245, 125],
  arm_left_upper: [85, 140, 135, 195],
  arm_left_forearm: [70, 185, 125, 250],
  arm_right_upper: [225, 140, 275, 195],
  arm_right_forearm: [235, 185, 290, 250],
  main_weapon: [245, 50, 345, 260],
  offhand_weapon: [40, 170, 120, 275],
  leg_left_thigh: [135, 245, 180, 295],
  leg_left_foot: [130, 285, 180, 350],
  leg_right_thigh: [180, 245, 225, 295],
  leg_right_foot: [180, 285, 230, 350],
  scarf: [140, 130, 220, 220],
};

/**
 * Procedural Pixel Art Drawing Function
 * Directly paints onto an 80x90 canvas and scales up to 360x360 with nearest neighbor!
 */
export function drawProceduralPixelCharacter(
  config: CustomCharacterConfig,
  targetCanvas: HTMLCanvasElement
): {
  standeeDataUrl: string;
  partsDataUrls: Record<string, string>;
} {
  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = 80;
  baseCanvas.height = 90;
  const ctx = baseCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not acquire 2D context");

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 80, 90);

  const OUTLINE = "#231926";
  const EYE_WHITE = "#ffffff";

  // Shades
  const skinBase = config.skinTone;
  const skinShadow = adjustBrightness(skinBase, 0.82);
  const skinDeep = adjustBrightness(skinBase, 0.68);
  const hairBase = config.hairColor;
  const hairHi = adjustBrightness(hairBase, 1.25);
  const hairSh = adjustBrightness(hairBase, 0.72);
  const clothPri = config.clothPrimary;
  const clothPriSh = adjustBrightness(clothPri, 0.75);
  const clothAcc = config.clothAccent;
  const clothAccHi = adjustBrightness(clothAcc, 1.2);
  const isMale = config.gender === "male";

  // 1. Oval Ground Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(40, 82, isMale ? 22 : 20, isMale ? 6 : 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Helper drawing functions
  const fillRect = (x: number, y: number, w: number, h: number, color: string, outline = true) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (outline) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
  };

  const drawPoly = (points: [number, number][], fill: string, outline = true) => {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // 2. Attire / Scarf flowing behind
  if (isMale) {
    drawPoly(
      [[26, 32], [18, 48], [22, 65], [28, 52]],
      clothPri,
      true
    );
  } else if (config.hairStyle === "ponytail" || config.hairStyle === "wavy") {
    drawPoly(
      [[45, 14], [58, 6], [65, 14], [62, 32], [54, 26]],
      hairSh,
      true
    );
    drawPoly(
      [[48, 13], [57, 8], [62, 14], [58, 28], [53, 22]],
      hairBase,
      false
    );
  }

  // 3. Legs & Boots
  if (isMale) {
    fillRect(28, 58, 8, 18, clothPriSh, true);
    fillRect(26, 75, 11, 6, clothAcc, true);
    fillRect(27, 79, 11, 2, "#ffffff", false);

    fillRect(43, 58, 8, 18, clothPriSh, true);
    fillRect(42, 75, 11, 6, clothAcc, true);
    fillRect(43, 79, 11, 2, "#ffffff", false);
  } else {
    fillRect(31, 58, 6, 8, skinBase, true); // Bare thigh
    fillRect(30, 66, 7, 12, clothPri, true); // High boot
    fillRect(30, 78, 8, 3, clothAcc, false);

    fillRect(42, 58, 6, 8, skinBase, true);
    fillRect(42, 66, 7, 12, clothPri, true);
    fillRect(41, 78, 8, 3, clothAcc, false);
  }

  // 4. Belt / Hips
  fillRect(28, 53, 23, 6, "#1e293b", true);
  fillRect(36, 54, 7, 6, clothAcc, true);

  // 5. Torso & Abs/Cleavage
  fillRect(29, 36, 21, 18, skinBase, true);
  if (isMale) {
    // 6-Pack Abs Linea Alba
    ctx.strokeStyle = skinDeep;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(39.5, 38);
    ctx.lineTo(39.5, 53);
    ctx.stroke();

    ctx.strokeStyle = skinShadow;
    ctx.beginPath();
    ctx.moveTo(33, 42.5); ctx.lineTo(46, 42.5); // Tier 1
    ctx.moveTo(33, 46.5); ctx.lineTo(46, 46.5); // Tier 2
    ctx.moveTo(34, 50.5); ctx.lineTo(45, 50.5); // Tier 3
    ctx.stroke();

    // Pectorals
    ctx.strokeStyle = skinDeep;
    ctx.beginPath();
    ctx.moveTo(31, 40); ctx.lineTo(38, 41);
    ctx.moveTo(40, 41); ctx.lineTo(47, 40);
    ctx.stroke();

    // Armor Pauldron on Right Shoulder
    drawPoly(
      [[48, 34], [57, 32], [58, 42], [49, 44]],
      clothAcc,
      true
    );
  } else {
    // Hourglass Slender Midriff with 11-line abs
    ctx.strokeStyle = skinShadow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(37.5, 46); ctx.lineTo(37.5, 52);
    ctx.moveTo(41.5, 46); ctx.lineTo(41.5, 52);
    ctx.stroke();

    // Bustier / Corset
    fillRect(30, 36, 19, 10, clothPri, true);
    fillRect(33, 38, 13, 7, adjustBrightness(clothPri, 1.15), false);

    // Cleavage V-cut
    drawPoly([[37, 36], [39.5, 41], [42, 36]], skinShadow, true);
  }

  // 6. Arms & Weapon
  // Left Hand / Weapon Offhand
  fillRect(21, 38, 8, 11, skinBase, true);
  fillRect(18, 48, 10, 11, clothPri, true);
  if (config.weaponType === "shield_sword") {
    // Lion Tower Shield
    fillRect(12, 35, 15, 38, clothAcc, true);
    fillRect(14, 38, 11, 32, clothAccHi, false);
    fillRect(18, 48, 4, 6, config.weaponGlow, true);
  } else if (config.weaponType === "twin_blades") {
    // Left Dagger
    drawPoly([[20, 50], [12, 40], [15, 38], [22, 48]], "#f1f5f9", true);
  } else if (config.weaponType === "dual_pistols") {
    // Left Blaster
    fillRect(13, 44, 11, 6, "#334155", true);
    fillRect(9, 45, 5, 4, config.weaponGlow, false);
  }

  // Right Hand / Weapon Main
  fillRect(49, 38, 8, 11, skinBase, true);
  fillRect(50, 48, 10, 11, clothPri, true);

  if (config.weaponType === "greatsword") {
    // Massive Greatsword
    fillRect(54, 15, 14, 48, "#f8fafc", true);
    ctx.fillStyle = config.weaponGlow;
    ctx.fillRect(56, 17, 3, 44); // Energy core
    fillRect(52, 60, 18, 5, clothAcc, true); // Guard
    fillRect(59, 64, 4, 11, "#1e293b", true); // Hilt
  } else if (config.weaponType === "shield_sword") {
    // Holy Broadsword
    fillRect(51, 60, 5, 20, "#f8fafc", true);
    fillRect(48, 57, 11, 3, clothAcc, true);
  } else if (config.weaponType === "twin_blades") {
    // Right Blade
    drawPoly([[54, 52], [64, 68], [61, 70], [52, 54]], config.weaponGlow, true);
  } else if (config.weaponType === "sniper_plasma") {
    // High-Tech Sniper
    fillRect(14, 45, 52, 7, "#0f172a", true);
    ctx.fillStyle = config.weaponGlow;
    ctx.fillRect(18, 46, 44, 3);
    fillRect(10, 46, 5, 5, "#475569", true);
    fillRect(44, 41, 12, 5, "#1e293b", true);
  } else if (config.weaponType === "dual_pistols") {
    fillRect(54, 44, 11, 6, "#334155", true);
    fillRect(64, 45, 5, 4, config.weaponGlow, false);
  }

  // 7. Neck & Head
  fillRect(36, 30, 7, 6, skinShadow, true);
  fillRect(31, 16, 17, 16, skinBase, true);

  // 8. Anime Eyes with Catchlight
  fillRect(34, 21, 5, 6, EYE_WHITE, true);
  ctx.fillStyle = config.eyeColor;
  ctx.fillRect(36, 22, 3, 5);
  ctx.fillStyle = EYE_WHITE;
  ctx.fillRect(36, 22, 1, 1); // Catchlight

  fillRect(41, 21, 5, 6, EYE_WHITE, true);
  ctx.fillStyle = config.eyeColor;
  ctx.fillRect(41, 22, 3, 5);
  ctx.fillStyle = EYE_WHITE;
  ctx.fillRect(41, 22, 1, 1); // Catchlight

  // Eyelashes for female
  if (!isMale) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(33, 21); ctx.lineTo(38, 21);
    ctx.moveTo(41, 21); ctx.lineTo(46, 21);
    ctx.stroke();
    // Lip tint
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(39, 29, 2, 1);
  } else {
    // Smirk
    ctx.fillStyle = "#b45309";
    ctx.fillRect(38, 28, 4, 1);
  }

  // 9. Hair Styles
  if (config.hairStyle === "spiky") {
    drawPoly([[26, 20], [28, 10], [35, 6], [43, 6], [52, 11], [54, 21], [48, 15], [39, 12], [28, 17]], hairSh, true);
    drawPoly([[27, 16], [32, 8], [38, 12], [34, 18]], hairBase, true);
    drawPoly([[34, 10], [41, 5], [46, 11], [41, 17]], hairHi, true);
    drawPoly([[43, 8], [50, 7], [53, 14], [47, 18]], hairBase, true);
  } else if (config.hairStyle === "undercut") {
    drawPoly([[26, 18], [29, 9], [36, 6], [44, 6], [52, 11], [54, 20], [48, 14], [38, 12], [28, 16]], hairSh, true);
    drawPoly([[27, 15], [33, 7], [39, 11], [34, 18]], hairBase, true);
    drawPoly([[35, 9], [42, 5], [47, 10], [41, 17]], hairHi, true);
  } else if (config.hairStyle === "wavy") {
    drawPoly([[23, 30], [18, 55], [24, 70], [28, 50]], hairSh, true);
    drawPoly([[55, 30], [60, 55], [54, 70], [50, 50]], hairSh, true);
    drawPoly([[30, 17], [35, 13], [39, 17], [36, 22]], hairBase, true);
    drawPoly([[38, 14], [43, 12], [48, 17], [43, 22]], hairHi, true);
  } else {
    // Ponytail / Short
    drawPoly([[30, 17], [35, 11], [39, 16], [36, 21]], hairBase, true);
    drawPoly([[38, 13], [43, 10], [47, 15], [42, 20]], hairHi, true);
    drawPoly([[29, 19], [32, 27], [31, 22]], hairBase, true);
    drawPoly([[46, 19], [48, 27], [47, 22]], hairBase, true);
  }

  // 10. Upscale 80x90 to 360x360 with Nearest Neighbor
  targetCanvas.width = 360;
  targetCanvas.height = 360;
  const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
  if (!targetCtx) throw new Error("Could not acquire target 2D context");

  targetCtx.imageSmoothingEnabled = false;
  targetCtx.clearRect(0, 0, 360, 360);

  // Compute scale and centering
  const scale = 4;
  const offsetX = Math.round((360 - 80 * scale) / 2);
  const offsetY = Math.round((360 - 90 * scale) / 2) + 8;
  targetCtx.drawImage(baseCanvas, 0, 0, 80, 90, offsetX, offsetY, 80 * scale, 90 * scale);

  const standeeDataUrl = targetCanvas.toDataURL("image/png");

  // 11. Slice 16 parts into transparent 360x360 canvases
  const partsDataUrls: Record<string, string> = {};
  const partCanvas = document.createElement("canvas");
  partCanvas.width = 360;
  partCanvas.height = 360;
  const partCtx = partCanvas.getContext("2d");

  if (partCtx) {
    partCtx.imageSmoothingEnabled = false;
    for (const [partName, [x1, y1, x2, y2]] of Object.entries(PART_BBOXES)) {
      partCtx.clearRect(0, 0, 360, 360);
      const w = x2 - x1;
      const h = y2 - y1;
      partCtx.drawImage(targetCanvas, x1, y1, w, h, x1, y1, w, h);
      partsDataUrls[partName] = partCanvas.toDataURL("image/png");
    }
  }

  return { standeeDataUrl, partsDataUrls };
}

/**
 * Randomize helper: Rolls random color harmony & traits
 */
export function generateRandomCharacterConfig(): CustomCharacterConfig {
  const isMale = Math.random() > 0.5;

  const skinTones = ["#ffdab9", "#fad6b4", "#ffe4c8", "#f8d7b9", "#f5d2b9", "#c68642"];
  const hairColors = ["#ef4444", "#f97316", "#eab308", "#a855f7", "#06b6d4", "#cbd5e1", "#18181b"];
  const eyeColors = ["#ef4444", "#f97316", "#eab308", "#0ea5e9", "#a855f7", "#00f2ff", "#10b981"];
  const clothColors = ["#b91c1c", "#1e293b", "#0f172a", "#18181b", "#581c87", "#0369a1", "#047857"];
  const accentColors = ["#eab308", "#facc15", "#00f2ff", "#c084fc", "#f43f5e", "#ffffff"];
  const hairStyles: CustomCharacterConfig["hairStyle"][] = isMale
    ? ["spiky", "undercut", "short"]
    : ["ponytail", "wavy", "short"];
  const weaponTypes: CustomCharacterConfig["weaponType"][] = [
    "greatsword",
    "twin_blades",
    "shield_sword",
    "sniper_plasma",
    "dual_pistols",
  ];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const weapon = pick(weaponTypes);
  const titles = isMale
    ? ["Huyết Long Chiến Thần", "Bá Đao Lãng Tử", "Ma Vũ Shinobi", "Lôi Đình Thiện Xạ"]
    : ["Long Nữ Thánh Hiệp", "Băng Sương Kiếm Cơ", "U Dạ Mỵ Nữ", "Lượng Tử Nữ Xạ"];

  return {
    name: pick(titles),
    gender: isMale ? "male" : "female",
    skinTone: pick(skinTones),
    hairStyle: pick(hairStyles),
    hairColor: pick(hairColors),
    eyeColor: pick(eyeColors),
    torsoStyle: isMale ? "abs_6pack" : "abs_11",
    clothPrimary: pick(clothColors),
    clothAccent: pick(accentColors),
    weaponType: weapon,
    weaponGlow: pick(eyeColors),
  };
}

