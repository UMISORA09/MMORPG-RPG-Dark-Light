import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../useGameStore";
import { ITEM_MAP } from "../data/items";

const _v3 = new THREE.Vector3();

const Player = memo(function Player() {
  const groupRef     = useRef<THREE.Group>(null);
  const bodyRef      = useRef<THREE.Group>(null);
  const leftLegRef   = useRef<THREE.Group>(null);
  const rightLegRef  = useRef<THREE.Group>(null);
  const leftArmRef   = useRef<THREE.Group>(null);
  const rightArmRef  = useRef<THREE.Group>(null);
  const swordArmRef  = useRef<THREE.Group>(null);
  const swordRef     = useRef<THREE.Group>(null);
  const capeTop      = useRef<THREE.Mesh>(null);
  const capeMid      = useRef<THREE.Mesh>(null);
  const capeBot      = useRef<THREE.Mesh>(null);
  const headRef      = useRef<THREE.Group>(null);
  const attackTimer  = useRef(0);
  const walkTime     = useRef(0);
  const isMovingRef  = useRef(false);

  const player = useGameStore((s) => s.player);

  const weaponItem    = player.equipment.weapon    ? ITEM_MAP[player.equipment.weapon]    : null;
  const armorItem     = player.equipment.armor     ? ITEM_MAP[player.equipment.armor]     : null;
  const helmetItem    = player.equipment.helmet    ? ITEM_MAP[player.equipment.helmet]    : null;
  const accessoryItem = player.equipment.accessory ? ITEM_MAP[player.equipment.accessory] : null;

  const weaponTier  = weaponItem?.tier  ?? 0;
  const armorTier   = armorItem?.tier   ?? 0;
  const helmetTier  = helmetItem?.tier  ?? 0;

  const bodyColor   = armorTier  >= 3 ? "#5c2873" : armorTier  >= 2 ? "#14416e" : armorTier  >= 1 ? "#6b3510" : "#c87820";
  const chestColor  = armorTier  >= 3 ? "#8b49a6" : armorTier  >= 2 ? "#2470a9" : "#a83030";
  const helmetColor = helmetTier >= 3 ? "#8b49a6" : helmetTier >= 2 ? "#2470a9" : "#a83030";
  const bladeColor  = weaponTier >= 3 ? "#ff5522" : weaponTier >= 2 ? "#70b8f0" : "#d4d4d4";
  const guardColor  = weaponTier >= 3 ? "#f0c000" : "#d08800";
  const legColor    = armorTier  >= 2 ? "#162438" : "#243040";
  const bootColor   = armorTier  >= 3 ? "#3d1e4a" : "#0c0c14";
  const skinColor   = "#f0c090";
  const capeColor   = armorTier  >= 3 ? "#4a1a6a" : armorTier >= 2 ? "#1a3a5a" : "#8b1a1a";
  const capeTrim    = armorTier  >= 3 ? "#cc88ff" : armorTier >= 2 ? "#5599ff" : "#ffcc44";

  const flash = player.isInvincible;
  const fp = flash ? { transparent: true as const, opacity: 0.55 } : {};

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(player.position);
    groupRef.current.rotation.y = player.facingDirection;

    const speed = _v3.set(player.velocity.x, 0, player.velocity.z).length();
    isMovingRef.current = speed > 0.3;

    if (isMovingRef.current) {
      walkTime.current += delta * 7;
    } else {
      walkTime.current *= 0.75;
    }

    const swing   = Math.sin(walkTime.current) * 0.42;
    const sideSwing = Math.sin(walkTime.current) * 0.04;

    if (leftLegRef.current)  { leftLegRef.current.rotation.x  =  swing;       }
    if (rightLegRef.current) { rightLegRef.current.rotation.x = -swing;        }
    if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -swing * 0.55; }

    // Cape ripple
    const capeSwing = isMovingRef.current ? 0.18 : 0.04;
    const t = walkTime.current;
    if (capeTop.current) capeTop.current.rotation.x = capeSwing * Math.sin(t * 0.5) * 0.3;
    if (capeMid.current) capeMid.current.rotation.x = capeSwing + Math.sin(t * 0.7) * 0.08;
    if (capeBot.current) capeBot.current.rotation.x = capeSwing * 1.6 + Math.sin(t + 1) * 0.12;

    // Body slight lean when moving
    if (bodyRef.current) {
      bodyRef.current.rotation.x = isMovingRef.current ? 0.06 : 0;
      bodyRef.current.rotation.z = sideSwing;
    }

    // Head gentle bob
    if (headRef.current) {
      headRef.current.position.y = Math.abs(Math.sin(walkTime.current)) * 0.02;
    }

    // Attack animation
    if (player.isAttacking) attackTimer.current = 0.42;
    if (attackTimer.current > 0) {
      attackTimer.current -= delta;
      const p = 1 - attackTimer.current / 0.42;
      const eased = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2; // ease in-out cubic

      // Right arm full overhead-to-down sweep
      if (swordArmRef.current) {
        swordArmRef.current.rotation.x = -Math.PI * 0.8 + eased * Math.PI * 1.4;
        swordArmRef.current.rotation.z = -0.1 + eased * 0.15;
      }
      // Body leans into strike
      if (bodyRef.current) {
        bodyRef.current.rotation.x = eased < 0.5 ? -eased * 0.3 : (1 - eased) * 0.3;
      }
    } else {
      // Return sword arm to idle
      if (swordArmRef.current) {
        swordArmRef.current.rotation.x += (-swing * 0.55 - swordArmRef.current.rotation.x) * 0.18;
        swordArmRef.current.rotation.z += (0 - swordArmRef.current.rotation.z) * 0.18;
      }
    }
  });

  return (
    <group ref={groupRef}>

      {/* ── Cape (behind body, rendered first) ─────────────────────────────── */}
      <group position={[0, 0.92, -0.22]}>
        <mesh ref={capeTop} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.52, 0.28, 0.04]} />
          <meshStandardMaterial color={capeColor} roughness={0.9} {...fp} />
        </mesh>
        <group position={[0, -0.28, 0]}>
          <mesh ref={capeMid} position={[0, -0.22, -0.04]} castShadow>
            <boxGeometry args={[0.48, 0.45, 0.04]} />
            <meshStandardMaterial color={capeColor} roughness={0.9} {...fp} />
          </mesh>
          <group position={[0, -0.45, 0]}>
            <mesh ref={capeBot} position={[0, -0.2, -0.08]} castShadow>
              <boxGeometry args={[0.44, 0.42, 0.04]} />
              <meshStandardMaterial color={capeColor} roughness={0.9} {...fp} />
            </mesh>
            {/* Cape trim */}
            <mesh position={[0, -0.42, -0.08]}>
              <boxGeometry args={[0.44, 0.05, 0.04]} />
              <meshBasicMaterial color={capeTrim} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── Legs ────────────────────────────────────────────────────────────── */}
      <group ref={leftLegRef} position={[-0.15, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.46, 0.28]} />
          <meshStandardMaterial color={legColor} roughness={0.8} metalness={0.1} {...fp} />
        </mesh>
        {/* Knee guard */}
        {armorTier >= 2 && (
          <mesh position={[0, -0.12, 0.14]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.06]} />
            <meshStandardMaterial color={chestColor} roughness={0.6} metalness={0.4} />
          </mesh>
        )}
        {/* Boot */}
        <mesh position={[0, -0.3, 0.05]} castShadow>
          <boxGeometry args={[0.26, 0.13, 0.36]} />
          <meshStandardMaterial color={bootColor} roughness={0.75} metalness={0.15} {...fp} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.15, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.46, 0.28]} />
          <meshStandardMaterial color={legColor} roughness={0.8} metalness={0.1} {...fp} />
        </mesh>
        {armorTier >= 2 && (
          <mesh position={[0, -0.12, 0.14]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.06]} />
            <meshStandardMaterial color={chestColor} roughness={0.6} metalness={0.4} />
          </mesh>
        )}
        <mesh position={[0, -0.3, 0.05]} castShadow>
          <boxGeometry args={[0.26, 0.13, 0.36]} />
          <meshStandardMaterial color={bootColor} roughness={0.75} metalness={0.15} {...fp} />
        </mesh>
      </group>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <group ref={bodyRef} position={[0, 0.82, 0]}>
        {/* Torso */}
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.8, 0.4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={armorTier >= 2 ? 0.25 : 0.05} {...fp} />
        </mesh>
        {/* Chest plate */}
        <mesh position={[0, 0.04, 0.21]} castShadow>
          <boxGeometry args={[0.54, 0.64, 0.07]} />
          <meshStandardMaterial color={chestColor} roughness={0.55} metalness={armorTier >= 2 ? 0.5 : 0.1} {...fp} />
        </mesh>
        {/* Chest center gem (tier 2+) */}
        {armorTier >= 2 && (
          <mesh position={[0, 0.1, 0.26]}>
            <octahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color={armorTier >= 3 ? "#cc44ff" : "#44aaff"} roughness={0.1} metalness={0.9} emissive={armorTier >= 3 ? "#8800cc" : "#0044aa"} emissiveIntensity={0.8} />
          </mesh>
        )}
        {/* Shoulder pads (always show tier 1+, better at tier 2+) */}
        {armorTier >= 1 && (
          <>
            <mesh position={[-0.38, 0.24, 0]} castShadow>
              <boxGeometry args={[0.16, 0.18, 0.38]} />
              <meshStandardMaterial color={chestColor} roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[0.38, 0.24, 0]} castShadow>
              <boxGeometry args={[0.16, 0.18, 0.38]} />
              <meshStandardMaterial color={chestColor} roughness={0.6} metalness={0.4} />
            </mesh>
          </>
        )}
        {/* Dragon scale overlay (tier 3) */}
        {armorTier >= 3 && (
          <>
            <mesh position={[0, 0.04, 0.26]}>
              <boxGeometry args={[0.32, 0.52, 0.05]} />
              <meshBasicMaterial color="#c039e0" transparent opacity={0.35} />
            </mesh>
            <pointLight position={[0, 0.04, 0.3]} color="#aa22ff" intensity={1.8} distance={3} decay={2} />
          </>
        )}
        {/* Belt */}
        <mesh position={[0, -0.33, 0.22]} castShadow>
          <boxGeometry args={[0.56, 0.1, 0.07]} />
          <meshStandardMaterial color="#4a2e10" roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Belt buckle */}
        <mesh position={[0, -0.33, 0.27]}>
          <boxGeometry args={[0.1, 0.08, 0.04]} />
          <meshStandardMaterial color={guardColor} roughness={0.3} metalness={0.9} />
        </mesh>

        {/* ── Left arm + Shield ──────────────────────────────────────────── */}
        <group ref={leftArmRef} position={[-0.42, 0.1, 0]}>
          {/* Upper arm */}
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.35, 0.26]} />
            <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.05} {...fp} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.23]} />
            <meshStandardMaterial color={skinColor} roughness={0.85} {...fp} />
          </mesh>
          {/* Bracer */}
          <mesh position={[-0.01, -0.31, 0]} castShadow>
            <boxGeometry args={[0.22, 0.1, 0.25]} />
            <meshStandardMaterial color={armorTier >= 2 ? "#1a4a6a" : "#3a2010"} roughness={0.65} metalness={0.4} />
          </mesh>
          {/* Shield */}
          <mesh position={[-0.2, -0.12, 0.08]} castShadow>
            <boxGeometry args={[0.1, 0.52, 0.42]} />
            <meshStandardMaterial color={armorTier >= 2 ? "#14416e" : "#2470a9"} roughness={0.65} metalness={0.35} />
          </mesh>
          {/* Shield boss */}
          <mesh position={[-0.24, -0.06, 0.08]}>
            <octahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color={guardColor} roughness={0.3} metalness={0.85} />
          </mesh>
        </group>

        {/* ── Right arm + Sword ──────────────────────────────────────────── */}
        <group ref={swordArmRef} position={[0.42, 0.1, 0]}>
          {/* Upper arm */}
          <mesh ref={rightArmRef} castShadow>
            <boxGeometry args={[0.22, 0.35, 0.26]} />
            <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.05} {...fp} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.23]} />
            <meshStandardMaterial color={skinColor} roughness={0.85} {...fp} />
          </mesh>
          {/* Bracer */}
          <mesh position={[0.01, -0.31, 0]} castShadow>
            <boxGeometry args={[0.22, 0.1, 0.25]} />
            <meshStandardMaterial color={armorTier >= 2 ? "#1a4a6a" : "#3a2010"} roughness={0.65} metalness={0.4} />
          </mesh>
          {/* Sword group */}
          <group ref={swordRef} position={[0.08, -0.52, 0.12]}>
            {/* Handle wrap */}
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.055, 0.28, 6]} />
              <meshStandardMaterial color="#3a2010" roughness={0.85} metalness={0.1} />
            </mesh>
            {/* Handle grip lines */}
            {[-0.06, 0, 0.06].map((y, i) => (
              <mesh key={i} position={[0, 0.12 + y, 0]} castShadow>
                <torusGeometry args={[0.052, 0.012, 5, 8]} />
                <meshStandardMaterial color={guardColor} roughness={0.5} metalness={0.6} />
              </mesh>
            ))}
            {/* Guard */}
            <mesh position={[0, -0.04, 0]} castShadow>
              <boxGeometry args={weaponTier >= 3 ? [0.44,0.1,0.12] : [0.32,0.09,0.1]} />
              <meshStandardMaterial color={guardColor} roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Guard wings (tier 2+) */}
            {weaponTier >= 2 && (
              <>
                <mesh position={[0.2,-0.04,0]} rotation={[0,0,Math.PI/6]} castShadow>
                  <boxGeometry args={[0.06,0.16,0.08]} />
                  <meshStandardMaterial color={guardColor} roughness={0.4} metalness={0.8} />
                </mesh>
                <mesh position={[-0.2,-0.04,0]} rotation={[0,0,-Math.PI/6]} castShadow>
                  <boxGeometry args={[0.06,0.16,0.08]} />
                  <meshStandardMaterial color={guardColor} roughness={0.4} metalness={0.8} />
                </mesh>
              </>
            )}
            {/* Blade */}
            <mesh position={[0, -0.65, 0]} castShadow>
              <boxGeometry args={weaponTier >= 3 ? [0.12,1.2,0.08] : weaponTier >= 2 ? [0.1,1.05,0.07] : [0.09,0.92,0.06]} />
              <meshStandardMaterial
                color={bladeColor}
                roughness={weaponTier >= 2 ? 0.2 : 0.4}
                metalness={weaponTier >= 2 ? 0.9 : 0.7}
                emissive={weaponTier >= 3 ? "#aa2200" : weaponTier >= 2 ? "#002266" : "#000"}
                emissiveIntensity={weaponTier >= 2 ? 0.5 : 0}
              />
            </mesh>
            {/* Blade edge highlight */}
            <mesh position={[0.05, -0.65, 0]} castShadow>
              <boxGeometry args={[0.015, weaponTier >= 2 ? 1.0 : 0.88, 0.06]} />
              <meshBasicMaterial color={weaponTier >= 3 ? "#ff8844" : weaponTier >= 2 ? "#88ccff" : "#ffffff"} transparent opacity={0.7} />
            </mesh>
            {/* Blade tip */}
            <mesh position={[0, -1.28, 0]} castShadow>
              <coneGeometry args={[0.06, 0.2, 4]} />
              <meshStandardMaterial color={bladeColor} roughness={0.2} metalness={0.9} />
            </mesh>
            {/* Weapon glow light (tier 2+) */}
            {weaponTier >= 2 && (
              <pointLight position={[0,-0.65,0]} color={weaponTier >= 3 ? "#ff4400" : "#4488ff"} intensity={weaponTier >= 3 ? 2.5 : 1.2} distance={4} decay={2} />
            )}
          </group>
        </group>
      </group>

      {/* ── Head ────────────────────────────────────────────────────────────── */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        {/* Head base */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.52, 0.5]} />
          <meshStandardMaterial color={flash ? "#ff9999" : skinColor} roughness={0.85} {...fp} />
        </mesh>
        {/* Chin/jaw */}
        <mesh position={[0, -0.25, 0.06]} castShadow>
          <boxGeometry args={[0.38, 0.08, 0.38]} />
          <meshStandardMaterial color={flash ? "#ff9999" : skinColor} roughness={0.85} {...fp} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.02, 0.26]} castShadow>
          <boxGeometry args={[0.07, 0.09, 0.07]} />
          <meshStandardMaterial color={flash ? "#ff9999" : "#e0a070"} roughness={0.9} />
        </mesh>
        {/* Eyes — whites */}
        <mesh position={[0.14, 0.1, 0.26]}>
          <boxGeometry args={[0.12, 0.1, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.14, 0.1, 0.26]}>
          <boxGeometry args={[0.12, 0.1, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Pupils */}
        <mesh position={[0.15, 0.1, 0.28]}>
          <boxGeometry args={[0.06, 0.07, 0.04]} />
          <meshBasicMaterial color="#1a0a2e" />
        </mesh>
        <mesh position={[-0.13, 0.1, 0.28]}>
          <boxGeometry args={[0.06, 0.07, 0.04]} />
          <meshBasicMaterial color="#1a0a2e" />
        </mesh>
        {/* Eye shine */}
        <mesh position={[0.16, 0.13, 0.295]}>
          <boxGeometry args={[0.025, 0.025, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.12, 0.13, 0.295]}>
          <boxGeometry args={[0.025, 0.025, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Eyebrows */}
        <mesh position={[0.14, 0.18, 0.265]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.13, 0.04, 0.03]} />
          <meshBasicMaterial color="#5a3010" />
        </mesh>
        <mesh position={[-0.14, 0.18, 0.265]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.13, 0.04, 0.03]} />
          <meshBasicMaterial color="#5a3010" />
        </mesh>
        {/* Mouth */}
        <mesh position={[0, -0.1, 0.265]}>
          <boxGeometry args={[0.12, 0.03, 0.03]} />
          <meshBasicMaterial color="#c06050" />
        </mesh>
        {/* Dragon eye glow (tier 3 weapon) */}
        {weaponTier >= 3 && (
          <>
            <mesh position={[0.15, 0.1, 0.29]}>
              <boxGeometry args={[0.06, 0.06, 0.03]} />
              <meshBasicMaterial color="#ff6600" />
            </mesh>
            <mesh position={[-0.13, 0.1, 0.29]}>
              <boxGeometry args={[0.06, 0.06, 0.03]} />
              <meshBasicMaterial color="#ff6600" />
            </mesh>
          </>
        )}

        {/* ── Helmet ─────────────────────────────────────────────────────── */}
        <mesh position={[0, 0.29, 0]} castShadow>
          <boxGeometry args={[0.54, 0.26, 0.54]} />
          <meshStandardMaterial color={helmetColor} roughness={0.55} metalness={0.5} />
        </mesh>
        {/* Cheek guards */}
        <mesh position={[0.27, 0.06, 0.14]} castShadow>
          <boxGeometry args={[0.08, 0.22, 0.28]} />
          <meshStandardMaterial color={helmetColor} roughness={0.55} metalness={0.5} />
        </mesh>
        <mesh position={[-0.27, 0.06, 0.14]} castShadow>
          <boxGeometry args={[0.08, 0.22, 0.28]} />
          <meshStandardMaterial color={helmetColor} roughness={0.55} metalness={0.5} />
        </mesh>
        {/* Visor (tier 2+) */}
        {helmetTier >= 2 && (
          <mesh position={[0, 0.09, 0.28]} castShadow>
            <boxGeometry args={[0.38, 0.1, 0.07]} />
            <meshStandardMaterial color="#0a0a1a" roughness={0.5} metalness={0.7} />
          </mesh>
        )}
        {/* Plume */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.09, helmetTier >= 3 ? 0.4 : 0.26, helmetTier >= 3 ? 0.5 : 0.38]} />
          <meshStandardMaterial
            color={helmetTier >= 3 ? "#f0c000" : helmetTier >= 2 ? "#aaddff" : "#e08800"}
            roughness={0.7}
            emissive={helmetTier >= 3 ? "#886600" : "black"}
            emissiveIntensity={helmetTier >= 3 ? 0.5 : 0}
          />
        </mesh>
        {/* Dragon horns (tier 3) */}
        {helmetTier >= 3 && (
          <>
            <mesh position={[-0.3, 0.36, 0]} rotation={[0, 0, Math.PI/4.5]} castShadow>
              <coneGeometry args={[0.06, 0.32, 5]} />
              <meshStandardMaterial color="#9b59b6" roughness={0.6} metalness={0.4} emissive="#440066" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0.3, 0.36, 0]} rotation={[0, 0, -Math.PI/4.5]} castShadow>
              <coneGeometry args={[0.06, 0.32, 5]} />
              <meshStandardMaterial color="#9b59b6" roughness={0.6} metalness={0.4} emissive="#440066" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
      </group>

      {/* ── Accessory glow ──────────────────────────────────────────────────── */}
      {accessoryItem && (
        <>
          <mesh position={[0, 1.05, 0.24]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color={accessoryItem.tier === 3 ? "#9b59b6" : accessoryItem.tier === 2 ? "#3498db" : "#f39c12"}
              roughness={0.1} metalness={0.8}
              emissive={accessoryItem.tier === 3 ? "#660099" : accessoryItem.tier === 2 ? "#003399" : "#885500"}
              emissiveIntensity={0.9}
            />
          </mesh>
          <pointLight
            position={[0, 1.05, 0.24]}
            color={accessoryItem.tier === 3 ? "#9b59b6" : accessoryItem.tier === 2 ? "#3498db" : "#f39c12"}
            intensity={accessoryItem.tier === 3 ? 1.8 : 0.9}
            distance={3.5} decay={2}
          />
        </>
      )}
    </group>
  );
});

export default Player;
