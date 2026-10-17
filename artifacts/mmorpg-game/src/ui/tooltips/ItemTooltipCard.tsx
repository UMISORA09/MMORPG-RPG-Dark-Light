import { memo } from "react";
import { Sparkles, Shield, Swords, Heart, Zap, Gem, Flame } from "lucide-react";

export interface ItemTooltipData {
  name: string;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "miracle" | string;
  icon?: string;
  enhanceLevel?: number;
  type?: string;
  category?: string;
  equipSlot?: string;
  classId?: string;
  requiredLevel?: number;
  hpBoost?: number;
  atkBoost?: number;
  defBoost?: number;
  spdBoost?: number;
  critRate?: number;
  critDamage?: number;
  description?: string;
  lore?: string;
  price?: number;
  socketsJson?: any[] | string;
  reforgeStatsJson?: any[] | string;
  miraclePassive?: string;
}

interface ItemTooltipCardProps {
  item: ItemTooltipData;
  position?: "top" | "bottom" | "left" | "right" | "cursor";
  className?: string;
}

export const ItemTooltipCard = memo(function ItemTooltipCard({
  item,
  className = "",
}: ItemTooltipCardProps) {
  const rarity = (item.rarity?.toLowerCase() || "common") as
    | "common"
    | "uncommon"
    | "rare"
    | "epic"
    | "legendary"
    | "miracle";

  const rarityStyles: Record<string, {
    border: string;
    bg: string;
    text: string;
    glow: string;
    label: string;
    badgeBg: string;
  }> = {
    common: {
      border: "border-slate-600/80",
      bg: "bg-gradient-to-b from-[#131722]/95 via-[#0c1017]/95 to-[#080b10]/95",
      text: "text-slate-300",
      glow: "shadow-[0_0_20px_rgba(100,116,139,0.25)]",
      label: "Bình Thường (Common)",
      badgeBg: "bg-slate-700/60 text-slate-300 border-slate-600",
    },
    uncommon: {
      border: "border-emerald-500/70",
      bg: "bg-gradient-to-b from-[#0a2318]/95 via-[#06160f]/95 to-[#040e0a]/95",
      text: "text-emerald-300",
      glow: "shadow-[0_0_25px_rgba(16,185,129,0.35)]",
      label: "Cao Cấp (Uncommon)",
      badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
    },
    rare: {
      border: "border-cyan-400/80",
      bg: "bg-gradient-to-b from-[#082638]/95 via-[#051724]/95 to-[#030e17]/95",
      text: "text-cyan-300",
      glow: "shadow-[0_0_30px_rgba(6,182,212,0.45)]",
      label: "Quý Hiếm (Rare)",
      badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-400/50",
    },
    epic: {
      border: "border-purple-400/80",
      bg: "bg-gradient-to-b from-[#250d3d]/95 via-[#160626]/95 to-[#0c0314]/95",
      text: "text-purple-300",
      glow: "shadow-[0_0_35px_rgba(168,85,247,0.5)]",
      label: "Sử Thi (Epic)",
      badgeBg: "bg-purple-950/80 text-purple-300 border-purple-400/50",
    },
    legendary: {
      border: "border-amber-400/90",
      bg: "bg-gradient-to-b from-[#331a08]/95 via-[#1e0e03]/95 to-[#120701]/95",
      text: "text-amber-300",
      glow: "shadow-[0_0_40px_rgba(245,158,11,0.55)]",
      label: "Huyền Thoại (Legendary)",
      badgeBg: "bg-amber-950/80 text-amber-300 border-amber-400/50",
    },
    miracle: {
      border: "border-pink-400",
      bg: "bg-gradient-to-b from-[#3d0f28]/95 via-[#240616]/95 to-[#14020c]/95",
      text: "text-pink-300",
      glow: "shadow-[0_0_50px_rgba(244,63,94,0.7)] ring-1 ring-pink-400/40 animate-pulse",
      label: "Kì Tích (Miracle Tối Thượng)",
      badgeBg: "bg-gradient-to-r from-pink-900 to-rose-900 text-pink-200 border-pink-400",
    },
  };

  const style = rarityStyles[rarity] || rarityStyles.common;

  // Parse sockets & reforge stats safely
  const sockets: any[] = Array.isArray(item.socketsJson)
    ? item.socketsJson
    : typeof item.socketsJson === "string"
    ? (() => {
        try {
          return JSON.parse(item.socketsJson);
        } catch {
          return [];
        }
      })()
    : [];

  const reforgeStats: any[] = Array.isArray(item.reforgeStatsJson)
    ? item.reforgeStatsJson
    : typeof item.reforgeStatsJson === "string"
    ? (() => {
        try {
          return JSON.parse(item.reforgeStatsJson);
        } catch {
          return [];
        }
      })()
    : [];

  const classNameMap: Record<string, string> = {
    assassin: "Sát Thủ (Ảnh Vũ)",
    warrior: "Chiến Binh (Cuồng Long)",
    tanker: "Đỡ Đòn (Kim Cương)",
    gunner: "Xạ Thủ (Pháo Thủ)",
  };

  const classLabel = item.classId
    ? classNameMap[item.classId] || item.classId
    : "Tất cả Hệ Phái";

  return (
    <div
      className={`w-72 sm:w-80 p-3.5 rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} backdrop-blur-xl text-white shadow-2xl pointer-events-none select-none z-50 animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      {/* Header: Icon, Name + Enhance Level, Rarity Badge */}
      <div className="flex items-start gap-3 pb-2.5 border-b border-slate-800/80">
        <div
          className={`w-12 h-12 rounded-xl bg-slate-950/80 border-2 ${style.border} flex items-center justify-center text-2xl shadow-inner shrink-0 relative`}
        >
          <span>{item.icon || "🛡️"}</span>
          {(item.enhanceLevel || 0) > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black font-mono text-[9px] shadow">
              +{item.enhanceLevel}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className={`text-sm font-black truncate ${style.text}`}>
              {item.name}
            </h4>
            {(item.enhanceLevel || 0) > 0 && (
              <span className="text-amber-400 font-mono font-black text-xs shrink-0">
                +{item.enhanceLevel}
              </span>
            )}
          </div>
          <span
            className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.badgeBg}`}
          >
            {style.label}
          </span>
        </div>
      </div>

      {/* Class & Level Requirements */}
      <div className="py-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 font-medium">
        <span>Yêu cầu: <strong className="text-slate-200">Cấp {item.requiredLevel || 1}</strong></span>
        <span>Phái: <strong className="text-cyan-300">{classLabel}</strong></span>
      </div>

      {/* Main Base Stats list */}
      <div className="py-2.5 space-y-1.5 text-xs font-mono border-b border-slate-800/60">
        {(item.atkBoost || 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Swords className="w-3.5 h-3.5 text-rose-400" /> Sát Thương Vật Lý
            </span>
            <span className="text-rose-400 font-bold font-mono">+{item.atkBoost}</span>
          </div>
        )}

        {(item.hpBoost || 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Heart className="w-3.5 h-3.5 text-emerald-400" /> Sinh Lực Tối Đa
            </span>
            <span className="text-emerald-400 font-bold font-mono">+{item.hpBoost}</span>
          </div>
        )}

        {(item.defBoost || 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Giáp Hộ Thể
            </span>
            <span className="text-blue-400 font-bold font-mono">+{item.defBoost}</span>
          </div>
        )}

        {(item.spdBoost || 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Tốc Độ Di Chuyển
            </span>
            <span className="text-amber-400 font-bold font-mono">+{item.spdBoost}%</span>
          </div>
        )}

        {(item.critRate || 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Tỉ Lệ Bạo Kích
            </span>
            <span className="text-yellow-400 font-bold font-mono">+{item.critRate}%</span>
          </div>
        )}
      </div>

      {/* Gem Sockets (if any) */}
      {sockets.length > 0 && (
        <div className="py-2 border-b border-slate-800/60">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Gem className="w-3 h-3" /> Bảo Thạch Đã Khảm ({sockets.filter(Boolean).length}/3)
          </div>
          <div className="space-y-1">
            {sockets.map((gem, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>{gem?.type === "ruby" ? "🔴" : gem?.type === "sapphire" ? "🔵" : gem?.type === "topaz" ? "🟡" : "🟢"}</span>
                  <span className="text-slate-200">{gem?.name || `Lỗ #${idx + 1}`}</span>
                </span>
                <span className="text-cyan-300 font-bold">
                  {gem?.statBonus?.atk ? `+${gem.statBonus.atk} ATK` :
                   gem?.statBonus?.def ? `+${gem.statBonus.def} DEF` :
                   gem?.statBonus?.hp ? `+${gem.statBonus.hp} HP` :
                   gem?.statBonus?.critRate ? `+${gem.statBonus.critRate}% Crit` : "+Tốc độ"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reforge Sub-stats (if any) */}
      {reforgeStats.length > 0 && (
        <div className="py-2 border-b border-slate-800/60">
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Dòng Tẩy Luyện Ẩn ({reforgeStats.length})
          </div>
          <div className="space-y-1">
            {reforgeStats.map((stat, idx) => {
              const isSS = stat.rank === "SS";
              const isS = stat.rank === "S";
              return (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-black font-mono px-1 py-0.2 rounded ${
                        isSS
                          ? "bg-pink-500 text-white animate-pulse"
                          : isS
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : stat.rank === "A"
                          ? "bg-purple-500 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      [{stat.rank}]
                    </span>
                    <span className={isSS ? "text-pink-300 font-bold" : isS ? "text-amber-300 font-bold" : "text-slate-300"}>
                      {stat.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Miracle Passive (if Miracle Quality) */}
      {rarity === "miracle" && item.miraclePassive && (
        <div className="my-2 p-2 rounded-xl bg-pink-950/50 border border-pink-400/50 text-[11px] text-pink-200">
          <span className="font-black text-pink-300 block mb-0.5">🌟 Kì Tích Chân Thần:</span>
          {item.miraclePassive}
        </div>
      )}

      {/* Lore Description */}
      {(item.description || item.lore) && (
        <div className="py-2 text-[10px] text-slate-400/90 italic border-b border-slate-800/50 leading-relaxed">
          &ldquo;{item.lore || item.description}&rdquo;
        </div>
      )}

      {/* Footer: Price in Gold */}
      <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold">
        <span className="text-slate-500 text-[10px]">Giá Trị Giao Dịch</span>
        <span className="text-yellow-400 flex items-center gap-1">
          <span>🪙</span> {item.price || 150} Vàng
        </span>
      </div>
    </div>
  );
});
