import { memo, useRef, useEffect, useState } from "react";
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

// ── Class-Specific Elemental Combat & Movement Halo ─────────────────────────
const ClassCombatVFXHalo = memo(function ClassCombatVFXHalo({
  classId,
  isAttacking,
  isRunning,
  position,
}: {
  classId: string;
  isAttacking: boolean;
  isRunning: boolean;
  position: THREE.Vector3;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const runeRef = useRef<THREE.Mesh>(null);

  const colors = {
    fighter: { main: "#f97316", secondary: "#fbbf24", rune: "#ea580c" },
    assassin: { main: "#f43f5e", secondary: "#c084fc", rune: "#e11d48" },
    gunner: { main: "#00f2ff", secondary: "#38bdf8", rune: "#0284c7" },
    tank: { main: "#fbbf24", secondary: "#fef08a", rune: "#d97706" },
  }[classId] || { main: "#f97316", secondary: "#fbbf24", rune: "#ea580c" };

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (isRunning ? 4.2 : 1.2);
      const scaleBase = isAttacking ? 1.35 : isRunning ? 1.15 : 1.0;
      const pulse = 1.0 + Math.sin(t * 6) * 0.06;
      ringRef.current.scale.set(scaleBase * pulse, scaleBase * pulse, 1);
    }
    if (coreRef.current) {
      coreRef.current.rotation.z = -t * 2.4;
    }
    if (runeRef.current) {
      runeRef.current.rotation.z = t * (isRunning ? 2.5 : 0.8);
      const runePulse = 1.0 + Math.cos(t * 4) * 0.05;
      runeRef.current.scale.set(runePulse, runePulse, 1);
    }
  });

  return (
    <group position={[position.x, 0.03, position.z]}>
      {/* Outer Elemental Rune Orbit Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 1.25, 32]} />
        <meshBasicMaterial
          color={colors.main}
          transparent
          opacity={isAttacking ? 0.75 : isRunning ? 0.45 : 0.28}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Middle Sacred Glyphs Orbit */}
      <mesh ref={runeRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 1.05, 16]} />
        <meshBasicMaterial
          color={colors.rune}
          transparent
          opacity={isAttacking ? 0.55 : isRunning ? 0.35 : 0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Radiant Core */}
      <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 16]} />
        <meshBasicMaterial
          color={colors.secondary}
          transparent
          opacity={isAttacking ? 0.55 : isRunning ? 0.35 : 0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

// Module-level scratch vectors to prevent GC thrashing in useFrame
const _camOffset = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _zeroVec = new THREE.Vector3(0, 0, 0);
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _aimTargetPoint = new THREE.Vector3();
const _facingDir = new THREE.Vector3(1, 0, 0);

export const PlayerEntity25D = memo(function PlayerEntity25D() {
  const { camera, raycaster, pointer } = useThree();

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
  const playerHairStyle = useGameWorldStore((s) => s.playerHairStyle);
  const playerHairColor = useGameWorldStore((s) => s.playerHairColor);
  const playerOutfitId = useGameWorldStore((s) => s.playerOutfitId);
  const playerAuraIds = useGameWorldStore((s) => s.playerAuraIds);
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

  // Hit-Stop, Dash & Particle Pools
  const hitStopTimer = useGameWorldStore((s) => s.hitStopTimer);
  const isDashing = useGameWorldStore((s) => s.isDashing);
  const dashDirection = useGameWorldStore((s) => s.dashDirection);
  const triggerDash = useGameWorldStore((s) => s.triggerDash);
  const addDustPuff = useGameWorldStore((s) => s.addDustPuff);
  const addAfterimageGhost = useGameWorldStore((s) => s.addAfterimageGhost);
  const afterimageGhosts = useGameWorldStore((s) => s.afterimageGhosts);
  const dustPuffs = useGameWorldStore((s) => s.dustPuffs);

  const updatePlayerPosition = useGameWorldStore((s) => s.updatePlayerPosition);
  const updatePlayerAim = useGameWorldStore((s) => s.updatePlayerAim);
  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const tickWorld = useGameWorldStore((s) => s.tickWorld);

  // Local physics variables & 60/144 FPS smooth visual anchor
  const playerVisualGroupRef = useRef<THREE.Group>(null);
  const pos = useRef(playerPosition.clone());
  const currentVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const attackCooldown = useRef(0);
  const animLockTimer = useRef(0);
  const facingLeftRef = useRef(playerFacingLeft);
  const footstepDustTimer = useRef(0);
  const ghostSpawnTimer = useRef(0);

  // High-frequency visual states for instantaneous, smooth animation switching
  const [visualAnim, setVisualAnim] = useState<import("../sprites/SpriteBillboard25D").EntityAnimationState>("idle");
  const [visualFacingLeft, setVisualFacingLeft] = useState<boolean>(playerFacingLeft);

  // Store synchronization throttle refs
  const lastSyncTime = useRef(0);
  const prevAnimRef = useRef<string>("idle");
  const prevFacingRef = useRef<boolean>(playerFacingLeft);

  // ── HẠNG MỤC 1: Dịch Chuyển Bắt Buộc Về Tâm Nhà Chính (0, 0, 0) Khi Hồi Sinh ──
  useEffect(() => {
    pos.current.set(0, 0, 0);
    currentVelocity.current.set(0, 0, 0);
    velocityY.current = 0;
    isGrounded.current = true;
    facingLeftRef.current = false;
    if (playerVisualGroupRef.current) {
      playerVisualGroupRef.current.position.set(0, 0, 0);
    }
  }, [respawnTriggerCount]);

  // ── HẠNG MỤC 4: Khôi phục tọa độ 3D chính xác khi Hydration hoặc Dịch chuyển ──
  useEffect(() => {
    if (pos.current.distanceTo(playerPosition) > 0.4) {
      pos.current.copy(playerPosition);
      currentVelocity.current.set(0, 0, 0);
      if (playerVisualGroupRef.current) {
        playerVisualGroupRef.current.position.copy(playerPosition);
      }
    }
  }, [playerPosition]);

  const jumpForce = 9.0;
  const gravity = -22.0;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // 1. Advance World timers
    tickWorld(dt);

    // ── Hit-Stop Micro-Freeze (Crunchy micro-pause on heavy hits) ──
    if (hitStopTimer > 0) {
      return;
    }

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

    // ── Directional Aiming & Facing Vector Calculation (Pointer on Ground Y=0 or Movement) ──
    let hasAimTarget = false;
    if (raycaster && raycaster.ray) {
      const hit = raycaster.ray.intersectPlane(_groundPlane, _aimTargetPoint);
      if (hit) {
        hasAimTarget = true;
      }
    }

    const wantsAttack = !isStunned && (input.attack || mobileState.attack || mobileState.shoot);

    // If attacking or aiming actively with pointer, face target point
    if (hasAimTarget && (wantsAttack || (inputMag <= 0.05 && pointer && Math.hypot(pointer.x, pointer.y) > 0.02))) {
      _facingDir.subVectors(_aimTargetPoint, pos.current).setY(0);
      if (_facingDir.lengthSq() > 0.04) {
        _facingDir.normalize();
        facingLeftRef.current = _facingDir.x < -0.05;
      }
    } else if (inputMag > 0.05) {
      _facingDir.set(moveX, 0, moveZ).normalize();
      if (Math.abs(inputRight) > 0.12) {
        facingLeftRef.current = inputRight < 0;
      } else if (Math.abs(moveX) > 0.15) {
        facingLeftRef.current = moveX < 0;
      }
    } else {
      _facingDir.set(facingLeftRef.current ? -1 : 1, 0, 0);
    }

    if (hasAimTarget && (wantsAttack || inputMag > 0.05)) {
      updatePlayerAim(_aimTargetPoint, _facingDir);
    }

    // 3. Jump Physics with landing impact
    const wantsJump = !isStunned && (input.jump || mobileState.jump) && isGrounded.current;
    if (wantsJump) {
      velocityY.current = jumpForce;
      isGrounded.current = false;
      mobileState.jump = false;
    }

    velocityY.current += gravity * dt;
    pos.current.y += velocityY.current * dt;

    if (pos.current.y <= 0) {
      if (!isGrounded.current) {
        // Landing dust puff
        addDustPuff(pos.current.clone(), 0.55);
      }
      pos.current.y = 0;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    // ── Ultra-Fluid Velocity Interpolation (Snappy Ramp-up & Natural Deceleration) ──
    const baseSpeed = 4.8 + Math.min(10, (playerSpd || 10) * 0.25);
    const effectiveSpeed = baseSpeed * (isStunned ? 0 : slowSpeedMultiplier) * (isMounted ? mountSpeedMultiplier : 1.0);
    const targetVelX = moveX * effectiveSpeed;
    const targetVelZ = moveZ * effectiveSpeed;

    // Responsive acceleration (26/s) & organic ease-out deceleration (18/s)
    const accelRate = inputMag > 0.05 ? 26.0 : 18.0;
    const lerpT = 1.0 - Math.exp(-accelRate * dt);
    currentVelocity.current.x = THREE.MathUtils.lerp(currentVelocity.current.x, targetVelX, lerpT);
    currentVelocity.current.z = THREE.MathUtils.lerp(currentVelocity.current.z, targetVelZ, lerpT);

    pos.current.x += currentVelocity.current.x * dt;
    pos.current.z += currentVelocity.current.z * dt;

    // 3.5 Dash / I-Frame Roll (Spacebar while moving or Shift)
    const wantsDash = !isStunned && Boolean(input.dash);
    if (wantsDash) {
      const moveMag = Math.hypot(moveX, moveZ);
      const dashVec = moveMag > 0.05
        ? new THREE.Vector3(moveX, 0, moveZ).normalize()
        : new THREE.Vector3(facingLeftRef.current ? -1 : 1, 0, 0);
      triggerDash(dashVec);
    }

    if (isDashing) {
      const dashSpeed = 16.5;
      pos.current.x += dashDirection.x * dashSpeed * dt;
      pos.current.z += dashDirection.z * dashSpeed * dt;

      ghostSpawnTimer.current += dt;
      if (ghostSpawnTimer.current >= 0.05) {
        ghostSpawnTimer.current = 0;
        addAfterimageGhost(pos.current.clone(), "run", facingLeftRef.current, "#00f2ff");
      }
    }

    // 4. Attack Execution (Left Mouse Click or J Combo Chain - Heavy & Deliberate Timing)
    // Auto-dismount when attacking or taking damage
    if (isMounted && (wantsAttack || hitFlashTimer > 0)) {
      dismount();
    }

    let currentAnim: import("../sprites/SpriteBillboard25D").EntityAnimationState = "idle";

    if (wantsAttack) {
      if (attackCooldown.current <= 0) {
        // Deliberate Attack Cadence: Lv.1 attacks slowly & deliberately (~0.65s cooldown), scaling down with level
        const cooldownTime = playerLevel === 1 ? 0.65 : playerLevel === 2 ? 0.55 : Math.max(0.32, 0.48 - (playerLevel - 2) * 0.035);
        // Snappy recovery window (0.26s) so player can fluidly transition back to running without feeling locked
        const animLockTime = Math.min(cooldownTime * 0.45, 0.28);
        attackCooldown.current = cooldownTime;
        animLockTimer.current = animLockTime;
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
    } else if (inputMag > 0.05 || currentVelocity.current.lengthSq() > 0.1 || isDashing) {
      currentAnim = "run";
    }

    // Footstep dust puffs when running on ground
    if (currentAnim === "run" && isGrounded.current) {
      footstepDustTimer.current += dt;
      if (footstepDustTimer.current >= 0.18) {
        footstepDustTimer.current = 0;
        const dustOffset = facingLeftRef.current ? 0.35 : -0.35;
        addDustPuff(pos.current.clone().add(new THREE.Vector3(dustOffset, 0.05, 0)), 0.45);
      }
    }

    // Solid Obstacle and World Boundary Collisions Resolution
    resolveWorldCollisions(pos.current, 0.45);

    // ── Update 60/144 FPS Player Visual Group Direct Transform (Zero-Lag Smooth Movement) ──
    if (playerVisualGroupRef.current) {
      playerVisualGroupRef.current.position.copy(pos.current);
    }

    // High-frequency visual state updates
    if (prevAnimRef.current !== currentAnim) {
      prevAnimRef.current = currentAnim;
      setVisualAnim(currentAnim);
    }
    if (prevFacingRef.current !== facingLeftRef.current) {
      prevFacingRef.current = facingLeftRef.current;
      setVisualFacingLeft(facingLeftRef.current);
    }

    // Push coordinates to Zustand store (Throttled to 20Hz / 50ms for UI/Radar/Network sync)
    const now = performance.now();
    const animChanged = prevAnimRef.current !== currentAnim;
    const facingChanged = prevFacingRef.current !== facingLeftRef.current;
    if (now - lastSyncTime.current > 50 || animChanged || facingChanged) {
      lastSyncTime.current = now;
      updatePlayerPosition(pos.current, facingLeftRef.current, currentAnim, _facingDir, _aimTargetPoint);
    }

    // 5. Smooth 2.5D Action RPG Camera Follow with Frame-Rate Independent Exponential Dampening
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
    const camLerp = 1.0 - Math.exp(-12.0 * dt);
    camera.position.lerp(_targetCamPos, camLerp);
    camera.lookAt(pos.current.x, pos.current.y + 1.2, pos.current.z);
  });

  return (
    <group>
      {/* ── 60FPS / 144FPS Ultra-Smooth Player Visual Anchor Group ── */}
      <group ref={playerVisualGroupRef} position={[pos.current.x, pos.current.y, pos.current.z]}>
        {/* Class-Specific Elemental Combat & Movement Halo */}
        <ClassCombatVFXHalo
          classId={playerClassId}
          isAttacking={animLockTimer.current > 0}
          isRunning={visualAnim === "run"}
          position={_zeroVec}
        />

        {/* Mount Visual (Horse / Wolf / Dragon) when Mounted */}
        {isMounted && (
          <MountVisual25D
            position={_zeroVec}
            facingLeft={visualFacingLeft}
            isRunning={visualAnim === "run"}
          />
        )}

        {/* Weapon Enhancement Particle Aura (+7 to +15) */}
        {highestEnhanceLevel >= 7 && (
          <WeaponEnhanceAura
            enhanceLevel={highestEnhanceLevel}
            position={_zeroVec}
          />
        )}

        {/* Miracle Tier Radiant Rose-Purple Aura */}
        {hasMiracleEquipped && (
          <MiracleRadiantAura position={_zeroVec} />
        )}

        {/* Overhead Chat Speech Bubble */}
        {overheadChatBubble && (
          <OverheadChatBubble
            message={overheadChatBubble}
            position={_zeroVec}
          />
        )}

        {/* Slow Ground Frost Swirl */}
        {slowSpeedMultiplier < 0.95 && (
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 1.4, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Stun Overhead Spinning Stars */}
        {isStunned && (
          <group position={[0, 2.35, 0]}>
            <Text fontSize={0.28} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
              💫 ✨ 💫
            </Text>
          </group>
        )}

        {characterRenderMode === "3d_model" ? (
          <group position={[0, 0, 0]}>
            <RPGCharacterModel3D
              classId={playerClassId}
              animState={visualAnim}
              facingLeft={visualFacingLeft}
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
            position={[0, 0, 0]}
            state={visualAnim}
            facingLeft={visualFacingLeft}
            textureKey={`player_${playerClassId}`}
            color={playerColorHex}
            hairStyle={playerHairStyle}
            hairColor={playerHairColor}
            outfitId={playerOutfitId}
            auraIds={playerAuraIds}
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

      {/* Auto-Magnet Loot Pet Companion (World-space follower) */}
      <BattlePetCompanion />

      {/* ── Dust Puffs (Running and Dash Foot Planting Ground Particles) ── */}
      {dustPuffs.map((dust) => (
        <mesh
          key={dust.id}
          position={[dust.position.x, dust.position.y, dust.position.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[dust.size * 0.35, dust.size, 16]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={dust.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Afterimage Ghost Billboards (Dash I-Frame Ghosting Trail) ── */}
      {afterimageGhosts.map((ghost) => (
        <group key={ghost.id} position={ghost.position}>
          <SpriteBillboard25D
            position={[0, 0, 0]}
            state={ghost.animState as any}
            facingLeft={ghost.facingLeft}
            textureKey={`player_${playerClassId}`}
            color={ghost.color}
            showOverhead={false}
            hp={playerHealth}
            maxHp={playerMaxHealth}
            hitFlash={false}
          />
        </group>
      ))}
    </group>
  );
});
