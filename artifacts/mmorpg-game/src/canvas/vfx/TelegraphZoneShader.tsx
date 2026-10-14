// ==============================================================================
// Ground Combat Telegraph Zone Shaders
// Circle, Cone, LineBox, and Donut Ring Area-of-Effect Warning Decals
// ==============================================================================

import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ActiveTelegraphZone } from "@/skills";

export interface TelegraphZoneItemProps {
  zone: ActiveTelegraphZone;
  onDetonate?: (zone: ActiveTelegraphZone) => void;
}

// ── GLSL Shaders for 4 Tactical Shapes ───────────────────────────────────────
const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uProgress; // 0.0 to 1.0 filling charge
  uniform int uShape;      // 0: CIRCLE, 1: CONE, 2: LINE_BOX, 3: DONUT_RING
  uniform float uAngleRad; // for CONE
  uniform float uInnerRatio; // for DONUT_RING (innerSafeRadius / outerRadius)
  uniform vec3 uDangerColor;
  uniform vec3 uSafeColor;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    // Center at (0, 0)
    vec2 p = vUv * 2.0 - 1.0;
    float dist = length(p);
    float alpha = 0.0;
    vec3 color = uDangerColor;

    if (uShape == 0) {
      // ── CIRCLE ──
      if (dist <= 1.0) {
        // Outer glowing danger ring
        float outerRing = smoothstep(0.92, 1.0, dist);
        // Expanding inner charge wave
        float chargeWave = smoothstep(uProgress - 0.08, uProgress, dist) * (1.0 - step(uProgress, dist));
        float fillBase = (dist <= uProgress) ? 0.35 : 0.12;

        alpha = fillBase + outerRing * 0.7 + chargeWave * 0.5;
        // Flashing pulse on near completion
        if (uProgress > 0.85) {
          alpha += sin(uTime * 25.0) * 0.2;
        }
      }
    } else if (uShape == 1) {
      // ── CONE (Directed forwards along +Y in UV space, angle = uAngleRad) ──
      // p.y is forward, p.x is lateral
      float angle = atan(p.x, p.y);
      float halfAngle = uAngleRad * 0.5;

      if (dist <= 1.0 && abs(angle) <= halfAngle) {
        float outerBorder = smoothstep(0.92, 1.0, dist);
        float edgeBorder = smoothstep(halfAngle - 0.06, halfAngle, abs(angle));
        float fill = (dist <= uProgress) ? 0.42 : 0.14;

        alpha = fill + (outerBorder + edgeBorder) * 0.6;
        if (uProgress > 0.85) {
          alpha += sin(uTime * 25.0) * 0.2;
        }
      }
    } else if (uShape == 2) {
      // ── LINE_BOX (vUv.y along length 0..1, vUv.x along width 0..1) ──
      float borderX = smoothstep(0.42, 0.5, abs(vUv.x - 0.5));
      float borderY = smoothstep(0.95, 1.0, vUv.y) + (1.0 - smoothstep(0.0, 0.05, vUv.y));
      float fill = (vUv.y <= uProgress) ? 0.4 : 0.15;

      // Scrolling energy arrows along path
      float arrows = sin(vUv.y * 20.0 - uTime * 12.0) * 0.15;

      alpha = fill + (borderX + borderY) * 0.5 + arrows;
      if (uProgress > 0.85) {
        alpha += sin(uTime * 25.0) * 0.2;
      }
    } else if (uShape == 3) {
      // ── DONUT_RING (Inner core is SAFE, Outer is DANGER) ──
      if (dist <= 1.0) {
        if (dist < uInnerRatio) {
          // Inside safe sanctuary zone (Tinted bright gold/cyan with green edge)
          color = uSafeColor;
          float innerBorder = smoothstep(uInnerRatio - 0.08, uInnerRatio, dist);
          alpha = 0.18 + innerBorder * 0.5;
        } else {
          // Dangerous outer donut
          color = uDangerColor;
          float outerBorder = smoothstep(0.92, 1.0, dist);
          float innerDangerEdge = (1.0 - smoothstep(uInnerRatio, uInnerRatio + 0.08, dist));
          float fill = (dist <= uProgress) ? 0.45 : 0.18;
          alpha = fill + (outerBorder + innerDangerEdge) * 0.6;

          if (uProgress > 0.85) {
            alpha += sin(uTime * 25.0) * 0.25;
          }
        }
      }
    }

    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95));
  }
`;

export const TelegraphZoneItem = memo(function TelegraphZoneItem({
  zone,
  onDetonate,
}: TelegraphZoneItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const pattern = zone.pattern;
  const shapeCode =
    pattern.shape === "CIRCLE"
      ? 0
      : pattern.shape === "CONE"
      ? 1
      : pattern.shape === "LINE_BOX"
      ? 2
      : 3; // DONUT_RING

  // Geometry dimensions
  const geomSize = useMemo(() => {
    if (pattern.shape === "LINE_BOX") {
      const w = pattern.radiusOrWidth;
      const l = pattern.length || 8.0;
      return [w, l] as const;
    }
    const r = pattern.radiusOrWidth * 2;
    return [r, r] as const;
  }, [pattern]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0.0 },
      uShape: { value: shapeCode },
      uAngleRad: { value: ((pattern.angleDeg || 90) * Math.PI) / 180 },
      uInnerRatio: {
        value:
          pattern.shape === "DONUT_RING" && pattern.innerSafeRadius
            ? pattern.innerSafeRadius / pattern.radiusOrWidth
            : 0.35,
      },
      uDangerColor: { value: new THREE.Color("#ef4444") },
      uSafeColor: { value: new THREE.Color("#22c55e") },
      uTime: { value: 0 },
    }),
    [shapeCode, pattern]
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    zone.elapsedMs += delta * 1000;
    const progress = Math.min(1.0, zone.elapsedMs / Math.max(1, zone.durationMs));

    materialRef.current.uniforms.uProgress.value = progress;
    materialRef.current.uniforms.uTime.value += delta;

    if (progress >= 1.0 && !zone.triggered) {
      zone.triggered = true;
      if (onDetonate) onDetonate(zone);
    }
  });

  // Calculate position offset: For LINE_BOX and CONE, the origin is at the caster's foot
  const offsetPosition = useMemo(() => {
    const p = new THREE.Vector3(...zone.position);
    p.y = 0.035; // Slightly elevated above terrain to avoid z-fighting
    if (pattern.shape === "LINE_BOX") {
      const len = pattern.length || 8.0;
      const dirVec = new THREE.Vector3(Math.sin(zone.direction), 0, Math.cos(zone.direction));
      p.addScaledVector(dirVec, len / 2);
    }
    return p;
  }, [zone, pattern]);

  return (
    <mesh
      ref={meshRef}
      position={offsetPosition}
      rotation={[-Math.PI / 2, 0, -zone.direction]}
    >
      <planeGeometry args={[geomSize[0], geomSize[1]]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

// ── Collision Check Utility ─────────────────────────────────────────────────
export function isPlayerInsideTelegraphZone(
  playerPos: { x: number; z: number },
  zone: ActiveTelegraphZone
): boolean {
  const [zx, , zz] = zone.position;
  const dx = playerPos.x - zx;
  const dz = playerPos.z - zz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const p = zone.pattern;

  if (p.shape === "CIRCLE") {
    return dist <= p.radiusOrWidth;
  }

  if (p.shape === "DONUT_RING") {
    const safeRadius = p.innerSafeRadius || 4.0;
    // Player is SAFE if close to the boss foot!
    if (dist < safeRadius) return false;
    return dist <= p.radiusOrWidth;
  }

  if (p.shape === "CONE") {
    if (dist > p.radiusOrWidth) return false;
    // Calculate angle relative to zone direction
    const playerAngle = Math.atan2(dx, dz);
    let diff = Math.abs(playerAngle - zone.direction);
    while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
    const halfAngle = (((p.angleDeg || 90) / 2) * Math.PI) / 180;
    return diff <= halfAngle;
  }

  if (p.shape === "LINE_BOX") {
    const len = p.length || 8.0;
    const halfWidth = p.radiusOrWidth / 2;

    // Project onto forward direction vector
    const dirX = Math.sin(zone.direction);
    const dirZ = Math.cos(zone.direction);
    const forwardDist = dx * dirX + dz * dirZ;

    // Project onto lateral vector
    const perpX = -dirZ;
    const perpZ = dirX;
    const sideDist = Math.abs(dx * perpX + dz * perpZ);

    return forwardDist >= 0 && forwardDist <= len && sideDist <= halfWidth;
  }

  return false;
}
