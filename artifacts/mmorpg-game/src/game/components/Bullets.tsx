import { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../useGameStore";
import type { BulletState } from "../types";

const Bullets = memo(function Bullets() {
  const bullets = useGameStore((s) => s.bullets);
  return (
    <>
      {bullets.map((b) => (
        b.fromPlayer
          ? <PlayerBullet key={b.id} bullet={b} />
          : <EnemyBullet key={b.id} bullet={b} />
      ))}
    </>
  );
});

export default Bullets;

// ── Player bullet — fireball / magic orb ──────────────────────────────────────
function PlayerBullet({ bullet }: { bullet: BulletState }) {
  const groupRef  = useRef<THREE.Group>(null);
  const coreRef   = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Mesh>(null);
  const outerRef  = useRef<THREE.Mesh>(null);
  const trailRef  = useRef<THREE.Group>(null);
  const spawnTime = useRef(performance.now());

  // Is it an inferno (high damage)?  detect by lifetime — inferno bullets move slower
  // We use a simple heuristic: large bullet speed or damage
  const isInferno = bullet.damage > 8; // inferno is 3x magic damage

  const coreColor  = isInferno ? "#ffdd00" : "#88ddff";
  const midColor   = isInferno ? "#ff8800" : "#4488ff";
  const outerColor = isInferno ? "#ff3300" : "#0044cc";
  const lightColor = isInferno ? "#ff6600" : "#2266ff";
  const baseSize   = isInferno ? 0.28 : 0.18;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(bullet.position);

    const t = state.clock.elapsedTime;
    const age = (performance.now() - spawnTime.current) / 1000;

    // Core pulse
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * (isInferno ? 18 : 22)) * 0.15;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y += 0.08;
      coreRef.current.rotation.x += 0.05;
    }

    // Spinning ring
    if (ringRef.current) {
      ringRef.current.rotation.z += isInferno ? 0.1 : 0.14;
      ringRef.current.rotation.x += 0.06;
    }

    // Outer glow pulse (opposite phase)
    if (outerRef.current) {
      const pulse = 1 + Math.sin(t * (isInferno ? 14 : 18) + Math.PI) * 0.2;
      outerRef.current.scale.setScalar(pulse);
    }

    // Trail fade
    if (trailRef.current) {
      trailRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat  = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, (0.4 - i * 0.1) * (1 - age * 2));
        mesh.scale.setScalar(1 - i * 0.18);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Trail ghosts — behind the bullet */}
      <group ref={trailRef}>
        {[0.3, 0.6, 0.9, 1.2].map((dist, i) => {
          const dir = bullet.velocity.clone().normalize();
          const trailPos = dir.multiplyScalar(-dist);
          return (
            <mesh key={i} position={[trailPos.x, trailPos.y, trailPos.z]}>
              <sphereGeometry args={[baseSize * (1 - i * 0.18), 6, 6]} />
              <meshBasicMaterial color={midColor} transparent opacity={0.3 - i * 0.07} />
            </mesh>
          );
        })}
      </group>

      {/* Outer glow disc */}
      <mesh ref={outerRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseSize * 1.2, baseSize * 2.4, 24]} />
        <meshBasicMaterial color={outerColor} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Spinning ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[baseSize * 1.5, baseSize * 0.18, 6, 20]} />
        <meshBasicMaterial color={midColor} transparent opacity={0.8} />
      </mesh>

      {/* Inner bright core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[baseSize, 1]} />
        <meshBasicMaterial color={coreColor} />
      </mesh>

      {/* White hot center */}
      <mesh>
        <sphereGeometry args={[baseSize * 0.45, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Point light for environment illumination */}
      <pointLight
        color={lightColor}
        intensity={isInferno ? 12 : 6}
        distance={isInferno ? 8 : 5}
        decay={2}
      />

      {/* Inferno: extra flame rings */}
      {isInferno && (
        <>
          <mesh rotation={[0.6, 0, 0]}>
            <torusGeometry args={[baseSize * 2.2, baseSize * 0.12, 5, 20]} />
            <meshBasicMaterial color="#ff4400" transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[0, 0.8, 0.4]}>
            <torusGeometry args={[baseSize * 1.9, baseSize * 0.1, 5, 20]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ── Enemy bullet — dark curse orb ─────────────────────────────────────────────
function EnemyBullet({ bullet }: { bullet: BulletState }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef  = useRef<THREE.Mesh>(null);
  const spikeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(bullet.position);
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.x += 0.12;
      coreRef.current.rotation.y += 0.09;
    }
    if (spikeRef.current) {
      spikeRef.current.rotation.x -= 0.07;
      spikeRef.current.rotation.z += 0.1;
      const pulse = 1 + Math.sin(t * 16) * 0.12;
      spikeRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dark core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#1a0030" roughness={0.3} metalness={0.8} emissive="#440000" emissiveIntensity={0.6} />
      </mesh>
      {/* Spike burst */}
      <mesh ref={spikeRef}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshBasicMaterial color="#cc0000" transparent opacity={0.55} wireframe />
      </mesh>
      {/* Red glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.34, 12]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Dim red light */}
      <pointLight color="#cc0000" intensity={4} distance={4} decay={2} />
    </group>
  );
}
