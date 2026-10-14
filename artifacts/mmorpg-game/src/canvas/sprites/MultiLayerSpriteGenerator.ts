// ==============================================================================
// Multi-Layer AAA 2.5D Sprite Generator
// Renders dynamic, cel-shaded, animated spritesheets from CharacterVisualAnatomy
// ==============================================================================

import * as THREE from "three";
import type { CharacterVisualAnatomy } from "../../skills/types";

export interface MultiLayerRenderOptions {
  anatomy: CharacterVisualAnatomy;
  frameSize?: number;
  equippedWeaponTint?: string;
  weaponGlowBoost?: number;
}

const multiLayerTextureCache = new Map<string, THREE.CanvasTexture>();

export function generateMultiLayerSpritesheet(options: MultiLayerRenderOptions): HTMLCanvasElement {
  const { anatomy, frameSize = 128, equippedWeaponTint, weaponGlowBoost = 1.0 } = options;
  const cols = 8;
  const rows = 5;
  const width = cols * frameSize;
  const height = rows * frameSize;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  const pal = anatomy.palette;
  const weapon = anatomy.weaponVisual;
  const weaponTrail = equippedWeaponTint || weapon.trailColor;
  const glow = weapon.glowIntensity * weaponGlowBoost;

  // Render each frame across 5 rows:
  // Row 0: Idle (8 frames)
  // Row 1: Run (8 frames)
  // Row 2: Combo 1 & 2 (8 frames)
  // Row 3: Combo 3 & Skill Cast (8 frames)
  // Row 4: Dash & Hurt (8 frames)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * frameSize;
      const y = r * frameSize;
      const cx = x + frameSize / 2;
      const cy = y + frameSize * 0.72; // foot anchor

      ctx.save();
      ctx.translate(cx, cy);

      const t = c / (cols - 1); // 0.0 to 1.0 phase in current anim

      let bobY = 0;
      let leanX = 0;
      let armPhase = 0;
      let swingWeapon = false;
      let dashBlur = false;
      let flashHurt = false;

      if (r === 0) {
        // Idle: Subtle rhythmic breathing
        bobY = Math.sin(t * Math.PI * 2) * 3;
      } else if (r === 1) {
        // Run: High-speed forward lean and stepping bob
        bobY = Math.abs(Math.sin(t * Math.PI * 2)) * 6;
        leanX = 3;
        armPhase = Math.sin(t * Math.PI * 2);
      } else if (r === 2) {
        // Combo 1 & 2: Quick slashes/shots
        swingWeapon = true;
        bobY = Math.sin(t * Math.PI) * 4;
        leanX = 4;
      } else if (r === 3) {
        // Combo 3 & Cast: Heavy slam / high energy burst
        swingWeapon = true;
        bobY = -Math.sin(t * Math.PI) * 10;
        leanX = 2;
      } else if (r === 4) {
        // Dash & Hurt
        if (c < 4) {
          dashBlur = true;
          leanX = 12;
          bobY = 4;
        } else {
          flashHurt = true;
          leanX = -6;
          bobY = -2;
        }
      }

      // ── Layer 1: Soft Floor Contact Shadow ───────────────────────────────
      const shadowW = (frameSize * 0.28 * anatomy.hitbox.shadowScale) * (1 - bobY * 0.015);
      const shadowH = shadowW * 0.38;
      const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, shadowW);
      shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
      shadowGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.35)");
      shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Apply bounce and lean for upper body
      ctx.translate(leanX, -bobY);

      if (flashHurt) {
        ctx.filter = "brightness(1.8) drop-shadow(0 0 8px #ef4444)";
      }

      // ── Layer 2: Back Attachment (Scarf, Jetpack, Halo, Banners) ─────────
      drawBackAttachment(ctx, anatomy.backAttachment, pal, t, r);

      // ── Layer 3: Silhouette Body / Armor (Cel-shaded) ─────────────────────
      drawCharacterBody(ctx, anatomy.silhouette, pal, armPhase);

      // ── Layer 4: Head & Headgear ──────────────────────────────────────────
      drawHeadgear(ctx, anatomy.headgear, pal);

      // ── Layer 5: Weapon Visual & Attack Trails ───────────────────────────
      drawWeaponVisual(ctx, anatomy.weaponVisual.type, weaponTrail, glow, swingWeapon, t, dashBlur);

      ctx.restore();
    }
  }

  return canvas;
}

// ── Sub-renderer: Back Attachment ────────────────────────────────────────────
function drawBackAttachment(
  ctx: CanvasRenderingContext2D,
  attachment: CharacterVisualAnatomy["backAttachment"],
  pal: CharacterVisualAnatomy["palette"],
  t: number,
  row: number
) {
  if (attachment === "none") return;

  ctx.save();
  if (attachment === "floating_holy_halo") {
    // Holy radiant halo behind head
    ctx.strokeStyle = pal.eyeGlow;
    ctx.lineWidth = 3;
    ctx.shadowColor = pal.energyCore;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, -68, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (attachment === "tattered_shadow_scarf") {
    // Flowing ninja scarf reacting to velocity
    const flutter = Math.sin(t * Math.PI * 4) * 8;
    ctx.fillStyle = pal.clothTrim;
    ctx.beginPath();
    ctx.moveTo(-4, -50);
    ctx.quadraticCurveTo(-22 - flutter, -40, -32 - flutter * 1.5, -30 + flutter);
    ctx.lineTo(-24 - flutter, -22);
    ctx.quadraticCurveTo(-14, -36, -2, -44);
    ctx.closePath();
    ctx.fill();
  } else if (attachment === "energy_jetpack") {
    // Cyber jetpack with twin energy thrusters
    ctx.fillStyle = pal.armorSecondary;
    ctx.fillRect(-12, -48, 24, 18);
    // Exhaust thruster plumes
    ctx.fillStyle = pal.energyCore;
    ctx.shadowColor = pal.eyeGlow;
    ctx.shadowBlur = 10;
    const flameH = (row === 1 || row === 4) ? 14 : 7;
    ctx.fillRect(-9, -30, 5, flameH);
    ctx.fillRect(4, -30, 5, flameH);
  } else if (attachment === "twin_dragon_banners") {
    // High-standing war banners
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -35);
    ctx.lineTo(-14, -75);
    ctx.moveTo(10, -35);
    ctx.lineTo(14, -75);
    ctx.stroke();

    ctx.fillStyle = pal.armorPrimary;
    ctx.fillRect(-22, -73, 10, 18);
    ctx.fillRect(14, -73, 10, 18);
  }
  ctx.restore();
}

// ── Sub-renderer: Character Body & Armor ────────────────────────────────────
function drawCharacterBody(
  ctx: CanvasRenderingContext2D,
  silhouette: CharacterVisualAnatomy["silhouette"],
  pal: CharacterVisualAnatomy["palette"],
  armPhase: number
) {
  ctx.save();

  // Width & height modifiers based on anatomy silhouette
  let torsoW = 18;
  let torsoH = 26;
  let shoulderW = 28;
  if (silhouette === "slim_agile") {
    torsoW = 14;
    shoulderW = 22;
  } else if (silhouette === "muscular_heavy") {
    torsoW = 22;
    shoulderW = 34;
  } else if (silhouette === "colossus_armored") {
    torsoW = 26;
    shoulderW = 40;
    torsoH = 30;
  }

  // Legs / Boots
  const legOffset = armPhase * 5;
  ctx.fillStyle = pal.armorSecondary;
  // Left leg
  ctx.fillRect(-torsoW / 2 + 1, -16 + legOffset, 6, 16 - legOffset);
  // Right leg
  ctx.fillRect(torsoW / 2 - 7, -16 - legOffset, 6, 16 + legOffset);

  // Main Torso Armor (Cel-shaded)
  ctx.fillStyle = pal.armorPrimary;
  ctx.beginPath();
  ctx.roundRect(-torsoW / 2, -42, torsoW, torsoH, 4);
  ctx.fill();

  // Armor Highlight (Left-lit cel-shading)
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillRect(-torsoW / 2, -42, torsoW * 0.35, torsoH);

  // Pauldrons / Shoulders
  ctx.fillStyle = pal.clothTrim;
  ctx.beginPath();
  ctx.roundRect(-shoulderW / 2, -44, 8, 12, 3);
  ctx.roundRect(shoulderW / 2 - 8, -44, 8, 12, 3);
  ctx.fill();

  // Glowing Core in chest
  ctx.fillStyle = pal.energyCore;
  ctx.shadowColor = pal.eyeGlow;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, -32, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Sub-renderer: Head & Headgear ───────────────────────────────────────────
function drawHeadgear(
  ctx: CanvasRenderingContext2D,
  headgear: CharacterVisualAnatomy["headgear"],
  pal: CharacterVisualAnatomy["palette"]
) {
  ctx.save();
  const headY = -52;

  // Base Face / Skin
  ctx.fillStyle = pal.skinTone;
  ctx.beginPath();
  ctx.arc(0, headY, 8, 0, Math.PI * 2);
  ctx.fill();

  if (headgear === "cyber_visor") {
    // High-tech glowing visor strip
    ctx.fillStyle = pal.eyeGlow;
    ctx.shadowColor = pal.eyeGlow;
    ctx.shadowBlur = 12;
    ctx.fillRect(-7, headY - 2, 14, 4);

    // Helmet chassis
    ctx.fillStyle = pal.armorSecondary;
    ctx.beginPath();
    ctx.arc(0, headY - 3, 9, Math.PI, 0);
    ctx.fill();
  } else if (headgear === "shadow_hood_mask") {
    // Dark cowl hood covering upper head and jaw
    ctx.fillStyle = pal.armorPrimary;
    ctx.beginPath();
    ctx.moveTo(-9, headY + 4);
    ctx.lineTo(0, headY - 12);
    ctx.lineTo(9, headY + 4);
    ctx.lineTo(0, headY + 8);
    ctx.closePath();
    ctx.fill();

    // Piercing glowing ninja eyes
    ctx.fillStyle = pal.eyeGlow;
    ctx.fillRect(-4, headY - 2, 2.5, 2);
    ctx.fillRect(1.5, headY - 2, 2.5, 2);
  } else if (headgear === "dragon_horned_helm") {
    // Helm with upward curved dragon horns
    ctx.fillStyle = pal.armorSecondary;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9, Math.PI, 0);
    ctx.fill();

    // Horns
    ctx.fillStyle = pal.clothTrim;
    ctx.beginPath();
    ctx.moveTo(-6, headY - 6);
    ctx.quadraticCurveTo(-14, headY - 18, -10, headY - 24);
    ctx.lineTo(-4, headY - 8);
    ctx.moveTo(6, headY - 6);
    ctx.quadraticCurveTo(14, headY - 18, 10, headY - 24);
    ctx.lineTo(4, headY - 8);
    ctx.fill();
  } else if (headgear === "paladin_winged_crown") {
    // Golden winged tiara/crown
    ctx.fillStyle = pal.clothTrim;
    ctx.beginPath();
    ctx.moveTo(-10, headY - 14);
    ctx.lineTo(-4, headY - 6);
    ctx.lineTo(0, headY - 11);
    ctx.lineTo(4, headY - 6);
    ctx.lineTo(10, headY - 14);
    ctx.lineTo(0, headY - 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// ── Sub-renderer: Weapons & Weapon Trails ────────────────────────────────────
function drawWeaponVisual(
  ctx: CanvasRenderingContext2D,
  weaponType: CharacterVisualAnatomy["weaponVisual"]["type"],
  trailColor: string,
  glow: number,
  isAttacking: boolean,
  t: number,
  isDashing: boolean
) {
  ctx.save();
  ctx.shadowColor = trailColor;
  ctx.shadowBlur = glow * 8;

  if (weaponType === "dual_pistols") {
    // Twin energy pistols
    ctx.fillStyle = "#334155";
    ctx.fillRect(-18, -32, 8, 4);
    ctx.fillRect(10, -32, 8, 4);
    // Muzzle glow
    ctx.fillStyle = trailColor;
    ctx.fillRect(-20, -33, 3, 6);
    ctx.fillRect(17, -33, 3, 6);

    if (isAttacking) {
      // Plasma shot streak
      ctx.fillStyle = trailColor;
      ctx.fillRect(-35 - t * 25, -34, 15, 6);
      ctx.fillRect(25 + t * 25, -34, 15, 6);
    }
  } else if (weaponType === "twin_katana_daggers") {
    // Twin curved blades
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.lineTo(-24, -40);
    ctx.moveTo(12, -22);
    ctx.lineTo(24, -40);
    ctx.stroke();

    if (isAttacking) {
      // Swirling blade slash arc
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -32, 28, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }
  } else if (weaponType === "blazing_gauntlets") {
    // Heavy fiery dragon fists
    ctx.fillStyle = trailColor;
    ctx.beginPath();
    ctx.arc(-14, -28, 6.5, 0, Math.PI * 2);
    ctx.arc(14, -28, 6.5, 0, Math.PI * 2);
    ctx.fill();

    if (isAttacking) {
      // Shockwave flame flare
      ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
      ctx.beginPath();
      ctx.arc(18, -28, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weaponType === "tower_shield_warhammer") {
    // Tower shield on left, hammer on right
    // Shield
    ctx.fillStyle = "#eab308";
    ctx.fillRect(-22, -38, 9, 24);
    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(-20, -36, 5, 20);

    // Hammer
    ctx.fillStyle = "#78350f";
    ctx.fillRect(16, -20, 4, 26);
    ctx.fillStyle = trailColor;
    ctx.fillRect(12, -42, 12, 12);
  }

  if (isDashing) {
    // Dash ghosting afterimage
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(-20, -50, 40, 50);
  }

  ctx.restore();
}

// ── Three.js Texture Builder ────────────────────────────────────────────────
export function createMultiLayerCanvasTexture(options: MultiLayerRenderOptions): THREE.CanvasTexture {
  const cacheKey = `${options.anatomy.silhouette}_${options.anatomy.headgear}_${options.anatomy.weaponVisual.type}_${options.equippedWeaponTint || "default"}`;
  if (multiLayerTextureCache.has(cacheKey)) {
    return multiLayerTextureCache.get(cacheKey)!;
  }

  const canvas = generateMultiLayerSpritesheet(options);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;

  multiLayerTextureCache.set(cacheKey, tex);
  return tex;
}
