import { useGameStore } from "../useGameStore";

export default function MenuScreen() {
  const game   = useGameStore((s) => s.game);
  const enterVillage = useGameStore((s) => s.enterVillage);

  // Village and playing phases render their own HUDs — hide this overlay
  if (game.phase === "playing" || game.phase === "village") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 5, 30, 0.72)",
        zIndex: 20,
        fontFamily: "'Segoe UI', sans-serif",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420, width: "90%", padding: "0 16px", maxHeight: "92vh", overflowY: "auto", margin: "auto" }}>

        {/* ── Main menu ─────────────────────────────────────────────────────── */}
        {game.phase === "menu" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 6 }}>🐉</div>
            <h1
              style={{
                fontSize: "clamp(28px, 8vw, 46px)",
                fontWeight: "900",
                background: "linear-gradient(135deg, #f39c12, #e74c3c, #9b59b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: 6,
                letterSpacing: 2,
              }}
            >
              DRAGON QUEST
            </h1>
            <p style={{ color: "#7f8c8d", fontSize: 12, marginBottom: 20, letterSpacing: 1 }}>
              A 3D ACTION ADVENTURE
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "14px 20px",
                marginBottom: 22,
                textAlign: "left",
                color: "#bdc3c7",
                fontSize: 12,
                lineHeight: 2,
              }}
            >
              <div style={{ color: "#f39c12", fontWeight: "bold", marginBottom: 6, fontSize: 11, letterSpacing: 1 }}>
                HƯỚNG DẪN
              </div>
              <div>🏘️ Khám phá làng · nói chuyện với NPC</div>
              <div>🌀 Bước vào portal để vào ngục tối</div>
              <div>⚔️ J / CHÉM — Đánh cận chiến</div>
              <div>🔥 K / BẮN — Bắn fireball</div>
              <div>🌊 Vượt qua 5 wave để chiến thắng!</div>
            </div>

            <button
              onClick={enterVillage}
              style={{
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "white",
                border: "none",
                padding: "14px 52px",
                borderRadius: 50,
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: 2,
                boxShadow: "0 0 28px rgba(231,76,60,0.55)",
                touchAction: "manipulation",
              }}
            >
              ⚔️ BẮT ĐẦU HÀNH TRÌNH
            </button>

            <div style={{ color: "#4a4a6a", fontSize: 10, marginTop: 16, letterSpacing: 1 }}>
              🟢 3 người chơi online trong làng
            </div>
          </>
        )}

        {/* ── Game over ─────────────────────────────────────────────────────── */}
        {game.phase === "gameover" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 6 }}>💀</div>
            <h1 style={{ fontSize: "clamp(28px, 8vw, 44px)", fontWeight: "900", color: "#e74c3c", marginBottom: 8 }}>
              GAME OVER
            </h1>
            <p style={{ color: "#f39c12", fontSize: 22, marginBottom: 6 }}>⭐ {game.score} điểm</p>
            <p style={{ color: "#7f8c8d", fontSize: 13, marginBottom: 26 }}>Wave {game.wave} / 5</p>
            <button
              onClick={enterVillage}
              style={{
                background: "linear-gradient(135deg, #e67e22, #d35400)",
                color: "white", border: "none",
                padding: "13px 44px", borderRadius: 50,
                fontSize: 17, fontWeight: "bold", cursor: "pointer",
                touchAction: "manipulation",
              }}
            >
              🏘️ Về làng
            </button>
          </>
        )}

        {/* ── Victory ───────────────────────────────────────────────────────── */}
        {game.phase === "win" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 6 }}>🏆</div>
            <h1
              style={{
                fontSize: "clamp(26px, 7vw, 40px)",
                fontWeight: "900",
                background: "linear-gradient(135deg, #f1c40f, #f39c12)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: 8,
              }}
            >
              CHIẾN THẮNG!
            </h1>
            <p style={{ color: "#2ecc71", fontSize: 14, marginBottom: 6 }}>
              Đã vượt qua 5 wave! Bạn là Dragon Hero!
            </p>
            <p style={{ color: "#f39c12", fontSize: 26, fontWeight: "bold", marginBottom: 26 }}>
              ⭐ {game.score} điểm
            </p>
            <button
              onClick={enterVillage}
              style={{
                background: "linear-gradient(135deg, #2ecc71, #27ae60)",
                color: "white", border: "none",
                padding: "13px 44px", borderRadius: 50,
                fontSize: 17, fontWeight: "bold", cursor: "pointer",
                touchAction: "manipulation",
              }}
            >
              🏘️ Về làng
            </button>
          </>
        )}

      </div>
    </div>
  );
}
