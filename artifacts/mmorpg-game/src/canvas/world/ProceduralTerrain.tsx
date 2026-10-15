// ==============================================================================
// Procedural Biome Blending Ground Terrain Shader
// Smoothstep blending between:
// 1. Safe Village (r < 18): Ancient carved dragon stone with cyan glowing seams
// 2. Wilderness (18 <= r < 50): Night velvet grass with natural dirt cross-paths
// 3. Boss Altar (z < -48): Obsidian volcanic crust with breathing lava veins
// ==============================================================================

import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const TERRAIN_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const TERRAIN_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  // Simple pseudo-random hash
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Noise function
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 p = vWorldPosition.xz;
    float dist = length(p);

    // ── BIOME 1: SAFE VILLAGE (Ancient Dragon Plaza) ──
    vec3 villageStone = vec3(0.12, 0.10, 0.18); // #2a1f3d base
    // Cobblestone grid
    vec2 brickUv = mod(p, 1.4);
    float seamX = smoothstep(0.0, 0.08, brickUv.x) * (1.0 - smoothstep(1.32, 1.4, brickUv.x));
    float seamY = smoothstep(0.0, 0.08, brickUv.y) * (1.0 - smoothstep(1.32, 1.4, brickUv.y));
    float seam = 1.0 - (seamX * seamY);

    // Glowing cyan dragon energy in brick crevices
    float pulse = 0.5 + 0.5 * sin(uTime * 1.8 - dist * 0.35);
    vec3 cyanVeins = vec3(0.0, 0.95, 1.0) * pulse * 1.2;
    vec3 villageColor = mix(villageStone, cyanVeins, seam * 0.75);

    // Center Golden Dragon Rune Circles
    float centerRune1 = abs(dist - 5.0);
    float centerRune2 = abs(dist - 11.5);
    if (centerRune1 < 0.25 || centerRune2 < 0.3) {
      villageColor += vec3(0.98, 0.75, 0.15) * (0.6 + 0.4 * sin(uTime * 2.2));
    }

    // ── BIOME 2: WILDERNESS (Night Indigo Grass & Dirt Trails) ──
    vec3 grassColor1 = vec3(0.04, 0.05, 0.12);
    vec3 grassColor2 = vec3(0.08, 0.09, 0.19);
    float nGrass = noise(p * 0.35);
    vec3 wildernessColor = mix(grassColor1, grassColor2, nGrass);

    // 4 Cardinal Dirt Paths (North towards bridge, South, East, West)
    float pathX = smoothstep(2.6, 0.5, abs(p.x));
    float pathZ = smoothstep(2.6, 0.5, abs(p.y)); // p.y is z
    float pathMask = max(pathX, pathZ);
    vec3 dirtColor = vec3(0.14, 0.11, 0.16);
    wildernessColor = mix(wildernessColor, dirtColor, pathMask * 0.65);

    // ── BIOME 3: BOSS RAID ALTAR (Cracked Obsidian & Molten Lava) ──
    vec3 obsidianStone = vec3(0.035, 0.02, 0.06);
    // Molten lava cracks
    float nLava = noise(p * 0.25 + vec2(sin(uTime * 0.2), cos(uTime * 0.2)));
    float cracks = smoothstep(0.48, 0.53, nLava) * (1.0 - smoothstep(0.53, 0.58, nLava));
    
    // Breathing lava glow
    float breath = 0.65 + 0.35 * sin(uTime * 2.5 + p.x * 0.2);
    vec3 moltenLava = mix(vec3(1.0, 0.18, 0.35), vec3(1.0, 0.65, 0.0), breath) * breath * 1.8;
    vec3 bossColor = mix(obsidianStone, moltenLava, cracks * 0.9);

    // Lava Moat ring around boss arena
    vec2 bossCenter = vec2(0.0, -70.0);
    float bossDist = length(p - bossCenter);
    if (bossDist >= 17.0 && bossDist <= 23.0) {
      float moat = smoothstep(17.0, 19.5, bossDist) * (1.0 - smoothstep(20.5, 23.0, bossDist));
      bossColor += vec3(1.0, 0.2, 0.1) * moat * 1.5;
    }

    // ── SEAMLESS PROCEDURAL BLENDING ──
    // 1. Blend Village into Wilderness at r = 18m
    float villageWeight = 1.0 - smoothstep(16.5, 18.5, dist);
    vec3 groundColor = mix(wildernessColor, villageColor, villageWeight);

    // 2. Blend Wilderness into Boss Altar at z < -46m
    float bossWeight = smoothstep(-44.0, -52.0, p.y); // p.y is z coordinate
    groundColor = mix(groundColor, bossColor, bossWeight);

    // 3. Smooth fade at world outer boundaries (r = 85m)
    float edgeFade = 1.0 - smoothstep(76.0, 85.0, dist);

    gl_FragColor = vec4(groundColor * edgeFade, 1.0);
  }
`;

export const ProceduralTerrain = memo(function ProceduralTerrain() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[180, 180, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={TERRAIN_VERTEX_SHADER}
        fragmentShader={TERRAIN_FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
});
