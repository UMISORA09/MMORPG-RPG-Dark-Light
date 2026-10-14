import { useEffect, useRef, useState } from "react";
import { mobileState } from "../mobileControls";
import { cameraControls, PITCH_MIN, PITCH_MAX } from "../cameraControls";
import { useDeviceType } from "../useDeviceDetect";
import { useGameStore } from "../useGameStore";

const JOYSTICK_RADIUS = 62;
const KNOB_RADIUS = 26;

export default function MobileControls() {
  const device = useDeviceType();
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);

  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (device === "desktop") return null;

  if (portrait) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 50, background: "#0d1117",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", color: "white",
        fontFamily: "'Segoe UI', sans-serif", gap: 20, pointerEvents: "all",
      }}>
        <div style={{ fontSize: 60 }}>📱</div>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#f39c12" }}>Xoay ngang để chơi!</div>
        <div style={{ fontSize: 13, color: "#7f8c8d" }}>Rotate your device to landscape</div>
      </div>
    );
  }

  return <LandscapeControls />;
}

function LandscapeControls() {
  const joystickArea  = useRef<HTMLDivElement>(null);
  const activeJoyId   = useRef<number | null>(null);
  const joyOrigin     = useRef({ x: 0, y: 0 });
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const activeLookId  = useRef<number | null>(null);
  const lookLast      = useRef({ x: 0, y: 0 });

  const [jumpActive,   setJumpActive]   = useState(false);
  const [attackActive, setAttackActive] = useState(false);
  const [shootActive,  setShootActive]  = useState(false);

  const phase      = useGameStore((s) => s.game.phase);
  const menuOpen   = useGameStore((s) => s.game.menuOpen);
  const toggleMenu = useGameStore((s) => s.toggleMenu);
  const player     = useGameStore((s) => s.player);
  const showInGame = phase === "village" || phase === "playing";
  const hasNotif   = player.statPoints > 0 || player.skillPoints > 0;

  // Ref để look-handler kiểm tra mà không cần re-register effect
  const menuOpenRef = useRef(false);
  useEffect(() => { menuOpenRef.current = menuOpen; }, [menuOpen]);

  // ── Joystick ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const area = joystickArea.current;
    if (!area) return;
    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      if (activeJoyId.current !== null) return;
      const t = e.changedTouches[0];
      activeJoyId.current = t.identifier;
      const r = area.getBoundingClientRect();
      joyOrigin.current = { x: t.clientX - r.left, y: t.clientY - r.top };
      setKnobPos({ x: 0, y: 0 });
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== activeJoyId.current) continue;
        const r = area.getBoundingClientRect();
        const dx = t.clientX - r.left - joyOrigin.current.x;
        const dy = t.clientY - r.top  - joyOrigin.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamp = Math.min(dist, JOYSTICK_RADIUS);
        const nx = dist > 0 ? (dx / dist) * clamp : 0;
        const ny = dist > 0 ? (dy / dist) * clamp : 0;
        setKnobPos({ x: nx, y: ny });
        mobileState.joystick.x = dist > 6 ? dx / dist : 0;
        mobileState.joystick.y = dist > 6 ? dy / dist : 0;
      }
    };
    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeJoyId.current) {
          activeJoyId.current = null;
          setKnobPos({ x: 0, y: 0 });
          mobileState.joystick.x = 0;
          mobileState.joystick.y = 0;
        }
      }
    };
    area.addEventListener("touchstart",  onStart, { passive: false });
    area.addEventListener("touchmove",   onMove,  { passive: false });
    area.addEventListener("touchend",    onEnd,   { passive: false });
    area.addEventListener("touchcancel", onEnd,   { passive: false });
    return () => {
      area.removeEventListener("touchstart",  onStart);
      area.removeEventListener("touchmove",   onMove);
      area.removeEventListener("touchend",    onEnd);
      area.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // ── Camera look drag ─────────────────────────────────────────────────────────
  useEffect(() => {
    const YAW_SENS   = 0.006;
    const PITCH_SENS = 0.005;
    const LOOK_LEFT  = 0.38;
    const BTN_RIGHT  = 180; // px reserved for buttons + char button

    const onStart = (e: TouchEvent) => {
      // Không chiếm touch khi menu nhân vật đang mở
      if (menuOpenRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const fromRight = window.innerWidth - t.clientX;
        const fromTop   = t.clientY;
        if (
          t.clientX > window.innerWidth * LOOK_LEFT &&
          fromRight > BTN_RIGHT &&
          fromTop > 80 &&                        // avoid char button at top
          activeLookId.current === null
        ) {
          activeLookId.current = t.identifier;
          lookLast.current = { x: t.clientX, y: t.clientY };
        }
      }
    };
    const onMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== activeLookId.current) continue;
        const dx = t.clientX - lookLast.current.x;
        const dy = t.clientY - lookLast.current.y;
        lookLast.current = { x: t.clientX, y: t.clientY };
        cameraControls.yaw  -= dx * YAW_SENS;
        cameraControls.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX,
          cameraControls.pitch + dy * PITCH_SENS));
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeLookId.current)
          activeLookId.current = null;
      }
    };
    window.addEventListener("touchstart",  onStart, { passive: true });
    window.addEventListener("touchmove",   onMove,  { passive: true });
    window.addEventListener("touchend",    onEnd,   { passive: true });
    window.addEventListener("touchcancel", onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart",  onStart);
      window.removeEventListener("touchmove",   onMove);
      window.removeEventListener("touchend",    onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  function btnHandlers(setter: (v: boolean) => void, key: "jump" | "attack" | "shoot") {
    return {
      onTouchStart:  (e: React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); mobileState[key] = true;  setter(true);  },
      onTouchEnd:    (e: React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); mobileState[key] = false; setter(false); },
      onTouchCancel: (e: React.TouchEvent) => { e.preventDefault();                      mobileState[key] = false; setter(false); },
    };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none" }}>

      {/* ── Character menu button — top right, always on top ─────────────── */}
      {showInGame && (
        <button
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); toggleMenu(); }}
          style={{
            position: "absolute", top: 12, right: 12,
            pointerEvents: "all",
            background: hasNotif
              ? "linear-gradient(135deg, rgba(243,156,18,0.3), rgba(155,89,182,0.25))"
              : "rgba(10,10,30,0.85)",
            border: `1.5px solid ${hasNotif ? "#f1c40f" : "rgba(155,89,182,0.5)"}`,
            borderRadius: 10,
            padding: "7px 14px",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: hasNotif ? "0 0 14px rgba(241,196,15,0.4)" : "0 2px 8px rgba(0,0,0,0.5)",
            touchAction: "manipulation",
            fontFamily: "'Segoe UI', sans-serif",
          }}
        >
          <span style={{ fontSize: 18 }}>🧙</span>
          <div>
            <div style={{ color: "#c9b", fontSize: 11, fontWeight: "bold" }}>Nhân Vật</div>
            {hasNotif && <div style={{ color: "#f1c40f", fontSize: 9 }}>✨ Điểm mới!</div>}
          </div>
        </button>
      )}

      {/* Crosshair */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
        <div style={{ position: "relative", width: 18, height: 18 }}>
          <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 2, background: "rgba(255,255,255,0.6)", transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, width: 2, height: "100%", background: "rgba(255,255,255,0.6)", transform: "translateX(-50%)" }} />
        </div>
      </div>

      {/* Look hint */}
      <div style={{
        position: "absolute", top: "50%", left: "55%",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        color: "rgba(255,255,255,0.14)", fontSize: 10, letterSpacing: 1, textAlign: "center",
      }}>
        ← Vuốt để nhìn xung quanh →
      </div>

      {/* ── Joystick — bottom left ──────────────────────────────────────────── */}
      <div
        ref={joystickArea}
        style={{
          position: "absolute", bottom: 24, left: 24,
          width: JOYSTICK_RADIUS * 2 + 20, height: JOYSTICK_RADIUS * 2 + 20,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "2px solid rgba(255,255,255,0.22)",
          pointerEvents: "all",
          display: "flex", alignItems: "center", justifyContent: "center",
          touchAction: "none",
        }}
      >
        <div style={{ position: "absolute", width: 2, height: "58%", background: "rgba(255,255,255,0.14)", borderRadius: 2 }} />
        <div style={{ position: "absolute", width: "58%", height: 2, background: "rgba(255,255,255,0.14)", borderRadius: 2 }} />
        <div style={{
          position: "absolute",
          width: KNOB_RADIUS * 2, height: KNOB_RADIUS * 2, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, rgba(255,200,50,0.92), rgba(230,120,20,0.82))",
          border: "2px solid rgba(255,200,50,0.65)",
          boxShadow: "0 0 14px rgba(255,160,0,0.55)",
          transform: `translate(${knobPos.x}px,${knobPos.y}px)`,
          transition: activeJoyId.current !== null ? "none" : "transform 0.14s ease",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Action buttons — bottom right ───────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 22, right: 18,
        display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end",
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn label="⚔️" sub="CHÉM"  active={attackActive} color={attackActive ? "#ff2222" : "#c0392b"} glow="rgba(231,76,60,0.6)"  handlers={btnHandlers(setAttackActive, "attack")} />
          <Btn label="🔥" sub="BẮN"   active={shootActive}  color={shootActive  ? "#ff8800" : "#e67e22"} glow="rgba(230,126,34,0.6)" handlers={btnHandlers(setShootActive,  "shoot")} />
        </div>
        <Btn label="🦘" sub="NHẢY"   active={jumpActive}   color={jumpActive   ? "#00cc66" : "#27ae60"} glow="rgba(39,174,96,0.6)"  handlers={btnHandlers(setJumpActive,   "jump")} wide />
      </div>
    </div>
  );
}

function Btn({ label, sub, color, glow, handlers, wide, active }: {
  label: string; sub: string; color: string; glow: string;
  handlers: object; wide?: boolean; active: boolean;
}) {
  return (
    <div
      {...handlers}
      style={{
        width: wide ? 95 : 74, height: 60, borderRadius: 14,
        background: color,
        border: `2px solid ${color}`,
        boxShadow: `0 0 ${active ? 20 : 12}px ${glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", pointerEvents: "all",
        userSelect: "none", touchAction: "none", gap: 1,
        transform: active ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.08s, box-shadow 0.08s",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: 9, fontWeight: "bold", color: "rgba(255,255,255,0.85)", letterSpacing: 1 }}>{sub}</span>
    </div>
  );
}
