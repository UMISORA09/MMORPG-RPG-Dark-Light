// ==============================================================================
// Procedural Biome Blending Ground Terrain Shader & Pixel Texture System
// Seamlessly blends 4 distinct biomes across the open world:
// 1. Safe Village (r < 21.5m): Ancient dragon carved stone plaza with cyan glowing seams & golden runes
// 2. Wilderness (West & South, 21.5m <= r < 50m): 4-layer pixel grass & warm dirt crossroads
// 3. Dead Marsh & Wasteland (East, x > 22m): Dark cracked mud, toxic purple mist veins & stagnant bog pools
// 4. Boss Altar & Dungeon Gates (North, z < -45m): Obsidian volcanic crust with breathing molten lava veins
// ==============================================================================

import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createPixelGrassTexture } from "./PixelGrassPathGenerator";

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
  uniform sampler2D uGrassTex;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

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

    // Sample 4-Step Pixel Art Grass Texture (tiled crisply without mipmap blur)
    vec2 grassUv = p * 0.18; // 1 tile per ~5.5 meters
    vec4 grassSample = texture2D(uGrassTex, grassUv);

    // ── BIOME 2: WILDERNESS (Pixel Grass + Warm Dirt Trail) ──
    vec3 wildernessColor = grassSample.rgb;

    // 4 Cardinal Dirt Paths (Crossroad through wilderness)
    float curveX = sin(p.y * 0.2) * 0.8;
    float curveZ = cos(p.x * 0.2) * 0.8;
    float pathX = smoothstep(2.6, 0.4, abs(p.x - curveX));
    float pathZ = smoothstep(2.6, 0.4, abs(p.y - curveZ)); // p.y is z
    float pathMask = max(pathX, pathZ);

    vec3 warmDirt = vec3(0.96, 0.88, 0.64); // #f5e1a4
    vec3 dirtPebble = vec3(0.85, 0.72, 0.45); // #d9b872
    float pebbleNoise = step(0.72, hash(floor(p * 3.0)));
    vec3 dirtColor = mix(warmDirt, dirtPebble, pebbleNoise * 0.4);

    float jag = (hash(floor(p * 4.0)) - 0.5) * 0.15;
    float dirtMix = smoothstep(0.4 + jag, 0.75 + jag, pathMask);
    wildernessColor = mix(wildernessColor, dirtColor, dirtMix * 0.92);

    // ── BIOME 1: SAFE VILLAGE (Ancient Dragon Plaza r < 21.5m) ──
    vec3 villageStone = vec3(0.12, 0.10, 0.18); // #2a1f3d base
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
    float centerRune2 = abs(dist - 12.5);
    float centerRune3 = abs(dist - 18.0);
    if (centerRune1 < 0.25 || centerRune2 < 0.3 || centerRune3 < 0.28) {
      villageColor += vec3(0.98, 0.75, 0.15) * (0.6 + 0.4 * sin(uTime * 2.2));
    }

    // ── BIOME 3: DEAD MARSH & WASTELAND (East Sector: x > 22m) ──
    vec3 marshMud = vec3(0.11, 0.08, 0.16); // Deep mud
    float nMud = noise(p * 0.35 + vec2(sin(uTime * 0.15), cos(uTime * 0.15)));
    float mudCracks = smoothstep(0.45, 0.52, nMud) * (1.0 - smoothstep(0.52, 0.58, nMud));
    float marshPulse = 0.6 + 0.4 * sin(uTime * 1.6 + p.x * 0.3);
    vec3 toxicPurpleVeins = vec3(0.72, 0.22, 0.98) * marshPulse * 1.4;
    vec3 deadMarshColor = mix(marshMud, toxicPurpleVeins, mudCracks * 0.85);

    // Stagnant poisoned water pools in Dead Marsh
    float poolNoise = noise(p * 0.18);
    if (poolNoise > 0.65) {
      deadMarshColor = mix(deadMarshColor, vec3(0.25, 0.08, 0.45), 0.75);
    }

    // ── BIOME 4: BOSS RAID ALTAR & DUNGEON (North Sector: z < -45m) ──
    vec3 obsidianStone = vec3(0.035, 0.02, 0.06);
    float nLava = noise(p * 0.25 + vec2(sin(uTime * 0.2), cos(uTime * 0.2)));
    float cracks = smoothstep(0.48, 0.53, nLava) * (1.0 - smoothstep(0.53, 0.58, nLava));
    float breath = 0.65 + 0.35 * sin(uTime * 2.5 + p.x * 0.2);
    vec3 moltenLava = mix(vec3(1.0, 0.18, 0.35), vec3(1.0, 0.65, 0.0), breath) * breath * 1.8;
    vec3 bossColor = mix(obsidianStone, moltenLava, cracks * 0.9);

    // Lava Moat ring around boss arena (z = -70)
    vec2 bossCenter = vec2(0.0, -70.0);
    float bossDist = length(p - bossCenter);
    if (bossDist >= 17.0 && bossDist <= 23.0) {
      float moat = smoothstep(17.0, 19.5, bossDist) * (1.0 - smoothstep(20.5, 23.0, bossDist));
      bossColor += vec3(1.0, 0.2, 0.1) * moat * 1.5;
    }

    // ── 4-BIOME PROCEDURAL BLEND MATH ──
    // 1. Start with Wilderness Grass as base
    vec3 finalColor = wildernessColor;

    // 2. Blend Dead Marsh in Eastern Sector (x > 22)
    float eastWeight = smoothstep(20.0, 27.0, p.x);
    finalColor = mix(finalColor, deadMarshColor, eastWeight);

    // 3. Blend Boss Altar in Deep North Sector (z < -45)
    float northWeight = smoothstep(-43.0, -50.0, p.y);
    finalColor = mix(finalColor, bossColor, northWeight);

    // 4. Blend Safe Village in Center (r < 21.5)
    float villageWeight = 1.0 - smoothstep(19.5, 21.5, dist);
    finalColor = mix(finalColor, villageColor, villageWeight);

    // Boost overall vibrancy & contrast for crisp Dark Fantasy pixel RPG aesthetics
    finalColor = finalColor * 1.32;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const ProceduralTerrain = memo(function ProceduralTerrain() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const grassTexture = useMemo(() => {
    return createPixelGrassTexture(128);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uGrassTex: { value: grassTexture },
    }),
    [grassTexture]
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
