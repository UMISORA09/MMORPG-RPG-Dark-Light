// ==============================================================================
// DailyLoginModal — Quà Đăng Nhập 7 Ngày Liên Tục
// Dark Fantasy Cinema Teal & Obsidian Slate UI
// Integrated with useGameWorldStore & Web Audio API
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { 
  X, 
  Gift, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  Lock, 
  Crown, 
  Star,
  ShieldCheck,
  PackageCheck
} from "lucide-react";

export interface DailyLoginModalProps {
  characterId?: number;
}

interface DailyRewardDay {
  day: number;
  title: string;
  icon: string;
  gold: number;
  exp: number;
  itemName: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  highlight?: boolean;
}

const SEVEN_DAY_REWARDS: DailyRewardDay[] = [
  {
    day: 1,
    title: "Tân Thủ Đắc Lộc",
    icon: "🧪",
    gold: 500,
    exp: 500,
    itemName: "5x Bình Máu Lớn (Hồi 30% HP)",
    rarity: "common",
  },
  {
    day: 2,
    title: "Cuộn Giấy Cương Mãnh",
    icon: "📜",
    gold: 800,
    exp: 800,
    itemName: "3x Cuộn Giấy Tăng Công (+25% ATK)",
    rarity: "uncommon",
  },
  {
    day: 3,
    title: "Thần Thạch Rèn Đúc",
    icon: "💎",
    gold: 1500,
    exp: 1200,
    itemName: "5x Đá Cường Hóa Vũ Khí (+15 Forge)",
    rarity: "rare",
    highlight: true,
  },
  {
    day: 4,
    title: "Bồi Bổ Dũng Khí",
    icon: "🍖",
    gold: 2000,
    exp: 1500,
    itemName: "5x Bụi Ma Thuật + 3x Thịt Nướng Siêu Cấp",
    rarity: "rare",
  },
  {
    day: 5,
    title: "Rương Báu Hiếm",
    icon: "📦",
    gold: 3500,
    exp: 2500,
    itemName: "1x Rương Trang Bị Hiếm (Rare Chest)",
    rarity: "epic",
    highlight: true,
  },
  {
    day: 6,
    title: "Tinh Thể Thần Long",
    icon: "🔮",
    gold: 5000,
    exp: 4000,
    itemName: "3x Tinh Thể Rồng + 5x Đá Cường Hóa Cao Cấp",
    rarity: "epic",
  },
  {
    day: 7,
    title: "Bảo Vật Huyền Thoại",
    icon: "👑",
    gold: 12000,
    exp: 10000,
    itemName: "🔥 Hỏa Long Thần Binh (Legendary Vũ Khí Thần)",
    rarity: "legendary",
    highlight: true,
  },
];

export const DailyLoginModal = memo(function DailyLoginModal({
  characterId: _characterId,
}: DailyLoginModalProps) {
  const worldModal = useGameWorldStore((s) => s.activeModal);
  const isOpen = worldModal === "dailyRewards";

  const close = () => {
    useGameWorldStore.getState().closeActiveModal();
  };

  const [claimedDays, setClaimedDays] = useState<number>(0);
  const [lastClaimDate, setLastClaimDate] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedDays = Number(localStorage.getItem("clb_daily_login_claimed_days")) || 0;
        const savedDate = localStorage.getItem("clb_daily_login_last_date") || "";
        setClaimedDays(savedDays);
        setLastClaimDate(savedDate);
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canClaimToday = lastClaimDate !== todayStr;
  const currentClaimDayIndex = claimedDays % 7; // 0 to 6
  const nextRewardDay = SEVEN_DAY_REWARDS[currentClaimDayIndex];

  const handleClaim = () => {
    if (!canClaimToday && claimedDays > 0) return;

    const reward = nextRewardDay;
    if (reward.rarity === "legendary" || reward.day === 7) {
      playCombatSFX("level_up_fanfare", 0.85);
      playCombatSFX("rarity_chime", 0.85);
    } else {
      playCombatSFX("holy_bell", 0.7);
      playCombatSFX("coin_chime", 0.6);
    }

    useGameWorldStore.getState().claimRewardBonus(
      reward.exp,
      reward.gold,
      `🎁 ĐIỂM DANH NGÀY ${reward.day}: Nhận +${reward.gold.toLocaleString()} Vàng, +${reward.exp.toLocaleString()} EXP & ${reward.itemName}!`
    );

    const nextCount = claimedDays + 1;
    setClaimedDays(nextCount);
    setLastClaimDate(todayStr);

    if (typeof window !== "undefined") {
      localStorage.setItem("clb_daily_login_claimed_days", String(nextCount));
      localStorage.setItem("clb_daily_login_last_date", todayStr);
    }
  };

  const getRarityStyle = (rarity: DailyRewardDay["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return {
          cardBorder: "border-amber-400 bg-gradient-to-b from-amber-950/60 via-slate-900 to-amber-950/40 shadow-[0_0_25px_rgba(251,191,36,0.35)]",
          badge: "bg-amber-500/20 text-amber-300 border-amber-400/50",
          text: "Huyền Thoại",
        };
      case "epic":
        return {
          cardBorder: "border-purple-500/70 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.25)]",
          badge: "bg-purple-500/20 text-purple-300 border-purple-400/40",
          text: "Sử Thi",
        };
      case "rare":
        return {
          cardBorder: "border-cyan-500/60 bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-950",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
          text: "Hiếm",
        };
      case "uncommon":
        return {
          cardBorder: "border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-950",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
          text: "Cao Cấp",
        };
      default:
        return {
          cardBorder: "border-slate-800 bg-slate-950/80",
          badge: "bg-slate-800 text-slate-300 border-slate-700",
          text: "Phổ Thông",
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-[#232f48] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100 my-auto">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Quà Đăng Nhập 7 Ngày Liên Tục
              </h2>
              <p className="text-xs text-slate-400">
                Đăng nhập mỗi ngày để tích lũy tài nguyên và nhận Vũ Khí Huyền Thoại vào Ngày 7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="p-2 rounded-full bg-slate-800/60 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition cursor-pointer"
              title="Đóng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Banner: Status of Today ── */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-cyan-950/30 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div className="text-xs">
              <span className="text-slate-300">Chuỗi điểm danh hiện tại: </span>
              <span className="font-mono font-black text-emerald-300 text-sm">
                {claimedDays} Ngày
              </span>
              <span className="text-slate-400 ml-2">
                {canClaimToday
                  ? "• Hôm nay chưa nhận quà, hãy điểm danh ngay!"
                  : "• Đã hoàn thành điểm danh hôm nay, hẹn gặp bạn vào ngày mai!"}
              </span>
            </div>
          </div>

          {canClaimToday && nextRewardDay && (
            <button
              onClick={handleClaim}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 animate-pulse shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>Điểm Danh Ngày {nextRewardDay.day} Ngay</span>
            </button>
          )}
        </div>

        {/* ── 7-Day Rewards Grid ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {SEVEN_DAY_REWARDS.map((reward) => {
              const dayIndex = reward.day - 1;
              const isPastClaimed = dayIndex < currentClaimDayIndex || (!canClaimToday && dayIndex <= currentClaimDayIndex);
              const isTodayActive = canClaimToday && dayIndex === currentClaimDayIndex;
              const isLocked = !isPastClaimed && !isTodayActive;
              const rarityStyle = getRarityStyle(reward.rarity);
              const isDay7 = reward.day === 7;

              return (
                <div
                  key={`day-${reward.day}`}
                  className={`relative p-3.5 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${
                    isDay7 ? "col-span-2 sm:col-span-2 lg:col-span-1" : ""
                  } ${
                    isTodayActive
                      ? "border-cyan-400 ring-2 ring-cyan-400/50 bg-gradient-to-b from-cyan-950/60 to-slate-900 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-[1.03]"
                      : isPastClaimed
                      ? "border-slate-800/80 bg-slate-950/50 opacity-70"
                      : rarityStyle.cardBorder
                  }`}
                >
                  {/* Top Bar: Day Label + Status */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-black text-slate-300">
                      NGÀY {reward.day}
                    </span>
                    {isPastClaimed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isTodayActive ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 text-[9px] font-black animate-pulse">
                        HÔM NAY
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>

                  {/* Center Icon */}
                  <div className="my-2 flex flex-col items-center justify-center">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border ${
                        isDay7
                          ? "bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-bounce"
                          : isTodayActive
                          ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      {reward.icon}
                    </div>

                    <h4 className="text-xs font-bold text-center text-slate-100 mt-2 truncate w-full">
                      {reward.title}
                    </h4>

                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border mt-1 ${rarityStyle.badge}`}>
                      {rarityStyle.text}
                    </span>
                  </div>

                  {/* Bottom Rewards Details */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-col gap-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-[10px] text-slate-400 font-sans">Vàng:</span>
                      <span className="font-bold">+{reward.gold.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-cyan-300">
                      <span className="text-[10px] text-slate-400 font-sans">EXP:</span>
                      <span className="font-bold">+{reward.exp.toLocaleString()}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-sans line-clamp-2 mt-0.5" title={reward.itemName}>
                      {reward.itemName}
                    </p>

                    {/* Claim Button for Today */}
                    {isTodayActive ? (
                      <button
                        onClick={handleClaim}
                        className="mt-2 w-full py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] transition cursor-pointer"
                      >
                        Nhận Ngay
                      </button>
                    ) : isPastClaimed ? (
                      <div className="mt-2 text-center text-[10px] text-emerald-400 font-bold py-1 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
                        Đã Nhận ✓
                      </div>
                    ) : (
                      <div className="mt-2 text-center text-[10px] text-slate-600 font-medium py-1">
                        Chưa Mở Khóa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">U</kbd> để đóng</span>
          <button
            onClick={close}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
});

export default DailyLoginModal;

