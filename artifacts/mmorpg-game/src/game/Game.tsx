import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, memo, useState } from "react";
import {
  SeamlessWorldMap,
  PlayerEntity25D,
  MonsterManager25D,
  LootManager3D,
  VFXManager,
  Particles as Stars,
  CanvasErrorBoundary,
} from "../canvas";
import { UnifiedGameHUD } from "../ui";
import { useGameStore, useGameWorldStore } from "../stores";
import { mobileState } from "./mobileControls";
import { cameraControls } from "./cameraControls";
import { useDeviceType } from "./useDeviceDetect";
import { initInputRouter, bindCanvasMouseControls, getInputState } from "./input/InputRouter";

import { AutoCombatController } from "../canvas/combat/AutoCombatController";
import { WorldEventManager } from "../canvas/world/WorldEventManager";

// Initialize InputRouter once
if (typeof window !== "undefined") {
  initInputRouter();
}

// ─── Controls builder ─────────────────────────────────────────────────────────
function buildControls(): Record<string, boolean | number> {
  const input = getInputState();
  const jx = mobileState.joystick.x;
  const jy = mobileState.joystick.y;
  const dz = 0.18;
  return {
    cameraYaw: cameraControls.yaw,
    joystickX: jx,
    joystickY: jy,
    forward:  input.forward || jy < -dz,
    back:     input.back    || jy >  dz,
    left:     input.left    || jx < -dz,
    right:    input.right   || jx >  dz,
    jump:     input.jump,
    attack:   input.attack,
    shoot:    mobileState.shoot,
    interact: input.interact,
  };
}

// ─── Single Unified Real-Time Game Loop ───────────────────────────────────────
function WorldLoop() {
  const updateWorld = useGameStore((s) => s.updateWorld);
  useFrame((_, delta) => {
    updateWorld(Math.min(delta, 0.05), buildControls());
  });
  return null;
}

// ─── Main Unified Game Component ──────────────────────────────────────────────
export interface GameProps {
  onLogout?: () => void;
}

const Game = memo(function Game({ onLogout }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const device = useDeviceType();

  // Dynamic Graphic Performance Settings
  const [graphics, setGraphics] = useState<{ preset: string; shadows: boolean; fpsCap: number }>(() => {
    try {
      const saved = localStorage.getItem("clb-graphics-settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { preset: "medium", shadows: true, fpsCap: 60 };
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("clb-graphics-settings");
        if (saved) setGraphics(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("clb-graphics-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("clb-graphics-updated", handleUpdate);
    };
  }, []);

  const isLowPreset = graphics.preset === "low" || graphics.shadows === false;
  const canvasDpr: [number, number] = isLowPreset ? [1, 1] : graphics.preset === "high" ? [1, 1.35] : [1, 1.2];

  // Unified Mouse & Keyboard Controls via InputRouter
  useEffect(() => {
    initInputRouter();
    const canvas = canvasRef.current;
    if (!canvas || device !== "desktop") return;
    return bindCanvasMouseControls(canvas);
  }, [device]);

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "hidden", background: "#030712" }}>
      {/* ── Single Unified 3D Canvas with High-Performance 2.5D GPU Optimization ── */}
      <Canvas
        ref={canvasRef}
        shadows={!isLowPreset}
        dpr={canvasDpr}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          depth: true,
          alpha: false,
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              console.warn("[WebGL] Context lost detected! Preserving canvas state...");
            },
            false
          );
          gl.domElement.addEventListener(
            "webglcontextrestored",
            () => {
              console.log("[WebGL] Context restored successfully!");
            },
            false
          );
        }}
        camera={{ position: [0, 18, 16], fov: 48 }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <CanvasErrorBoundary name="WorldMapLayer">
          <SeamlessWorldMap />
        </CanvasErrorBoundary>
        <CanvasErrorBoundary name="PlayerEntityLayer">
          <PlayerEntity25D />
        </CanvasErrorBoundary>
        <CanvasErrorBoundary name="MonsterLayer">
          <MonsterManager25D />
        </CanvasErrorBoundary>
        <CanvasErrorBoundary name="LootLayer">
          <LootManager3D />
        </CanvasErrorBoundary>
        <CanvasErrorBoundary name="VFXLayer">
          <VFXManager />
        </CanvasErrorBoundary>
        <CanvasErrorBoundary name="AutoCombatLayer">
          <AutoCombatController />
        </CanvasErrorBoundary>
        <CanvasErrorBoundary name="WorldEventLayer">
          <WorldEventManager />
        </CanvasErrorBoundary>
      </Canvas>

      {/* ── 2D Unified HUD Overlay ── */}
      <UnifiedGameHUD onLogout={onLogout} />
    </div>
  );
});

export default Game;
