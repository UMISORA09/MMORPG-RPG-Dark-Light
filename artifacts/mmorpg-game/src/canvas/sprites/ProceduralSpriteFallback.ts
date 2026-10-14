import * as THREE from "three";

// ==============================================================================
// Procedural HD-2D Billboard Spritesheet Generator
// Generates 4x4 Grid Spritesheet CanvasTexture:
// Row 0: Idle (4 frames)
// Row 1: Run (4 frames)
// Row 2: Attack (4 frames)
// Row 3: Hurt / Death (4 frames)
// ==============================================================================

export interface SpriteGeneratorOptions {
  key: string;
  color: string;
  secondaryColor?: string;
  emoji?: string;
  weaponType?: "gun" | "daggers" | "sword" | "shield" | "claws" | "dragon";
  isBoss?: boolean;
}

const textureCache = new Map<string, THREE.CanvasTexture>();
const fileTextureCache = new Map<string, THREE.Texture>();

export function loadOrFallbackSpritesheet(options: SpriteGeneratorOptions): THREE.Texture {
  const fileKey = options.key.replace(/^player_|^mob_/, "");
  const cached = fileTextureCache.get(fileKey);
  if (cached) return cached;

  const fallback = getOrCreateProceduralSpritesheet(options);

  if (typeof window !== "undefined") {
    const img = new Image();
    img.src = `/assets/sprites/${fileKey}.svg`;
    img.onload = () => {
      const tex = new THREE.CanvasTexture(img);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      fileTextureCache.set(fileKey, tex);
    };
  }

  return fallback;
}

export function getOrCreateProceduralSpritesheet(options: SpriteGeneratorOptions): THREE.CanvasTexture {
  const cacheKey = `${options.key}_${options.color}_${options.isBoss ? "boss" : "norm"}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const frameSize = options.isBoss ? 128 : 64;
  const cols = 4;
  const rows = 4;
  const width = frameSize * cols;
  const height = frameSize * rows;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  // Pixelated crisp graphics settings
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * frameSize;
      const y = row * frameSize;
      ctx.save();
      ctx.translate(x, y);

      drawSpriteFrame(ctx, row, col, frameSize, options);

      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const scale = opts.isBoss ? 1.6 : 1.0;
  const primary = opts.color || "#00b4ff";
  const secondary = opts.secondaryColor || "#ffffff";
  const isBoss = !!opts.isBoss;

  // Row meanings: 0 = Idle, 1 = Run, 2 = Attack, 3 = Hurt
  let bobY = 0;
  let legOffset = 0;
  let armAngle = 0;
  let slashProgress = 0;
  let hurtFlash = false;

  if (row === 0) {
    // Idle: breathing bounce
    bobY = Math.sin((col / 4) * Math.PI * 2) * (2 * scale);
  } else if (row === 1) {
    // Run: walking swing
    bobY = Math.abs(Math.sin((col / 4) * Math.PI * 2)) * (-4 * scale);
    legOffset = Math.sin((col / 4) * Math.PI * 2) * (6 * scale);
  } else if (row === 2) {
    // Attack: windup and strike
    slashProgress = (col + 1) / 4;
    armAngle = (col / 3) * Math.PI * 0.8;
  } else if (row === 3) {
    // Hurt / Defeat
    bobY = col * (2 * scale);
    hurtFlash = col % 2 === 0;
  }

  // --- 1. Soft Shadow on ground ---
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, (size * 0.28) * scale, (size * 0.09) * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- 2. Boss Dragon Special Wings & Aura ---
  if (isBoss) {
    const wingAngle = Math.sin((col / 4) * Math.PI * 2) * 0.3;
    ctx.fillStyle = hurtFlash ? "#ff3333" : "#7f1d1d";
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 3;

    // Left Wing
    ctx.save();
    ctx.translate(cx - 24 * scale, cy - 10 * scale);
    ctx.rotate(-0.4 + wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-28 * scale, -25 * scale);
    ctx.lineTo(-40 * scale, 0);
    ctx.lineTo(-20 * scale, 15 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.translate(cx + 24 * scale, cy - 10 * scale);
    ctx.rotate(0.4 - wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(28 * scale, -25 * scale);
    ctx.lineTo(40 * scale, 0);
    ctx.lineTo(20 * scale, 15 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- 3. Legs / Feet ---
  ctx.fillStyle = hurtFlash ? "#ffffff" : "#1e293b";
  const legW = (5 * scale);
  const legH = (12 * scale);
  // Left leg
  ctx.fillRect(cx - legW - 2, cy + bobY + 10 * scale + legOffset, legW, legH);
  // Right leg
  ctx.fillRect(cx + 2, cy + bobY + 10 * scale - legOffset, legW, legH);

  // --- 4. Main Body / Armor Torso ---
  ctx.fillStyle = hurtFlash ? "#ff4444" : primary;
  const bodyW = (18 * scale);
  const bodyH = (22 * scale);
  ctx.beginPath();
  ctx.roundRect(cx - bodyW / 2, cy + bobY - 8 * scale, bodyW, bodyH, 4 * scale);
  ctx.fill();

  // Inner Armor Plate / Chest Emblem
  ctx.fillStyle = hurtFlash ? "#ffffff" : secondary;
  ctx.beginPath();
  ctx.roundRect(cx - (bodyW * 0.6) / 2, cy + bobY - 4 * scale, bodyW * 0.6, bodyH * 0.5, 3 * scale);
  ctx.fill();

  // --- 5. Head / Helmet ---
  const headRadius = (11 * scale);
  const headY = cy + bobY - 18 * scale;
  ctx.fillStyle = hurtFlash ? "#ffffff" : primary;
  ctx.beginPath();
  ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Face Visor / Eyes
  ctx.fillStyle = isBoss ? "#facc15" : "#0f172a";
  ctx.fillRect(cx - 6 * scale, headY - 2 * scale, 12 * scale, 4 * scale);

  // Glowing Eye Dots
  ctx.fillStyle = isBoss ? "#ef4444" : "#38bdf8";
  ctx.fillRect(cx - 4 * scale, headY - 1 * scale, 2.5 * scale, 2 * scale);
  ctx.fillRect(cx + 1.5 * scale, headY - 1 * scale, 2.5 * scale, 2 * scale);

  // Horns / Crown for Boss or Tank
  if (isBoss) {
    ctx.fillStyle = "#f59e0b";
    // Horn Left
    ctx.beginPath();
    ctx.moveTo(cx - 7 * scale, headY - 8 * scale);
    ctx.lineTo(cx - 16 * scale, headY - 22 * scale);
    ctx.lineTo(cx - 3 * scale, headY - 10 * scale);
    ctx.fill();
    // Horn Right
    ctx.beginPath();
    ctx.moveTo(cx + 7 * scale, headY - 8 * scale);
    ctx.lineTo(cx + 16 * scale, headY - 22 * scale);
    ctx.lineTo(cx + 3 * scale, headY - 10 * scale);
    ctx.fill();
  }

  // --- 6. Weapon / Arms ---
  ctx.save();
  ctx.translate(cx + 10 * scale, cy + bobY);
  ctx.rotate(armAngle);

  if (opts.weaponType === "gun") {
    // Gunner: Energy Blaster Rifle
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, -3 * scale, 18 * scale, 6 * scale);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(14 * scale, -2 * scale, 5 * scale, 4 * scale);
    if (row === 2) {
      // Muzzle flash
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(24 * scale, 0, (6 * slashProgress) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (opts.weaponType === "daggers") {
    // Assassin: Twin Energy Daggers
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.moveTo(0, -2 * scale);
    ctx.lineTo(16 * scale, -8 * scale);
    ctx.lineTo(6 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (opts.weaponType === "shield") {
    // Tank: Heavy Shield
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.roundRect(-4 * scale, -10 * scale, 12 * scale, 20 * scale, 3 * scale);
    ctx.fill();
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Fighter / Default: Claymore Sword
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, -3 * scale, 20 * scale, 5 * scale);
    ctx.fillStyle = "#f87171";
    ctx.fillRect(-2 * scale, -7 * scale, 4 * scale, 14 * scale);
    // Blade glow
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(4 * scale, -1.5 * scale, 14 * scale, 2 * scale);
  }
  ctx.restore();

  // --- 7. Slash / Attack VFX Arc (Row 2) ---
  if (row === 2 && slashProgress > 0) {
    ctx.strokeStyle = opts.weaponType === "gun" ? "#38bdf8" : primary;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(cx + 8 * scale, cy + bobY - 4 * scale, (22 * slashProgress) * scale, -0.6, 1.2);
    ctx.stroke();
  }
}
