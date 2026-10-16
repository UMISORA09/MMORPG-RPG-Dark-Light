// ==============================================================================
// ProceduralSpriteFallback.ts
// 3/4 Top-Down Pixel Art Sprite Generator (Heroic Chibi & Pixel Monsters)
// Guarantees 100% Procedural Pixel Generation (Zero broken static SVGs/Sheets)
// - Slime: Red teardrop bouncy droplet with specular glint & vertical eyes
// - Goblin: Green skin, pointed ears, spiked wooden club
// - Skeleton: Pale bone ribs, hollow blue-glowing eye sockets, rusty blade
// - Wolf: Silver-grey quadruped, long snout, alert pointed ears, bared fangs
// - Boss Dragon: Crimson draconian wings, obsidian horns, fiery chest
// - Heroes: Spiky hair (Gold #fcd34d / Ice Blue #38bdf8), 1px crisp outline,
//   bright glow contrast for Assassin/Fighter/Tank/Gunner, 4-stage White Smear Arc
// ==============================================================================

import * as THREE from "three";

export interface SpriteGeneratorOptions {
  key: string;
  color: string;
  secondaryColor?: string;
  emoji?: string;
  weaponType?: "gun" | "daggers" | "sword" | "shield" | "claws" | "dragon";
  isBoss?: boolean;
}

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Always returns procedurally-generated crisp Pixel Art texture.
 * Bypasses stale/broken static png & svg files completely!
 */
export function loadOrFallbackSpritesheet(options: SpriteGeneratorOptions): THREE.Texture {
  return getOrCreateProceduralSpritesheet(options);
}

export function getOrCreateProceduralSpritesheet(options: SpriteGeneratorOptions): THREE.CanvasTexture {
  const cacheKey = `${options.key}_${options.color}_${options.isBoss ? "boss" : "norm"}_${options.weaponType || "sword"}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const frameSize = options.isBoss ? 128 : 64;
  const cols = 8;
  const rows = 9;
  const width = frameSize * cols;
  const height = frameSize * rows;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.imageSmoothingEnabled = false;

  const keyLower = options.key.toLowerCase();
  const isSlime = keyLower.includes("slime") || options.color === "#e6192e" || options.color === "#22c55e";
  const isGoblin = keyLower.includes("goblin");
  const isSkeleton = keyLower.includes("skeleton");
  const isWolf = keyLower.includes("wolf");
  const isDragon = keyLower.includes("dragon") || !!options.isBoss;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * frameSize;
      const y = row * frameSize;
      ctx.save();
      ctx.translate(x, y);

      if (isSlime) {
        drawRedSlimeFrame(ctx, row, col, frameSize, options);
      } else if (isGoblin) {
        drawGoblinFrame(ctx, row, col, frameSize, options);
      } else if (isSkeleton) {
        drawSkeletonFrame(ctx, row, col, frameSize, options);
      } else if (isWolf) {
        drawWolfFrame(ctx, row, col, frameSize, options);
      } else if (isDragon) {
        drawBossDragonFrame(ctx, row, col, frameSize, options);
      } else {
        // Hero Player & NPCs by Class
        const key = keyLower;
        const weapon = options.weaponType || "";
        const isGunner = key.includes("gunner") || weapon === "gun" || options.color === "#00f2ff";
        const isAssassin = key.includes("assassin") || weapon === "daggers" || options.color === "#f43f5e" || options.color === "#9d4edd";
        const isTank = key.includes("tank") || weapon === "shield" || options.color === "#ffd700" || options.color === "#eab308";

        if (isGunner) {
          drawGunnerHeroFrame(ctx, row, col, frameSize, options);
        } else if (isAssassin) {
          drawAssassinHeroFrame(ctx, row, col, frameSize, options);
        } else if (isTank) {
          drawTankHeroFrame(ctx, row, col, frameSize, options);
        } else {
          drawFighterHeroFrame(ctx, row, col, frameSize, options);
        }
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

  textureCache.set(cacheKey, texture);
  return texture;
}

// ==============================================================================
// 1. RED SLIME MONSTER (TEARDROP SHAPE, SPECULAR HIGHLIGHT & BOUNCY SQUASH)
// ==============================================================================
function drawRedSlimeFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const groundY = size * 0.85;

  let stretchX = 1.0;
  let stretchY = 1.0;
  let bounceY = 0;
  let showDroplets = false;

  if (row === 0) {
    // Idle: Slow breathing pulse
    const phase = Math.sin((col / 8) * Math.PI * 2);
    stretchX = 1.0 + phase * 0.12;
    stretchY = 1.0 - phase * 0.12;
    bounceY = -Math.abs(phase) * 2;
  } else if (row === 1) {
    // Walk / Run: Bouncy spring
    const jumpPhase = (col / 8) * Math.PI * 2;
    stretchY = 0.85 + Math.sin(jumpPhase) * 0.35;
    stretchX = 2.0 - stretchY;
    bounceY = -Math.abs(Math.sin(jumpPhase)) * 14;
    showDroplets = col === 2 || col === 3;
  } else if (row >= 2 && row <= 7) {
    // Attack: Lunge forward & squash
    const attackPhase = (col / 8) * Math.PI;
    stretchX = 1.3 + Math.sin(attackPhase) * 0.25;
    stretchY = 0.8;
    bounceY = -Math.sin(attackPhase) * 8;
    showDroplets = true;
  } else {
    // Hurt / Death
    stretchX = 1.4 + (col / 8) * 0.6;
    stretchY = 0.6 - (col / 8) * 0.4;
    showDroplets = true;
  }

  // 1. Dark Shadow below
  ctx.fillStyle = "rgba(20, 5, 10, 0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 4, 18 * stretchX, 6 * stretchX, 0, 0, Math.PI * 2);
  ctx.fill();

  const baseRadius = 18;
  const slimeW = baseRadius * 2 * stretchX;
  const slimeH = baseRadius * 1.9 * stretchY;
  const slimeX = cx - slimeW / 2;
  const slimeY = groundY + bounceY - slimeH;

  // 2. Thick Dark Red Outline (#590009)
  ctx.fillStyle = "#590009";
  ctx.beginPath();
  ctx.roundRect(slimeX - 2, slimeY - 2, slimeW + 4, slimeH + 4, [16 * stretchX, 16 * stretchX, 6 * stretchX, 6 * stretchX]);
  ctx.fill();

  // 3. Vibrant Pure Red Body (#e6192e)
  ctx.fillStyle = "#e6192e";
  ctx.beginPath();
  ctx.roundRect(slimeX, slimeY, slimeW, slimeH, [14 * stretchX, 14 * stretchX, 4 * stretchX, 4 * stretchX]);
  ctx.fill();

  // 4. Specular White Highlight & Pink Inner Glow
  ctx.fillStyle = "#ffa6b2";
  ctx.beginPath();
  ctx.arc(cx - slimeW * 0.22, slimeY + slimeH * 0.28, 6 * stretchY, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx - slimeW * 0.24, slimeY + slimeH * 0.24, 3.5 * stretchY, 0, Math.PI * 2);
  ctx.fill();

  // 5. Vertical Expressive Dark Eyes (#110006)
  if (row !== 8) {
    ctx.fillStyle = "#110006";
    const eyeH = 7 * stretchY;
    const eyeW = 3.5;
    const eyeY = slimeY + slimeH * 0.42;

    ctx.fillRect(cx - 7 * stretchX, eyeY, eyeW, eyeH);
    ctx.fillRect(cx + 3.5 * stretchX, eyeY, eyeW, eyeH);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - 6 * stretchX, eyeY + 1, 1.5, 2);
    ctx.fillRect(cx + 4.5 * stretchX, eyeY + 1, 1.5, 2);
  }

  // 6. Splattering Red Droplets
  if (showDroplets) {
    ctx.fillStyle = "#e6192e";
    ctx.fillRect(cx - slimeW * 0.65, groundY - 8, 3, 3);
    ctx.fillRect(cx + slimeW * 0.62, groundY - 6, 2, 2);
    ctx.fillRect(cx + slimeW * 0.5, groundY - 14, 3, 3);
  }
}

// ==============================================================================
// 2. GOBLIN MONSTER (GREEN SKIN, POINTED EARS, LEATHER LOINCLOTH & CLUB)
// ==============================================================================
function drawGoblinFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const bobY = Math.sin((col / 8) * Math.PI * 2) * (row === 1 ? -4 : 2);

  // Shadow
  ctx.fillStyle = "rgba(10, 20, 10, 0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Green Skin Body (#16a34a, outline #052e16)
  ctx.fillStyle = "#052e16";
  ctx.fillRect(cx - 8, cy + bobY - 4, 16, 16);
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(cx - 7, cy + bobY - 3, 14, 14);

  // Leather Loincloth (#78350f)
  ctx.fillStyle = "#78350f";
  ctx.fillRect(cx - 8, cy + bobY + 4, 16, 6);

  // Head (#22c55e)
  ctx.fillStyle = "#052e16";
  ctx.fillRect(cx - 9, cy + bobY - 20, 18, 16);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(cx - 8, cy + bobY - 19, 16, 14);

  // Long Pointed Ears
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(cx - 15, cy + bobY - 16, 7, 4);
  ctx.fillRect(cx + 8, cy + bobY - 16, 7, 4);

  // Fierce Orange Eyes
  ctx.fillStyle = "#f97316";
  ctx.fillRect(cx - 5, cy + bobY - 13, 3, 3);
  ctx.fillRect(cx + 2, cy + bobY - 13, 3, 3);

  // Wooden Club Weapon
  ctx.fillStyle = "#451a03";
  ctx.fillRect(cx + 9, cy + bobY - 18, 5, 18);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(cx + 8, cy + bobY - 22, 7, 8);
}

// ==============================================================================
// 3. SKELETON MONSTER (PALE BONES, HOLLOW BLUE GLOW EYES, RUSTY BLADE)
// ==============================================================================
function drawSkeletonFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const bobY = Math.sin((col / 8) * Math.PI * 2) * (row === 1 ? -4 : 2);

  // Shadow
  ctx.fillStyle = "rgba(10, 15, 25, 0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spine & Ribs (#f1f5f9)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(cx - 6, cy + bobY - 4, 12, 16);
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(cx - 1, cy + bobY - 4, 2, 14); // Spine
  ctx.fillRect(cx - 5, cy + bobY - 2, 10, 2); // Rib 1
  ctx.fillRect(cx - 5, cy + bobY + 2, 10, 2); // Rib 2
  ctx.fillRect(cx - 4, cy + bobY + 6, 8, 2);  // Rib 3

  // Skull Head (#f8fafc)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(cx - 8, cy + bobY - 20, 16, 16);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(cx - 7, cy + bobY - 19, 14, 14);

  // Hollow Eye Sockets with Cyan Undead Soul Glow
  ctx.fillStyle = "#020617";
  ctx.fillRect(cx - 5, cy + bobY - 14, 4, 5);
  ctx.fillRect(cx + 1, cy + bobY - 14, 4, 5);
  ctx.fillStyle = "#00f2ff";
  ctx.fillRect(cx - 4, cy + bobY - 13, 2, 2);
  ctx.fillRect(cx + 2, cy + bobY - 13, 2, 2);

  // Rusty Sword
  ctx.fillStyle = "#78350f";
  ctx.fillRect(cx + 8, cy + bobY - 16, 4, 18);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(cx + 9, cy + bobY - 24, 2, 10);
}

// ==============================================================================
// 4. WOLF MONSTER (SILVER-GREY QUADRUPED, LONG SNOUT, ALERT POINTED EARS)
// ==============================================================================
function drawWolfFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.68;
  const bobY = Math.sin((col / 8) * Math.PI * 2) * (row === 1 ? -5 : 2);

  // Shadow
  ctx.fillStyle = "rgba(10, 15, 25, 0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body Torso (#64748b, outline #1e293b)
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(cx - 16, cy + bobY - 8, 30, 14);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(cx - 15, cy + bobY - 7, 28, 12);

  // 4 Legs
  ctx.fillStyle = "#475569";
  ctx.fillRect(cx - 14, cy + bobY + 4, 4, 10);
  ctx.fillRect(cx - 8, cy + bobY + 4, 4, 10);
  ctx.fillRect(cx + 4, cy + bobY + 4, 4, 10);
  ctx.fillRect(cx + 10, cy + bobY + 4, 4, 10);

  // Head & Long Snout (#94a3b8)
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(cx + 8, cy + bobY - 16, 16, 12);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(cx + 9, cy + bobY - 15, 14, 10);

  // Snout nose (#0f172a)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(cx + 20, cy + bobY - 12, 4, 3);

  // Pointed Ears
  ctx.fillStyle = "#475569";
  ctx.fillRect(cx + 9, cy + bobY - 20, 4, 5);

  // Yellow Predator Eyes
  ctx.fillStyle = "#facc15";
  ctx.fillRect(cx + 14, cy + bobY - 13, 3, 2);

  // Bushy Tail at rear
  ctx.fillStyle = "#475569";
  ctx.fillRect(cx - 20, cy + bobY - 12, 6, 10);
}

// ==============================================================================
// 5. BOSS DRAGON (CRIMSON WINGS, OBSIDIAN HORNS, MOLTEN FIERY GLOW)
// ==============================================================================
function drawBossDragonFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.6;
  const scale = 1.4;
  const bobY = Math.sin((col / 8) * Math.PI * 2) * 4;

  // Ground Shadow
  ctx.fillStyle = "rgba(20, 5, 10, 0.5)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings (Flapping swing)
  const wingY = Math.sin((col / 8) * Math.PI * 2) * 8;
  ctx.fillStyle = "#7f1d1d";
  // Left Wing
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + bobY);
  ctx.lineTo(cx - 44, cy + bobY - 28 + wingY);
  ctx.lineTo(cx - 52, cy + bobY + wingY);
  ctx.closePath();
  ctx.fill();
  // Right Wing
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy + bobY);
  ctx.lineTo(cx + 44, cy + bobY - 28 + wingY);
  ctx.lineTo(cx + 52, cy + bobY + wingY);
  ctx.closePath();
  ctx.fill();

  // Dragon Body (#991b1b & #ef4444)
  ctx.fillStyle = "#450a0a";
  ctx.fillRect(cx - 18 * scale, cy + bobY - 10 * scale, 36 * scale, 28 * scale);
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(cx - 16 * scale, cy + bobY - 8 * scale, 32 * scale, 24 * scale);

  // Molten Lava Core on Chest (#ffaa00)
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(cx - 8 * scale, cy + bobY - 2 * scale, 16 * scale, 12 * scale);

  // Dragon Horned Head
  ctx.fillStyle = "#450a0a";
  ctx.fillRect(cx - 14 * scale, cy + bobY - 28 * scale, 28 * scale, 20 * scale);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(cx - 12 * scale, cy + bobY - 26 * scale, 24 * scale, 16 * scale);

  // Obsidian Golden Horns
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(cx - 18 * scale, cy + bobY - 36 * scale, 6 * scale, 12 * scale);
  ctx.fillRect(cx + 12 * scale, cy + bobY - 36 * scale, 6 * scale, 12 * scale);

  // Glowing Fiery Eyes
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(cx - 8 * scale, cy + bobY - 20 * scale, 4 * scale, 3 * scale);
  ctx.fillRect(cx + 4 * scale, cy + bobY - 20 * scale, 4 * scale, 3 * scale);
}

// ==============================================================================
// 6. HEROIC CHIBI PLAYER & NPCS (HIGH CONTRAST, BRIGHT AURA, SPIKY HAIR & SMEAR ARC)
// ==============================================================================
// ==============================================================================
// 6. DEDICATED CLASS RENDERERS (GUNNER, ASSASSIN, FIGHTER, TANK)
// ==============================================================================

// ── A. XẠ THỦ (GUNNER) — Cyberpunk Tactical Ranger with Dual Plasma Pistols & Jetpack ──
function drawGunnerHeroFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const isAttackRow = row >= 3 && row <= 7;

  let bobY = 0;
  let legOffset = 0;
  let attackStage = 0;
  let hurtFlash = false;

  if (row === 0) {
    bobY = Math.sin((col / 8) * Math.PI * 2) * 2;
  } else if (row === 1) {
    bobY = Math.abs(Math.sin((col / 8) * Math.PI * 2)) * -5;
    legOffset = Math.sin((col / 8) * Math.PI * 2) * 8;
  } else if (row === 2) {
    bobY = Math.sin((col / 8) * Math.PI) * -12;
    legOffset = -4;
  } else if (isAttackRow) {
    attackStage = col % 4;
    bobY = attackStage === 0 ? 1 : attackStage === 1 ? -2 : attackStage === 2 ? 0 : 0;
  } else if (row === 8) {
    hurtFlash = col % 2 === 0;
    bobY = col * 2;
  }

  // 1. Neon Cyan Foot Halo & Ground Shadow
  ctx.fillStyle = "rgba(10, 20, 35, 0.6)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 242, 255, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 16, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Back Jetpack with Glowing Thruster Flames
  const jetpackY = cy + bobY - 8;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(cx - 13, jetpackY, 6, 12);
  ctx.fillRect(cx + 7, jetpackY, 6, 12);
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(cx - 12, jetpackY + 2, 4, 8);
  ctx.fillRect(cx + 8, jetpackY + 2, 4, 8);

  // Thruster exhaust particles (active during run/jump/attack)
  if (row === 1 || row === 2 || isAttackRow) {
    ctx.fillStyle = "#00f2ff";
    const flameH = 4 + (col % 3) * 3;
    ctx.fillRect(cx - 11, jetpackY + 12, 2, flameH);
    ctx.fillRect(cx + 9, jetpackY + 12, 2, flameH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - 11, jetpackY + 12, 2, 2);
    ctx.fillRect(cx + 9, jetpackY + 12, 2, 2);
  }

  // 3. Legs & High-Tech Tactical Boots
  ctx.fillStyle = "#090d16";
  ctx.fillRect(cx - 8, cy + bobY + 11 + legOffset, 7, 11);
  ctx.fillRect(cx + 1, cy + bobY + 11 - legOffset, 7, 11);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#1e293b";
  ctx.fillRect(cx - 7, cy + bobY + 12 + legOffset, 5, 9);
  ctx.fillRect(cx + 2, cy + bobY + 12 - legOffset, 5, 9);

  // Cyan boot LED sole
  ctx.fillStyle = "#00f2ff";
  ctx.fillRect(cx - 7, cy + bobY + 20 + legOffset, 5, 2);
  ctx.fillRect(cx + 2, cy + bobY + 20 - legOffset, 5, 2);

  // 4. Torso & Cybernetic Ballistic Armor with Arc Reactor Core
  const bodyW = 18;
  const bodyH = 16;
  const bodyX = cx - bodyW / 2;
  const bodyY = cy + bobY - 4;

  ctx.fillStyle = "#090d16";
  ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, bodyH + 4);

  ctx.fillStyle = hurtFlash ? "#ef4444" : "#0f172a";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  // Chest Armor Plating (Navy & Slate Blue)
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(bodyX + 2, bodyY + 2, bodyW - 4, 6);

  // Glowing Arc Reactor Core (Center Chest)
  ctx.fillStyle = "#00f2ff";
  ctx.fillRect(cx - 3, bodyY + 4, 6, 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 1, bodyY + 5, 2, 4);

  // Tactical Belt & Holster
  ctx.fillStyle = "#334155";
  ctx.fillRect(bodyX, bodyY + bodyH - 4, bodyW, 4);
  ctx.fillStyle = "#00f2ff";
  ctx.fillRect(cx - 2, bodyY + bodyH - 3, 4, 2);

  // 5. Head & Cyber Visor (Futuristic HUD over eyes)
  const headW = 22;
  const headH = 20;
  const headX = cx - headW / 2;
  const headY = cy + bobY - 24;

  ctx.fillStyle = "#090d16";
  ctx.fillRect(headX - 2, headY - 2, headW + 4, headH + 4);

  ctx.fillStyle = hurtFlash ? "#ffcccc" : "#fed7aa";
  ctx.fillRect(headX, headY, headW, headH);

  // Cyber Visor over Eyes
  if (row !== 8) {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(headX + 2, headY + 7, headW - 4, 8);
    // Glowing Neon Cyan Visor Lens
    ctx.fillStyle = "#00f2ff";
    ctx.fillRect(headX + 3, headY + 8, headW - 6, 6);
    // Visor HUD Scanline & Reticle
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(headX + 5, headY + 10, 4, 2);
    ctx.fillRect(headX + headW - 9, headY + 10, 4, 2);
  }

  // 6. Spiky Ice-Blue Hair
  ctx.fillStyle = "#090d16";
  ctx.fillRect(headX - 5, headY - 11, headW + 10, 12);
  ctx.fillRect(headX - 7, headY - 5, 5, 10);
  ctx.fillRect(headX + headW + 2, headY - 5, 5, 10);
  ctx.fillRect(cx - 6, headY - 15, 12, 8);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#38bdf8";
  ctx.fillRect(headX - 4, headY - 9, headW + 7, 10);
  ctx.fillRect(cx - 4, headY - 13, 8, 8);
  ctx.fillRect(headX - 5, headY - 3, 4, 8);
  ctx.fillRect(headX + headW + 1, headY - 3, 4, 8);

  // Sharp Ice-Blue Hair Highlights
  ctx.fillStyle = "#a5f3fc";
  ctx.fillRect(headX + 2, headY - 8, 8, 3);
  ctx.fillRect(cx - 2, headY - 12, 4, 4);

  // 7. Dual Plasma Pistols & Combat Laser Firing
  if (isAttackRow) {
    if (attackStage === 0) {
      // Windup: Aim forward with laser target beam
      ctx.save();
      ctx.translate(cx + 8, cy + bobY);
      drawPixelPlasmaPistol(ctx, false);
      ctx.restore();

      ctx.save();
      ctx.translate(cx - 10, cy + bobY + 2);
      drawPixelPlasmaPistol(ctx, false);
      ctx.restore();

      // Laser Sight Target Beam
      ctx.strokeStyle = "rgba(0, 242, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 18, cy + bobY);
      ctx.lineTo(cx + 36, cy + bobY);
      ctx.stroke();
    } else if (attackStage === 1) {
      // FIRE: Dual Plasma Cross-Star Muzzle Flash & Laser Bolt
      ctx.save();
      ctx.translate(cx + 10, cy + bobY - 2);
      drawPixelPlasmaPistol(ctx, true);
      ctx.restore();

      ctx.save();
      ctx.translate(cx - 8, cy + bobY - 1);
      drawPixelPlasmaPistol(ctx, true);
      ctx.restore();

      // Dual High-Energy Plasma Laser Bolts
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + 22, cy + bobY - 4, 12, 4);
      ctx.fillRect(cx + 22, cy + bobY + 2, 10, 4);
      ctx.fillStyle = "#00f2ff";
      ctx.fillRect(cx + 20, cy + bobY - 5, 16, 6);
      ctx.fillRect(cx + 20, cy + bobY + 1, 14, 6);
    } else if (attackStage === 2) {
      // Recoil: Pistols raised with vapor dissipation
      ctx.save();
      ctx.translate(cx + 8, cy + bobY - 4);
      ctx.rotate(-0.35);
      drawPixelPlasmaPistol(ctx, false);
      ctx.restore();

      // Energy discharge spark
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(cx + 18, cy + bobY - 6, 3, 3);
      ctx.fillRect(cx + 24, cy + bobY - 2, 2, 2);
    } else {
      // Recovery
      ctx.save();
      ctx.translate(cx + 6, cy + bobY);
      drawPixelPlasmaPistol(ctx, false);
      ctx.restore();
    }
  } else if (row !== 8) {
    // Idle / Walk: Hold dual pistols in ready stance
    ctx.save();
    ctx.translate(cx + 8, cy + bobY + 2);
    ctx.rotate(0.15);
    drawPixelPlasmaPistol(ctx, false);
    ctx.restore();
  }
}

// ── B. SÁT THỦ (ASSASSIN) — Shadow Ninja with Trailing Scarf & Twin Reverse Daggers ──
function drawAssassinHeroFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const isAttackRow = row >= 3 && row <= 7;

  let bobY = 0;
  let legOffset = 0;
  let attackStage = 0;
  let hurtFlash = false;

  if (row === 0) {
    bobY = Math.sin((col / 8) * Math.PI * 2) * 2;
  } else if (row === 1) {
    bobY = Math.abs(Math.sin((col / 8) * Math.PI * 2)) * -5;
    legOffset = Math.sin((col / 8) * Math.PI * 2) * 8;
  } else if (row === 2) {
    bobY = Math.sin((col / 8) * Math.PI) * -12;
    legOffset = -4;
  } else if (isAttackRow) {
    attackStage = col % 4;
    bobY = attackStage === 0 ? 2 : attackStage === 1 ? -3 : attackStage === 2 ? 1 : 0;
  } else if (row === 8) {
    hurtFlash = col % 2 === 0;
    bobY = col * 2;
  }

  // 1. Shadow Purple Aura & Ground Shadow
  ctx.fillStyle = "rgba(25, 5, 35, 0.6)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 16, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Trailing Flowing Crimson-Orange Ninja Scarf (Dynamic wave physics)
  const wave = Math.sin((col / 8) * Math.PI * 2) * (row === 1 ? 6 : 4);
  const scarfY = cy + bobY - 4;
  // Scarf Main Ribbon
  ctx.fillStyle = "#f97316";
  ctx.fillRect(cx - 16, scarfY + wave, 14, 4);
  ctx.fillRect(cx - 24, scarfY + wave * 1.3 - 2, 12, 4);
  // Scarf Red Tail
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(cx - 30, scarfY + wave * 1.5 - 4, 8, 3);
  ctx.fillRect(cx - 34, scarfY + wave * 1.8 - 6, 5, 2);

  // 3. Shinobi Legs & Tabi Wraps
  ctx.fillStyle = "#1e0b36";
  ctx.fillRect(cx - 8, cy + bobY + 11 + legOffset, 7, 11);
  ctx.fillRect(cx + 1, cy + bobY + 11 - legOffset, 7, 11);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#581c87";
  ctx.fillRect(cx - 7, cy + bobY + 12 + legOffset, 5, 9);
  ctx.fillRect(cx + 2, cy + bobY + 12 - legOffset, 5, 9);

  // Purple Tabi ankle wrap
  ctx.fillStyle = "#c084fc";
  ctx.fillRect(cx - 7, cy + bobY + 16 + legOffset, 5, 2);
  ctx.fillRect(cx + 2, cy + bobY + 16 - legOffset, 5, 2);

  // 4. Torso & Shadow Leather Tunic with Gold Buckles
  const bodyW = 18;
  const bodyH = 16;
  const bodyX = cx - bodyW / 2;
  const bodyY = cy + bobY - 4;

  ctx.fillStyle = "#150624";
  ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, bodyH + 4);

  ctx.fillStyle = hurtFlash ? "#ef4444" : "#6b21a8";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  // Leather Harness & Gold Belt Buckle
  ctx.fillStyle = "#3b0764";
  ctx.fillRect(bodyX + 2, bodyY + 4, bodyW - 4, 4);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 2, bodyY + bodyH - 4, 4, 4);

  // 5. Head with Shadow Cowl / Hood & Face Mask
  const headW = 22;
  const headH = 20;
  const headX = cx - headW / 2;
  const headY = cy + bobY - 24;

  ctx.fillStyle = "#150624";
  ctx.fillRect(headX - 2, headY - 2, headW + 4, headH + 4);

  ctx.fillStyle = hurtFlash ? "#ffcccc" : "#fcd3a1";
  ctx.fillRect(headX, headY, headW, headH);

  // Shadow Cowl Hood
  ctx.fillStyle = "#3b0764";
  ctx.fillRect(headX - 4, headY - 8, headW + 8, 12);
  ctx.fillRect(cx - 4, headY - 12, 8, 6);

  // Ninja Lower Face Mask
  ctx.fillStyle = "#1e1035";
  ctx.fillRect(headX + 2, headY + 12, headW - 4, 8);

  // Glowing Crimson/Magenta Assassin Eyes
  if (row !== 8) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(headX + 4, headY + 7, 4, 4);
    ctx.fillRect(headX + headW - 8, headY + 7, 4, 4);

    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(headX + 5, headY + 8, 3, 3);
    ctx.fillRect(headX + headW - 7, headY + 8, 3, 3);
  }

  // Purple Hair Strands Peeking out
  ctx.fillStyle = "#c084fc";
  ctx.fillRect(headX - 2, headY + 2, 3, 6);
  ctx.fillRect(headX + headW - 1, headY + 2, 3, 6);

  // 6. Dual Reverse-Grip Shadow Daggers & Attack Slashes
  if (isAttackRow) {
    if (attackStage === 0) {
      // Windup: Crossed daggers in stealth stance
      ctx.save();
      ctx.translate(cx + 6, cy + bobY - 2);
      ctx.rotate(-0.4);
      drawPixelTwinDaggers(ctx);
      ctx.restore();

      ctx.save();
      ctx.translate(cx - 8, cy + bobY - 2);
      ctx.rotate(0.4);
      drawPixelTwinDaggers(ctx);
      ctx.restore();
    } else if (attackStage === 1) {
      // STRIKE: Dual Crossing Crimson Smear Arcs (X-Slash)
      ctx.save();
      ctx.translate(cx + 12, cy + bobY - 2);
      ctx.rotate(0.5);
      drawPixelTwinDaggers(ctx);
      ctx.restore();

      // Top-Down Crimson Smear Arc 1
      ctx.save();
      ctx.translate(cx, cy + bobY - 6);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(10, 0, 22, -Math.PI * 0.4, Math.PI * 0.35, false);
      ctx.stroke();

      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(10, 0, 25, -Math.PI * 0.45, Math.PI * 0.3, false);
      ctx.stroke();
      ctx.restore();

      // Reverse Slash Arc 2 (Creating Glowing 'X' Cross-Slash)
      ctx.save();
      ctx.translate(cx, cy + bobY - 6);
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(10, 0, 20, Math.PI * 0.4, -Math.PI * 0.35, true);
      ctx.stroke();
      ctx.restore();
    } else if (attackStage === 2) {
      // Follow Through: Puncture stab forward
      ctx.save();
      ctx.translate(cx + 16, cy + bobY + 2);
      ctx.rotate(1.2);
      drawPixelTwinDaggers(ctx);
      ctx.restore();

      // Blood-red impact particle
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(cx + 26, cy + bobY + 4, 4, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + 27, cy + bobY + 5, 2, 2);
    } else {
      // Recovery
      ctx.save();
      ctx.translate(cx + 6, cy + bobY);
      ctx.rotate(0.3);
      drawPixelTwinDaggers(ctx);
      ctx.restore();
    }
  } else if (row !== 8) {
    ctx.save();
    ctx.translate(cx + 8, cy + bobY + 2);
    ctx.rotate(0.2);
    drawPixelTwinDaggers(ctx);
    ctx.restore();
  }
}

// ── C. ĐẤU SĨ (FIGHTER) — Muscular Flame Dragon Warrior with Broadsword & 6-Pack ──
function drawFighterHeroFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const isAttackRow = row >= 3 && row <= 7;

  let bobY = 0;
  let legOffset = 0;
  let attackStage = 0;
  let hurtFlash = false;

  if (row === 0) {
    bobY = Math.sin((col / 8) * Math.PI * 2) * 2;
  } else if (row === 1) {
    bobY = Math.abs(Math.sin((col / 8) * Math.PI * 2)) * -5;
    legOffset = Math.sin((col / 8) * Math.PI * 2) * 8;
  } else if (row === 2) {
    bobY = Math.sin((col / 8) * Math.PI) * -12;
    legOffset = -4;
  } else if (isAttackRow) {
    attackStage = col % 4;
    bobY = attackStage === 0 ? 2 : attackStage === 1 ? -2 : attackStage === 2 ? 1 : 0;
  } else if (row === 8) {
    hurtFlash = col % 2 === 0;
    bobY = col * 2;
  }

  // 1. Fiery Orange Foot Halo & Ground Shadow
  ctx.fillStyle = "rgba(35, 10, 5, 0.6)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(249, 115, 22, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 16, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Legs & Red Martial Boots
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(cx - 8, cy + bobY + 11 + legOffset, 7, 11);
  ctx.fillRect(cx + 1, cy + bobY + 11 - legOffset, 7, 11);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#7f1d1d";
  ctx.fillRect(cx - 7, cy + bobY + 12 + legOffset, 5, 9);
  ctx.fillRect(cx + 2, cy + bobY + 12 - legOffset, 5, 9);

  // Gold martial leg bands
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(cx - 7, cy + bobY + 15 + legOffset, 5, 2);
  ctx.fillRect(cx + 2, cy + bobY + 15 - legOffset, 5, 2);

  // 3. Torso: Muscular 6-Pack Abs & Open Crimson Martial Gi
  const bodyW = 18;
  const bodyH = 16;
  const bodyX = cx - bodyW / 2;
  const bodyY = cy + bobY - 4;

  ctx.fillStyle = "#18181b";
  ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, bodyH + 4);

  // Exposed Tanned Muscular Torso
  ctx.fillStyle = hurtFlash ? "#ef4444" : "#fcd3a1";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  // Defined 6-pack abs shading
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(cx - 3, bodyY + 4, 2, 2);
  ctx.fillRect(cx + 1, bodyY + 4, 2, 2);
  ctx.fillRect(cx - 3, bodyY + 7, 2, 2);
  ctx.fillRect(cx + 1, bodyY + 7, 2, 2);
  ctx.fillRect(cx - 3, bodyY + 10, 2, 2);
  ctx.fillRect(cx + 1, bodyY + 10, 2, 2);

  // Open Red Martial Vest (Left & Right Flaps)
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(bodyX, bodyY, 4, bodyH - 2);
  ctx.fillRect(bodyX + bodyW - 4, bodyY, 4, bodyH - 2);

  // Gold Dragon Martial Belt / Sash
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(bodyX, bodyY + bodyH - 4, bodyW, 4);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 2, bodyY + bodyH - 5, 4, 5);

  // 4. Head & Anime Face
  const headW = 22;
  const headH = 20;
  const headX = cx - headW / 2;
  const headY = cy + bobY - 24;

  ctx.fillStyle = "#18181b";
  ctx.fillRect(headX - 2, headY - 2, headW + 4, headH + 4);

  ctx.fillStyle = hurtFlash ? "#ffcccc" : "#fcd3a1";
  ctx.fillRect(headX, headY, headW, headH);

  // Fierce Anime Eyes
  if (row !== 8) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(headX + 4, headY + 8, 4, 6);
    ctx.fillRect(headX + headW - 8, headY + 8, 4, 6);

    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(headX + 5, headY + 9, 3, 5);
    ctx.fillRect(headX + headW - 7, headY + 9, 3, 5);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(headX + 6, headY + 9, 2, 2);
    ctx.fillRect(headX + headW - 6, headY + 9, 2, 2);
  }

  // Red Martial Headband
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(headX - 3, headY + 3, headW + 6, 4);
  // Fluttering headband tails
  const ribbonWave = Math.sin((col / 8) * Math.PI * 2) * 3;
  ctx.fillRect(headX - 10, headY + 5 + ribbonWave, 8, 3);

  // 5. Wild Spiky Flame Hair
  ctx.fillStyle = "#18181b";
  ctx.fillRect(headX - 6, headY - 10, headW + 12, 12);
  ctx.fillRect(cx - 5, headY - 14, 10, 8);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#ef4444";
  ctx.fillRect(headX - 4, headY - 8, headW + 8, 10);
  ctx.fillRect(cx - 3, headY - 12, 6, 8);
  ctx.fillRect(headX - 6, headY - 2, 4, 8);
  ctx.fillRect(headX + headW + 1, headY - 2, 4, 8);

  // Flame Yellow Hair Highlights
  ctx.fillStyle = "#fde047";
  ctx.fillRect(headX + 2, headY - 7, 8, 3);
  ctx.fillRect(cx - 2, headY - 11, 4, 4);

  // 6. Heavy Flaming Dragon Broadsword Attack
  if (isAttackRow) {
    if (attackStage === 0) {
      // Windup overhead
      ctx.save();
      ctx.translate(cx - 10, cy + bobY - 6);
      ctx.rotate(-0.9);
      drawPixelFlamingBroadsword(ctx);
      ctx.restore();
    } else if (attackStage === 1) {
      // STRIKE with GIANT ORANGE-RED FIRE SMEAR ARC
      ctx.save();
      ctx.translate(cx + 8, cy + bobY - 2);
      ctx.rotate(0.35);
      drawPixelFlamingBroadsword(ctx);
      ctx.restore();

      // WHITE CORE + ORANGE FIRE SMEAR ARC
      ctx.save();
      ctx.translate(cx, cy + bobY - 8);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(8, 0, 26, -Math.PI * 0.45, Math.PI * 0.35, false);
      ctx.stroke();

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(8, 0, 30, -Math.PI * 0.4, Math.PI * 0.3, false);
      ctx.stroke();
      ctx.restore();
    } else if (attackStage === 2) {
      // Follow Through & Ground Crack
      ctx.save();
      ctx.translate(cx + 16, cy + bobY + 2);
      ctx.rotate(1.2);
      drawPixelFlamingBroadsword(ctx);
      ctx.restore();

      // Fire Ember Spark
      ctx.fillStyle = "#f97316";
      ctx.fillRect(cx + 28, cy + bobY + 4, 5, 5);
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(cx + 29, cy + bobY + 5, 3, 3);
    } else {
      // Recovery
      ctx.save();
      ctx.translate(cx + 6, cy + bobY);
      ctx.rotate(0.6);
      drawPixelFlamingBroadsword(ctx);
      ctx.restore();
    }
  } else if (row !== 8) {
    ctx.save();
    ctx.translate(cx + 8, cy + bobY + 2);
    ctx.rotate(0.2);
    drawPixelFlamingBroadsword(ctx);
    ctx.restore();
  }
}

// ── D. ĐỠ ĐÒN / HỘ VỆ (TANK) — Golden Fortress Knight with Tower Shield & War Hammer ──
function drawTankHeroFrame(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  size: number,
  _opts: SpriteGeneratorOptions
) {
  const cx = size / 2;
  const cy = size * 0.65;
  const isAttackRow = row >= 3 && row <= 7;

  let bobY = 0;
  let legOffset = 0;
  let attackStage = 0;
  let hurtFlash = false;

  if (row === 0) {
    bobY = Math.sin((col / 8) * Math.PI * 2) * 1.5;
  } else if (row === 1) {
    bobY = Math.abs(Math.sin((col / 8) * Math.PI * 2)) * -4;
    legOffset = Math.sin((col / 8) * Math.PI * 2) * 6;
  } else if (row === 2) {
    bobY = Math.sin((col / 8) * Math.PI) * -10;
    legOffset = -3;
  } else if (isAttackRow) {
    attackStage = col % 4;
    bobY = attackStage === 0 ? 1 : attackStage === 1 ? -2 : attackStage === 2 ? 0 : 0;
  } else if (row === 8) {
    hurtFlash = col % 2 === 0;
    bobY = col * 2;
  }

  // 1. Imperial Sacred Gold Foot Aura & Ground Shadow
  ctx.fillStyle = "rgba(30, 20, 5, 0.65)";
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(234, 179, 8, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.9, 18, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Royal Crimson Knight Cape (Flowing behind)
  const capeWave = Math.sin((col / 8) * Math.PI * 2) * 3;
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(cx - 15, cy + bobY - 4 + capeWave, 8, 18);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 15, cy + bobY + 12 + capeWave, 8, 2); // Cape Gold Hem

  // 3. Bulky Gilded Greaves & Plated Sabatons
  ctx.fillStyle = "#1e1b18";
  ctx.fillRect(cx - 9, cy + bobY + 11 + legOffset, 8, 12);
  ctx.fillRect(cx + 1, cy + bobY + 11 - legOffset, 8, 12);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#ca8a04";
  ctx.fillRect(cx - 8, cy + bobY + 12 + legOffset, 6, 10);
  ctx.fillRect(cx + 2, cy + bobY + 12 - legOffset, 6, 10);

  // 4. Heavy Gilded Full-Plate Cuirass & Spiked Pauldrons
  const bodyW = 22; // Wider fortress silhouette!
  const bodyH = 17;
  const bodyX = cx - bodyW / 2;
  const bodyY = cy + bobY - 4;

  ctx.fillStyle = "#1e1b18";
  ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, bodyH + 4);

  ctx.fillStyle = hurtFlash ? "#ef4444" : "#eab308";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  // Heavy Spiked Golden Shoulder Pauldrons (Left & Right)
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(bodyX - 4, bodyY - 2, 6, 8);
  ctx.fillRect(bodyX + bodyW - 2, bodyY - 2, 6, 8);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(bodyX - 3, bodyY - 4, 3, 3); // Shoulder spike
  ctx.fillRect(bodyX + bodyW, bodyY - 4, 3, 3);

  // Breastplate Solar Emblem
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(cx - 3, bodyY + 4, 6, 6);
  ctx.fillStyle = "#d97706";
  ctx.fillRect(cx - 1, bodyY + 5, 2, 4);

  // Heavy Plate Belt
  ctx.fillStyle = "#78350f";
  ctx.fillRect(bodyX, bodyY + bodyH - 4, bodyW, 4);

  // 5. Heavy Knight Great-Helm with Winged Crest & Glowing Visor Slit
  const headW = 22;
  const headH = 20;
  const headX = cx - headW / 2;
  const headY = cy + bobY - 24;

  ctx.fillStyle = "#1e1b18";
  ctx.fillRect(headX - 2, headY - 2, headW + 4, headH + 4);

  ctx.fillStyle = hurtFlash ? "#ffffff" : "#eab308";
  ctx.fillRect(headX, headY, headW, headH);

  // Winged Helmet Crest
  ctx.fillStyle = "#fde047";
  ctx.fillRect(cx - 3, headY - 8, 6, 6);
  ctx.fillRect(cx - 6, headY - 6, 3, 4);
  ctx.fillRect(cx + 3, headY - 6, 3, 4);

  // Glowing Horizontal Golden Visor Slit
  if (row !== 8) {
    ctx.fillStyle = "#1e1b18";
    ctx.fillRect(headX + 3, headY + 8, headW - 6, 5);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(headX + 4, headY + 9, headW - 8, 3);
  }

  // 6. Weapons: Massive Golden Tower Shield (Front) & Heavy War Hammer
  if (isAttackRow) {
    if (attackStage === 0) {
      // Brace: Angle shield forward
      ctx.save();
      ctx.translate(cx - 4, cy + bobY - 2);
      drawPixelTowerShield(ctx);
      ctx.restore();

      ctx.save();
      ctx.translate(cx + 10, cy + bobY - 6);
      ctx.rotate(-0.6);
      drawPixelWarHammer(ctx);
      ctx.restore();
    } else if (attackStage === 1) {
      // SHIELD BASH & HAMMER SMASH with GOLDEN DIVINE CRESCENT ARC
      ctx.save();
      ctx.translate(cx + 8, cy + bobY - 2);
      drawPixelTowerShield(ctx);
      ctx.restore();

      ctx.save();
      ctx.translate(cx + 14, cy + bobY);
      ctx.rotate(0.4);
      drawPixelWarHammer(ctx);
      ctx.restore();

      // GOLDEN DIVINE CRESCENT ARC
      ctx.save();
      ctx.translate(cx, cy + bobY - 8);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(10, 0, 26, -Math.PI * 0.45, Math.PI * 0.35, false);
      ctx.stroke();

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(10, 0, 30, -Math.PI * 0.4, Math.PI * 0.3, false);
      ctx.stroke();
      ctx.restore();
    } else if (attackStage === 2) {
      // Ground Stomp Shockwave
      ctx.save();
      ctx.translate(cx + 6, cy + bobY);
      drawPixelTowerShield(ctx);
      ctx.restore();

      // Golden Holy Impact Star
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(cx + 26, cy + bobY + 4, 6, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + 28, cy + bobY + 5, 2, 2);
    } else {
      // Fortress Recovery
      ctx.save();
      ctx.translate(cx + 2, cy + bobY);
      drawPixelTowerShield(ctx);
      ctx.restore();
    }
  } else if (row !== 8) {
    // Idle / Walk: Proudly display Massive Golden Tower Shield
    ctx.save();
    ctx.translate(cx + 2, cy + bobY);
    drawPixelTowerShield(ctx);
    ctx.restore();

    ctx.save();
    ctx.translate(cx - 10, cy + bobY + 2);
    ctx.rotate(-0.2);
    drawPixelWarHammer(ctx);
    ctx.restore();
  }
}

// ==============================================================================
// 7. WEAPON RENDERING HELPERS
// ==============================================================================

// Plasma Pistol (Gunner)
function drawPixelPlasmaPistol(ctx: CanvasRenderingContext2D, isFiring: boolean) {
  // Body casing
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-2, -3, 10, 6);
  // Energy chamber
  ctx.fillStyle = "#00f2ff";
  ctx.fillRect(0, -2, 5, 4);
  // Grip
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-2, 3, 3, 5);
  // Muzzle
  ctx.fillStyle = "#64748b";
  ctx.fillRect(8, -2, 3, 4);

  if (isFiring) {
    // 4-Point Star Muzzle Flash
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(11, -2, 5, 4);
    ctx.fillStyle = "#00f2ff";
    ctx.fillRect(13, -5, 3, 10);
    ctx.fillRect(10, -1, 8, 2);
  }
}

// Twin Reverse-Grip Shadow Daggers (Assassin)
function drawPixelTwinDaggers(ctx: CanvasRenderingContext2D) {
  // Grip
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-2, -4, 4, 8);
  // Golden Pommel
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(-3, -5, 6, 2);
  // Curved Obsidian Blade extending downwards (Reverse Grip)
  ctx.fillStyle = "#1e1b4b";
  ctx.fillRect(-2, 4, 4, 14);
  // Glowing Razor Pink Edge
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(1, 4, 2, 14);
  ctx.fillRect(0, 18, 2, 3); // Pointed tip
}

// Heavy Flaming Dragon Broadsword (Fighter)
function drawPixelFlamingBroadsword(ctx: CanvasRenderingContext2D) {
  // Handle & Dragon Pommel
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-2, 0, 4, 10);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(-3, 10, 6, 3);
  // Golden Crossguard
  ctx.fillStyle = "#d97706";
  ctx.fillRect(-8, -2, 16, 4);
  // Colossal Broadsword Blade
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(-4, -26, 8, 24);
  // Fiery Serrated Edge & Spine
  ctx.fillStyle = "#f97316";
  ctx.fillRect(-5, -24, 2, 20);
  ctx.fillRect(3, -24, 2, 20);
  // Flaming Tip
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-2, -29, 4, 4);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(-1, -22, 2, 16);
}

// Massive Golden Tower Shield (Tank)
function drawPixelTowerShield(ctx: CanvasRenderingContext2D) {
  // Tower Kite Shield Body
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-8, -12, 16, 24);
  // Golden Plate Center
  ctx.fillStyle = "#facc15";
  ctx.fillRect(-6, -10, 12, 20);
  // Holy White Cross Emblem
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4, -3, 8, 4);
  ctx.fillRect(-2, -6, 4, 10);
  // Steel Border Rivets
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(-6, -10, 2, 2);
  ctx.fillRect(4, -10, 2, 2);
  ctx.fillRect(-6, 8, 2, 2);
  ctx.fillRect(4, 8, 2, 2);
}

// Heavy Spiked War Hammer (Tank)
function drawPixelWarHammer(ctx: CanvasRenderingContext2D) {
  // Bronze Handle
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-2, -6, 4, 22);
  // Heavy Steel Hammerhead
  ctx.fillStyle = "#475569";
  ctx.fillRect(-7, -16, 14, 10);
  // Golden Spikes
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(-9, -13, 2, 4);
  ctx.fillRect(7, -13, 2, 4);
  ctx.fillRect(-2, -18, 4, 2);
}

