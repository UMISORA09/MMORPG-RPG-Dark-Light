import { memo, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { createMultiLayerCanvasTexture } from "../sprites/MultiLayerSpriteGenerator";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { mobileState } from "@/game/mobileControls";
import { cameraControls } from "@/game/cameraControls";
import { getCharacterBlueprint } from "@/skills";

// ── Keyboard State Tracker ──
const keys = new Set<string>();

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      e.preventDefault();
    }
    // Number and Action keys for skills
    if (e.key === "1" || k === "k") useGameWorldStore.getState().triggerSkill(1);
    if (e.key === "2" || k === "l") useGameWorldStore.getState().triggerSkill(2);
    if (e.key === "3" || k === "u") useGameWorldStore.getState().triggerSkill(3);
    if (k === "i") useGameWorldStore.getState().setActiveModal("inventory");
    if (k === "b") useGameWorldStore.getState().setActiveModal("shop");
    if (k === "l" && !e.ctrlKey) useGameWorldStore.getState().setActiveModal("leaderboard");
    if (k === "h") useGameWorldStore.getState().setActiveModal("battleLog");
    if (e.key === "Escape") useGameWorldStore.getState().closeActiveModal();
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
  });
}

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
  const playerColorHex = useGameWorldStore((s) => s.playerColorHex);
  const isInvincible = useGameWorldStore((s) => s.isInvincible);
  const cameraShakeIntensity = useGameWorldStore((s) => s.cameraShakeIntensity);

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

  const speed = 7.0;
  const jumpForce = 9.0;
  const gravity = -22.0;

  // Multi-layer procedural texture from blueprint anatomy
  const blueprint = useMemo(() => getCharacterBlueprint(playerClassId), [playerClassId]);
  const customAnatomyTexture = useMemo(() => {
    return createMultiLayerCanvasTexture({
      anatomy: blueprint.anatomy,
      frameSize: 128,
    });
  }, [blueprint]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // 1. Advance World timers
    tickWorld(dt);

    if (attackCooldown.current > 0) attackCooldown.current -= dt;
    if (animLockTimer.current > 0) animLockTimer.current -= dt;

    // 2. Read Keyboard & Mobile Joystick inputs
    const joyX = mobileState.joystick.x;
    const joyY = mobileState.joystick.y;
    const deadzone = 0.15;

    let moveX = 0;
    let moveZ = 0;

    if (keys.has("a") || keys.has("arrowleft") || joyX < -deadzone) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright") || joyX > deadzone) moveX += 1;
    if (keys.has("w") || keys.has("arrowup") || joyY < -deadzone) moveZ -= 1;
    if (keys.has("s") || keys.has("arrowdown") || joyY > deadzone) moveZ += 1;

    // Normalize diagonal movement
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    // Determine facing direction (flip left/right)
    if (moveX < -0.05) facingLeftRef.current = true;
    else if (moveX > 0.05) facingLeftRef.current = false;

    // 3. Jump Physics
    const wantsJump = (keys.has(" ") || mobileState.jump) && isGrounded.current;
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

    // Move in X/Z plane
    pos.current.x += moveX * speed * dt;
    pos.current.z += moveZ * speed * dt;

    // 4. Attack Execution (3-step Combo Chain)
    const wantsAttack = keys.has("j") || mobileState.attack || mobileState.shoot;

    let currentAnim: "idle" | "run" | "attack" | "hurt" = "idle";

    if (wantsAttack) {
      if (attackCooldown.current <= 0) {
        attackCooldown.current = 0.28;
        animLockTimer.current = 0.32;
        mobileState.attack = false;
        mobileState.shoot = false;

        triggerComboAttack();
      }
    }

    if (animLockTimer.current > 0) {
      currentAnim = "attack";
    } else if (len > 0.1) {
      currentAnim = "run";
    }

    // Push coordinates to Zustand store
    updatePlayerPosition(pos.current, facingLeftRef.current, currentAnim);

    // 5. Smooth 2.5D Isometric Action Camera Follow with Shake Impulse
    const camOffset = new THREE.Vector3(0, 8.5, 13.5);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraControls.yaw);

    // Camera Shake jitter
    if (cameraShakeIntensity > 0.02) {
      const shakeAmt = cameraShakeIntensity * 0.45;
      camOffset.x += (Math.random() - 0.5) * shakeAmt;
      camOffset.y += (Math.random() - 0.5) * shakeAmt;
      camOffset.z += (Math.random() - 0.5) * shakeAmt;
    }

    const targetCamPos = pos.current.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(pos.current.x, pos.current.y + 1.2, pos.current.z);
  });

  return (
    <group>
      {/* 2.5D Billboard Sprite for Player with Multi-Layer Cel-Shading */}
      <SpriteBillboard25D
        position={playerPosition}
        state={playerAnimState}
        facingLeft={playerFacingLeft}
        textureKey={`player_${playerClassId}`}
        customTexture={customAnatomyTexture}
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
      />
    </group>
  );
});
