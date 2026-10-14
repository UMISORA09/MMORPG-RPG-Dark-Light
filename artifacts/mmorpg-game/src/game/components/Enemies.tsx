import { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../useGameStore";
import type { EnemyState } from "../types";

const Enemies = memo(function Enemies() {
  const enemies = useGameStore((s) => s.enemies);
  return (
    <>
      {enemies.map((e) => e.isAlive && <Enemy key={e.id} enemy={e} />)}
    </>
  );
});

export default Enemies;

function Enemy({ enemy }: { enemy: EnemyState }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(enemy.position);
    const player = useGameStore.getState().player;
    const dir = player.position.clone().sub(enemy.position);
    if (dir.length() > 0.1) {
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
    }
  });

  const isAlert = enemy.state === "chase" || enemy.state === "attack";

  if (enemy.type === "goblin") return <GoblinMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  if (enemy.type === "orc") return <OrcMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  return <SkeletonMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const pct = Math.max(0, health / maxHealth);
  const barColor = pct > 0.6 ? "#00ee44" : pct > 0.3 ? "#ffaa00" : "#ee1111";
  return (
    <group position={[0, 2.4, 0]}>
      {/* BG */}
      <mesh>
        <boxGeometry args={[0.9, 0.12, 0.06]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Fill */}
      <mesh position={[-(0.9*(1-pct))/2, 0, 0.04]}>
        <boxGeometry args={[0.9*pct, 0.12, 0.06]} />
        <meshBasicMaterial color={barColor} />
      </mesh>
      {/* Glow */}
      {pct < 0.3 && <pointLight position={[0,0,0]} color="#ee1111" intensity={1.5} distance={3} decay={2} />}
    </group>
  );
}

function GoblinMesh({ groupRef, enemy, isAlert }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  const bobRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!bobRef.current) return;
    bobRef.current.position.y = Math.sin(state.clock.elapsedTime * 6 + enemy.id) * 0.05;
  });

  const bodyColor = isAlert ? "#b05a20" : "#5a7a18";
  const skinColor = "#7cce30";
  const eyeColor  = isAlert ? "#ff2200" : "#cc0000";

  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      <group ref={bobRef}>
        {/* Body */}
        <mesh position={[0,0.55,0]} castShadow>
          <boxGeometry args={[0.42,0.58,0.32]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Leather vest */}
        <mesh position={[0,0.58,0.17]} castShadow>
          <boxGeometry args={[0.38,0.48,0.05]} />
          <meshStandardMaterial color="#3a2010" roughness={0.9} metalness={0.0} />
        </mesh>
        {/* Head */}
        <mesh position={[0,1.04,0]} castShadow>
          <boxGeometry args={[0.42,0.4,0.4]} />
          <meshStandardMaterial color={skinColor} roughness={0.75} />
        </mesh>
        {/* Pointed ears */}
        <mesh position={[0.23,1.12,0]} rotation={[0,0,-0.4]} castShadow>
          <coneGeometry args={[0.07,0.24,5]} />
          <meshStandardMaterial color={skinColor} roughness={0.8} />
        </mesh>
        <mesh position={[-0.23,1.12,0]} rotation={[0,0,0.4]} castShadow>
          <coneGeometry args={[0.07,0.24,5]} />
          <meshStandardMaterial color={skinColor} roughness={0.8} />
        </mesh>
        {/* Glowing eyes */}
        <mesh position={[0.11,1.08,0.21]}>
          <sphereGeometry args={[0.055,8,8]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
        <mesh position={[-0.11,1.08,0.21]}>
          <sphereGeometry args={[0.055,8,8]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
        {isAlert && <pointLight position={[0,1.08,0.3]} color={eyeColor} intensity={1.2} distance={2.5} decay={2} />}
        {/* Spiked club */}
        <mesh position={[0.36,0.68,0.12]} rotation={[0,0,-0.35]} castShadow>
          <cylinderGeometry args={[0.065,0.11,0.65,6]} />
          <meshStandardMaterial color="#3a2010" roughness={0.85} metalness={0.1} />
        </mesh>
        <mesh position={[0.44,0.85,0.12]} castShadow>
          <boxGeometry args={[0.18,0.18,0.14]} />
          <meshStandardMaterial color="#666" roughness={0.6} metalness={0.5} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.12,0.2,0]} castShadow>
          <boxGeometry args={[0.17,0.4,0.24]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        <mesh position={[0.12,0.2,0]} castShadow>
          <boxGeometry args={[0.17,0.4,0.24]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        {/* Belt */}
        <mesh position={[0,0.38,0.17]}>
          <boxGeometry args={[0.4,0.08,0.05]} />
          <meshStandardMaterial color="#8B6914" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function OrcMesh({ groupRef, enemy, isAlert }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  const breathRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!breathRef.current) return;
    breathRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2.5 + enemy.id) * 0.03;
    breathRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 2.5 + enemy.id) * 0.03;
  });

  const bodyColor = isAlert ? "#3d7a3d" : "#2a5a2a";
  const skinColor = "#4a9a4a";
  const eyeColor  = isAlert ? "#ff1100" : "#dd2200";
  const armorColor = isAlert ? "#999" : "#777";

  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      {/* Hulking body */}
      <mesh ref={breathRef} position={[0,0.85,0]} castShadow>
        <boxGeometry args={[0.78,1.05,0.58]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Metal chest plate */}
      <mesh position={[0,0.9,0.3]} castShadow>
        <boxGeometry args={[0.7,0.82,0.07]} />
        <meshStandardMaterial color={armorColor} roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Rivets */}
      {[[-0.25,1.1],[-0.25,0.7],[0.25,1.1],[0.25,0.7]].map(([px,py],i)=>(
        <mesh key={i} position={[px,py,0.35]}>
          <sphereGeometry args={[0.04,6,6]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.4} metalness={0.9} />
        </mesh>
      ))}
      {/* Head */}
      <mesh position={[0,1.62,0]} castShadow>
        <boxGeometry args={[0.64,0.58,0.58]} />
        <meshStandardMaterial color={skinColor} roughness={0.75} />
      </mesh>
      {/* Jaw ridge */}
      <mesh position={[0,1.34,0.16]} castShadow>
        <boxGeometry args={[0.52,0.12,0.38]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} />
      </mesh>
      {/* Tusks */}
      <mesh position={[0.16,1.3,0.3]} rotation={[0.3,0,0.1]} castShadow>
        <coneGeometry args={[0.045,0.26,5]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.6} />
      </mesh>
      <mesh position={[-0.16,1.3,0.3]} rotation={[0.3,0,-0.1]} castShadow>
        <coneGeometry args={[0.045,0.26,5]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.6} />
      </mesh>
      {/* Glowing eyes */}
      <mesh position={[0.17,1.66,0.3]}>
        <sphereGeometry args={[0.08,8,8]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh position={[-0.17,1.66,0.3]}>
        <sphereGeometry args={[0.08,8,8]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      {isAlert && <pointLight position={[0,1.66,0.4]} color="#ff2200" intensity={2} distance={4} decay={2} />}
      {/* Massive arms */}
      <mesh position={[-0.6,0.88,0]} castShadow>
        <boxGeometry args={[0.34,0.85,0.36]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.6,0.88,0]} castShadow>
        <boxGeometry args={[0.34,0.85,0.36]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      {/* War axe */}
      <mesh position={[0.8,0.62,0.12]} rotation={[0,0,-0.5]} castShadow>
        <cylinderGeometry args={[0.055,0.055,0.9,6]} />
        <meshStandardMaterial color="#3a2010" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.96,0.96,0.12]} rotation={[0,0,-0.5]} castShadow>
        <boxGeometry args={[0.32,0.44,0.08]} />
        <meshStandardMaterial color="#aaa" roughness={0.4} metalness={0.8} emissive="#334" emissiveIntensity={0.3} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.22,0.24,0]} castShadow>
        <boxGeometry args={[0.3,0.5,0.38]} />
        <meshStandardMaterial color="#2a3a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0.22,0.24,0]} castShadow>
        <boxGeometry args={[0.3,0.5,0.38]} />
        <meshStandardMaterial color="#2a3a2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SkeletonMesh({ groupRef, enemy, isAlert }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  const floatRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!floatRef.current) return;
    floatRef.current.position.y = Math.sin(state.clock.elapsedTime * 3 + enemy.id * 1.5) * 0.06;
  });

  const boneColor = "#e8e0c0";
  const eyeColor  = isAlert ? "#ff8800" : "#ee6600";
  const glowColor = isAlert ? "#ff6600" : "#884400";

  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      <group ref={floatRef}>
        {/* Ribcage body */}
        <mesh position={[0,0.72,0]} castShadow>
          <boxGeometry args={[0.44,0.72,0.24]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} emissive={isAlert?"#221100":"#000"} emissiveIntensity={0.2} />
        </mesh>
        {/* Ribs */}
        {[-0.22,0,0.22].map((y,i)=>(
          <mesh key={i} position={[0,0.72+y,0.13]}>
            <boxGeometry args={[0.4,0.08,0.06]} />
            <meshStandardMaterial color="#c0c098" roughness={0.8} />
          </mesh>
        ))}
        {/* Spine glow */}
        <mesh position={[0,0.72,-0.05]}>
          <boxGeometry args={[0.06,0.6,0.05]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.7} />
        </mesh>
        {/* Skull */}
        <mesh position={[0,1.35,0]} castShadow>
          <boxGeometry args={[0.4,0.42,0.4]} />
          <meshStandardMaterial color="#fffff0" roughness={0.65} emissive={isAlert?"#331100":"#000"} emissiveIntensity={0.15} />
        </mesh>
        {/* Cheekbones */}
        <mesh position={[0.2,1.28,0.18]} castShadow>
          <boxGeometry args={[0.12,0.1,0.15]} />
          <meshStandardMaterial color="#eeeedd" roughness={0.7} />
        </mesh>
        <mesh position={[-0.2,1.28,0.18]} castShadow>
          <boxGeometry args={[0.12,0.1,0.15]} />
          <meshStandardMaterial color="#eeeedd" roughness={0.7} />
        </mesh>
        {/* Glowing eye sockets */}
        <mesh position={[0.12,1.4,0.21]}>
          <sphereGeometry args={[0.075,8,8]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
        <mesh position={[-0.12,1.4,0.21]}>
          <sphereGeometry args={[0.075,8,8]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
        <pointLight position={[0,1.4,0.3]} color={glowColor} intensity={isAlert?2.5:1.2} distance={4} decay={2} />
        {/* Jaw */}
        <mesh position={[0,1.15,0.1]} castShadow>
          <boxGeometry args={[0.32,0.1,0.26]} />
          <meshStandardMaterial color="#fffff0" roughness={0.65} />
        </mesh>
        {/* Bone arms */}
        <mesh position={[-0.34,0.78,0]} castShadow>
          <cylinderGeometry args={[0.055,0.055,0.68,5]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.34,0.78,0]} castShadow>
          <cylinderGeometry args={[0.055,0.055,0.68,5]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} />
        </mesh>
        {/* Scythe */}
        <mesh position={[0.48,0.55,0.12]} rotation={[0,0,-0.4]} castShadow>
          <cylinderGeometry args={[0.04,0.04,0.95,5]} />
          <meshStandardMaterial color="#2a1a08" roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh position={[0.65,1.05,0.12]} rotation={[0,0,Math.PI/4]} castShadow>
          <boxGeometry args={[0.09,0.5,0.05]} />
          <meshStandardMaterial color="#c8c8c8" roughness={0.3} metalness={0.85} emissive="#335" emissiveIntensity={0.4} />
        </mesh>
        {/* Robe tatter */}
        <mesh position={[0,0.35,0]} castShadow>
          <boxGeometry args={[0.42,0.2,0.22]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.95} />
        </mesh>
        {/* Bone legs */}
        <mesh position={[-0.12,0.22,0]} castShadow>
          <cylinderGeometry args={[0.075,0.075,0.46,5]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.12,0.22,0]} castShadow>
          <cylinderGeometry args={[0.075,0.075,0.46,5]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
