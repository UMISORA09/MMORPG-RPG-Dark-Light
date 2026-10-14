import { memo } from "react";
import { useGameStore } from "../useGameStore";

// Non-interactive stat display — zIndex 10
const HUD = memo(function HUD() {
  const player  = useGameStore((s) => s.player);
  const game    = useGameStore((s) => s.game);
  const enemies = useGameStore((s) => s.enemies);

  if (game.phase !== "playing") return null;

  const hpPct  = player.health / player.maxHealth;
  const expPct = player.expToNext > 0 ? (player.exp / player.expToNext) * 100 : 0;
  const alive  = enemies.filter((e) => e.isAlive).length;
  const hasNotif = player.skillPoints > 0 || player.statPoints > 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10,
      pointerEvents: "none",
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* ── HP + EXP — bottom left ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 20, left: 20,
        background: "rgba(0,0,0,0.78)",
        border: "2px solid rgba(192,57,43,0.7)",
        borderRadius: 12, padding: "10px 14px", minWidth: 210,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#ff7675", fontSize: 11, fontWeight: "bold", letterSpacing: 1 }}>
            ❤ {player.name}
          </span>
          <span style={{ color: "#f1c40f", fontSize: 11, fontWeight: "bold" }}>
            Lv.{player.level}
          </span>
        </div>
        {/* HP bar */}
        <div style={{ background: "#1a1a1a", borderRadius: 5, height: 12, overflow: "hidden", border: "1px solid #333", marginBottom: 4 }}>
          <div style={{
            height: "100%",
            width: `${hpPct * 100}%`,
            background: hpPct > 0.5
              ? "linear-gradient(90deg,#00cc44,#00ff88)"
              : hpPct > 0.25
              ? "linear-gradient(90deg,#ff8800,#ffcc00)"
              : "linear-gradient(90deg,#cc0000,#ff4444)",
            transition: "width 0.2s, background 0.4s",
            borderRadius: 5,
          }} />
        </div>
        <div style={{ color: "#888", fontSize: 10, marginBottom: 6 }}>
          {player.health} / {player.maxHealth} HP
        </div>
        {/* EXP bar */}
        <div style={{ background: "#1a1a3a", borderRadius: 4, height: 6, overflow: "hidden", border: "1px solid #2a2a4a" }}>
          <div style={{
            height: "100%", width: `${expPct}%`,
            background: "linear-gradient(90deg,#3498db,#9b59b6)",
            borderRadius: 4, transition: "width 0.3s",
          }} />
        </div>
        <div style={{ color: "#444", fontSize: 9, marginTop: 3 }}>
          {player.exp} / {player.expToNext} EXP
        </div>

        {/* Unspent points warning */}
        {hasNotif && (
          <div style={{
            marginTop: 6,
            background: "rgba(241,196,15,0.1)",
            border: "1px solid rgba(241,196,15,0.3)",
            borderRadius: 6, padding: "3px 8px",
            color: "#f1c40f", fontSize: 9, fontWeight: "bold",
          }}>
            ✨ Có điểm chưa dùng — mở tab nhân vật!
          </div>
        )}
      </div>

      {/* ── Score + Gold — top-right info (no button here) ─────────────────── */}
      <div style={{
        position: "absolute", top: 60, right: 16,
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(243,156,18,0.4)",
        borderRadius: 10, padding: "8px 14px", textAlign: "right",
      }}>
        <div style={{ color: "#f39c12", fontSize: 16, fontWeight: "bold" }}>⭐ {player.score}</div>
        <div style={{ color: "#555", fontSize: 9, marginTop: 1 }}>ĐIỂM</div>
        <div style={{ color: "#e67e22", fontSize: 12, marginTop: 5, fontWeight: "bold" }}>
          WAVE {game.wave} / 5
        </div>
        <div style={{ color: "#f1c40f", fontSize: 11, marginTop: 3 }}>🪙 {player.gold}</div>
      </div>

      {/* ── Enemy count — top left ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 60, left: 16,
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(142,68,173,0.5)",
        borderRadius: 10, padding: "8px 14px",
      }}>
        <div style={{ color: "#e74c3c", fontSize: 13, fontWeight: "bold" }}>
          👾 {alive} kẻ địch
        </div>
        <div style={{ color: "#7f8c8d", fontSize: 9, marginTop: 2 }}>còn sống</div>
      </div>

      {/* ── Wave clear flash ─────────────────────────────────────────────────── */}
      {alive === 0 && (
        <div style={{
          position: "absolute", top: "45%", left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#f1c40f", fontSize: 28, fontWeight: "bold",
          textShadow: "0 0 20px #f1c40f",
          animation: "none",
        }}>
          ✨ Wave {game.wave} Cleared! ✨
        </div>
      )}
    </div>
  );
});

export default HUD;
