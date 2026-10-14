import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function MenuCamera() {
  const { camera } = useThree();
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta * 0.12;
    const radius = 18;
    const x = Math.sin(t.current) * radius;
    const z = Math.cos(t.current) * radius;
    camera.position.set(x, 9, z);
    camera.lookAt(0, 1, 0);
  });

  return null;
}
