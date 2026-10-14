import { memo } from "react";
import { useGameStore } from "../useGameStore";
import { useDeviceType } from "../useDeviceDetect";

// Non-interactive village info — zIndex 20
const VillageHUD = memo(function VillageHUD() {
  const game        = useGameStore((s) => s.game);
  const player      = useGameStore((s) => s.player);
  const enterBattle = useGameStore((s) => s.enterBattle);
  const device      = useDeviceType();

  if (game.phase !== "village") return null;

  const hpPct  = player.health / player.maxHealth;
  const expPct = player.expToNext > 0 ? (player.exp / player.expToNext) * 100 : 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 20,
      pointerEvents: "none",
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Zone label */}
      <div style={{
        position: "absolute", top: 16, left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: "5px 20px",
        color: "#f1c40f", fontSize: 13, fontWeight: "bold", letterSpacing: 2,
        textShadow: "0 0 8px #f39c12",
        whiteSpace: "nowrap",
      }}>
        🏘️ LÀNG KHỞI ĐẦU
      </div>

      {/* Online badges */}
      <div style={{
        position: "absolute", top: 54, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", gap: 6,
      }}>
        {["Hanzo", "SilverBlade", "Ryuko"].map((name, i) => (
          <div key={i} style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid #27ae60",
            borderRadius: 12, padding: "2px 10px",
            fontSize: 10, color: "#2ecc71", fontWeight: "bold",
          }}>
            🟢 {name}
          </div>
        ))}
      </div>

      {/* ── HP + EXP — bottom left ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 20, left: 20,
        background: "rgba(0,0,0,0.78)",
        border: "2px solid rgba(192,57,43,0.7)",
        borderRadius: 12, padding: "10px 14px", minWidth: 210,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "#ff7675", fontSize: 11, fontWeight: "bold", letterSpacing: 1 }}>
            ❤ {player.name}
          </span>
          <span style={{ color: "#f1c40f", fontSize: 11, fontWeight: "bold" }}>
            Lv.{player.level}
          </span>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 5, height: 12, overflow: "hidden", border: "1px solid #333", marginBottom: 4 }}>
          <div style={{
            height: "100%", width: `${hpPct * 100}%`,
            background: "linear-gradient(90deg,#00cc44,#00ff88)",
            transition: "width 0.2s", borderRadius: 5,
          }} />
        </div>
        <div style={{ color: "#888", fontSize: 10, marginBottom: 5 }}>
          {player.health} / {player.maxHealth} HP
        </div>
        <div style={{ background: "#1a1a3a", borderRadius: 4, height: 6, overflow: "hidden", border: "1px solid #2a2a4a" }}>
          <div style={{
            height: "100%", width: `${expPct}%`,
            background: "linear-gradient(90deg,#3498db,#9b59b6)",
            borderRadius: 4,
          }} />
        </div>
        <div style={{ color: "#444", fontSize: 9, marginTop: 2 }}>
          {player.exp} / {player.expToNext} EXP
        </div>
      </div>

      {/* ── Gold + Score — top right (below CharacterButton at top:16, right:16) */}
      <div style={{
        position: "absolute", top: 60, right: 16,
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(243,156,18,0.4)",
        borderRadius: 10, padding: "8px 14px", textAlign: "right",
      }}>
        <div style={{ color: "#f1c40f", fontSize: 18, fontWeight: "bold" }}>🪙 {player.gold}</div>
        <div style={{ color: "#555", fontSize: 9, marginTop: 1 }}>VÀNG</div>
        <div style={{ color: "#f39c12", fontSize: 12, marginTop: 5, fontWeight: "bold" }}>⭐ {player.score}</div>
      </div>

      {/* ── Portal prompt (interactive) ─────────────────────────────────────── */}
      {game.nearPortal && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: device === "desktop" ? "none" : "all",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.92)",
            border: "2px solid #c039e0",
            borderRadius: 16, padding: "20px 32px",
            boxShadow: "0 0 30px rgba(192,57,224,0.5)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌀</div>
            <div style={{ color: "#c039e0", fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
              Ngục Tối
            </div>
            <div style={{ color: "#aaa", fontSize: 12, marginBottom: 14 }}>
              Quái vật đang chờ bên trong...
            </div>
            {device === "desktop" ? (
              <div style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>
                Nhấn{" "}
                <kbd style={{ background: "#333", border: "1px solid #666", borderRadius: 4, padding: "1px 7px" }}>
                  E
                </kbd>{" "}
                để vào
              </div>
            ) : (
              <button
                onClick={enterBattle}
                style={{
                  background: "linear-gradient(135deg,#c039e0,#7b1fa2)",
                  color: "#fff", border: "none",
                  padding: "10px 28px", borderRadius: 24,
                  fontSize: 14, fontWeight: "bold",
                  cursor: "pointer", touchAction: "manipulation",
                  pointerEvents: "all",
                }}
              >
                ⚔️ Vào Ngục Tối
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default VillageHUD;
