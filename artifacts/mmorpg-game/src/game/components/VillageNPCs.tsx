import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RemotePlayer } from "../types";

// ── NPC route definitions (pre-computed, not random in render) ─────────────────
interface NPCDef {
  id: number;
  name: string;
  color: string;
  skinColor: string;
  outfit: string;
  waypoints: [number, number][];
  speed: number;
  phase: number;
}

const NPC_DEFS: NPCDef[] = [
  {
    id: 1, name: "Guard", color: "#6688aa", skinColor: "#f5c89a", outfit: "#557799",
    waypoints: [[-1, -22], [1, -22], [1, -28], [-1, -28]],
    speed: 1.2, phase: 0,
  },
  {
    id: 2, name: "Guard", color: "#6688aa", skinColor: "#e8a070", outfit: "#557799",
    waypoints: [[2, -24], [-2, -24], [-2, -29], [2, -29]],
    speed: 1.1, phase: 0.5,
  },
  {
    id: 3, name: "Elder Mage", color: "#9b59b6", skinColor: "#f0d0a0", outfit: "#7b1fa2",
    waypoints: [[-4, -12], [0, -10], [4, -12], [0, -8]],
    speed: 0.6, phase: 0.2,
  },
  {
    id: 4, name: "Merchant", color: "#c0392b", skinColor: "#f5c89a", outfit: "#922b21",
    waypoints: [[-1, -12], [1, -12], [1, -11], [-1, -11]],
    speed: 0.4, phase: 0.7,
  },
  {
    id: 5, name: "Villager", color: "#27ae60", skinColor: "#f0c89a", outfit: "#1e8449",
    waypoints: [[-6, 4], [6, 4], [6, 8], [-6, 8]],
    speed: 0.9, phase: 0.1,
  },
  {
    id: 6, name: "Villager", color: "#e67e22", skinColor: "#f5c8b0", outfit: "#d35400",
    waypoints: [[4, 10], [-4, 10], [-4, 14], [4, 14]],
    speed: 0.8, phase: 0.4,
  },
  {
    id: 7, name: "Bard", color: "#f39c12", skinColor: "#f8d8a0", outfit: "#d68910",
    waypoints: [[-2, 2], [2, 2], [2, -2], [-2, -2]],
    speed: 1.0, phase: 0.9,
  },
];

// ── Demo remote players (future multiplayer stubs) ─────────────────────────────
const DEMO_PLAYERS: RemotePlayer[] = [
  {
    id: "player-hanzo",
    name: "Hanzo",
    colorHex: "#2980b9",
    position: new THREE.Vector3(-5, 0, 2),
    facingDirection: 0,
    isOnline: true,
  },
  {
    id: "player-silver",
    name: "SilverBlade",
    colorHex: "#27ae60",
    position: new THREE.Vector3(5, 0, -8),
    facingDirection: Math.PI,
    isOnline: true,
  },
  {
    id: "player-ryuko",
    name: "Ryuko",
    colorHex: "#8e44ad",
    position: new THREE.Vector3(0, 0, 6),
    facingDirection: Math.PI / 2,
    isOnline: true,
  },
];

// waypoints for demo players
const PLAYER_ROUTES: [number, number][][] = [
  [[-5, 2], [-8, -2], [-5, -8], [-2, -5], [-5, 2]],
  [[5, -8], [8, -2], [5, 4], [2, -4], [5, -8]],
  [[0, 6], [4, 2], [0, -4], [-4, 2], [0, 6]],
];

export default function VillageNPCs() {
  return (
    <>
      {NPC_DEFS.map((npc) => <NPC key={npc.id} def={npc} />)}
      {DEMO_PLAYERS.map((p, i) => <DemoPlayer key={p.id} player={p} routeIdx={i} />)}
    </>
  );
}

// ── NPC ────────────────────────────────────────────────────────────────────────
function NPC({ def }: { def: NPCDef }) {
  const groupRef = useRef<THREE.Group>(null);
  const wpIdx = useRef(0);
  const progress = useRef(def.phase);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const wps = def.waypoints;
    const cur = wps[wpIdx.current];
    const nxt = wps[(wpIdx.current + 1) % wps.length];
    const dx = nxt[0] - cur[0];
    const dz = nxt[1] - cur[1];
    const segLen = Math.sqrt(dx * dx + dz * dz);

    progress.current += (def.speed / segLen) * delta;
    if (progress.current >= 1) {
      progress.current -= 1;
      wpIdx.current = (wpIdx.current + 1) % wps.length;
    }

    const p = progress.current;
    const x = cur[0] + dx * p;
    const z = cur[1] + dz * p;
    groupRef.current.position.set(x, 0, z);
    if (Math.abs(dx) + Math.abs(dz) > 0.01) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group ref={groupRef}>
      <NPCBody color={def.outfit} skinColor={def.skinColor} />
      <NameTag name={def.name} color={def.color} y={2.6} />
    </group>
  );
}

// ── Demo remote player ─────────────────────────────────────────────────────────
function DemoPlayer({ player, routeIdx }: { player: RemotePlayer; routeIdx: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const wpIdx = useRef(0);
  const progress = useRef(routeIdx * 0.33);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const route = PLAYER_ROUTES[routeIdx];
    const cur = route[wpIdx.current];
    const nxt = route[(wpIdx.current + 1) % route.length];
    const dx = nxt[0] - cur[0];
    const dz = nxt[1] - cur[1];
    const segLen = Math.sqrt(dx * dx + dz * dz) || 1;

    progress.current += (1.5 / segLen) * delta;
    if (progress.current >= 1) {
      progress.current -= 1;
      wpIdx.current = (wpIdx.current + 1) % route.length;
    }
    const p = progress.current;
    const x = cur[0] + dx * p;
    const z = cur[1] + dz * p;
    groupRef.current.position.set(x, 0, z);
    if (Math.abs(dx) + Math.abs(dz) > 0.01) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group ref={groupRef}>
      <PlayerBody colorHex={player.colorHex} />
      <NameTag name={player.name} color={player.colorHex} y={2.9} online />
    </group>
  );
}

// ── NPC body ───────────────────────────────────────────────────────────────────
function NPCBody({ color, skinColor }: { color: string; skinColor: string }) {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.46, 0.7, 0.3]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      {/* Eyes */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 1.34, 0.22]}>
          <boxGeometry args={[0.07, 0.06, 0.04]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
      ))}
      {/* Arms */}
      {[-0.34, 0.34].map((x, i) => (
        <mesh key={i} position={[x, 0.76, 0]} castShadow>
          <boxGeometry args={[0.18, 0.55, 0.2]} />
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
      {/* Legs */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.24]} />
          <meshLambertMaterial color="#2c3e50" />
        </mesh>
      ))}
    </group>
  );
}

// ── Player body (for remote players) ──────────────────────────────────────────
function PlayerBody({ colorHex }: { colorHex: string }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.55, 0.8, 0.35]} />
        <meshLambertMaterial color={colorHex} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial color="#f5c89a" />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.63, 0]} castShadow>
        <boxGeometry args={[0.52, 0.2, 0.52]} />
        <meshLambertMaterial color={colorHex} />
      </mesh>
      {/* Arms */}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]} castShadow>
          <boxGeometry args={[0.2, 0.65, 0.25]} />
          <meshLambertMaterial color={colorHex} />
        </mesh>
      ))}
      {/* Legs */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0]} castShadow>
          <boxGeometry args={[0.22, 0.4, 0.28]} />
          <meshLambertMaterial color="#2c3e50" />
        </mesh>
      ))}
    </group>
  );
}

// ── Name tag (billboard always faces camera) ───────────────────────────────────
function NameTag({ name, color, y, online }: { name: string; color: string; y: number; online?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={ref} position={[0, y, 0]}>
      {/* Background plane */}
      <mesh>
        <planeGeometry args={[name.length * 0.13 + 0.3, 0.32]} />
        <meshBasicMaterial color="rgba(0,0,0,0.0)" transparent opacity={0} />
      </mesh>
    </group>
  );
}
