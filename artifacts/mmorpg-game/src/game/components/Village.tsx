import { useMemo, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VILLAGE_SIZE, PORTAL_POSITION } from "../constants";

// ── Pre-computed layout data (never in render) ────────────────────────────────
const PERIMETER_TREES = (() => {
  const pts: [number, number][] = [];
  const half = VILLAGE_SIZE / 2 - 2;
  const step = 6;
  for (let i = -half; i <= half; i += step) {
    pts.push([i, -half], [i, half], [-half, i], [half, i]);
  }
  // thin out duplicates at corners & add variety
  return pts.filter((_, idx) => idx % 2 === 0).slice(0, 48);
})();

const INTERIOR_TREES: [number, number][] = [
  [-18, -10], [18, -10], [-20, 6], [20, 6],
  [-16, 16], [16, 16], [-5, 20], [5, 20],
];

const LANTERNS: [number, number][] = [
  [-4, -2], [4, -2], [-4, 6], [4, 6],
  [-10, -8], [10, -8], [0, -14],
];

const BARRELS: [number, number, number][] = [
  [-9.5, 0, -5.5], [9.5, 0, -5.5], [-9.5, 0, -7],
  [6.5, 0, -12.5], [-6.5, 0, -12.5],
];

const Village = memo(function Village() {
  return (
    <group>
      <Ground />
      <Paths />
      <Buildings />
      <PortalEntrance />
      {PERIMETER_TREES.map(([x, z], i) => <Tree key={`pt${i}`} position={[x, 0, z]} scale={1 + (i % 3) * 0.15} />)}
      {INTERIOR_TREES.map(([x, z], i) => <Tree key={`it${i}`} position={[x, 0, z]} scale={0.9} />)}
      {LANTERNS.map(([x, z], i) => <Lantern key={i} position={[x, 0, z]} />)}
      {BARRELS.map(([x, y, z], i) => <Barrel key={i} position={[x, y, z]} />)}
      <Well />
      <FountainParticles />
    </group>
  );
});

export default Village;

// ── Ground ────────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <group>
      {/* Main grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[VILLAGE_SIZE, VILLAGE_SIZE, 1, 1]} />
        <meshLambertMaterial color="#5a8a3a" />
      </mesh>
    </group>
  );
}

// ── Stone paths ───────────────────────────────────────────────────────────────
function Paths() {
  return (
    <group>
      {/* N-S main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]}>
        <planeGeometry args={[5, 40]} />
        <meshLambertMaterial color="#9e9080" />
      </mesh>
      {/* E-W cross road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]}>
        <planeGeometry args={[40, 5]} />
        <meshLambertMaterial color="#9e9080" />
      </mesh>
      {/* Central plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[7, 12]} />
        <meshLambertMaterial color="#b0a090" />
      </mesh>
      {/* Plaza inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <ringGeometry args={[5.5, 7, 12]} />
        <meshLambertMaterial color="#8a7a6a" />
      </mesh>
      {/* Portal path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -19]}>
        <planeGeometry args={[6, 10]} />
        <meshLambertMaterial color="#7a6a5a" />
      </mesh>
    </group>
  );
}

// ── Buildings ─────────────────────────────────────────────────────────────────
function Buildings() {
  return (
    <group>
      <Inn />
      <Blacksmith />
      <Shop />
      <House position={[-14, 0, 5]} rotation={0.1} />
      <House position={[14, 0, 5]} rotation={-0.1} />
      <House position={[-10, 0, 16]} rotation={0.2} />
      <House position={[10, 0, 16]} rotation={-0.15} />
      <TavernSign />
    </group>
  );
}

function Inn() {
  return (
    <group position={[-9, 0, -7]}>
      {/* Main building */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 7]} />
        <meshLambertMaterial color="#c8a06a" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <boxGeometry args={[9, 1.6, 8]} />
        <meshLambertMaterial color="#7a3a1a" />
      </mesh>
      <mesh position={[0, 5.6, 0]} castShadow>
        <boxGeometry args={[7, 1, 6]} />
        <meshLambertMaterial color="#8a4a2a" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.9, 3.52]} castShadow>
        <boxGeometry args={[1.2, 1.8, 0.1]} />
        <meshLambertMaterial color="#5c3d1e" />
      </mesh>
      {/* Windows */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 2.2, 3.52]}>
          <boxGeometry args={[1.2, 1, 0.1]} />
          <meshLambertMaterial color="#aaddff" />
        </mesh>
      ))}
      {/* Sign */}
      <mesh position={[0, 4, 3.6]} castShadow>
        <boxGeometry args={[2.5, 0.6, 0.15]} />
        <meshLambertMaterial color="#5c3d1e" />
      </mesh>
      {/* Chimney */}
      <mesh position={[2.5, 5.5, -1]} castShadow>
        <boxGeometry args={[0.7, 2, 0.7]} />
        <meshLambertMaterial color="#888" />
      </mesh>
    </group>
  );
}

function Blacksmith() {
  return (
    <group position={[9, 0, -7]}>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 4, 6]} />
        <meshLambertMaterial color="#888880" />
      </mesh>
      {/* Slanted roof */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[8, 1.2, 7]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      {/* Forge glow */}
      <pointLight position={[0, 1.5, 0]} color="#ff6600" intensity={2} distance={6} decay={2} />
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshLambertMaterial color="#333" emissive="#442200" emissiveIntensity={1} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1, 3.05]} castShadow>
        <boxGeometry args={[1.5, 2, 0.12]} />
        <meshLambertMaterial color="#3a2a10" />
      </mesh>
      {/* Chimney */}
      <mesh position={[-2, 5.5, 0]} castShadow>
        <boxGeometry args={[0.8, 2.5, 0.8]} />
        <meshLambertMaterial color="#555" />
      </mesh>
    </group>
  );
}

function Shop() {
  return (
    <group position={[0, 0, -14]}>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 6]} />
        <meshLambertMaterial color="#c8b08a" />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 2.5, 3.3]} castShadow>
        <boxGeometry args={[8.5, 0.2, 2]} />
        <meshLambertMaterial color="#c03020" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[9, 1.5, 7]} />
        <meshLambertMaterial color="#8b4513" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1, 3.06]} castShadow>
        <boxGeometry args={[1.3, 2, 0.1]} />
        <meshLambertMaterial color="#6b3d1e" />
      </mesh>
      {/* Windows */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 2.2, 3.06]}>
          <boxGeometry args={[1.4, 1.2, 0.1]} />
          <meshLambertMaterial color="#cceeaa" />
        </mesh>
      ))}
    </group>
  );
}

function House({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 3, 5]} />
        <meshLambertMaterial color="#d4b896" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[6.2, 1.4, 5.8]} />
        <meshLambertMaterial color="#7a3a1a" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.85, 2.52]} castShadow>
        <boxGeometry args={[1, 1.7, 0.1]} />
        <meshLambertMaterial color="#5c3d1e" />
      </mesh>
      {/* Window */}
      <mesh position={[1.8, 1.8, 2.52]}>
        <boxGeometry args={[0.9, 0.8, 0.08]} />
        <meshLambertMaterial color="#aaddff" />
      </mesh>
    </group>
  );
}

function TavernSign() {
  return (
    <group position={[-9, 0, -2.5]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.5, 5]} />
        <meshLambertMaterial color="#5c3d1e" />
      </mesh>
      <mesh position={[0.9, 3.2, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 0.12]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

// ── Portal / Dungeon Entrance ─────────────────────────────────────────────────
function PortalEntrance() {
  const portalGlowRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (portalGlowRef.current) {
      portalGlowRef.current.intensity = 2.5 + Math.sin(t * 2) * 0.8;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.012;
    }
  });

  const px = PORTAL_POSITION.x;
  const pz = PORTAL_POSITION.z;

  return (
    <group position={[px, 0, pz]}>
      {/* Stone arch base pillars */}
      {[-2, 2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 2.5, 0]} castShadow>
            <boxGeometry args={[1, 5, 1]} />
            <meshLambertMaterial color="#666" />
          </mesh>
          {/* Pillar cap */}
          <mesh position={[x, 5.2, 0]} castShadow>
            <boxGeometry args={[1.3, 0.5, 1.3]} />
            <meshLambertMaterial color="#888" />
          </mesh>
          {/* Rune glow on pillar */}
          <mesh position={[x, 2.5, 0.55]}>
            <planeGeometry args={[0.4, 0.4]} />
            <meshBasicMaterial color="#9b59b6" />
          </mesh>
        </group>
      ))}

      {/* Arch top */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <boxGeometry args={[5.5, 1, 1.2]} />
        <meshLambertMaterial color="#666" />
      </mesh>
      <mesh position={[0, 6.25, 0]} castShadow>
        <boxGeometry args={[4, 0.8, 1]} />
        <meshLambertMaterial color="#888" />
      </mesh>

      {/* Portal swirl */}
      <mesh position={[0, 2.8, 0]} ref={ringRef}>
        <torusGeometry args={[1.6, 0.12, 8, 24]} />
        <meshBasicMaterial color="#c039e0" />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <circleGeometry args={[1.55, 24]} />
        <meshBasicMaterial color="#1a0030" transparent opacity={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner glow rings */}
      <mesh position={[0, 2.8, 0.05]}>
        <ringGeometry args={[0.8, 1.4, 24]} />
        <meshBasicMaterial color="#7b1fa2" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      <pointLight ref={portalGlowRef} color="#c039e0" intensity={3} distance={10} decay={2} />

      {/* Ground rune circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.5, 3, 8]} />
        <meshBasicMaterial color="#7b1fa2" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* "Enter Dungeon" stone sign */}
      <mesh position={[0, 6.9, 0]} castShadow>
        <boxGeometry args={[3.5, 0.7, 0.3]} />
        <meshLambertMaterial color="#555" />
      </mesh>

      {/* Warning torches */}
      {[-3.5, 3.5].map((x, i) => (
        <group key={i} position={[x, 0, 0.5]}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 2, 5]} />
            <meshLambertMaterial color="#5c3d1e" />
          </mesh>
          <mesh position={[0, 2.15, 0]}>
            <sphereGeometry args={[0.22, 6, 6]} />
            <meshBasicMaterial color="#ff8800" />
          </mesh>
          <pointLight position={[0, 2.2, 0]} color="#ff6600" intensity={1.5} distance={5} decay={2} />
        </group>
      ))}
    </group>
  );
}

// ── Well ──────────────────────────────────────────────────────────────────────
function Well() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.8, 10]} />
        <meshLambertMaterial color="#888" />
      </mesh>
      {/* Inner water */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.05, 10]} />
        <meshLambertMaterial color="#2277bb" />
      </mesh>
      {/* Roof */}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 5]} />
          <meshLambertMaterial color="#5c3d1e" />
        </mesh>
      ))}
      <mesh position={[0, 2.45, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.6, 0.15, 1.1]} />
        <meshLambertMaterial color="#7a3a1a" />
      </mesh>
    </group>
  );
}

// ── Fountain particles (CSS-only approximation with instanced mesh) ─────────────
function FountainParticles() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 18;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const phases = useMemo(() => Array.from({ length: COUNT }, (_, i) => i / COUNT), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = phases[i];
      const angle = p * Math.PI * 2;
      const progress = ((t * 0.6 + p) % 1);
      const r = 0.3 + progress * 0.5;
      const y = 0.8 + progress * 1.2 - progress * progress * 1.4;
      dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      dummy.scale.setScalar(0.06 * (1 - progress * 0.6));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#88ccff" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ── Tree ──────────────────────────────────────────────────────────────────────
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.4, 6]} />
        <meshLambertMaterial color="#5c3d1e" />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[1.1, 1.6, 7]} />
        <meshLambertMaterial color="#2d6b2d" />
      </mesh>
      <mesh position={[0, 3.7, 0]} castShadow>
        <coneGeometry args={[0.8, 1.4, 7]} />
        <meshLambertMaterial color="#3a7a3a" />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[0.5, 1.1, 7]} />
        <meshLambertMaterial color="#4a8a4a" />
      </mesh>
    </group>
  );
}

// ── Lantern ───────────────────────────────────────────────────────────────────
function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 3, 5]} />
        <meshLambertMaterial color="#555" />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[0.35, 0.45, 0.35]} />
        <meshBasicMaterial color="#ffffaa" />
      </mesh>
      <pointLight position={[0, 3.1, 0]} color="#ffffaa" intensity={0.8} distance={6} decay={2} />
    </group>
  );
}

// ── Barrel ────────────────────────────────────────────────────────────────────
function Barrel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.3, 0.28, 0.7, 8]} />
      <meshLambertMaterial color="#7a5c2e" />
    </mesh>
  );
}
