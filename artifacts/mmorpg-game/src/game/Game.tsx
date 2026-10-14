import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import Arena from "./components/Arena";
import Village from "./components/Village";
import VillageNPCs from "./components/VillageNPCs";
import VillageHUD from "./components/VillageHUD";
import CharacterMenu from "./components/CharacterMenu";
import Player from "./components/Player";
import Enemies from "./components/Enemies";
import Bullets from "./components/Bullets";
import SkillFX from "./components/SkillFX";
import GameCamera from "./components/GameCamera";
import MenuCamera from "./components/MenuCamera";
import Stars from "./components/Particles";
import HUD from "./components/HUD";
import MenuScreen from "./components/MenuScreen";
import MobileControls from "./components/MobileControls";
import { useGameStore } from "./useGameStore";
import { mobileState } from "./mobileControls";
import { cameraControls, PITCH_MIN, PITCH_MAX } from "./cameraControls";
import { useDeviceType } from "./useDeviceDetect";

// ─── Keyboard tracking ────────────────────────────────────────────────────────
const keysDown = new Set<string>();
window.addEventListener("keydown", (e) => {
  keysDown.add(e.key);
  if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))
    e.preventDefault();
});
window.addEventListener("keyup", (e) => keysDown.delete(e.key));

function requestLock(canvas: HTMLElement) {
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
}
function exitLock() {
  if (document.pointerLockElement) document.exitPointerLock();
}

// ─── Controls builder ─────────────────────────────────────────────────────────
function buildControls(includeInteract = false): Record<string, boolean | number> {
  const jx = mobileState.joystick.x;
  const jy = mobileState.joystick.y;
  const dz = 0.18;
  return {
    cameraYaw: cameraControls.yaw,
    joystickX: jx, joystickY: jy,
    forward:  keysDown.has("ArrowUp")    || keysDown.has("w") || keysDown.has("W") || jy < -dz,
    back:     keysDown.has("ArrowDown")  || keysDown.has("s") || keysDown.has("S") || jy >  dz,
    left:     keysDown.has("ArrowLeft")  || keysDown.has("a") || keysDown.has("A") || jx < -dz,
    right:    keysDown.has("ArrowRight") || keysDown.has("d") || keysDown.has("D") || jx >  dz,
    jump:     keysDown.has(" ") || mobileState.jump,
    attack:   keysDown.has("j") || keysDown.has("J") || keysDown.has("z") || keysDown.has("Z") || mobileState.attack,
    shoot:    keysDown.has("k") || keysDown.has("K") || keysDown.has("x") || keysDown.has("X") || mobileState.shoot,
    interact: includeInteract ? (keysDown.has("e") || keysDown.has("E")) : false,
  };
}

// ─── Game loops ───────────────────────────────────────────────────────────────
function VillageLoop() {
  const updateVillage = useGameStore((s) => s.updateVillage);
  const phase = useGameStore((s) => s.game.phase);
  useFrame((_, delta) => {
    if (phase !== "village") return;
    updateVillage(Math.min(delta, 0.05), buildControls(true));
  });
  return null;
}

function BattleLoop() {
  const updateGame = useGameStore((s) => s.updateGame);
  const phase = useGameStore((s) => s.game.phase);
  useFrame((_, delta) => {
    if (phase !== "playing") return;
    updateGame(Math.min(delta, 0.05), buildControls(false));
  });
  return null;
}

// ─── Pointer lock status toast (doesn't block UI) ────────────────────────────
function LockToast({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const phase    = useGameStore((s) => s.game.phase);
  const menuOpen = useGameStore((s) => s.game.menuOpen);
  const device   = useDeviceType();
  const inGame   = phase === "playing";
  const locked   = useRef(false);

  useEffect(() => {
    const onChange = () => { locked.current = !!document.pointerLockElement; };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  if (!inGame || menuOpen) return null;

  const mobileHint  = "Joystick di chuyển · Nút J chém · Nút K bắn · 🧙 mở nhân vật";
  const desktopHint = "Click 3D để khóa chuột · WASD di chuyển · J chém · K bắn · Tab nhân vật";

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 22,
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{
        marginTop: 8,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: "5px 18px",
        color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: 1,
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

  // F11 keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F11") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <button
      onClick={toggle}
      title={isFs ? "Thoát toàn màn hình (F11)" : "Toàn màn hình (F11)"}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 28,
        background: "rgba(10,10,30,0.82)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        width: 40, height: 40,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
        color: "#aaa",
        transition: "background 0.2s, border-color 0.2s",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,10,30,0.82)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
      }}
    >
      {isFs ? "⊡" : "⛶"}
    </button>
  );
}

// ─── Persistent character toggle button (zIndex 28 — above PCOverlay 24) ─────
function CharacterButton() {
  const phase      = useGameStore((s) => s.game.phase);
  const toggleMenu = useGameStore((s) => s.toggleMenu);
  const player     = useGameStore((s) => s.player);
  const device     = useDeviceType();

  if (phase !== "village" && phase !== "playing") return null;
  if (device !== "desktop") return null; // mobile handled inside MobileControls

  const hasNotif = player.statPoints > 0 || player.skillPoints > 0;

  return (
    <button
      onClick={toggleMenu}
      style={{
        position: "fixed",
        top: 16, right: 16,
        zIndex: 28,
        background: hasNotif
          ? "linear-gradient(135deg, rgba(243,156,18,0.25), rgba(155,89,182,0.2))"
          : "rgba(10,10,30,0.82)",
        border: `1px solid ${hasNotif ? "#f1c40f" : "rgba(155,89,182,0.45)"}`,
        borderRadius: 10,
        padding: "8px 16px",
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: hasNotif ? "0 0 16px rgba(241,196,15,0.35)" : "none",
        transition: "all 0.2s",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <span style={{ fontSize: 16 }}>🧙</span>
      <div style={{ textAlign: "left" }}>
        <div style={{ color: "#c9b", fontSize: 11, fontWeight: "bold" }}>Nhân Vật</div>
        {hasNotif
          ? <div style={{ color: "#f1c40f", fontSize: 9 }}>✨ Có điểm mới! · Tab</div>
          : <div style={{ color: "#555", fontSize: 9 }}>Tab / C</div>
        }
      </div>
    </button>
  );
}

// ─── Lighting ─────────────────────────────────────────────────────────────────
function SceneLighting({ phase }: { phase: string }) {
  if (phase === "village") {
    return (
      <>
        <ambientLight intensity={0.7} color="#ffd580" />
        <directionalLight position={[30, 50, 20]} intensity={2.2} castShadow color="#fff5d0"
          shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-far={150} shadow-camera-left={-60} shadow-camera-right={60}
          shadow-camera-top={60} shadow-camera-bottom={-60} />
        <hemisphereLight args={["#a8d8ff", "#4a7c30", 0.9]} />
        <pointLight position={[0, 8, 0]} color="#ffc87a" intensity={1.5} distance={40} decay={2} />
        <fog attach="fog" args={["#c8e8ff", 60, 200]} />
      </>
    );
  }
  // Battle — dark and dramatic with colored accent lights
  return (
    <>
      <ambientLight intensity={0.18} color="#1a0533" />
      <directionalLight position={[15, 30, 10]} intensity={1.0} castShadow color="#c0a0ff"
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={80} shadow-camera-left={-30} shadow-camera-right={30}
        shadow-camera-top={30} shadow-camera-bottom={-30} />
      <hemisphereLight args={["#1a0533", "#0a0a00", 0.5]} />
      {/* Corner torch lights */}
      <pointLight position={[-12, 4, -12]} color="#ff6600" intensity={8} distance={20} decay={2} />
      <pointLight position={[ 12, 4, -12]} color="#ff4400" intensity={8} distance={20} decay={2} />
      <pointLight position={[-12, 4,  12]} color="#ff6600" intensity={8} distance={20} decay={2} />
      <pointLight position={[ 12, 4,  12]} color="#ff4400" intensity={8} distance={20} decay={2} />
      {/* Central magic circle glow */}
      <pointLight position={[0, 0.5, 0]} color="#9933ff" intensity={5} distance={14} decay={2} />
      <fog attach="fog" args={["#0a0018", 30, 100]} />
    </>
  );
}

export interface GameProps {
  character?: any;
  onBackToDashboard?: () => void;
  onOpenCharacterSheet?: () => void;
  onSyncReward?: (reward: { expGained: number; goldGained: number; kills: number }) => void;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Game({ character, onBackToDashboard, onOpenCharacterSheet, onSyncReward }: GameProps = {}) {
  const phase      = useGameStore((s) => s.game.phase);
  const menuOpen   = useGameStore((s) => s.game.menuOpen);
  const toggleMenu = useGameStore((s) => s.toggleMenu);
  const setMenuOpen= useGameStore((s) => s.setMenuOpen);
  const syncFromCharacter = useGameStore((s) => s.syncFromCharacter);
  const device     = useDeviceType();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (character) {
      syncFromCharacter(character);
    }
  }, [character, syncFromCharacter]);

  // Tab / C / Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "c" || e.key === "C") {
        if (phase === "village" || phase === "playing") { e.preventDefault(); toggleMenu(); }
      }
      if (e.key === "Escape" && menuOpen) { e.stopPropagation(); setMenuOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, menuOpen, toggleMenu, setMenuOpen]);

  // Pointer lock mouse look
  useEffect(() => {
    if (device !== "desktop") return;
    const YAW_SENS   = 0.0022;
    const PITCH_SENS = 0.0018;
    const onMove = (e: MouseEvent) => {
      const canvas = wrapRef.current?.querySelector("canvas");
      if (!canvas || document.pointerLockElement !== canvas) return;
      cameraControls.yaw  -= e.movementX * YAW_SENS;
      cameraControls.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX,
        cameraControls.pitch + e.movementY * PITCH_SENS));
    };
    // Lock mouse when clicking the canvas (not UI elements)
    const onCanvasClick = (e: MouseEvent) => {
      if ((phase === "playing" || phase === "village") && !menuOpen) {
        const canvas = wrapRef.current?.querySelector("canvas");
        if (canvas && e.target === canvas) requestLock(canvas);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onCanvasClick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onCanvasClick);
    };
  }, [device, phase, menuOpen]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "village") exitLock();
    if (menuOpen) exitLock();
  }, [phase, menuOpen]);

  const skyColor = phase === "village" ? "#87ceeb" : "#0a0a1a";

  return (
    <div ref={wrapRef} style={{ width: "100vw", height: "100vh", position: "relative", background: skyColor }}>
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 500, position: [0, 8, 10] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneLighting phase={phase} />
        <mesh renderOrder={-1}>
          <sphereGeometry args={[300, 16, 16]} />
          <meshBasicMaterial color={phase === "village" ? "#87ceeb" : "#0d0d2b"} side={2} />
        </mesh>

        {phase === "village" && (
          <>
            <Village />
            <VillageNPCs />
            <Player />
            <Stars />
            <GameCamera />
            <VillageLoop />
          </>
        )}

        {phase === "playing" && (
          <>
            <Arena />
            <Player />
            <SkillFX />
            <Enemies />
            <Bullets />
            <Stars />
            <GameCamera />
            <BattleLoop />
          </>
        )}

        {(phase === "menu" || phase === "gameover" || phase === "win") && (
          <>
            <Arena />
            <Stars />
            <MenuCamera />
          </>
        )}
      </Canvas>

      {/* ── DOM overlays (z-index layering) ──────────────────────────────────
          zIndex 10  : HUD stat bars (non-interactive)
          zIndex 20  : VillageHUD info panels
          zIndex 22  : LockToast (non-interactive hint)
          zIndex 28  : CharacterButton (always clickable, above pointer lock)
          zIndex 30  : MobileControls
          zIndex 50  : CharacterMenu (full-screen)
      ─────────────────────────────────────────────────────────────────────── */}
      <HUD />
      <VillageHUD />
      <LockToast canvasRef={canvasRef} />
      <CharacterButton />
      <FullscreenButton />
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          style={{
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 35,
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(255, 215, 0, 0.4)",
            borderRadius: 20,
            padding: "6px 16px",
            color: "#f8fafc",
            fontWeight: "bold",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <span>⬅️</span> Sảnh MMORPG
        </button>
      )}
      {onOpenCharacterSheet && (
        <button
          onClick={onOpenCharacterSheet}
          style={{
            position: "fixed",
            top: 14,
            right: 56,
            zIndex: 35,
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            borderRadius: 20,
            padding: "6px 14px",
            color: "#c084fc",
            fontWeight: "bold",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <span>📜</span> BXH / Túi Đồ
        </button>
      )}
      <CharacterMenu />
      <MenuScreen />
      {device !== "desktop" && <MobileControls />}
    </div>
  );
}
