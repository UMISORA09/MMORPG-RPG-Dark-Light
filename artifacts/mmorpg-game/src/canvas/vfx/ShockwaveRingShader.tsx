import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface ShockwaveRingShaderProps {
  position: [number, number, number] | THREE.Vector3;
  primaryColor?: string;
  secondaryColor?: string;
  radius?: number;
  duration?: number;
  onComplete?: () => void;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform float uProgress;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center) * 2.0; // 0 to 1

    // Shockwave wavefront expands with progress
    float wavePos = uProgress;
    float waveWidth = 0.22;
    float wave = smoothstep(wavePos - waveWidth, wavePos, dist) * (1.0 - smoothstep(wavePos, wavePos + 0.08, dist));

    // Inner secondary ripple
    float ripplePos = max(0.0, wavePos - 0.25);
    float ripple = smoothstep(ripplePos - 0.15, ripplePos, dist) * (1.0 - smoothstep(ripplePos, ripplePos + 0.05, dist)) * 0.5;

    float totalWave = (wave + ripple) * (1.0 - uProgress);

    vec3 col = mix(uSecondaryColor, uPrimaryColor, wave);
    col += vec3(1.0) * pow(wave, 4.0) * 0.8; // intense glowing crest

    gl_FragColor = vec4(col, totalWave);
  }
`;

export const ShockwaveRingShader = memo(function ShockwaveRingShader({
  position,
  primaryColor = "#ffaa00",
  secondaryColor = "#ef4444",
  radius = 5.0,
  duration = 0.65,
  onComplete,
}: ShockwaveRingShaderProps) {
  const progressRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uPrimaryColor: { value: new THREE.Color(primaryColor) },
      uSecondaryColor: { value: new THREE.Color(secondaryColor) },
      uProgress: { value: 0 },
    }),
    [primaryColor, secondaryColor]
  );

  useFrame((_, delta) => {
    progressRef.current += delta / duration;
    uniforms.uProgress.value = Math.min(1.0, progressRef.current);

    if (progressRef.current >= 1.0 && onComplete) {
      onComplete();
    }
  });

  const posArray: [number, number, number] = Array.isArray(position)
    ? [position[0], 0.05, position[2]]
    : [position.x, 0.05, position.z];

  return (
    <mesh position={posArray} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});
