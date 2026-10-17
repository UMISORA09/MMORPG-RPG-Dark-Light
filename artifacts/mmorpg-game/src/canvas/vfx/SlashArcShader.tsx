import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface SlashArcShaderProps {
  position: [number, number, number] | THREE.Vector3;
  direction?: number; // angle in radians or facing direction
  primaryColor?: string;
  secondaryColor?: string;
  scale?: number;
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

  #define PI 3.14159265359

  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv - center;
    float dist = length(p) * 2.0;
    float angle = atan(p.y, p.x); // -PI to PI

    // Slash Arc is a high-speed crescent smear ring between radius 0.35 and 0.98
    float ringMask = smoothstep(0.32, 0.52, dist) * (1.0 - smoothstep(0.88, 1.0, dist));

    // Angular span: from -0.8 PI to 0.8 PI with razor-sharp trailing edge
    float sweep = angle + PI; // 0 to 2PI
    float arcMask = smoothstep(0.15, 0.9, sweep) * (1.0 - smoothstep(4.2, 5.6, sweep));

    // High-speed smear sweep animation
    float head = uProgress * 6.4;
    float tail = max(0.0, head - 3.2);
    float progressMask = smoothstep(tail, head, sweep);

    float alpha = ringMask * arcMask * progressMask * (1.0 - uProgress);

    // Color gradient from primary to secondary along radius & angle
    vec3 col = mix(uPrimaryColor, uSecondaryColor, clamp(dist * 0.85, 0.0, 1.0));
    // Razor-sharp white-hot inner core (smear frame high-energy trail)
    float core = pow(ringMask, 3.8) * 1.4;
    col = mix(col, vec3(1.0, 1.0, 1.0), clamp(core, 0.0, 0.9));
    col += vec3(1.0) * core * 0.5;

    gl_FragColor = vec4(col, alpha);
  }
`;

export const SlashArcShader = memo(function SlashArcShader({
  position,
  direction = 0,
  primaryColor = "#ffaa00",
  secondaryColor = "#ef4444",
  scale = 1.0,
  duration = 0.28,
  onComplete,
}: SlashArcShaderProps) {
  const meshRef = useRef<THREE.Mesh>(null);
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

    if (meshRef.current) {
      meshRef.current.rotation.z = direction + progressRef.current * 0.8;
    }

    if (progressRef.current >= 1.0 && onComplete) {
      onComplete();
    }
  });

  const posArray: [number, number, number] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z];

  return (
    <mesh ref={meshRef} position={posArray} rotation={[-Math.PI * 0.35, 0, direction]}>
      <planeGeometry args={[scale * 3.4, scale * 3.4]} />
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
