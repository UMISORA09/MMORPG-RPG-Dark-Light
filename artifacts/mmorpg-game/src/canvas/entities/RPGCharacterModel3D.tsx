import { memo, useRef, useEffect, useMemo, Component, type ReactNode, Suspense } from "react";
import * as THREE from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { WeaponSocket3D, type WeaponType, type ItemRarity } from "./WeaponSocket3D";
import { ProceduralGreyboxCharacter } from "./ProceduralGreyboxCharacter";
import type { EntityAnimationState } from "../sprites/SpriteBillboard25D";

// ==============================================================================
// Error Boundary to prevent any GLTF loading errors from crashing the 3D Canvas
// ==============================================================================

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("⚠️ [RPGCharacterModel3D] GLTF load fallback triggered:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ==============================================================================
// Inner Model Loader with useGLTF and useAnimations
// ==============================================================================

interface InnerModelProps {
  modelPath: string;
  animState: EntityAnimationState;
  facingLeft: boolean;
  weaponType?: WeaponType;
  weaponRarity?: ItemRarity;
  color?: string;
}

function InnerGLBModel({
  modelPath,
  animState,
  facingLeft,
  weaponType = "sword",
  weaponRarity,
}: InnerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  // Load glTF
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, groupRef);

  // Clone scene so multiple instances don't share identical scene trees
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Find weapon socket node
  const weaponSocketPos = useMemo(() => {
    let pos = new THREE.Vector3(0.65, 0.9, 0.35);
    clonedScene.traverse((child) => {
      if (
        child.name === "weapon_slot" ||
        child.name.toLowerCase().includes("hand") ||
        child.name.toLowerCase().includes("socket")
      ) {
        pos.copy(child.position);
      }
    });
    return pos;
  }, [clonedScene]);

  // Map entity animation state to glTF animation clip
  const targetClipName = useMemo(() => {
    switch (animState) {
      case "walk":
      case "run":
        return "run";
      case "attack":
      case "attack1":
      case "attack2":
      case "attack3":
      case "air_attack":
        return "attack_slash";
      case "death":
        return "death";
      default:
        return "idle";
    }
  }, [animState]);

  // Animation State Machine with Smooth Cross-Fade
  useEffect(() => {
    if (!actions) return;

    const nextAction =
      actions[targetClipName] ||
      actions["idle"] ||
      Object.values(actions)[0];

    if (!nextAction) return;

    if (currentActionRef.current && currentActionRef.current !== nextAction) {
      currentActionRef.current.fadeOut(0.2);
    }

    nextAction.reset().fadeIn(0.2);

    if (targetClipName === "attack_slash") {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    nextAction.play();
    currentActionRef.current = nextAction;
  }, [targetClipName, actions]);

  // Facing direction lerp
  useFrame(() => {
    if (groupRef.current) {
      const targetRotY = facingLeft ? -Math.PI / 2 : Math.PI / 2;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.2
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Model Scene */}
      <primitive object={clonedScene} castShadow receiveShadow />

      {/* Dynamic Weapon Socket attached to hand */}
      <group position={weaponSocketPos}>
        <WeaponSocket3D weaponType={weaponType} rarity={weaponRarity} />
      </group>
    </group>
  );
}

// ==============================================================================
// RPGCharacterModel3D: Production 3D Character with Auto-Fallback
// ==============================================================================

export interface RPGCharacterModel3DProps {
  classId?: string;
  modelUrl?: string;
  animState?: EntityAnimationState;
  facingLeft?: boolean;
  color?: string;
  weaponType?: WeaponType;
  weaponRarity?: ItemRarity;
}

export const RPGCharacterModel3D = memo(function RPGCharacterModel3D({
  classId = "fighter",
  modelUrl,
  animState = "idle",
  facingLeft = false,
  color = "#f97316",
  weaponType,
  weaponRarity,
}: RPGCharacterModel3DProps) {
  // Resolve model path
  const targetPath =
    modelUrl ||
    `/assets/models/characters/${classId}.glb`;

  // Fallback UI (Greybox Character)
  const greyboxFallback = (
    <ProceduralGreyboxCharacter
      classId={classId}
      animState={animState}
      facingLeft={facingLeft}
      color={color}
      weaponType={weaponType}
    />
  );

  return (
    <ModelErrorBoundary fallback={greyboxFallback}>
      <Suspense fallback={greyboxFallback}>
        <InnerGLBModel
          modelPath={targetPath}
          animState={animState}
          facingLeft={facingLeft}
          weaponType={weaponType}
          weaponRarity={weaponRarity}
          color={color}
        />
      </Suspense>
    </ModelErrorBoundary>
  );
});

export default RPGCharacterModel3D;
