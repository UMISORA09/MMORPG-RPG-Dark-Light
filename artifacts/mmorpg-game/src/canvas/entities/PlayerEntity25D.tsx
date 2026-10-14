import { memo, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { RPGCharacterModel3D } from "./RPGCharacterModel3D";
import { createMultiLayerCanvasTexture } from "../sprites/MultiLayerSpriteGenerator";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { mobileState } from "@/game/mobileControls";
import { cameraControls } from "@/game/cameraControls";
import { getCharacterBlueprint } from "@/skills";

// ── Keyboard State Tracker ──
const keys = new Set<string>();

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    // If typing in input or textarea, ignore game hotkeys
    if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
      return;
    }
    const k = e.key.toLowerCase();
    keys.add(k);
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      e.preventDefault();
    }
    // Combat Skills: 1/Q (Skill 1), 2/E (Skill 2), 3/R (Skill 3) - Ergonomic Left Hand Layout
    if (e.key === "1" || k === "q" || k === "k") useGameWorldStore.getState().triggerSkill(1);
    if (e.key === "2" || k === "e") useGameWorldStore.getState().triggerSkill(2);
    if (e.key === "3" || k === "r" || k === "u") useGameWorldStore.getState().triggerSkill(3);

    // Interface Modals: B/I (Bag/Túi), P (Shop/Cửa hàng), O (BXH/Leaderboard), H (Chiến Báo), V (2.5D/3D Mode), ESC (Đóng)
    if (k === "b" || k === "i") useGameWorldStore.getState().setActiveModal("inventory");
    if (k === "p") useGameWorldStore.getState().setActiveModal("shop");
    if (k === "o") useGameWorldStore.getState().setActiveModal("leaderboard");
    if (k === "h") useGameWorldStore.getState().setActiveModal("battleLog");
    if (k === "v") useGameWorldStore.getState().toggleCharacterRenderMode();
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
  const characterRenderMode = useGameWorldStore((s) => s.characterRenderMode);
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

    // 2. Read Keyboard & Mobile Joystick inputs with Camera-Relative Orientation
    const joyX = mobileState.joystick.x;
    const joyY = mobileState.joystick.y;
    const deadzone = 0.15;

    let inputForward = 0; // +1 = Forward (Away from camera), -1 = Backward (Towards camera)
    let inputRight = 0;   // +1 = Right, -1 = Left relative to screen view

    // Keyboard Input (WASD & Arrow Keys)
    if (keys.has("w") || keys.has("arrowup")) inputForward += 1;
    if (keys.has("s") || keys.has("arrowdown")) inputForward -= 1;
    if (keys.has("d") || keys.has("arrowright")) inputRight += 1;
    if (keys.has("a") || keys.has("arrowleft")) inputRight -= 1;

    // Mobile Virtual Joystick (joyY < 0 is dragging UP on screen)
    if (joyY < -deadzone) inputForward += -joyY;
    if (joyY > deadzone) inputForward += -joyY;
    if (joyX > deadzone) inputRight += joyX;
    if (joyX < -deadzone) inputRight += joyX;

    // Normalize diagonal input vector
    const inputMag = Math.hypot(inputForward, inputRight);
    if (inputMag > 1) {
      inputForward /= inputMag;
      inputRight /= inputMag;
    }

    // ── Calculate Camera-Relative Movement Vector ──
    // cameraControls.yaw is camera orbit rotation angle around Y axis
    const yaw = cameraControls.yaw;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const moveX = forwardX * inputForward + rightX * inputRight;
    const moveZ = forwardZ * inputForward + rightZ * inputRight;

    // Determine facing direction (flip left/right sprite based on screen orientation)
    if (inputRight < -0.05) facingLeftRef.current = true;
    else if (inputRight > 0.05) facingLeftRef.current = false;
    else if (moveX < -0.05) facingLeftRef.current = true;
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

    // Move in X/Z plane smoothly
    pos.current.x += moveX * speed * dt;
    pos.current.z += moveZ * speed * dt;

    // 4. Attack Execution (3-step Combo Chain)
    const wantsAttack = keys.has("j") || keys.has("f") || mobileState.attack || mobileState.shoot;

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

    if (animLockTimer.current > 0) {
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
        /* 2.5D Billboard Sprite for Player with Multi-Layer Cel-Shading */
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
      )}
    </group>
  );
});
