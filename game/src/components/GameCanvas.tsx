// ==============================================================================
// GameCanvas.tsx — Bonfire 2.5D ARPG Canvas Engine (React TSX Component)
// ==============================================================================

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type {
  KnightState,
  SlimeBossState,
  Projectile,
  VFXEntity,
  DamageText,
  Torch,
  CombatEvent
} from '../types';
import { soundSynth } from '../audio/SoundSynth';

export interface GameCanvasHandle {
  triggerAttack: () => void;
  triggerAnimeSkill: () => void;
  triggerFlameWave: () => void;
  triggerDodge: () => void;
  respawnSlime: () => void;
  setMoveInput: (left: boolean, right: boolean) => void;
}

interface GameCanvasProps {
  knightState: KnightState;
  slimeState: SlimeBossState;
  onKnightUpdate: (updater: (prev: KnightState) => KnightState) => void;
  onSlimeUpdate: (updater: (prev: SlimeBossState) => SlimeBossState) => void;
  onCombatEvent: (event: Omit<CombatEvent, 'id' | 'time'>) => void;
  onComboHit: () => void;
  comboMultiplier: number;
  debugMode: boolean;
  dynamicLighting: boolean;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const WORLD_WIDTH = 1280;
const GROUND_Y = 270;
const PIXEL_SCALE = 3;

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  {
    knightState,
    slimeState,
    onKnightUpdate,
    onSlimeUpdate,
    onCombatEvent,
    onComboHit,
    comboMultiplier,
    debugMode,
    dynamicLighting
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable internal engine state for 60fps physics
  const knightRef = useRef<KnightState>({ ...knightState });
  const slimeRef = useRef<SlimeBossState>({ ...slimeState });
  const cameraXRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  const activeProjectilesRef = useRef<Projectile[]>([]);
  const activeVFXRef = useRef<VFXEntity[]>([]);
  const damageTextsRef = useRef<DamageText[]>([]);

  const moveKeysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Atlas & Mapping Cache
  const atlasImageRef = useRef<HTMLImageElement>(new Image());
  const atlasLoadedRef = useRef<boolean>(false);
  const mappingDataRef = useRef<any>(null);

  const torchesRef = useRef<Torch[]>([
    { x: 120, y: 150, baseRadius: 85 },
    { x: 380, y: 150, baseRadius: 85 },
    { x: 640, y: 150, baseRadius: 85 },
    { x: 900, y: 150, baseRadius: 85 },
    { x: 1160, y: 150, baseRadius: 85 },
  ]);

  // Load Spritesheet Atlas
  useEffect(() => {
    let isMounted = true;
    async function loadAssets() {
      const candidates = [
        '/assets/exported/mapping.json',
        '../assets/exported/mapping.json',
        'assets/exported/mapping.json'
      ];
      for (const path of candidates) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            const data = await res.json();
            if (!isMounted) return;
            mappingDataRef.current = data;
            const imgPath = path.replace('mapping.json', 'atlas.png');
            atlasImageRef.current.src = imgPath;
            atlasImageRef.current.onload = () => {
              if (isMounted) atlasLoadedRef.current = true;
            };
            return;
          }
        } catch (e) {}
      }
    }
    loadAssets();
    return () => { isMounted = false; };
  }, []);

  // Expose Controls API via ref
  useImperativeHandle(ref, () => ({
    triggerAttack() {
      const k = knightRef.current;
      if (k.isAttacking || k.dodgeTimer > 0) return;
      k.isAttacking = true;
      k.currentAnim = 'knight_attack';
      k.frameIndex = 0;
      k.animTimer = 0;
      k.vfxSpawnedThisAttack = false;
      soundSynth.playSlash();
    },

    triggerAnimeSkill() {
      const k = knightRef.current;
      if (k.isAttacking || k.dodgeTimer > 0) return;
      k.isAttacking = true;
      k.currentAnim = 'knight_attack';
      k.frameIndex = 0;
      k.animTimer = 0;
      k.vfxSpawnedThisAttack = false;

      soundSynth.playAnimeSkill();
      screenShakeRef.current = 9;

      setTimeout(() => {
        spawnAnimeVFX(k.x + 40 * k.facing, GROUND_Y - 30, k.facing);
      }, 70);

      setTimeout(() => {
        spawnAnimeVFX(k.x + 85 * k.facing, GROUND_Y - 45, k.facing);
        checkHitboxCollision(k.facing * 1.5, 36, true);
        onCombatEvent({ text: 'Anime Slash đánh trúng liên hoàn!', type: 'skill' });
      }, 150);
    },

    triggerFlameWave() {
      const k = knightRef.current;
      if (k.isAttacking || k.dodgeTimer > 0) return;
      k.isAttacking = true;
      k.currentAnim = 'knight_attack';
      k.frameIndex = 0;
      k.animTimer = 0;
      k.vfxSpawnedThisAttack = false;

      soundSynth.playFlameWave();
      screenShakeRef.current = 5;

      setTimeout(() => {
        activeProjectilesRef.current.push({
          x: k.x + k.facing * 25,
          y: GROUND_Y - 35,
          vx: k.facing * 450,
          vy: 0,
          facing: k.facing,
          distanceTraveled: 0,
          maxDistance: 650,
          damage: 42,
          radius: 22,
          life: 1.6,
          particles: []
        });
        onCombatEvent({ text: 'Khai hỏa Kiếm Khí Long Bá!', type: 'skill' });
      }, 90);
    },

    triggerDodge() {
      const k = knightRef.current;
      if (k.dodgeTimer > 0 || k.isAttacking) return;
      k.dodgeTimer = 0.35;
      k.isInvincible = true;
      k.invincibleTimer = 0.35;
      k.vx_force = k.facing * 340;
      soundSynth.playDodge();
      spawnDamageText(k.x, k.y - 45, 'DODGE!', false, '#38bdf8');
      onCombatEvent({ text: 'Hiệp sĩ kích hoạt lướt né bất tử!', type: 'dodge' });
    },

    respawnSlime() {
      const s = slimeRef.current;
      s.x = s.spawnX;
      s.hp = s.maxHp;
      s.lagHp = s.maxHp;
      s.isDead = false;
      s.aiState = 'patrol';
      s.currentAnim = 'slime_idle';
      s.frameIndex = 0;
      s.animTimer = 0;
      s.isWindingUp = false;
      s.poise = s.maxPoise;
      s.isStaggered = false;
      onCombatEvent({ text: 'Oni Slime Boss đã hồi sinh tại sào huyệt!', type: 'boss_rage' });
    },

    setMoveInput(left: boolean, right: boolean) {
      moveKeysRef.current = { left, right };
    }
  }));

  function spawnAnimeVFX(x: number, y: number, facing: 1 | -1 = 1) {
    activeVFXRef.current.push({
      x,
      y,
      facing,
      anim: 'slash_anime_01',
      frameIndex: 0,
      animTimer: 0,
      fps: 18,
      totalFrames: 6,
    });
  }

  function spawnDamageText(x: number, y: number, text: string | number, isCrit = false, customColor: string | null = null) {
    damageTextsRef.current.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 20,
      text: isCrit ? `-${text} CRIT!` : (typeof text === 'number' ? `-${text}` : text),
      color: customColor || (isCrit ? '#facc15' : '#f43f5e'),
      fontSize: isCrit ? 18 : 13,
      alpha: 1.0,
      vy: -50,
    });
  }

  function applyDamageToSlime(direction: 1 | -1, forceMultiplier: number, bonusDmg: number, isCritForced: boolean) {
    const s = slimeRef.current;
    if (s.isDead) return;

    screenShakeRef.current = 7 * forceMultiplier;
    const isCrit = isCritForced || Math.random() > 0.45;
    const baseDmg = isCrit ? 40 : 22;
    const scaledDmg = Math.floor((baseDmg + bonusDmg) * comboMultiplier + Math.random() * 10);

    s.hp = Math.max(0, s.hp - scaledDmg);
    s.vx_force = direction * 240 * forceMultiplier;
    s.currentAnim = s.hp <= 0 ? 'slime_die' : 'slime_hit';
    s.frameIndex = 0;
    s.animTimer = 0;

    // Poise damage & Stagger Break
    s.poise -= 25 * forceMultiplier;
    if (s.poise <= 0 && !s.isStaggered) {
      s.poise = 0;
      s.isStaggered = true;
      s.staggerTimer = 2.5; // Stunned for 2.5s
      s.aiState = 'stagger';
      soundSynth.playStagger();
      screenShakeRef.current = 12;
      spawnDamageText(s.x, s.y - 70, 'STAGGER BREAK!', true, '#8b5cf6');
      onCombatEvent({ text: 'BOSS BỊ VỠ ĐỠ! RƠI VÀO TRẠNG THÁI CHOÁNG STAGGER!', type: 'stagger' });
    }

    soundSynth.playHit(isCrit);
    spawnDamageText(s.x, s.y - 50, scaledDmg, isCrit);
    onComboHit();

    if (s.hp <= 0) {
      s.hp = 0;
      s.isDead = true;
      s.aiState = 'die';
      spawnDamageText(s.x, s.y - 80, '+150 EXP & 60 GOLD', true, '#facc15');
      onCombatEvent({ text: 'Tiêu diệt Oni Slime Boss thành công!', type: 'exp' });
    } else {
      onCombatEvent({
        text: `Đánh trúng Boss: -${scaledDmg} HP ${isCrit ? '(CHÍ MẠNG!)' : ''}`,
        type: isCrit ? 'crit' : 'damage'
      });
    }
  }

  function checkHitboxCollision(forceMultiplier = 1.0, bonusDmg = 0, isCritForced = false) {
    const k = knightRef.current;
    const s = slimeRef.current;
    if (s.isDead) return;

    const hbW = 46 * PIXEL_SCALE;
    const hbH = 36 * PIXEL_SCALE;
    const hbX = k.facing === 1 ? k.x + 8 : k.x - hbW - 8;
    const hbY = k.y - hbH - 6;

    const sbW = 40 * PIXEL_SCALE;
    const sbH = 38 * PIXEL_SCALE;
    const sbX = s.x - sbW / 2;
    const sbY = s.y - sbH;

    const isOverlap = !(
      hbX + hbW < sbX ||
      hbX > sbX + sbW ||
      hbY + hbH < sbY ||
      hbY > sbY + sbH
    );

    if (isOverlap) {
      applyDamageToSlime(k.facing, forceMultiplier, bonusDmg, isCritForced);
    }
  }

  // 60FPS Game Engine Main Loop
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();
    let syncTimer = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    function gameLoop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const k = knightRef.current;
      const s = slimeRef.current;

      // 1. Decay Screen Shake
      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 22);
      }

      // 2. Bonfire Camera Lerp Tracking
      const targetCamX = k.x - CANVAS_WIDTH / 2;
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.08;
      cameraXRef.current = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, cameraXRef.current));

      // 3. Player i-Frames & Energy Recovery
      if (k.invincibleTimer > 0) {
        k.invincibleTimer -= dt;
        if (k.invincibleTimer <= 0) k.isInvincible = false;
      }
      if (k.dodgeTimer > 0) k.dodgeTimer -= dt;
      if (k.energy < k.maxEnergy) k.energy = Math.min(k.maxEnergy, k.energy + dt * 15);

      // 4. Player Movement & Keyboard/Joystick Routing
      if (!k.isAttacking && k.dodgeTimer <= 0) {
        let moving = false;
        if (moveKeysRef.current.left) {
          k.x -= k.speed * dt;
          k.facing = -1;
          moving = true;
        } else if (moveKeysRef.current.right) {
          k.x += k.speed * dt;
          k.facing = 1;
          moving = true;
        }

        k.currentAnim = moving ? 'knight_run' : 'knight_idle';
      }

      // 5. Apply Bonfire Knockback Physics
      k.x += k.vx_force * dt;
      k.vx_force *= Math.max(0, 1 - 9 * dt);
      k.x = Math.max(40, Math.min(WORLD_WIDTH - 40, k.x));

      s.x += s.vx_force * dt;
      s.vx_force *= Math.max(0, 1 - 9 * dt);

      // 6. Lagging Ghost HP Smooth Catchup
      k.lagHp += (k.hp - k.lagHp) * 0.08;
      s.lagHp += (s.hp - s.lagHp) * 0.08;

      // 7. Update Bonfire Slime AI
      if (!s.isDead) {
        if (s.isStaggered) {
          s.staggerTimer -= dt;
          if (s.staggerTimer <= 0) {
            s.isStaggered = false;
            s.poise = s.maxPoise;
            s.aiState = 'patrol';
          }
        } else {
          if (s.attackCooldownTimer > 0) s.attackCooldownTimer -= dt;

          const dx = k.x - s.x;
          const dy = k.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= s.visionRadius && k.hp > 0) {
            if (s.aiState === 'patrol') {
              s.aiState = 'alert';
              spawnDamageText(s.x, s.y - 65, '!', false, '#ef4444');
            }

            if (dist <= s.attackRadius) {
              s.aiState = 'attack';
              s.facing = dx > 0 ? 1 : -1;
              if (s.attackCooldownTimer <= 0 && !s.isWindingUp) {
                s.isWindingUp = true;
                s.windupTimer = 0.35;
              }
            } else {
              s.aiState = 'chase';
              s.facing = dx > 0 ? 1 : -1;
              s.x += s.facing * s.speedChase * dt;
            }
          } else {
            s.aiState = 'patrol';
            s.patrolTimer -= dt;
            if (s.patrolTimer <= 0) {
              s.patrolTimer = 2.0 + Math.random() * 2.0;
              s.patrolDirection = (s.patrolDirection * -1) as (1 | -1);
            }
            s.facing = s.patrolDirection;
            s.x += s.facing * s.speedPatrol * dt;
          }

          if (s.isWindingUp) {
            s.windupTimer -= dt;
            if (s.windupTimer <= 0) {
              s.isWindingUp = false;
              s.attackCooldownTimer = s.attackCooldown;
              // Leap forward attack
              s.vx_force = s.facing * 190;
              screenShakeRef.current = 6;
              const distToK = Math.abs(k.x - s.x);
              if (distToK < 65 && !k.isInvincible) {
                const dmg = Math.floor(15 + Math.random() * 8);
                k.hp = Math.max(0, k.hp - dmg);
                k.vx_force = s.facing * 230;
                k.isInvincible = true;
                k.invincibleTimer = 0.35;
                soundSynth.playHit(false);
                spawnDamageText(k.x, k.y - 45, dmg, false, '#ef4444');
                onCombatEvent({ text: `Boss tấn công hiệp sĩ: -${dmg} HP`, type: 'boss_rage' });
              }
            }
          }
        }
      }

      // 8. Update Animations
      updateAnimation(k, dt, () => {
        k.isAttacking = false;
        k.currentAnim = 'knight_idle';
      }, (frameIdx) => {
        if (frameIdx === 2 && !k.vfxSpawnedThisAttack) {
          k.vfxSpawnedThisAttack = true;
          spawnAnimeVFX(k.x + 28 * k.facing, k.y - 24, k.facing);
          checkHitboxCollision();
        }
      });

      updateAnimation(s, dt, () => {
        if (s.currentAnim === 'slime_hit') s.currentAnim = s.isDead ? 'slime_die' : 'slime_idle';
      });

      // 9. Update Projectiles
      for (let i = activeProjectilesRef.current.length - 1; i >= 0; i--) {
        const p = activeProjectilesRef.current[i];
        p.x += p.vx * dt;
        p.distanceTraveled += Math.abs(p.vx * dt);
        p.life -= dt;

        p.particles.push({
          x: p.x - p.facing * 14,
          y: p.y + (Math.random() * 8 - 4),
          size: Math.random() * 5 + 2,
          alpha: 1.0,
        });

        for (let j = p.particles.length - 1; j >= 0; j--) {
          const pt = p.particles[j];
          pt.alpha -= dt * 4;
          if (pt.alpha <= 0) p.particles.splice(j, 1);
        }

        if (!s.isDead && Math.abs(p.x - s.x) < 45 && Math.abs(p.y - (s.y - 25)) < 40) {
          spawnAnimeVFX(p.x, p.y, p.facing);
          applyDamageToSlime(p.facing, 1.4, p.damage, true);
          activeProjectilesRef.current.splice(i, 1);
          continue;
        }

        if (p.distanceTraveled >= p.maxDistance || p.life <= 0 || p.x < 0 || p.x > WORLD_WIDTH) {
          activeProjectilesRef.current.splice(i, 1);
        }
      }

      // 10. Update VFX & Damage Texts
      for (let i = activeVFXRef.current.length - 1; i >= 0; i--) {
        const vfx = activeVFXRef.current[i];
        vfx.animTimer += dt;
        if (vfx.animTimer >= 1.0 / vfx.fps) {
          vfx.animTimer -= 1.0 / vfx.fps;
          vfx.frameIndex++;
          if (vfx.frameIndex >= vfx.totalFrames) activeVFXRef.current.splice(i, 1);
        }
      }

      for (let i = damageTextsRef.current.length - 1; i >= 0; i--) {
        const dtObj = damageTextsRef.current[i];
        dtObj.y += dtObj.vy * dt;
        dtObj.alpha -= dt * 1.35;
        if (dtObj.alpha <= 0) damageTextsRef.current.splice(i, 1);
      }

      // 11. Render Canvas
      renderCanvas(ctx, now / 1000);

      // Sync state back to React at ~15Hz to avoid excessive re-renders
      syncTimer += dt;
      if (syncTimer >= 0.065) {
        syncTimer = 0;
        onKnightUpdate(() => ({ ...k }));
        onSlimeUpdate(() => ({ ...s }));
      }

      animFrameId = requestAnimationFrame(gameLoop);
    }

    animFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [comboMultiplier, debugMode, dynamicLighting, onCombatEvent, onComboHit, onKnightUpdate, onSlimeUpdate]);

  function updateAnimation(entity: any, dt: number, onEnd?: () => void, onFrame?: (idx: number) => void) {
    const mapping = mappingDataRef.current;
    if (!mapping || !mapping.animations[entity.currentAnim]) return;

    const animDef = mapping.animations[entity.currentAnim];
    const frameDur = 1.0 / (animDef.fps || 10);
    entity.animTimer += dt;

    if (entity.animTimer >= frameDur) {
      entity.animTimer -= frameDur;
      entity.frameIndex++;
      onFrame?.(entity.frameIndex);

      if (entity.frameIndex >= animDef.frames.length) {
        if (animDef.loop) {
          entity.frameIndex = 0;
        } else {
          onEnd?.();
        }
      }
    }
  }

  function renderCanvas(ctx: CanvasRenderingContext2D, time: number) {
    const camX = cameraXRef.current;
    const k = knightRef.current;
    const s = slimeRef.current;

    ctx.save();

    // Screen Shake
    if (screenShakeRef.current > 0) {
      const sx = (Math.random() - 0.5) * screenShakeRef.current;
      const sy = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(sx, sy);
    }

    // 1. World Background (Parallax Moon + Gothic Pillars)
    renderWorldBackground(ctx, camX);

    ctx.save();
    ctx.translate(-camX, 0);

    // 2. Animated Castle Torches
    torchesRef.current.forEach((t) => {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(t.x - 4, t.y, 8, 20);
      const flameOffset = Math.sin(time * 9 + t.x) * 3;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 4 + flameOffset, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 6 + flameOffset, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Render Sprites
    if (atlasLoadedRef.current && mappingDataRef.current) {
      if (!k.isInvincible || Math.floor(time * 20) % 2 === 0) {
        renderSpriteEntity(ctx, k, k.currentAnim, k.frameIndex);
      }
      renderSpriteEntity(ctx, s, s.currentAnim, s.frameIndex);

      // Flying Projectiles
      activeProjectilesRef.current.forEach((p) => {
        p.particles.forEach((pt) => {
          ctx.fillStyle = `rgba(251, 146, 60, ${pt.alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.facing === -1) ctx.scale(-1, 1);
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 18, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.arc(-8, 0, 14, Math.PI * 0.35, -Math.PI * 0.35, true);
        ctx.fill();
        ctx.restore();
      });

      // Additive Anime Slash VFX
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      activeVFXRef.current.forEach((vfx) => renderVFXEntity(ctx, vfx));
      ctx.restore();

      // Overhead Floating Life Bar (UseBarLife)
      renderOverheadLifeBar(ctx, s, '[Lv.5] Oni Slime', s.hp, s.lagHp, s.maxHp, '#f43f5e');
    }

    // 4. Damage Numbers
    damageTextsRef.current.forEach((d) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.fillStyle = d.color;
      ctx.font = `bold ${d.fontSize}px 'Courier New', monospace`;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(d.text, d.x, d.y);
      ctx.restore();
    });

    // 5. Bonfire Vision Sensor & Hitbox Debugger
    if (debugMode) {
      renderDebugVisualizer(ctx);
    }

    ctx.restore(); // Restore camera translation

    // 6. Dynamic Atmospheric Lighting
    if (dynamicLighting) {
      renderDynamicLighting(ctx, camX, time);
    }

    ctx.restore();
  }

  function renderWorldBackground(ctx: CanvasRenderingContext2D, camX: number) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#06030c');
    skyGrad.addColorStop(0.65, '#160d26');
    skyGrad.addColorStop(1, '#0e071c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Parallax Moon
    const moonX = 500 - camX * 0.15;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX, 70, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    ctx.beginPath();
    ctx.arc(moonX, 70, 45, 0, Math.PI * 2);
    ctx.fill();

    // Gothic Pillars
    ctx.fillStyle = '#140c21';
    for (let i = 0; i < 14; i++) {
      const px = i * 100 + 20 - camX;
      if (px > -60 && px < CANVAS_WIDTH + 60) {
        ctx.fillRect(px, 115, 24, GROUND_Y - 115);
        ctx.fillRect(px - 4, 110, 32, 8);
      }
    }

    // Cobblestone Floor
    ctx.fillStyle = '#241a38';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#4a3466';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);

    ctx.fillStyle = '#1a1229';
    for (let y = GROUND_Y + 12; y < CANVAS_HEIGHT; y += 18) {
      for (let wx = -40; wx < WORLD_WIDTH + 40; wx += 40) {
        const sx = wx - (camX % 40) - 20;
        ctx.fillRect(sx, y, 36, 11);
      }
    }
  }

  function renderDynamicLighting(ctx: CanvasRenderingContext2D, camX: number, time: number) {
    const k = knightRef.current;
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = CANVAS_WIDTH;
    lightCanvas.height = CANVAS_HEIGHT;
    const lctx = lightCanvas.getContext('2d');
    if (!lctx) return;

    lctx.fillStyle = 'rgba(7, 4, 15, 0.72)';
    lctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    lctx.globalCompositeOperation = 'destination-out';

    // Player Lantern Light
    const kScreenX = k.x - camX;
    const kScreenY = k.y - 35;
    const kGrad = lctx.createRadialGradient(kScreenX, kScreenY, 15, kScreenX, kScreenY, 115);
    kGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    kGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.65)');
    kGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    lctx.fillStyle = kGrad;
    lctx.beginPath();
    lctx.arc(kScreenX, kScreenY, 115, 0, Math.PI * 2);
    lctx.fill();

    // Torches
    torchesRef.current.forEach((t) => {
      const tScreenX = t.x - camX;
      if (tScreenX > -80 && tScreenX < CANVAS_WIDTH + 80) {
        const radius = t.baseRadius + Math.sin(time * 8 + t.x) * 4;
        const tGrad = lctx.createRadialGradient(tScreenX, t.y, 10, tScreenX, t.y, radius);
        tGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        tGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.55)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        lctx.fillStyle = tGrad;
        lctx.beginPath();
        lctx.arc(tScreenX, t.y, radius, 0, Math.PI * 2);
        lctx.fill();
      }
    });

    // Flying Projectiles
    activeProjectilesRef.current.forEach((p) => {
      const pScreenX = p.x - camX;
      const pGrad = lctx.createRadialGradient(pScreenX, p.y, 8, pScreenX, p.y, 65);
      pGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      lctx.fillStyle = pGrad;
      lctx.beginPath();
      lctx.arc(pScreenX, p.y, 65, 0, Math.PI * 2);
      lctx.fill();
    });

    ctx.drawImage(lightCanvas, 0, 0);
  }

  function renderOverheadLifeBar(
    ctx: CanvasRenderingContext2D,
    entity: any,
    title: string,
    hp: number,
    lagHp: number,
    maxHp: number,
    color: string
  ) {
    if (entity.isDead) return;

    const barW = 60;
    const barH = 5;
    const barX = entity.x - barW / 2;
    const barY = entity.y - 65;

    ctx.fillStyle = 'rgba(15, 10, 25, 0.85)';
    ctx.fillRect(barX - 2, barY - 14, barW + 4, barH + 16);
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 14, barW + 4, barH + 16);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(title, barX, barY - 4);

    ctx.fillStyle = '#231d33';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, lagHp / maxHp)), barH);

    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, hp / maxHp)), barH);
  }

  function renderSpriteEntity(ctx: CanvasRenderingContext2D, entity: any, animName: string, frameIdx: number) {
    const mapping = mappingDataRef.current;
    if (!mapping) return;
    const animDef = mapping.animations[animName];
    if (!animDef) return;

    const frameKey = animDef.frames[frameIdx % animDef.frames.length];
    const frameData = mapping.frames[frameKey];
    if (!frameData) return;

    const f = frameData.frame;
    const pivot = frameData.pivot;

    const drawW = f.w * PIXEL_SCALE;
    const drawH = f.h * PIXEL_SCALE;

    ctx.save();
    ctx.translate(entity.x, entity.y);
    if (entity.facing === -1) ctx.scale(-1, 1);

    const dx = -drawW * pivot.x;
    const dy = -drawH * pivot.y;

    ctx.drawImage(atlasImageRef.current, f.x, f.y, f.w, f.h, dx, dy, drawW, drawH);
    ctx.restore();
  }

  function renderVFXEntity(ctx: CanvasRenderingContext2D, vfx: VFXEntity) {
    const mapping = mappingDataRef.current;
    if (!mapping) return;
    const animDef = mapping.animations[vfx.anim];
    if (!animDef) return;

    const frameKey = animDef.frames[vfx.frameIndex % animDef.frames.length];
    const frameData = mapping.frames[frameKey];
    if (!frameData) return;

    const f = frameData.frame;
    const pivot = frameData.pivot;

    const drawW = f.w * PIXEL_SCALE;
    const drawH = f.h * PIXEL_SCALE;

    ctx.save();
    ctx.translate(vfx.x, vfx.y);
    if (vfx.facing === -1) ctx.scale(-1, 1);

    const dx = -drawW * pivot.x;
    const dy = -drawH * pivot.y;

    ctx.drawImage(atlasImageRef.current, f.x, f.y, f.w, f.h, dx, dy, drawW, drawH);
    ctx.restore();
  }

  function renderDebugVisualizer(ctx: CanvasRenderingContext2D) {
    const k = knightRef.current;
    const s = slimeRef.current;

    // Bonfire Vision Sensor Circle
    ctx.strokeStyle = s.aiState === 'patrol' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(s.x, s.y - 25, s.visionRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(234, 179, 8, 0.65)';
    ctx.beginPath();
    ctx.arc(s.x, s.y - 25, s.attackRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = s.aiState === 'patrol' ? '#22c55e' : '#ef4444';
    ctx.font = '10px monospace';
    ctx.fillText(`Bonfire Vision [${s.visionRadius}px] - ${s.aiState}`, s.x - 70, s.y - s.visionRadius - 6);

    // Hitbox Active during frame 2
    if (k.currentAnim === 'knight_attack' && k.frameIndex === 2) {
      const hbW = 46 * PIXEL_SCALE;
      const hbH = 36 * PIXEL_SCALE;
      const hbX = k.facing === 1 ? k.x + 8 : k.x - hbW - 8;
      const hbY = k.y - hbH - 6;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(hbX, hbY, hbW, hbH);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(hbX, hbY, hbW, hbH);
    }
  }

  return (
    <div className="game-viewport">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
    </div>
  );
});

