import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGameStore, computeBonus } from "../useGameStore";
import { useDeviceType } from "../useDeviceDetect";
import {
  ITEMS,
  ITEM_MAP,
  TIER_COLOR,
  TIER_NAME,
  type ItemSlot,
} from "../data/items";
import { SKILLS } from "../data/skills";
import {
  PLAYER_MAX_HEALTH,
  PLAYER_SPEED,
  PLAYER_ATTACK_DAMAGE,
  BULLET_DAMAGE,
} from "../constants";
import type { Equipment } from "../types";

type Tab = "character" | "stats" | "bag" | "equipment" | "skills";

const SLOT_LABELS: Record<ItemSlot, string> = {
  weapon: "⚔️ Vũ Khí",
  armor: "🛡️ Giáp",
  helmet: "⛑️ Mũ Bảo Hiểm",
  accessory: "📿 Phụ Kiện",
};

const SLOT_ICONS: Record<ItemSlot, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  helmet: "⛑️",
  accessory: "📿",
};

const STAT_INFO = [
  { key: "hp", label: "❤️ Máu", per: "+20 HP/điểm", color: "#e74c3c" },
  { key: "atk", label: "⚔️ Tấn Công", per: "+5 ATK/điểm", color: "#e67e22" },
  {
    key: "def",
    label: "🛡️ Phòng Thủ",
    per: "+3% giảm dmg/điểm",
    color: "#3498db",
  },
  { key: "spd", label: "💨 Tốc Độ", per: "+0.3 SPD/điểm", color: "#1abc9c" },
  {
    key: "magic",
    label: "✨ Phép Thuật",
    per: "+5 MAG/điểm",
    color: "#9b59b6",
  },
] as const;

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "character", label: "Nhân Vật", icon: "🧙" },
  { id: "stats", label: "Chỉ Số", icon: "📊" },
  { id: "bag", label: "Hành Trang", icon: "🎒" },
  { id: "equipment", label: "Trang Bị", icon: "⚔️" },
  { id: "skills", label: "Kỹ Năng", icon: "✨" },
];

// ── Tiny reusable ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: "#f39c12",
        fontSize: 11,
        fontWeight: "bold",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ flex: 1, height: 1, background: "rgba(243,156,18,0.2)" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(243,156,18,0.2)" }} />
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{ background: "#1a1a2e", border: "1px solid #333", padding: "1px 6px", borderRadius: 4, color: "#666" }}>
      {children}
    </kbd>
  );
}

function Pill({
  children,
  color = "#f39c12",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        background: `${color}22`,
        border: `1px solid ${color}66`,
        color,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: "bold",
      }}
    >
      {children}
    </span>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "success" | "danger" | "ghost";
  small?: boolean;
}) {
  const bg = disabled
    ? "rgba(255,255,255,0.06)"
    : variant === "success"
      ? "linear-gradient(135deg,#27ae60,#229954)"
      : variant === "danger"
        ? "linear-gradient(135deg,#c0392b,#e74c3c)"
        : variant === "ghost"
          ? "rgba(255,255,255,0.08)"
          : "linear-gradient(135deg,#f39c12,#e67e22)";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        border: disabled ? "1px solid rgba(255,255,255,0.08)" : "none",
        color: disabled ? "#444" : "#fff",
        padding: small ? "4px 10px" : "6px 14px",
        borderRadius: 7,
        fontSize: small ? 10 : 12,
        fontWeight: "bold",
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Tab: Nhân Vật ────────────────────────────────────────────────────────────
function CharacterTab() {
  const player = useGameStore((s) => s.player);
  const buyPotion = useGameStore((s) => s.buyPotion);
  const bonus = computeBonus(player);

  const expPct =
    player.expToNext > 0
      ? Math.min(100, (player.exp / player.expToNext) * 100)
      : 0;
  const hpPct =
    player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 0;
  const maxHP = PLAYER_MAX_HEALTH + bonus.hp;
  const atkVal = PLAYER_ATTACK_DAMAGE + bonus.atk;
  const defVal = Math.min(50, bonus.def);
  const spdVal = (PLAYER_SPEED + bonus.spd).toFixed(1);
  const magicVal = BULLET_DAMAGE + bonus.magic;
  const canPotion = player.gold >= 30 && player.health < player.maxHealth;

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {/* Left: Avatar + info */}
      <div style={{ minWidth: 180, flex: "0 0 180px" }}>
        {/* Avatar */}
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            background: "linear-gradient(135deg, #1a0a2e, #2c1654)",
            border: "2px solid rgba(155,89,182,0.4)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 14,
            boxShadow: "0 0 30px rgba(155,89,182,0.2)",
          }}
        >
          🐉
        </div>

        {/* Name + class */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ color: "#f1c40f", fontWeight: "bold", fontSize: 16 }}>
            {player.name}
          </div>
          <div style={{ color: "#9b59b6", fontSize: 12, marginTop: 2 }}>
            Dragon Warrior
          </div>
        </div>

        {/* Level badge */}
        <div
          style={{
            background: "linear-gradient(135deg,#9b59b6,#8e44ad)",
            borderRadius: 10,
            padding: "8px 12px",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ color: "#ddd", fontSize: 10, marginBottom: 2 }}>
            CẤP ĐỘ
          </div>
          <div style={{ color: "#fff", fontWeight: "bold", fontSize: 22 }}>
            {player.level}
          </div>
        </div>

        {/* EXP */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ color: "#7f8c8d", fontSize: 10 }}>EXP</span>
            <span style={{ color: "#7f8c8d", fontSize: 10 }}>
              {player.exp} / {player.expToNext}
            </span>
          </div>
          <div
            style={{
              background: "#1a1a2e",
              borderRadius: 6,
              height: 8,
              overflow: "hidden",
              border: "1px solid rgba(155,89,182,0.3)",
            }}
          >
            <div
              style={{
                width: `${expPct}%`,
                height: "100%",
                background: "linear-gradient(90deg,#9b59b6,#e74c3c)",
                borderRadius: 6,
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>

        {/* Gold */}
        <div
          style={{
            background: "rgba(241,196,15,0.08)",
            border: "1px solid rgba(241,196,15,0.25)",
            borderRadius: 8,
            padding: "8px 12px",
            textAlign: "center",
            color: "#f1c40f",
            fontWeight: "bold",
            fontSize: 15,
          }}
        >
          🪙 {player.gold} vàng
        </div>
      </div>

      {/* Right: stats + potion */}
      <div style={{ flex: 1, minWidth: 220 }}>
        {/* HP bar */}
        <div
          style={{
            background: "rgba(231,76,60,0.08)",
            border: "1px solid rgba(231,76,60,0.25)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{ color: "#e74c3c", fontWeight: "bold", fontSize: 13 }}
            >
              ❤️ Máu
            </span>
            <span style={{ color: "#fff", fontWeight: "bold" }}>
              {Math.round(player.health)} / {player.maxHealth}
            </span>
          </div>
          <div
            style={{
              background: "#1a1a2e",
              borderRadius: 6,
              height: 12,
              overflow: "hidden",
              border: "1px solid rgba(231,76,60,0.3)",
            }}
          >
            <div
              style={{
                width: `${hpPct}%`,
                height: "100%",
                borderRadius: 6,
                background:
                  hpPct > 50
                    ? "linear-gradient(90deg,#27ae60,#2ecc71)"
                    : hpPct > 25
                      ? "linear-gradient(90deg,#e67e22,#f39c12)"
                      : "linear-gradient(90deg,#c0392b,#e74c3c)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            {
              icon: "⚔️",
              label: "Tấn Công",
              val: `${atkVal}`,
              color: "#e67e22",
            },
            {
              icon: "🛡️",
              label: "Phòng Thủ",
              val: `${defVal}%`,
              color: "#3498db",
            },
            { icon: "💨", label: "Tốc Độ", val: spdVal, color: "#1abc9c" },
            {
              icon: "✨",
              label: "Phép Thuật",
              val: `${magicVal}`,
              color: "#9b59b6",
            },
          ].map(({ icon, label, val, color }) => (
            <div
              key={label}
              style={{
                background: `${color}11`,
                border: `1px solid ${color}33`,
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <div style={{ color: "#888", fontSize: 9 }}>{label}</div>
                <div style={{ color, fontWeight: "bold", fontSize: 14 }}>
                  {val}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Max HP info */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#aaa", fontSize: 12, flex: 1 }}>
            ❤️ HP tối đa: <b style={{ color: "#e74c3c" }}>{maxHP}</b>
          </span>
        </div>

        {/* Points summary */}
        {(player.statPoints > 0 || player.skillPoints > 0) && (
          <div
            style={{
              background: "rgba(243,156,18,0.06)",
              border: "1px solid rgba(243,156,18,0.25)",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                color: "#f39c12",
                fontWeight: "bold",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              ⚡ Điểm chưa phân bổ
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {player.statPoints > 0 && (
                <Pill color="#f39c12">🌟 {player.statPoints} điểm chỉ số</Pill>
              )}
              {player.skillPoints > 0 && (
                <Pill color="#9b59b6">
                  ✨ {player.skillPoints} điểm kỹ năng
                </Pill>
              )}
            </div>
          </div>
        )}

        {/* Potion */}
        <div
          style={{
            background: "rgba(46,204,113,0.06)",
            border: "1px solid rgba(46,204,113,0.25)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🧪</span>
            <div style={{ flex: 1 }}>
              <div
                style={{ color: "#2ecc71", fontWeight: "bold", fontSize: 13 }}
              >
                Thuốc Hồi Máu
              </div>
              <div style={{ color: "#666", fontSize: 10, marginTop: 1 }}>
                Hồi phục +50 HP • 🪙 30 vàng
              </div>
            </div>
            <Btn onClick={buyPotion} disabled={!canPotion} variant="success">
              {player.health >= player.maxHealth ? "Máu đầy" : "Uống — 🪙30"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Chỉ Số ──────────────────────────────────────────────────────────────
function StatsTab() {
  const player = useGameStore((s) => s.player);
  const allocateStat = useGameStore((s) => s.allocateStat);
  const bonus = computeBonus(player);

  const totals: Record<string, string> = {
    hp: `${PLAYER_MAX_HEALTH + bonus.hp} HP`,
    atk: `${PLAYER_ATTACK_DAMAGE + bonus.atk} ATK`,
    def: `${Math.min(50, bonus.def)}% giảm`,
    spd: `${(PLAYER_SPEED + bonus.spd).toFixed(1)} u/s`,
    magic: `${BULLET_DAMAGE + bonus.magic} MAG`,
  };

  const bases: Record<string, number | string> = {
    hp: PLAYER_MAX_HEALTH,
    atk: PLAYER_ATTACK_DAMAGE,
    def: 0,
    spd: PLAYER_SPEED,
    magic: BULLET_DAMAGE,
  };

  // Equipment bonuses per stat
  const eqBonus = { hp: 0, atk: 0, def: 0, spd: 0, magic: 0 };
  for (const itemId of Object.values(player.equipment)) {
    const item = itemId ? ITEM_MAP[itemId] : null;
    if (!item) continue;
    eqBonus.hp += item.stats.hp ?? 0;
    eqBonus.atk += item.stats.atk ?? 0;
    eqBonus.def += item.stats.def ?? 0;
    eqBonus.spd += item.stats.spd ?? 0;
    eqBonus.magic += item.stats.magic ?? 0;
  }
  // Skill bonuses
  const skillBonus = { hp: 0, atk: 0, def: 0, spd: 0, magic: 0 };
  if (player.learnedSkills.includes("iron_body")) skillBonus.def += 20;
  if (player.learnedSkills.includes("swift_foot")) skillBonus.spd += 1.5;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ color: "#888", fontSize: 12 }}>
          Phân bổ điểm chỉ số để tăng sức mạnh nhân vật.
        </div>
        {player.statPoints > 0 ? (
          <Pill color="#f39c12">🌟 {player.statPoints} điểm còn lại</Pill>
        ) : (
          <span style={{ color: "#555", fontSize: 11 }}>
            Không có điểm chưa dùng
          </span>
        )}
      </div>

      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 70px 70px 70px 40px",
          gap: 8,
          marginBottom: 8,
          padding: "0 12px",
        }}
      >
        {["Chỉ Số", "Cơ Bản", "Phân Bổ", "Trang Bị", "Kỹ Năng", ""].map(
          (h, i) => (
            <div
              key={i}
              style={{
                color: "#555",
                fontSize: 10,
                textAlign: i > 0 ? "center" : "left",
              }}
            >
              {h}
            </div>
          ),
        )}
      </div>

      {STAT_INFO.map(({ key, label, per, color }) => {
        const allocated = (
          player.allocatedStats as unknown as Record<string, number>
        )[key];
        const eqB = (eqBonus as unknown as Record<string, number>)[key];
        const skB = (skillBonus as unknown as Record<string, number>)[key];
        const base = bases[key];
        return (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 70px 70px 70px 40px",
              gap: 8,
              alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${color}22`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 8,
            }}
          >
            {/* Label + per */}
            <div>
              <div style={{ color: "#ddd", fontWeight: "bold", fontSize: 13 }}>
                {label}
              </div>
              <div style={{ color: "#555", fontSize: 9, marginTop: 1 }}>
                {per}
              </div>
            </div>
            {/* Base */}
            <div style={{ textAlign: "center", color: "#888", fontSize: 12 }}>
              {base}
            </div>
            {/* Allocated */}
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  color: allocated > 0 ? "#f39c12" : "#555",
                  fontWeight: "bold",
                  fontSize: 12,
                }}
              >
                {allocated > 0 ? `+${allocated}` : "0"}
              </span>
            </div>
            {/* Equipment */}
            <div style={{ textAlign: "center" }}>
              <span
                style={{ color: eqB > 0 ? "#3498db" : "#555", fontSize: 12 }}
              >
                {eqB > 0 ? `+${eqB}` : "—"}
              </span>
            </div>
            {/* Skill */}
            <div style={{ textAlign: "center" }}>
              <span
                style={{ color: skB > 0 ? "#9b59b6" : "#555", fontSize: 12 }}
              >
                {skB > 0 ? `+${skB}` : "—"}
              </span>
            </div>
            {/* + button */}
            <button
              onClick={() => allocateStat(key as never)}
              disabled={player.statPoints <= 0}
              style={{
                background:
                  player.statPoints > 0
                    ? `linear-gradient(135deg, ${color}, ${color}aa)`
                    : "rgba(255,255,255,0.06)",
                border: "none",
                color: player.statPoints > 0 ? "#fff" : "#333",
                width: 32,
                height: 32,
                borderRadius: 7,
                cursor: player.statPoints > 0 ? "pointer" : "not-allowed",
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
          </div>
        );
      })}

      {/* Total summary */}
      <div
        style={{
          marginTop: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            color: "#f39c12",
            fontSize: 11,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          TỔNG CHỈ SỐ
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {STAT_INFO.map(({ key, label, color }) => (
            <div key={key} style={{ textAlign: "center" }}>
              <div style={{ color: "#555", fontSize: 9 }}>
                {label.split(" ").slice(1).join(" ")}
              </div>
              <div style={{ color, fontWeight: "bold", fontSize: 14 }}>
                {totals[key]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Túi Đồ ─────────────────────────────────────────────────────────────
function BagTab() {
  const player = useGameStore((s) => s.player);
  const equipItem = useGameStore((s) => s.equipItem);
  const sellItem = useGameStore((s) => s.sellItem);
  const buyItem = useGameStore((s) => s.buyItem);
  const [shopSlot, setShopSlot] = useState<ItemSlot | "all">("all");

  const shopItems =
    shopSlot === "all" ? ITEMS : ITEMS.filter((i) => i.slot === shopSlot);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Inventory ── */}
      <div>
        <SectionTitle>
          🎒 Vật Phẩm Đang Có ({player.inventory.length})
        </SectionTitle>
        {player.inventory.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              color: "#444",
              fontSize: 14,
              background: "rgba(255,255,255,0.02)",
              borderRadius: 10,
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            Hành trang trống. Hãy mua vật phẩm ở cửa hàng bên dưới!
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8,
            }}
          >
            {player.inventory.map((itemId) => {
              const item = ITEM_MAP[itemId];
              if (!item) return null;
              const isEquipped = player.equipment[item.slot] === itemId;
              return (
                <div
                  key={itemId}
                  style={{
                    background: isEquipped
                      ? `${TIER_COLOR[item.tier]}18`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isEquipped ? TIER_COLOR[item.tier] + "77" : "rgba(255,255,255,0.09)"}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${TIER_COLOR[item.tier]}22`,
                        border: `1px solid ${TIER_COLOR[item.tier]}55`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: TIER_COLOR[item.tier],
                          fontWeight: "bold",
                          fontSize: 12,
                          marginBottom: 1,
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ color: "#555", fontSize: 9 }}>
                        {SLOT_LABELS[item.slot]} · {TIER_NAME[item.tier]}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#777", fontSize: 10, marginBottom: 8 }}>
                    {Object.entries(item.stats)
                      .map(
                        ([k, v]) =>
                          `+${typeof v === "number" && v % 1 !== 0 ? v.toFixed(1) : v} ${k.toUpperCase()}`,
                      )
                      .join("  ")}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {isEquipped ? (
                      <span
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: 10,
                          color: "#f1c40f",
                          padding: "4px 0",
                          background: "rgba(241,196,15,0.1)",
                          borderRadius: 6,
                        }}
                      >
                        ✓ Đang trang bị
                      </span>
                    ) : (
                      <Btn
                        small
                        onClick={() => equipItem(itemId)}
                        variant="success"
                      >
                        Trang Bị
                      </Btn>
                    )}
                    <Btn
                      small
                      onClick={() => sellItem(itemId)}
                      variant="danger"
                    >
                      Bán 🪙{Math.floor(item.price / 2)}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Shop ── */}
      <div>
        <SectionTitle>🏪 Cửa Hàng</SectionTitle>
        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              ["all", "Tất Cả"],
              ["weapon", "⚔️ Vũ Khí"],
              ["armor", "🛡️ Giáp"],
              ["helmet", "⛑️ Mũ"],
              ["accessory", "📿 Phụ Kiện"],
            ] as [string, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setShopSlot(id as ItemSlot | "all")}
              style={{
                background:
                  shopSlot === id
                    ? "rgba(243,156,18,0.2)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${shopSlot === id ? "#f39c12" : "rgba(255,255,255,0.1)"}`,
                color: shopSlot === id ? "#f39c12" : "#888",
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
          <div
            style={{
              marginLeft: "auto",
              color: "#f1c40f",
              fontWeight: "bold",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
            }}
          >
            🪙 {player.gold}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 8,
          }}
        >
          {shopItems.map((item) => {
            const owned = player.inventory.includes(item.id);
            const canBuy = !owned && player.gold >= item.price;
            return (
              <div
                key={item.id}
                style={{
                  background: owned
                    ? "rgba(39,174,96,0.07)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${owned ? "#27ae6055" : TIER_COLOR[item.tier] + "33"}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  opacity: !owned && !canBuy ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${TIER_COLOR[item.tier]}22`,
                      border: `1px solid ${TIER_COLOR[item.tier]}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: TIER_COLOR[item.tier],
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ color: "#555", fontSize: 9 }}>
                      {TIER_NAME[item.tier]} · {SLOT_LABELS[item.slot]}
                    </div>
                  </div>
                </div>
                <div style={{ color: "#666", fontSize: 10, marginBottom: 8 }}>
                  {item.description}
                </div>
                {owned ? (
                  <div
                    style={{
                      color: "#27ae60",
                      fontSize: 11,
                      textAlign: "center",
                      padding: "4px",
                      background: "rgba(39,174,96,0.1)",
                      borderRadius: 6,
                    }}
                  >
                    ✓ Đã sở hữu
                  </div>
                ) : (
                  <Btn onClick={() => buyItem(item.id)} disabled={!canBuy}>
                    Mua — 🪙 {item.price}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Trang Bị ────────────────────────────────────────────────────────────
function EquipmentTab() {
  const player = useGameStore((s) => s.player);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const bonus = computeBonus(player);

  const slots: ItemSlot[] = ["weapon", "armor", "helmet", "accessory"];

  return (
    <div>
      {/* Equipment slot cards */}
      <SectionTitle>⚔️ Vị Trí Trang Bị</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {slots.map((slot) => {
          const equippedId = player.equipment[slot];
          const item = equippedId ? ITEM_MAP[equippedId] : null;
          return (
            <div
              key={slot}
              style={{
                background: item
                  ? `${TIER_COLOR[item.tier]}14`
                  : "rgba(255,255,255,0.02)",
                border: `2px solid ${item ? TIER_COLOR[item.tier] + "55" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12,
                padding: "14px",
              }}
            >
              <div style={{ color: "#555", fontSize: 10, marginBottom: 10 }}>
                {SLOT_LABELS[slot]}
              </div>
              {item ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 10,
                        background: `${TIER_COLOR[item.tier]}22`,
                        border: `2px solid ${TIER_COLOR[item.tier]}77`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          color: TIER_COLOR[item.tier],
                          fontWeight: "bold",
                          fontSize: 13,
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ color: "#555", fontSize: 9 }}>
                        {TIER_NAME[item.tier]}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#888",
                      fontSize: 11,
                      marginBottom: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    {Object.entries(item.stats).map(([k, v], i) => (
                      <span key={k}>
                        {i > 0 && "  "}
                        <span style={{ color: "#3498db" }}>
                          +
                          {typeof v === "number" && v % 1 !== 0
                            ? v.toFixed(1)
                            : v}
                        </span>{" "}
                        <span style={{ color: "#666" }}>{k.toUpperCase()}</span>
                      </span>
                    ))}
                  </div>
                  <Btn
                    small
                    onClick={() => unequipItem(slot as keyof Equipment)}
                    variant="ghost"
                  >
                    Tháo ra
                  </Btn>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.2 }}>
                    {SLOT_ICONS[slot]}
                  </div>
                  <div style={{ color: "#333", fontSize: 11 }}>
                    Chưa trang bị
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bonus from equipment */}
      <SectionTitle>📈 Chỉ Số Từ Trang Bị</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {[
          { label: "HP", val: bonus.hp, color: "#e74c3c", icon: "❤️" },
          { label: "ATK", val: bonus.atk, color: "#e67e22", icon: "⚔️" },
          {
            label: "DEF",
            val: `${Math.min(50, bonus.def)}%`,
            color: "#3498db",
            icon: "🛡️",
          },
          {
            label: "SPD",
            val: bonus.spd.toFixed(1),
            color: "#1abc9c",
            icon: "💨",
          },
          { label: "MAG", val: bonus.magic, color: "#9b59b6", icon: "✨" },
        ].map(({ label, val, color, icon }) => (
          <div
            key={label}
            style={{
              background: `${color}11`,
              border: `1px solid ${color}33`,
              borderRadius: 8,
              padding: "10px 6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ color, fontWeight: "bold", fontSize: 14 }}>
              +{val}
            </div>
            <div style={{ color: "#555", fontSize: 9 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick equip from inventory */}
      {player.inventory.length > 0 && (
        <>
          <SectionTitle>🔄 Trang Bị Nhanh Từ Hành Trang</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
            }}
          >
            {player.inventory.map((itemId) => {
              const item = ITEM_MAP[itemId];
              if (!item) return null;
              const isEquipped = player.equipment[item.slot] === itemId;
              return (
                <div
                  key={itemId}
                  style={{
                    background: isEquipped
                      ? `${TIER_COLOR[item.tier]}18`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isEquipped ? TIER_COLOR[item.tier] + "66" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: TIER_COLOR[item.tier],
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ color: "#555", fontSize: 9 }}>
                      {SLOT_LABELS[item.slot]}
                    </div>
                  </div>
                  {isEquipped ? (
                    <Btn
                      small
                      onClick={() => unequipItem(item.slot as keyof Equipment)}
                      variant="ghost"
                    >
                      Tháo
                    </Btn>
                  ) : (
                    <Btn
                      small
                      onClick={() => equipItem(itemId)}
                      variant="success"
                    >
                      Đeo
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Kỹ Năng ─────────────────────────────────────────────────────────────
function SkillsTab() {
  const player = useGameStore((s) => s.player);
  const learnSkill = useGameStore((s) => s.learnSkill);

  const canLearn = (skillId: string) => {
    const skill = SKILLS.find((s) => s.id === skillId);
    if (!skill) return false;
    if (player.learnedSkills.includes(skillId)) return false;
    if (player.skillPoints < skill.cost) return false;
    if (skill.requires && !player.learnedSkills.includes(skill.requires))
      return false;
    return true;
  };

  const activeSkills = SKILLS.filter((s) => s.type === "active");
  const passiveSkills = SKILLS.filter((s) => s.type === "passive");

  function SkillCard({ skill }: { skill: (typeof SKILLS)[0] }) {
    const learned = player.learnedSkills.includes(skill.id);
    const unlockable = canLearn(skill.id);
    const reqLocked =
      !learned &&
      !!skill.requires &&
      !player.learnedSkills.includes(skill.requires);
    const noPoints = !learned && !reqLocked && player.skillPoints < skill.cost;

    return (
      <div
        style={{
          background: learned ? `${skill.color}18` : "rgba(255,255,255,0.03)",
          border: `1px solid ${learned ? skill.color + "77" : unlockable ? skill.color + "44" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 12,
          padding: "14px 16px",
          opacity: reqLocked || noPoints ? 0.6 : 1,
          position: "relative",
        }}
      >
        {/* Type badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background:
              skill.type === "active"
                ? "rgba(231,76,60,0.2)"
                : "rgba(52,152,219,0.2)",
            color: skill.type === "active" ? "#e74c3c" : "#3498db",
            padding: "2px 8px",
            borderRadius: 8,
            fontSize: 9,
            fontWeight: "bold",
          }}
        >
          {skill.type === "active" ? "⚡ Chủ Động" : "🔮 Bị Động"}
        </div>

        {/* Icon + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 9,
              background: learned
                ? skill.color + "33"
                : "rgba(255,255,255,0.06)",
              border: `2px solid ${learned ? skill.color + "88" : "rgba(255,255,255,0.1)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {skill.icon}
          </div>
          <div>
            <div
              style={{
                color: learned ? skill.color : "#ccc",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              {skill.name}
            </div>
            {skill.cooldown > 0 && (
              <div style={{ color: "#666", fontSize: 10 }}>
                ⏱ Hồi chiêu {skill.cooldown}s
              </div>
            )}
            {skill.cooldown === 0 && (
              <div style={{ color: "#555", fontSize: 10 }}>
                Hiệu lực vĩnh viễn
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            color: "#888",
            fontSize: 11,
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          {skill.description}
        </div>

        {/* Effect tag */}
        <div
          style={{
            display: "inline-block",
            background: `${skill.color}11`,
            border: `1px solid ${skill.color}33`,
            color: skill.color,
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 10,
            marginBottom: 10,
          }}
        >
          {skill.effect}
        </div>

        {/* Requires */}
        {skill.requires && (
          <div
            style={{
              color: reqLocked ? "#e74c3c" : "#555",
              fontSize: 10,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {reqLocked ? "🔒" : "✓"} Yêu cầu:{" "}
            {SKILLS.find((s) => s.id === skill.requires)?.name}
          </div>
        )}

        {/* Action */}
        {learned ? (
          <div
            style={{
              background: `${skill.color}18`,
              border: `1px solid ${skill.color}55`,
              color: skill.color,
              padding: "6px",
              borderRadius: 8,
              fontSize: 11,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            ✓ Đã Học
          </div>
        ) : (
          <Btn
            onClick={() => learnSkill(skill.id)}
            disabled={!unlockable}
            variant={unlockable ? "primary" : "ghost"}
          >
            {reqLocked
              ? "🔒 Cần học kỹ năng trước"
              : noPoints
                ? `Cần ${skill.cost} điểm KN`
                : `Học — ${skill.cost} điểm KN`}
          </Btn>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ color: "#888", fontSize: 12 }}>
          Học kỹ năng để tăng sức chiến đấu. Điểm kỹ năng nhận khi lên cấp.
        </div>
        {player.skillPoints > 0 ? (
          <Pill color="#9b59b6">✨ {player.skillPoints} điểm còn lại</Pill>
        ) : (
          <span style={{ color: "#555", fontSize: 11 }}>
            Cần lên cấp để có điểm mới
          </span>
        )}
      </div>

      <SectionTitle>⚡ Kỹ Năng Chủ Động</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {activeSkills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>

      <SectionTitle>🔮 Kỹ Năng Bị Động</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {passiveSkills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </div>
  );
}

// ── Main menu ────────────────────────────────────────────────────────────────
export default function CharacterMenu() {
  const menuOpen = useGameStore((s) => s.game.menuOpen);
  const setMenuOpen = useGameStore((s) => s.setMenuOpen);
  const player = useGameStore((s) => s.player);
  const [tab, setTab] = useState<Tab>("character");
  const device   = useDeviceType();
  const isMobile = device !== "desktop";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanUp(el.scrollTop > 8);
    setCanDown(el.scrollTop < el.scrollHeight - el.clientHeight - 8);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    checkScroll();
  }, [tab, checkScroll]);

  const scrollBy = useCallback((dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ top: dir * 200, behavior: "smooth" });
  }, []);

  if (!menuOpen) return null;

  // ── Mobile: toàn bộ overlay là scroll container, dùng portal ra document.body
  // thoát hoàn toàn khỏi DOM game (Canvas touch-action:none)
  if (isMobile) {
    return createPortal(<div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          overflowY: "scroll",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch" as never,
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          background: "linear-gradient(160deg, #0d0d25 0%, #0a0a1e 100%)",
          fontFamily: "'Segoe UI', sans-serif",
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ── */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(90deg, #0d0d25 0%, #0a0a1e 100%)",
          borderBottom: "1px solid rgba(255,200,80,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#9b59b6,#8e44ad)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>🐉</div>
            <div>
              <div style={{ color: "#f1c40f", fontWeight: "bold", fontSize: 14 }}>{player.name}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                <Pill color="#9b59b6">Lv.{player.level}</Pill>
                <span style={{ color: "#f1c40f", fontSize: 11 }}>🪙 {player.gold}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {player.statPoints > 0 && <Pill color="#f39c12">🌟 {player.statPoints}</Pill>}
            {player.skillPoints > 0 && <Pill color="#9b59b6">✨ {player.skillPoints}</Pill>}
            <button
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); }}
              onClick={() => setMenuOpen(false)}
              style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                color: "#ccc", borderRadius: 8, width: 34, height: 34,
                cursor: "pointer", fontSize: 17, display: "flex",
                alignItems: "center", justifyContent: "center",
                touchAction: "manipulation",
              }}
            >✕</button>
          </div>
        </div>

        {/* ── Sticky tabs ── */}
        <div style={{
          position: "sticky",
          top: 57,
          zIndex: 9,
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0a1e",
          overflowX: "auto",
        }}>
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setTab(id); }}
              onClick={() => setTab(id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "9px 12px", fontSize: 11,
                fontWeight: tab === id ? "bold" : "normal",
                color: tab === id ? "#f1c40f" : "#555",
                borderBottom: tab === id ? "2px solid #f1c40f" : "2px solid transparent",
                whiteSpace: "nowrap", touchAction: "manipulation",
              }}
            >{icon} {label}</button>
          ))}
        </div>

        {/* ── Content — flows naturally, no height constraints ── */}
        <div style={{ padding: "14px 12px", minHeight: "60vh" }}>
          {tab === "character" && <CharacterTab />}
          {tab === "stats"     && <StatsTab />}
          {tab === "bag"       && <BagTab />}
          {tab === "equipment" && <EquipmentTab />}
          {tab === "skills"    && <SkillsTab />}
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "10px 14px", color: "#444", fontSize: 10, textAlign: "center",
        }}>
          👆 Vuốt lên/xuống · Nhấn ✕ để đóng
        </div>
      </div>, document.body);
  }

  // ── Desktop: modal với scroll buttons — cũng portal để thoát DOM game ────────
  return createPortal(<div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}
    >
      <div style={{
        width: "min(960px, 96vw)", maxHeight: "92vh",
        background: "linear-gradient(160deg, #0d0d25 0%, #0a0a1e 100%)",
        border: "1px solid rgba(255,200,80,0.25)", borderRadius: 20,
        boxShadow: "0 0 80px rgba(155,89,182,0.12), 0 0 40px rgba(243,156,18,0.08), inset 0 0 60px rgba(0,0,20,0.5)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
          background: "linear-gradient(90deg, rgba(155,89,182,0.1), rgba(243,156,18,0.06))",
          borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg,#9b59b6,#8e44ad)",
              border: "2px solid rgba(155,89,182,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>🐉</div>
            <div>
              <div style={{ color: "#f1c40f", fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 }}>
                {player.name}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                <Pill color="#9b59b6">Lv.{player.level}</Pill>
                <span style={{ color: "#888", fontSize: 11 }}>Dragon Warrior</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {player.statPoints > 0 && <Pill color="#f39c12">🌟 {player.statPoints}</Pill>}
              {player.skillPoints > 0 && <Pill color="#9b59b6">✨ {player.skillPoints}</Pill>}
            </div>
            <div style={{ color: "#f1c40f", fontWeight: "bold", fontSize: 14 }}>🪙 {player.gold}</div>
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#aaa", borderRadius: 8, width: 32, height: 32,
                cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 20px", flexShrink: 0, overflowX: "auto",
        }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "11px 18px", fontSize: 12,
              fontWeight: tab === id ? "bold" : "normal",
              color: tab === id ? "#f1c40f" : "#666",
              borderBottom: tab === id ? "2px solid #f1c40f" : "2px solid transparent",
              transition: "color 0.15s", whiteSpace: "nowrap",
            }}>{icon} {label}</button>
          ))}
        </div>

        {/* ── Content: desktop scroll buttons ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {canUp && (
            <button onClick={() => scrollBy(-1)} style={{
              position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", zIndex: 5,
              background: "linear-gradient(180deg, rgba(13,13,37,0.98) 60%, transparent)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 28px",
              color: "#aaa", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}>▲ Lên</button>
          )}
          <div ref={scrollRef} onScroll={checkScroll} style={{
            flex: 1, overflowY: "auto", padding: "20px 24px",
            scrollbarWidth: "thin", scrollbarColor: "rgba(155,89,182,0.4) transparent",
          }}>
            {tab === "character" && <CharacterTab />}
            {tab === "stats"     && <StatsTab />}
            {tab === "bag"       && <BagTab />}
            {tab === "equipment" && <EquipmentTab />}
            {tab === "skills"    && <SkillsTab />}
          </div>
          {canDown && (
            <button onClick={() => scrollBy(1)} style={{
              position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", zIndex: 5,
              background: "linear-gradient(0deg, rgba(13,13,37,0.98) 60%, transparent)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 28px",
              color: "#aaa", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", gap: 4, boxShadow: "0 -2px 12px rgba(0,0,0,0.5)",
            }}>▼ Xuống</button>
          )}
          {canUp && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, background: "linear-gradient(180deg, rgba(13,13,37,0.6) 0%, transparent 100%)", pointerEvents: "none" }} />}
          {canDown && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(0deg, rgba(13,13,37,0.6) 0%, transparent 100%)", pointerEvents: "none" }} />}
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 24px",
          color: "#555", fontSize: 10, textAlign: "center", flexShrink: 0,
        }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <span><Kbd>Tab</Kbd>{" / "}<Kbd>C</Kbd> đóng menu</span>
            <span style={{ color: "#333" }}>·</span>
            <span><Kbd>F11</Kbd> toàn màn hình</span>
            <span style={{ color: "#333" }}>·</span>
            <span>Con lăn chuột để cuộn</span>
          </span>
        </div>
      </div>
    </div>, document.body);
}
