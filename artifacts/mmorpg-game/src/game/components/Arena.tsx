import { useMemo, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ARENA_SIZE } from "../constants";

const TREE_POSITIONS: [number, number][] = [
  [-13,-12],[11,-14],[-14,8],[13,10],[-8,14],
  [7,-13],[-12,2],[14,-3],[0,14],[-3,-14],
  [10,5],[-9,-7],[5,12],[-14,-5],[12,-8],
];

const ROCK_POSITIONS: [number, number, number][] = [
  [-6,0,-9],[8,0,-7],[-10,0,5],[6,0,9],[-4,0,11],
];

const TORCH_POSITIONS: [number, number, number][] = [
  [-12, 0, -12],[12, 0, -12],[-12, 0, 12],[12, 0, 12],
  [-12, 0, 0],[12, 0, 0],[0, 0, -12],[0, 0, 12],
];

const Arena = memo(function Arena() {
  return (
    <group>
      <ArenaGround />
      <MagicCircle />
      <BorderWalls />
      {TORCH_POSITIONS.map(([x,y,z], i) => <Torch key={i} position={[x,y,z]} />)}
      {TREE_POSITIONS.map(([x,z], i) => <Tree key={i} position={[x,0,z]} />)}
      {ROCK_POSITIONS.map(([x,y,z], i) => <Rock key={i} position={[x,y,z]} />)}
    </group>
  );
});

export default Arena;

function ArenaGround() {
  const stoneColor = "#2a2a3a";
  const accentColor = "#1a0a2e";
  return (
    <group>
      {/* Main dark stone floor */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,0,0]}>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE, 24, 24]} />
        <meshStandardMaterial color={stoneColor} roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Rune tile grid — dark inset tiles */}
      {Array.from({length:6}, (_,row) => row-2.5).map(row =>
        Array.from({length:6}, (_,col) => col-2.5).map(col => (
          <mesh key={`${row},${col}`} rotation={[-Math.PI/2,0,0]} position={[col*4, 0.005, row*4]}>
            <planeGeometry args={[3.4, 3.4]} />
            <meshStandardMaterial color={accentColor} roughness={0.9} metalness={0.05} />
          </mesh>
        ))
      )}
      {/* Border trim — glowing edge */}
      {[[-1,1],[1,1],[1,-1],[-1,-1]].map(([sx,sz], i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[sx*(ARENA_SIZE/2-0.5), 0.01, sz*(ARENA_SIZE/2-0.5)]}>
          <planeGeometry args={[1,1]} />
          <meshBasicMaterial color="#550022" />
        </mesh>
      ))}
    </group>
  );
}

function MagicCircle() {
  const runeRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (runeRef.current) runeRef.current.rotation.y = t * 0.3;
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 2) * 0.12;
    }
  });

  return (
    <group position={[0, 0.02, 0]}>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[7.8, 8.2, 64]} />
        <meshBasicMaterial color="#8800cc" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Mid ring */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[5.3, 5.7, 48]} />
        <meshBasicMaterial color="#aa22ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner glowing disc */}
      <mesh ref={innerRef} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[5.2, 48]} />
        <meshBasicMaterial color="#4400aa" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Rotating rune arms */}
      <group ref={runeRef}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={i} rotation={[-Math.PI/2, 0, rad]} position={[Math.sin(rad)*6.5, 0, Math.cos(rad)*6.5]}>
              <planeGeometry args={[0.25, 2.8]} />
              <meshBasicMaterial color="#cc44ff" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
        {/* Hex vertices glow dots */}
        {[0,60,120,180,240,300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={`d${i}`} rotation={[-Math.PI/2,0,0]} position={[Math.sin(rad)*7.8, 0, Math.cos(rad)*7.8]}>
              <circleGeometry args={[0.35, 12]} />
              <meshBasicMaterial color="#ff44ff" transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>
      {/* Central pentagram */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.8, 1.1, 5, 1]} />
        <meshBasicMaterial color="#ff00aa" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BorderWalls() {
  const half = ARENA_SIZE / 2;
  const wallColor = "#1a0a2e";
  const wallTop = "#2a0a3e";
  return (
    <group>
      {[-1,1].map((s, i) => (
        <>
          {/* Walls */}
          <mesh key={`wx${i}`} position={[s*half, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.6, 3, ARENA_SIZE+0.6]} />
            <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh key={`wz${i}`} position={[0, 1.5, s*half]} castShadow receiveShadow>
            <boxGeometry args={[ARENA_SIZE+0.6, 3, 0.6]} />
            <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Wall tops with glow */}
          <mesh key={`wtx${i}`} position={[s*half, 3.05, 0]}>
            <boxGeometry args={[0.7, 0.15, ARENA_SIZE+0.7]} />
            <meshBasicMaterial color="#440066" />
          </mesh>
          <mesh key={`wtz${i}`} position={[0, 3.05, s*half]}>
            <boxGeometry args={[ARENA_SIZE+0.7, 0.15, 0.7]} />
            <meshBasicMaterial color="#440066" />
          </mesh>
        </>
      ))}
      {/* Corner pillars */}
      {[-1,1].flatMap(sx => [-1,1].map(sz => (
        <group key={`p${sx}${sz}`} position={[sx*half, 0, sz*half]}>
          <mesh position={[0,2,0]} castShadow>
            <boxGeometry args={[1.2,4,1.2]} />
            <meshStandardMaterial color={wallTop} roughness={0.8} metalness={0.2} />
          </mesh>
          {/* Pillar cap */}
          <mesh position={[0,4.15,0]}>
            <boxGeometry args={[1.4,0.3,1.4]} />
            <meshBasicMaterial color="#660088" />
          </mesh>
          {/* Pillar glow */}
          <pointLight position={[0,3.5,0]} color="#9900ff" intensity={3} distance={8} decay={2} />
        </group>
      )))}
    </group>
  );
}

function Torch({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 12 + position[0]) * 0.18;
      flameRef.current.scale.x = 1 + Math.sin(t * 8 + position[2]) * 0.12;
      const mat = flameRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHSL(0.07 + Math.sin(t*6)*0.03, 1, 0.55 + Math.sin(t*9)*0.08);
    }
  });

  return (
    <group position={position}>
      {/* Wall bracket */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 1.6, 6]} />
        <meshStandardMaterial color="#3a2a10" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* Torch bowl */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.22, 8]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 2.95, 0]}>
        <coneGeometry args={[0.13, 0.38, 8]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.92} />
      </mesh>
      {/* Bright point light */}
      <pointLight position={[0, 2.9, 0]} color="#ff7700" intensity={6} distance={12} decay={2} castShadow={false} />
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  const darkened = true; // battle trees look dead/spooky
  return (
    <group position={position}>
      <mesh position={[0,1.5,0]} castShadow>
        <cylinderGeometry args={[0.22,0.35,3,6]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh position={[0,3.2,0]} castShadow>
        <coneGeometry args={[1.3,2,6]} />
        <meshStandardMaterial color={darkened?"#0d2b0d":"#2d6b2d"} roughness={0.85} />
      </mesh>
      <mesh position={[0,4.4,0]} castShadow>
        <coneGeometry args={[0.95,1.7,6]} />
        <meshStandardMaterial color={darkened?"#102e10":"#3a7a3a"} roughness={0.85} />
      </mesh>
      <mesh position={[0,5.4,0]} castShadow>
        <coneGeometry args={[0.6,1.3,6]} />
        <meshStandardMaterial color={darkened?"#143514":"#4a8a4a"} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Rock({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0,0.35,0]} castShadow>
        <dodecahedronGeometry args={[0.65,0]} />
        <meshStandardMaterial color="#444455" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[0.45,0.18,0.22]} castShadow>
        <dodecahedronGeometry args={[0.38,0]} />
        <meshStandardMaterial color="#555566" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}
