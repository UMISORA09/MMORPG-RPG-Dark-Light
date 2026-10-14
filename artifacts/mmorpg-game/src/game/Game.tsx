import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  SeamlessWorldMap,
  PlayerEntity25D,
  MonsterManager25D,
  LootManager3D,
  VFXManager,
  Particles as Stars,
} from "../canvas";
import { UnifiedGameHUD } from "../ui";
import { useGameStore, useGameWorldStore } from "../stores";
import { mobileState } from "./mobileControls";
import { cameraControls } from "./cameraControls";
import { useDeviceType } from "./useDeviceDetect";
import { initInputRouter, bindCanvasMouseControls, getInputState } from "./input/InputRouter";

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

// ─── Pointer lock status toast ────────────────────────────────────────────────
function LockToast({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const menuOpen = useGameStore((s) => s.game.menuOpen);
  const device   = useDeviceType();
  const locked   = useRef(false);

  useEffect(() => {
    const onChange = () => { locked.current = !!document.pointerLockElement; };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  if (menuOpen) return null;

  const mobileHint  = "Joystick di chuyển · Nút J chém · 1/2/3 Chiêu thức · B Túi đồ · V Đổi 2.5D/3D";
  const desktopHint = "WASD di chuyển · Chuột Trái / J Chém · Giữ Chuột Phải xoay Camera · 1/Q, 2/E, 3/R Kỹ năng · F Tương tác · B Túi · V Đổi 2.5D/3D";

  return (
    <div
      style={{
        position: "fixed", top: 8, left: 0, right: 0, zIndex: 15,
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{
        background: "rgba(10,15,30,0.85)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 20, padding: "5px 18px",
        color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}>
        {device === "desktop" ? desktopHint : mobileHint}
      </div>
    </div>
  );
}

// ─── Fullscreen button ────────────────────────────────────────────────────────
function FullscreenButton() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <button
      onClick={toggle}
      title={isFs ? "Thoát toàn màn hình (F11)" : "Toàn màn hình (F11)"}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 25,
        background: "rgba(10,10,30,0.82)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        padding: "6px 12px",
        color: "#fff",
        cursor: "pointer",
        fontSize: 12,
        backdropFilter: "blur(6px)",
      }}
    >
      {isFs ? "✕ Thu nhỏ" : "⛶ Toàn màn hình"}
    </button>
  );
}

// ─── Main Unified Game Component ──────────────────────────────────────────────
export interface GameProps {
  onLogout?: () => void;
}

const Game = memo(function Game({ onLogout }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const device = useDeviceType();
  const menuOpen = useGameStore((s) => s.game.menuOpen);

  // Unified Mouse & Keyboard Controls via InputRouter
  useEffect(() => {
    initInputRouter();
    const canvas = canvasRef.current;
    if (!canvas || device !== "desktop") return;
    return bindCanvasMouseControls(canvas);
  }, [device]);

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "hidden", background: "#030712" }}>
      {/* ── Single Unified 3D Canvas with 2.5D Billboard Sprite Engine ── */}
      <Canvas
        ref={canvasRef}
        shadows
        camera={{ position: [0, 8, 14], fov: 50 }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <SeamlessWorldMap />
        <PlayerEntity25D />
        <MonsterManager25D />
        <LootManager3D />
        <VFXManager />
        <Stars />
      </Canvas>

      {/* ── 2D Unified HUD Overlay ── */}
      <UnifiedGameHUD onLogout={onLogout} />
      <LockToast canvasRef={canvasRef} />
      <FullscreenButton />
    </div>
  );
});

export default Game;
