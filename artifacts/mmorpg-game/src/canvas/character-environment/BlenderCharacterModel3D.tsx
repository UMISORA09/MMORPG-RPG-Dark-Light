import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type {
  CharacterClassId,
  CharacterAnimationState,
  BlenderModelStats,
} from "./types";

export interface BlenderCharacterModel3DProps {
  classId?: CharacterClassId;
  modelUrl?: string;
  animState?: CharacterAnimationState;
  showWeapon?: boolean;
  showShield?: boolean;
  showSkeleton?: boolean;
  showWireframe?: boolean;
  onStatsExtracted?: (stats: BlenderModelStats) => void;
}

export const BlenderCharacterModel3D = memo(function BlenderCharacterModel3D({
  classId = "fighter",
  modelUrl,
  animState = "idle",
  showWeapon = true,
  showShield = true,
  showSkeleton = false,
  showWireframe = false,
  onStatsExtracted,
}: BlenderCharacterModel3DProps) {
  const containerRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);

  // Default model URL if not provided
  const targetUrl =
    modelUrl || `/assets/models/characters/${classId}.glb`;

  // Weapon URL corresponding to class
  const weaponUrl =
    classId === "gunner"
      ? "/assets/models/weapons/weapon_blaster.glb"
      : classId === "assassin"
      ? "/assets/models/weapons/weapon_daggers.glb"
      : classId === "tank"
      ? "/assets/models/weapons/weapon_shield.glb"
      : "/assets/models/weapons/weapon_sword.glb";

  // 1. Load Blender Character Model GLB
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loader = new GLTFLoader();
    loader.load(
      targetUrl,
      (gltf) => {
        if (isCancelled) return;

        const scene = gltf.scene;

        // Statistics collector
        let triCount = 0;
        let vertCount = 0;
        let meshCount = 0;
        const bonesList: string[] = [];
        let hasWeaponSocket = false;
        let hasShieldSocket = false;
        let hasHeadSocket = false;
        let hasBackSocket = false;

        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            meshCount++;
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const geo = mesh.geometry;
            if (geo) {
              if (geo.index) {
                triCount += geo.index.count / 3;
              } else if (geo.attributes.position) {
                triCount += geo.attributes.position.count / 3;
              }
              if (geo.attributes.position) {
                vertCount += geo.attributes.position.count;
              }
            }
          }

          if ((obj as THREE.Bone).isBone) {
            bonesList.push(obj.name);
          }

          // Check sockets standard
          const lowerName = obj.name.toLowerCase();
          if (lowerName.includes("weapon_slot") || lowerName.includes("righthand")) {
            hasWeaponSocket = true;
          }
          if (lowerName.includes("shield_slot") || lowerName.includes("leftforearm")) {
            hasShieldSocket = true;
          }
          if (lowerName.includes("head_socket") || lowerName === "head") {
            hasHeadSocket = true;
          }
          if (lowerName.includes("back_socket") || lowerName.includes("spine2")) {
            hasBackSocket = true;
          }
        });

        // Setup Animation Mixer
        const mixer = new THREE.AnimationMixer(scene);
        mixerRef.current = mixer;
        const actions: Record<string, THREE.AnimationAction> = {};

        const animNames = gltf.animations.map((clip) => {
          const action = mixer.clipAction(clip);
          actions[clip.name] = action;
          return clip.name;
        });

        actionsRef.current = actions;

        // Compute Budget Status
        const budgetStatus: "pass" | "warn" | "fail" =
          triCount > 25000
            ? "fail"
            : triCount > 15000
            ? "warn"
            : "pass";

        const stats: BlenderModelStats = {
          fileName: targetUrl.split("/").pop() || "character.glb",
          triangles: Math.round(triCount),
          vertices: Math.round(vertCount),
          meshesCount: meshCount,
          animations: animNames,
          bones: bonesList,
          hasWeaponSocket,
          hasShieldSocket,
          hasHeadSocket,
          hasBackSocket,
          budgetStatus,
        };

        if (onStatsExtracted) {
          onStatsExtracted(stats);
        }

        setModelScene(scene);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (isCancelled) return;
        console.error("Lỗi khi tải mô hình Blender GLTF:", err);
        setLoadError(`Không thể tải tệp mô hình 3D: ${targetUrl}`);
        setIsLoading(false);
      }
    );

    return () => {
      isCancelled = true;
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [targetUrl, onStatsExtracted]);

  // 2. Load Weapon into Socket
  useEffect(() => {
    if (!modelScene || !showWeapon) return;

    let weaponObj: THREE.Group | null = null;
    const loader = new GLTFLoader();

    loader.load(
      weaponUrl,
      (gltf) => {
        weaponObj = gltf.scene;
        weaponObj.name = "blender_attached_weapon";
        weaponObj.scale.set(0.85, 0.85, 0.85);

        // Find weapon socket or right hand bone
        let socketParent: THREE.Object3D | null = null;
        modelScene.traverse((child) => {
          const lower = child.name.toLowerCase();
          if (lower.includes("weapon_slot") || lower.includes("righthand")) {
            socketParent = child;
          }
        });

        if (socketParent) {
          socketParent.add(weaponObj);
        } else {
          // If no specific bone found, attach near right hand offset
          weaponObj.position.set(0.35, 0.9, 0.1);
          modelScene.add(weaponObj);
        }
      },
      undefined,
      (err) => {
        console.warn("Không thể gắn vũ khí 3D:", err);
      }
    );

    return () => {
      if (weaponObj && weaponObj.parent) {
        weaponObj.parent.remove(weaponObj);
      }
    };
  }, [modelScene, showWeapon, weaponUrl]);

  // 3. Toggle Wireframe
  useEffect(() => {
    if (!modelScene) return;

    modelScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            mat.wireframe = showWireframe;
          });
        } else if (mesh.material) {
          mesh.material.wireframe = showWireframe;
        }
      }
    });
  }, [modelScene, showWireframe]);

  // 4. Skeleton Helper
  useEffect(() => {
    if (!modelScene) return;

    if (showSkeleton) {
      const helper = new THREE.SkeletonHelper(modelScene);
      skeletonHelperRef.current = helper;
      modelScene.add(helper);
    } else if (skeletonHelperRef.current) {
      if (skeletonHelperRef.current.parent) {
        skeletonHelperRef.current.parent.remove(skeletonHelperRef.current);
      }
      skeletonHelperRef.current = null;
    }

    return () => {
      if (skeletonHelperRef.current && skeletonHelperRef.current.parent) {
        skeletonHelperRef.current.parent.remove(skeletonHelperRef.current);
        skeletonHelperRef.current = null;
      }
    };
  }, [modelScene, showSkeleton]);

  // 5. Handle Animation Transitions
  useEffect(() => {
    const actions = actionsRef.current;
    if (!actions || Object.keys(actions).length === 0) return;

    // Find best matching action
    let nextAction: THREE.AnimationAction | null = null;

    if (animState === "idle") {
      nextAction =
        actions["idle"] ||
        Object.values(actions).find((a) =>
          a.getClip().name.toLowerCase().includes("idle")
        ) ||
        Object.values(actions)[0];
    } else if (animState === "run") {
      nextAction =
        actions["run"] ||
        Object.values(actions).find(
          (a) =>
            a.getClip().name.toLowerCase().includes("run") ||
            a.getClip().name.toLowerCase().includes("walk")
        ) ||
        actions["idle"];
    } else if (animState === "attack_slash") {
      nextAction =
        actions["attack_slash"] ||
        Object.values(actions).find(
          (a) =>
            a.getClip().name.toLowerCase().includes("attack") ||
            a.getClip().name.toLowerCase().includes("slash")
        ) ||
        actions["idle"];
    } else if (animState === "skill_cast") {
      nextAction =
        actions["skill_cast"] ||
        Object.values(actions).find(
          (a) =>
            a.getClip().name.toLowerCase().includes("skill") ||
            a.getClip().name.toLowerCase().includes("cast")
        ) ||
        actions["idle"];
    } else if (animState === "death") {
      nextAction =
        actions["death"] ||
        Object.values(actions).find(
          (a) =>
            a.getClip().name.toLowerCase().includes("death") ||
            a.getClip().name.toLowerCase().includes("die")
        ) ||
        actions["idle"];
    }

    if (nextAction && nextAction !== currentActionRef.current) {
      const prevAction = currentActionRef.current;
      nextAction.reset();

      if (animState === "death") {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
      } else {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
      }

      nextAction.play();

      if (prevAction) {
        prevAction.crossFadeTo(nextAction, 0.25, true);
      }

      currentActionRef.current = nextAction;
    }
  }, [animState, modelScene]);

  // 6. Frame Animation Update
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <group ref={containerRef} name="blender-character-3d-root" position={[0, 0, 0]}>
      {/* ── Loading Hologram Spinner ── */}
      {isLoading && (
        <group position={[0, 1.0, 0]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.5, 0.03, 16, 32]} />
            <meshBasicMaterial color="#00f2ff" wireframe />
          </mesh>
          <pointLight color="#00f2ff" intensity={2} distance={3} />
        </group>
      )}

      {/* ── Load Error Indicator ── */}
      {loadError && (
        <group position={[0, 1.0, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#ef4444" wireframe />
          </mesh>
        </group>
      )}

      {/* ── Render 3D Model Scene ── */}
      {modelScene && <primitive object={modelScene} />}
    </group>
  );
});
