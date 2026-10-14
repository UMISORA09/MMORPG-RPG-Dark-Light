import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface HolyShieldDomeVFXProps {
  position: [number, number, number] | THREE.Vector3;
  primaryColor?: string;
  secondaryColor?: string;
  radius?: number;
  duration?: number;
  onComplete?: () => void;
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Hexagonal Grid pattern simulation via sine waves
    vec2 p = vUv * 24.0;
    float hex = sin(p.x * 1.732 + uTime) * sin(p.y * 1.732);
    float gridLine = smoothstep(0.4, 0.5, abs(hex));

    // Fresnel Rim Glow
    float fresnel = pow(1.0 - abs(vNormal.z), 2.2);

    vec3 col = mix(uSecondaryColor, uPrimaryColor, fresnel);
    col += vec3(1.0) * gridLine * 0.6; // glowing hexagonal lines

    float alpha = clamp(fresnel * 0.7 + gridLine * 0.4, 0.0, 0.85);

    gl_FragColor = vec4(col, alpha);
  }
`;

export const HolyShieldDomeVFX = memo(function HolyShieldDomeVFX({
  position,
  primaryColor = "#ffd700",
  secondaryColor = "#00ff88",
  radius = 2.4,
  duration = 3.0,
  onComplete,
}: HolyShieldDomeVFXProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const lifeRef = useRef(duration);

  const uniforms = useMemo(
    () => ({
      uPrimaryColor: { value: new THREE.Color(primaryColor) },
      uSecondaryColor: { value: new THREE.Color(secondaryColor) },
      uTime: { value: 0 },
    }),
    [primaryColor, secondaryColor]
  );

  useFrame((_, delta) => {
    timeRef.current += delta * 2.0;
    lifeRef.current -= delta;
    uniforms.uTime.value = timeRef.current;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }

    if (lifeRef.current <= 0 && onComplete) {
      onComplete();
    }
  });

  const posArray: [number, number, number] = Array.isArray(position)
    ? [position[0], position[1] + radius * 0.6, position[2]]
    : [position.x, position.y + radius * 0.6, position.z];

  return (
    <mesh ref={meshRef} position={posArray}>
      <sphereGeometry args={[radius, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
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
