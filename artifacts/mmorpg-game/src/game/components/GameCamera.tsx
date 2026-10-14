import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../useGameStore";
import { cameraControls } from "../cameraControls";
import { CAMERA_DISTANCE } from "../constants";

const _lookAt = new THREE.Vector3();
const TARGET_HEIGHT = 1.2; // look-at point above player origin

export default function GameCamera() {
  const { camera } = useThree();
  const smoothYaw   = useRef(cameraControls.yaw);
  const smoothPitch = useRef(cameraControls.pitch);
  const smoothPos   = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const player = useGameStore.getState().player;
    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;

    // Smooth angles — fast enough to feel responsive
    const k = 1 - Math.exp(-12 * delta);
    smoothYaw.current   = THREE.MathUtils.lerp(smoothYaw.current,   cameraControls.yaw,   k);
    smoothPitch.current = THREE.MathUtils.lerp(smoothPitch.current, cameraControls.pitch, k);

    const yaw   = smoothYaw.current;
    const pitch = smoothPitch.current;

    // Spherical orbit: yaw=horizontal, pitch=vertical
    // pitch=0 → camera is level with player; pitch>0 → camera rises above and looks down
    const dist = CAMERA_DISTANCE;
    const offsetX = Math.sin(yaw)   * Math.cos(pitch) * dist;
    const offsetY = Math.sin(pitch) * dist;
    const offsetZ = Math.cos(yaw)   * Math.cos(pitch) * dist;

    const targetX = px + offsetX;
    const targetY = py + TARGET_HEIGHT + offsetY;
    const targetZ = pz + offsetZ;

    // Smooth position
    const posK = 1 - Math.exp(-10 * delta);
    smoothPos.current.x = THREE.MathUtils.lerp(smoothPos.current.x, targetX, posK);
    smoothPos.current.y = THREE.MathUtils.lerp(smoothPos.current.y, targetY, posK);
    smoothPos.current.z = THREE.MathUtils.lerp(smoothPos.current.z, targetZ, posK);

    camera.position.copy(smoothPos.current);

    _lookAt.set(px, py + TARGET_HEIGHT, pz);
    camera.lookAt(_lookAt);
  });

  return null;
}
