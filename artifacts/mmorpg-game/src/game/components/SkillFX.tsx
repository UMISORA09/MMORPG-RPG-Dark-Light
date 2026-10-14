/**
 * SkillFX — visual effects that play on the player when using skills/attacking.
 * Detects rising edge of `isAttacking`, spawns timed effects based on learnedSkills.
 * Rendered inside the R3F Canvas as a sibling of Player.
 */
import { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../useGameStore";

interface Effect {
  type: "swing" | "triple" | "dragon_fury" | "inferno_cast";
  timer: number;
  maxTimer: number;
  phase: number; // internal sub-phase counter
}

const SkillFX = memo(function SkillFX() {
  const prevAttacking = useRef(false);
  const effects       = useRef<Effect[]>([]);

  // Persistent mesh refs for reuse
  const swingRingRef    = useRef<THREE.Mesh>(null);
  const swing2RingRef   = useRef<THREE.Mesh>(null);
  const swing3RingRef   = useRef<THREE.Mesh>(null);
  const furyRingRef     = useRef<THREE.Mesh>(null);
  const furyRing2Ref    = useRef<THREE.Mesh>(null);
  const furyHexRef      = useRef<THREE.Group>(null);
  const infernoBurstRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const { player } = useGameStore.getState();
    const pos = player.position;
    const skills = player.learnedSkills;
    const isAttacking = player.isAttacking;

    // Rising edge — new attack
    if (isAttacking && !prevAttacking.current) {
      const isShoot  = false; // melee only here; bullets handle shoot FX
      const hasFury  = skills.includes("dragon_fury");
      const hasTriple = skills.includes("triple_strike");

      if (hasFury) {
        effects.current.push({ type: "dragon_fury", timer: 1.2, maxTimer: 1.2, phase: 0 });
      } else if (hasTriple) {
        effects.current.push({ type: "triple", timer: 0.55, maxTimer: 0.55, phase: 0 });
      } else {
        effects.current.push({ type: "swing", timer: 0.38, maxTimer: 0.38, phase: 0 });
      }
    }
    prevAttacking.current = isAttacking;

    // Decay effects
    effects.current = effects.current
      .map(e => ({ ...e, timer: e.timer - delta }))
      .filter(e => e.timer > 0);

    const activeTypes = new Set(effects.current.map(e => e.type));

    // ── Base swing ring ──────────────────────────────────────────────────────
    if (swingRingRef.current) {
      const swingEffect = effects.current.find(e => e.type === "swing");
      if (swingEffect) {
        const p = 1 - swingEffect.timer / swingEffect.maxTimer;
        const scale = 0.4 + p * 3.5;
        swingRingRef.current.scale.setScalar(scale);
        swingRingRef.current.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0));
        swingRingRef.current.rotation.x = Math.PI / 2 + p * 0.5;
        const mat = swingRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, (1 - p) * 0.8);
        swingRingRef.current.visible = true;
      } else {
        swingRingRef.current.visible = false;
      }
    }

    // ── Triple strike — 3 sequential arc rings ───────────────────────────────
    const tripleEffect = effects.current.find(e => e.type === "triple");
    const rings = [swingRingRef, swing2RingRef, swing3RingRef];

    if (tripleEffect) {
      const totalP = 1 - tripleEffect.timer / tripleEffect.maxTimer;
      [0, 1, 2].forEach((i) => {
        const ref = rings[i];
        if (!ref.current) return;
        const startP = i / 3;
        const endP   = (i + 1) / 3;
        if (totalP < startP || totalP > endP + 0.25) {
          ref.current.visible = false;
          return;
        }
        const localP = Math.min(1, (totalP - startP) / (endP - startP));
        const scale = 0.3 + localP * 2.8;
        ref.current.scale.setScalar(scale);
        const angle = (i * Math.PI * 2) / 3;
        ref.current.position
          .copy(pos)
          .add(new THREE.Vector3(Math.sin(angle) * 0.3, 0.9, Math.cos(angle) * 0.3));
        ref.current.rotation.set(Math.PI / 2, 0, angle);
        const mat = ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, (1 - localP) * 0.85);
        ref.current.visible = true;
      });
    } else {
      rings.forEach(r => { if (r.current) r.current.visible = false; });
    }

    // ── Dragon Fury — spinning hex energy ring ───────────────────────────────
    const furyEffect = effects.current.find(e => e.type === "dragon_fury");
    if (furyRingRef.current && furyRing2Ref.current && furyHexRef.current) {
      if (furyEffect) {
        const p = 1 - furyEffect.timer / furyEffect.maxTimer;
        const basePos = pos.clone().add(new THREE.Vector3(0, 0.5, 0));

        furyRingRef.current.visible = true;
        furyRingRef.current.position.copy(basePos);
        furyRingRef.current.rotation.y += delta * 4;
        const scaleIn = Math.min(1, p * 4);
        const scaleOut = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
        furyRingRef.current.scale.setScalar(scaleIn * scaleOut * 3.5);
        const mat1 = furyRingRef.current.material as THREE.MeshBasicMaterial;
        mat1.opacity = scaleIn * scaleOut * 0.85;

        furyRing2Ref.current.visible = true;
        furyRing2Ref.current.position.copy(basePos);
        furyRing2Ref.current.rotation.y -= delta * 2.5;
        furyRing2Ref.current.rotation.x = Math.PI / 3 + p * 0.4;
        furyRing2Ref.current.scale.setScalar(scaleIn * scaleOut * 2.8);
        const mat2 = furyRing2Ref.current.material as THREE.MeshBasicMaterial;
        mat2.opacity = scaleIn * scaleOut * 0.55;

        furyHexRef.current.visible = true;
        furyHexRef.current.position.copy(basePos);
        furyHexRef.current.rotation.y += delta * 6;
        furyHexRef.current.scale.setScalar(scaleIn * scaleOut);

        // Spawn particle explosion-style on first frame
      } else {
        furyRingRef.current.visible = false;
        furyRing2Ref.current.visible = false;
        furyHexRef.current.visible = false;
      }
    }

    // ── Inferno cast burst ───────────────────────────────────────────────────
    if (infernoBurstRef.current) {
      const burnEffect = effects.current.find(e => e.type === "inferno_cast");
      if (burnEffect) {
        const p = 1 - burnEffect.timer / burnEffect.maxTimer;
        infernoBurstRef.current.visible = true;
        infernoBurstRef.current.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0));
        infernoBurstRef.current.scale.setScalar(1 + p * 3);
        const mat = infernoBurstRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, (1 - p) * 0.7);
      } else {
        infernoBurstRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* Base swing ring */}
      <mesh ref={swingRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.15, 32]} />
        <meshBasicMaterial color="#ffee44" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Triple strike rings (3 separate) */}
      <mesh ref={swing2RingRef} visible={false}>
        <ringGeometry args={[0.85, 1.08, 24]} />
        <meshBasicMaterial color="#ff8822" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={swing3RingRef} visible={false}>
        <ringGeometry args={[0.85, 1.08, 24]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Dragon fury outer ring */}
      <mesh ref={furyRingRef} visible={false}>
        <torusGeometry args={[1, 0.08, 6, 48]} />
        <meshBasicMaterial color="#aa44ff" transparent opacity={0} />
      </mesh>
      {/* Dragon fury inner tilted ring */}
      <mesh ref={furyRing2Ref} visible={false}>
        <torusGeometry args={[0.75, 0.06, 6, 36]} />
        <meshBasicMaterial color="#ff44aa" transparent opacity={0} />
      </mesh>

      {/* Dragon fury hex arm group */}
      <group ref={furyHexRef} visible={false}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <group key={i}>
              {/* Arm ray */}
              <mesh
                position={[Math.sin(rad) * 2.2, 0, Math.cos(rad) * 2.2]}
                rotation={[0, rad, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.04, 0.02, 1.6, 5]} />
                <meshBasicMaterial color="#cc88ff" />
              </mesh>
              {/* Tip gem */}
              <mesh position={[Math.sin(rad) * 3.2, 0, Math.cos(rad) * 3.2]}>
                <octahedronGeometry args={[0.18, 0]} />
                <meshBasicMaterial color="#ff44ff" />
              </mesh>
            </group>
          );
        })}
        {/* Center energy core */}
        <mesh>
          <icosahedronGeometry args={[0.35, 1]} />
          <meshBasicMaterial color="#cc00ff" transparent opacity={0.7} />
        </mesh>
        <pointLight color="#aa00ff" intensity={8} distance={8} decay={2} />
      </group>

      {/* Inferno cast burst */}
      <mesh ref={infernoBurstRef} visible={false}>
        <ringGeometry args={[0.5, 1.2, 20]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});

export default SkillFX;
