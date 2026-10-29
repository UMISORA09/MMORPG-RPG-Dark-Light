import { memo, useRef, useEffect, type ComponentRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { CameraPresetConfig, StudioCameraPresetId } from "./types";

export const STUDIO_CAMERA_PRESETS: Record<StudioCameraPresetId, CameraPresetConfig> = {
  full_body: {
    id: "full_body",
    name: "Toàn Thân",
    description: "Góc nhìn bao quát toàn bộ chiều cao nhân vật và bục đỡ.",
    position: [0.0, 1.25, 3.6],
    target: [0.0, 0.95, 0.0],
    fov: 42,
    minDistance: 1.2,
    maxDistance: 6.5,
  },
  portrait: {
    id: "portrait",
    name: "Chân Dung Cận Cảnh",
    description: "Cận cảnh gương mặt sắc sảo anime và ánh mắt thần thái.",
    position: [0.0, 1.55, 1.5],
    target: [0.0, 1.48, 0.0],
    fov: 32,
    minDistance: 0.8,
    maxDistance: 3.0,
  },
  three_quarter_action: {
    id: "three_quarter_action",
    name: "Góc Hành Động 3/4",
    description: "Góc nghiêng 3/4 kinh điển của game nhập vai hành động.",
    position: [2.2, 1.35, 2.8],
    target: [0.0, 0.95, 0.0],
    fov: 40,
    minDistance: 1.2,
    maxDistance: 6.0,
  },
  weapon_inspect: {
    id: "weapon_inspect",
    name: "Soi Chi Tiết Vũ Khí",
    description: "Cận cảnh vũ khí cầm tay, khiên hoặc súng.",
    position: [0.95, 1.05, 1.4],
    target: [0.35, 0.95, 0.0],
    fov: 36,
    minDistance: 0.6,
    maxDistance: 3.0,
  },
  back_profile: {
    id: "back_profile",
    name: "Góc Sau Lưng",
    description: "Góc nhìn từ phía sau kiểm tra áo choàng và cánh.",
    position: [0.0, 1.35, -3.4],
    target: [0.0, 0.95, 0.0],
    fov: 42,
    minDistance: 1.2,
    maxDistance: 6.0,
  },
};

interface CharacterCameraRigProps {
  presetId?: StudioCameraPresetId;
  enableOrbit?: boolean;
}

type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;

export const CharacterCameraRig = memo(function CharacterCameraRig({
  presetId = "full_body",
  enableOrbit = true,
}: CharacterCameraRigProps) {
  const controlsRef = useRef<OrbitControlsHandle>(null);
  const { camera } = useThree();

  const config = STUDIO_CAMERA_PRESETS[presetId] || STUDIO_CAMERA_PRESETS.full_body;

  const targetPosRef = useRef(new THREE.Vector3(...config.position));
  const targetLookAtRef = useRef(new THREE.Vector3(...config.target));

  useEffect(() => {
    targetPosRef.current.set(...config.position);
    targetLookAtRef.current.set(...config.target);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = config.fov;
      camera.updateProjectionMatrix();
    }
  }, [config, camera]);

  useFrame((_, delta) => {
    // Smooth dampening towards target preset position
    const lerpFactor = THREE.MathUtils.clamp(delta * 4.5, 0, 1);
    camera.position.lerp(targetPosRef.current, lerpFactor);

    if (controlsRef.current && controlsRef.current.target) {
      controlsRef.current.target.lerp(targetLookAtRef.current, lerpFactor);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enableOrbit}
      enableDamping
      dampingFactor={0.08}
      minDistance={config.minDistance}
      maxDistance={config.maxDistance}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.52} // Prevent camera going below floor
      target={config.target}
    />
  );
});
