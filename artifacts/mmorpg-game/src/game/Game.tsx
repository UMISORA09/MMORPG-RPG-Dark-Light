import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  SeamlessWorldMap,
  PlayerEntity25D,
  MonsterManager25D,
  VFXManager,
  Particles as Stars,
} from "../canvas";
import { UnifiedGameHUD } from "../ui";
import { useGameStore, useGameWorldStore } from "../stores";
import { mobileState } from "./mobileControls";
import { cameraControls } from "./cameraControls";
import { useDeviceType } from "./useDeviceDetect";

// ─── Keyboard tracking ────────────────────────────────────────────────────────
const keysDown = new Set<string>();

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    keysDown.add(e.key);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }

    // Modal & Skill Shortcuts
    if (e.key === "i" || e.key === "I") {
      useGameStore.getState().setActiveModal("inventory");
    } else if (e.key === "b" || e.key === "B") {
      useGameStore.getState().setActiveModal("shop");
    } else if (e.key === "l" || e.key === "L") {
      useGameStore.getState().setActiveModal("leaderboard");
    } else if (e.key === "h" || e.key === "H") {
      useGameStore.getState().setActiveModal("battle_logs");
    } else if (e.key === "1") {
      useGameStore.getState().triggerSkill(1);
    } else if (e.key === "2") {
      useGameStore.getState().triggerSkill(2);
    } else if (e.key === "3") {
      useGameStore.getState().triggerSkill(3);
    } else if (e.key === "Escape") {
      useGameStore.getState().closeActiveModal();
    }
  });

  window.addEventListener("keyup", (e) => keysDown.delete(e.key));
}

function requestLock(canvas: HTMLElement) {
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
}

function exitLock() {
  if (document.pointerLockElement) document.exitPointerLock();
}

// ─── Controls builder ─────────────────────────────────────────────────────────
function buildControls(): Record<string, boolean | number> {
  const jx = mobileState.joystick.x;
  const jy = mobileState.joystick.y;
  const dz = 0.18;
  return {
    cameraYaw: cameraControls.yaw,
    joystickX: jx,
    joystickY: jy,
    forward:  keysDown.has("ArrowUp")    || keysDown.has("w") || keysDown.has("W") || jy < -dz,
    back:     keysDown.has("ArrowDown")  || keysDown.has("s") || keysDown.has("S") || jy >  dz,
    left:     keysDown.has("ArrowLeft")  || keysDown.has("a") || keysDown.has("A") || jx < -dz,
    right:    keysDown.has("ArrowRight") || keysDown.has("d") || keysDown.has("D") || jx >  dz,
    jump:     keysDown.has(" ") || mobileState.jump,
    attack:   keysDown.has("j") || keysDown.has("J") || keysDown.has("z") || keysDown.has("Z") || mobileState.attack,
    shoot:    keysDown.has("k") || keysDown.has("K") || keysDown.has("x") || keysDown.has("X") || mobileState.shoot,
    interact: keysDown.has("e") || keysDown.has("E"),
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

  const mobileHint  = "Joystick di chuyển · Nút J chém · Nút K bắn · 1/2/3 Chiêu thức";
  const desktopHint = "Click 3D để xoay chuột · WASD di chuyển · J chém · K bắn · I Túi đồ · B Shop";

  return (
    <div
      style={{
        position: "fixed", top: 8, left: 0, right: 0, zIndex: 15,
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{
        background: "rgba(10,15,30,0.75)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: "4px 16px",
        color: "rgba(255,255,255,0.55)", fontSize: 11, letterSpacing: 0.5,
        backdropFilter: "blur(4px)",
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

  // Pointer lock handling for desktop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || device !== "desktop") return;

    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (menuOpen) return;
      isMouseDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      requestLock(canvas);
    };

    const onMouseUp = () => { isMouseDown = false; };

    const onMouseMove = (e: MouseEvent) => {
      if (menuOpen) return;
      if (document.pointerLockElement === canvas) {
        cameraControls.yaw -= e.movementX * 0.003;
        cameraControls.pitch = Math.max(-0.4, Math.min(0.6, cameraControls.pitch + e.movementY * 0.003));
      } else if (isMouseDown) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        cameraControls.yaw -= dx * 0.004;
        cameraControls.pitch = Math.max(-0.4, Math.min(0.6, cameraControls.pitch + dy * 0.004));
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [device, menuOpen]);

  // Release pointer lock if modal opens
  useEffect(() => {
    if (menuOpen) exitLock();
  }, [menuOpen]);

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
