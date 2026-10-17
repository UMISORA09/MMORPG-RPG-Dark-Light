import { memo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { RPGCharacterModel3D } from "./RPGCharacterModel3D";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { mobileState } from "@/game/mobileControls";
import { cameraControls, PITCH_MIN, PITCH_MAX } from "@/game/cameraControls";
import { resolveWorldCollisions } from "../world/worldColliders";
import { initInputRouter, getInputState } from "@/game/input/InputRouter";
import { MountVisual25D } from "./MountVisual25D";
import { BattlePetCompanion } from "./BattlePetCompanion";
import { OverheadChatBubble } from "./OverheadChatBubble";
import { WeaponEnhanceAura } from "./WeaponEnhanceAura";
import { MiracleRadiantAura } from "./MiracleRadiantAura";

// Ensure global InputRouter listeners are mounted
if (typeof window !== "undefined") {
  initInputRouter();
}

// Module-level scratch vectors to prevent GC thrashing in useFrame
const _camOffset = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();

export const PlayerEntity25D = memo(function PlayerEntity25D() {
  const { camera } = useThree();

  // Store bindings
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const playerAnimState = useGameWorldStore((s) => s.playerAnimState);
  const playerFacingLeft = useGameWorldStore((s) => s.playerFacingLeft);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerGender = useGameWorldStore((s) => s.playerGender);
  const playerColorHex = useGameWorldStore((s) => s.playerColorHex);
  const isInvincible = useGameWorldStore((s) => s.isInvincible);
  const characterRenderMode = useGameWorldStore((s) => s.characterRenderMode);
  const cameraShakeIntensity = useGameWorldStore((s) => s.cameraShakeIntensity);
  const isStunned = useGameWorldStore((s) => s.isStunned);
  const slowSpeedMultiplier = useGameWorldStore((s) => s.slowSpeedMultiplier);
  const hitFlashTimer = useGameWorldStore((s) => s.hitFlashTimer);
  const playerDebuffs = useGameWorldStore((s) => s.playerDebuffs);
  const isDead = useGameWorldStore((s) => s.isDead);
  const respawnTriggerCount = useGameWorldStore((s) => s.respawnTriggerCount);
  const playerSpd = useGameWorldStore((s) => s.playerSpd);

  // Mount, Pet, Aura & Chat
  const isMounted = useGameWorldStore((s) => s.isMounted);
  const mountSpeedMultiplier = useGameWorldStore((s) => s.mountSpeedMultiplier);
  const dismount = useGameWorldStore((s) => s.dismount);
  const highestEnhanceLevel = useGameWorldStore((s) => s.highestEnhanceLevel);
  const hasMiracleEquipped = useGameWorldStore((s) => s.hasMiracleEquipped);
  const overheadChatBubble = useGameWorldStore((s) => s.overheadChatBubble);

  const updatePlayerPosition = useGameWorldStore((s) => s.updatePlayerPosition);
  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const tickWorld = useGameWorldStore((s) => s.tickWorld);

  // Local physics variables
  const pos = useRef(playerPosition.clone());
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const attackCooldown = useRef(0);
  const animLockTimer = useRef(0);
  const facingLeftRef = useRef(playerFacingLeft);

  // 60FPS to 5Hz throttle synchronization refs
  const lastSyncTime = useRef(0);
  const prevAnimRef = useRef<string>("idle");
  const prevFacingRef = useRef<boolean>(playerFacingLeft);

  // ── HẠNG MỤC 1: Dịch Chuyển Bắt Buộc Về Tâm Nhà Chính (0, 0, 0) Khi Hồi Sinh ──
  useEffect(() => {
    pos.current.set(0, 0, 0);
    velocityY.current = 0;
    isGrounded.current = true;
    facingLeftRef.current = false;
  }, [respawnTriggerCount]);

  const jumpForce = 9.0;
  const gravity = -22.0;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // 1. Advance World timers
    tickWorld(dt);

    if (attackCooldown.current > 0) attackCooldown.current -= dt;
    if (animLockTimer.current > 0) animLockTimer.current -= dt;

    // ── HẠNG MỤC 1: Khóa Ngay Mọi Thao Tác Khi Tử Trận (isDead) ──
    if (isDead) {
      mobileState.jump = false;
      mobileState.attack = false;
      mobileState.shoot = false;
      velocityY.current = 0;

      // Throttle sync death state to store
      const now = performance.now();
      if (now - lastSyncTime.current > 200 || prevAnimRef.current !== "death") {
        lastSyncTime.current = now;
        prevAnimRef.current = "death";
        updatePlayerPosition(pos.current, facingLeftRef.current, "death");
      }
      return;
    }

    // 2. Read Keyboard & Mobile Joystick inputs with Camera-Relative Orientation
    const input = getInputState();
    const joyX = mobileState.joystick.x;
    const joyY = mobileState.joystick.y;
    const deadzone = 0.15;

    let inputForward = 0; // +1 = Forward (Away from camera), -1 = Backward (Towards camera)
    let inputRight = 0;   // +1 = Right, -1 = Left relative to screen view

    // If stunned, lock movement and inputs
    if (isStunned) {
      mobileState.jump = false;
      mobileState.attack = false;
      mobileState.shoot = false;
    } else {
      // Keyboard Input (WASD & Arrow Keys) via InputRouter
      if (input.forward) inputForward += 1;
      if (input.back) inputForward -= 1;
      if (input.right) inputRight += 1;
      if (input.left) inputRight -= 1;

      // Mobile Virtual Joystick (joyY < 0 is dragging UP on screen)
      if (joyY < -deadzone) inputForward += -joyY;
      if (joyY > deadzone) inputForward += -joyY;
      if (joyX > deadzone) inputRight += joyX;
      if (joyX < -deadzone) inputRight += joyX;
    }

    // Normalize diagonal input vector
    const inputMag = Math.hypot(inputForward, inputRight);
    if (inputMag > 1) {
      inputForward /= inputMag;
      inputRight /= inputMag;
    }

    // ── Calculate Camera-Relative Movement Vector ──
    const yaw = cameraControls.yaw;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const moveX = forwardX * inputForward + rightX * inputRight;
    const moveZ = forwardZ * inputForward + rightZ * inputRight;

    // Determine facing direction
    if (inputRight < -0.05) facingLeftRef.current = true;
    else if (inputRight > 0.05) facingLeftRef.current = false;
    else if (moveX < -0.05) facingLeftRef.current = true;
    else if (moveX > 0.05) facingLeftRef.current = false;

    // 3. Jump Physics
    const wantsJump = !isStunned && (input.jump || mobileState.jump) && isGrounded.current;
    if (wantsJump) {
      velocityY.current = jumpForce;
      isGrounded.current = false;
      mobileState.jump = false;
    }

    velocityY.current += gravity * dt;
    pos.current.y += velocityY.current * dt;

    if (pos.current.y <= 0) {
      pos.current.y = 0;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    // Speed derived from playerSpd stat
    const baseSpeed = 4.5 + Math.min(10, (playerSpd || 10) * 0.25);
    const effectiveSpeed = baseSpeed * (isStunned ? 0 : slowSpeedMultiplier) * (isMounted ? mountSpeedMultiplier : 1.0);
    pos.current.x += moveX * effectiveSpeed * dt;
    pos.current.z += moveZ * effectiveSpeed * dt;

    // 4. Attack Execution (Left Mouse Click or J Combo Chain)
    const wantsAttack = !isStunned && (input.attack || mobileState.attack || mobileState.shoot);

    // Auto-dismount when attacking or taking damage
    if (isMounted && (wantsAttack || hitFlashTimer > 0)) {
      dismount();
    }

    let currentAnim: import("../sprites/SpriteBillboard25D").EntityAnimationState = "idle";

    if (wantsAttack) {
      if (attackCooldown.current <= 0) {
        attackCooldown.current = 0.28;
        animLockTimer.current = 0.32;
        mobileState.attack = false;
        mobileState.shoot = false;

        triggerComboAttack();
      }
    }

    if (isStunned) {
      currentAnim = "hurt";
    } else if (animLockTimer.current > 0) {
      if (!isGrounded.current) {
        currentAnim = "air_attack";
      } else {
        const cStep = useGameWorldStore.getState().comboIndex;
        currentAnim = cStep === 1 ? "attack1" : cStep === 2 ? "attack2" : "attack3";
      }
    } else if (!isGrounded.current) {
      currentAnim = velocityY.current > 0 ? "jump" : "fall";
    } else if (inputMag > 0.1) {
      currentAnim = "run";
    }

    // Solid Obstacle and World Boundary Collisions Resolution
    resolveWorldCollisions(pos.current, 0.45);

    // Push coordinates to Zustand store (Throttled to 5Hz / 200ms or on state change to prevent 60FPS DOM thrashing)
    const now = performance.now();
    const animChanged = prevAnimRef.current !== currentAnim;
    const facingChanged = prevFacingRef.current !== facingLeftRef.current;
    if (now - lastSyncTime.current > 200 || animChanged || facingChanged) {
      lastSyncTime.current = now;
      prevAnimRef.current = currentAnim;
      prevFacingRef.current = facingLeftRef.current;
      updatePlayerPosition(pos.current, facingLeftRef.current, currentAnim);
    }

    // 5. Smooth 2.5D Action RPG Camera Follow with Locked Polar Angle (35°-55°) & Wheel Zoom
    cameraControls.zoom += (cameraControls.targetZoom - cameraControls.zoom) * cameraControls.dampingFactor;

    const clampedPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, cameraControls.pitch));
    const radius = cameraControls.zoom;
    const camY = radius * Math.sin(clampedPitch);
    const horizDist = radius * Math.cos(clampedPitch);
    const camX = horizDist * Math.sin(cameraControls.yaw);
    const camZ = horizDist * Math.cos(cameraControls.yaw);

    _camOffset.set(camX, camY, camZ);

    // Camera Shake jitter
    if (cameraShakeIntensity > 0.02) {
      const shakeAmt = cameraShakeIntensity * 0.45 * (cameraControls.reduceShake ? 0.2 : 1);
      _camOffset.x += (Math.random() - 0.5) * shakeAmt;
      _camOffset.y += (Math.random() - 0.5) * shakeAmt;
      _camOffset.z += (Math.random() - 0.5) * shakeAmt;
    }

    _targetCamPos.copy(pos.current).add(_camOffset);
    camera.position.lerp(_targetCamPos, 0.08);
    camera.lookAt(pos.current.x, pos.current.y + 1.2, pos.current.z);
  });

  return (
    <group>
      {/* Mount Visual (Horse / Wolf / Dragon) when Mounted */}
      {isMounted && (
        <MountVisual25D
          position={playerPosition}
          facingLeft={playerFacingLeft}
          isRunning={playerAnimState === "run"}
        />
      )}

      {/* Auto-Magnet Loot Pet Companion */}
      <BattlePetCompanion />

      {/* Weapon Enhancement Particle Aura (+7 to +15) */}
      {highestEnhanceLevel >= 7 && (
        <WeaponEnhanceAura
          enhanceLevel={highestEnhanceLevel}
          position={playerPosition}
        />
      )}

      {/* ── Miracle Tier Radiant Rose-Purple Aura (Hào Quang Kì Tích Tối Thượng) ── */}
      {hasMiracleEquipped && (
        <MiracleRadiantAura position={playerPosition} />
      )}

      {/* Overhead Chat Speech Bubble */}
      {overheadChatBubble && (
        <OverheadChatBubble
          message={overheadChatBubble}
          position={playerPosition}
        />
      )}

      {/* Slow Ground Frost Swirl */}
      {slowSpeedMultiplier < 0.95 && (
        <mesh position={[playerPosition.x, 0.03, playerPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 1.4, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Stun Overhead Spinning Stars */}
      {isStunned && (
        <group position={[playerPosition.x, playerPosition.y + 2.35, playerPosition.z]}>
          <Text fontSize={0.28} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
            💫 ✨ 💫
          </Text>
        </group>
      )}

      {characterRenderMode === "3d_model" ? (
        <group position={playerPosition}>
          <RPGCharacterModel3D
            classId={playerClassId}
            animState={playerAnimState}
            facingLeft={playerFacingLeft}
            color={playerColorHex}
            weaponType={
              playerClassId === "gunner"
                ? "gun"
                : playerClassId === "assassin"
                ? "daggers"
                : playerClassId === "tank"
                ? "shield"
                : "sword"
            }
          />
        </group>
      ) : (
        /* 2.5D Billboard Sprite for Player with High-Contrast Pixel Chibi Art & Foot Halo */
        <SpriteBillboard25D
          position={playerPosition}
          state={playerAnimState}
          facingLeft={playerFacingLeft}
          textureKey={`player_${playerClassId}`}
          color={playerColorHex}
          weaponType={
            playerClassId === "gunner"
              ? "gun"
              : playerClassId === "assassin"
              ? "daggers"
              : playerClassId === "tank"
              ? "shield"
              : "sword"
          }
          name={playerName}
          level={playerLevel}
          hp={playerHealth}
          maxHp={playerMaxHealth}
          isPlayer={true}
          isInvincible={isInvincible}
          hitFlash={hitFlashTimer > 0}
          debuffBadges={playerDebuffs.map((d) => d.icon)}
        />
      )}
    </group>
  );
});
