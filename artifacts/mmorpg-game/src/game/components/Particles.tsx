import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 60;

export default function Stars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { positions, speeds } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const speeds: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          10 + Math.random() * 30,
          (Math.random() - 0.5) * 80
        )
      );
      speeds.push(0.2 + Math.random() * 0.5);
    }
    return { positions, speeds };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y + Math.sin(t * speeds[i] + i) * 0.5, p.z);
      dummy.scale.setScalar(0.05 + Math.abs(Math.sin(t * speeds[i] + i * 1.3)) * 0.08);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffffcc" />
    </instancedMesh>
  );
}
