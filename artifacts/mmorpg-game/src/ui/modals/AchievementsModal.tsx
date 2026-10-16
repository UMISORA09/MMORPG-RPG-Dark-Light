// ==============================================================================
// AchievementsModal — Bảng Thành Tựu & Cột Mốc Danh Vọng Đại Lục
// Dark Fantasy Cinema Teal & Obsidian Slate UI
// Integrated with useGameWorldStore & Web Audio API
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { 
  X, 
  Award, 
  Trophy, 
  CheckCircle2, 
  Coins, 
  Sparkles, 
  Swords, 
  Hammer, 
  Flame, 
  Lock,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export interface AchievementsModalProps {
  characterId?: number;
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: "all" | "combat" | "forge" | "wealth";
  icon: string;
  targetCount: number;
  getCurrentCount: (state: ReturnType<typeof useGameWorldStore.getState>) => number;
  rewardExp: number;
  rewardGold: number;
  rewardTitle?: string;
  rewardItemName?: string;
}

const ACHIEVEMENTS_LIST: AchievementDef[] = [
  {
    id: "novice_hunter",
    title: "Chiến Binh Tập Sự",
    description: "Tiêu diệt 50 quái vật hoang dã trên toàn cõi đại lục Long Tộc.",
    category: "combat",
    icon: "⚔️",
    targetCount: 50,
    getCurrentCount: (s) => s.playerKills,
    rewardExp: 1000,
    rewardGold: 500,
  },
  {
    id: "golden_blacksmith",
    title: "Thợ Rèn Tay Vàng",
    description: "Cường hóa thành công trang bị lên mốc +7 hào quang rực sáng.",
    category: "forge",
    icon: "🔨",
    targetCount: 7,
    getCurrentCount: (s) => s.highestEnhanceLevel,
    rewardExp: 2500,
    rewardGold: 1500,
    rewardItemName: "5x Đá Cường Hóa Huyền Thoại",
  },
  {
    id: "dragon_millionaire",
    title: "Triệu Phú Long Tộc",
    description: "Tích lũy tài sản đạt mốc 20,000 Vàng trong hành trang.",
    category: "wealth",
    icon: "🪙",
    targetCount: 20000,
    getCurrentCount: (s) => s.playerGold,
    rewardExp: 5000,
    rewardGold: 2000,
    rewardTitle: "Triệu Phú Long Tộc",
  },
  {
    id: "dragon_slayer",
    title: "Săn Boss Huyền Thoại",
    description: "Khiêu chiến và hạ gục Boss Rồng Lửa Cổ Đại (Boss Cấp 20) tại Cấm Địa.",
    category: "combat",
    icon: "🐉",
    targetCount: 1,
    getCurrentCount: (s) => (s.playerKills >= 5 && (!s.bossActive || s.bossHealth <= 0) ? 1 : 0),
    rewardExp: 10000,
    rewardGold: 5000,
    rewardItemName: "Hỏa Long Thần Binh (Legendary)",
  },
  {
    id: "level_master",
    title: "Bậc Thầy Cấp Độ",
    description: "Rèn luyện ý chí và thăng tiến nhân vật đạt Cấp 10.",
    category: "combat",
    icon: "👑",
    targetCount: 10,
    getCurrentCount: (s) => s.playerLevel,
    rewardExp: 3000,
    rewardGold: 2000,
    rewardItemName: "10x Thần Dược Đại Hồi Phục",
  },
  {
    id: "arena_champion",
    title: "Đấu Vương Đại Lục",
    description: "Giao đấu và giành điểm danh dự tại Đấu Trường Xếp Hạng PvP 1v1.",
    category: "combat",
    icon: "🥊",
    targetCount: 20,
    getCurrentCount: (s) => s.honorPoints,
    rewardExp: 2500,
    rewardGold: 1200,
    rewardTitle: "Đấu Vương Long Tộc",
  },
  {
    id: "armory_collector",
    title: "Kho Vũ Khí Tối Thượng",
    description: "Thu thập và sở hữu ít nhất 10 món trang bị trong túi đồ.",
    category: "forge",
    icon: "🛡️",
    targetCount: 10,
    getCurrentCount: (s) => (s.inventoryItems ? s.inventoryItems.length : 12),
    rewardExp: 1500,
    rewardGold: 1000,
  },
];

export const AchievementsModal = memo(function AchievementsModal({
  characterId: _characterId,
}: AchievementsModalProps) {
  const worldModal = useGameWorldStore((s) => s.activeModal);
  const isOpen = worldModal === "achievements";

  const close = () => {
    useGameWorldStore.getState().closeActiveModal();
  };

  const [activeTab, setActiveTab] = useState<"all" | "combat" | "forge" | "wealth">("all");
  const [claimedList, setClaimedList] = useState<string[]>([]);

  // Read claimed achievements from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("clb_claimed_achievements");
        if (saved) {
          setClaimedList(JSON.parse(saved));
        }
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  const worldState = useGameWorldStore();

  if (!isOpen) return null;

  const handleClaim = (ach: AchievementDef) => {
    playCombatSFX("holy_bell", 0.7);
    playCombatSFX("coin_chime", 0.6);

    worldState.claimRewardBonus(
      ach.rewardExp,
      ach.rewardGold,
      `🏆 HOÀN THÀNH THÀNH TỰU: ${ach.title}! Nhận +${ach.rewardExp} EXP & +${ach.rewardGold} Vàng!`
    );

    const nextClaimed = [...claimedList, ach.id];
    setClaimedList(nextClaimed);
    if (typeof window !== "undefined") {
      localStorage.setItem("clb_claimed_achievements", JSON.stringify(nextClaimed));
    }
  };

  const filteredAchievements = ACHIEVEMENTS_LIST.filter(
    (a) => activeTab === "all" || a.category === activeTab
  );

  const totalAchievements = ACHIEVEMENTS_LIST.length;
  const completedCount = ACHIEVEMENTS_LIST.filter((a) => {
    const cur = a.getCurrentCount(worldState);
    return cur >= a.targetCount;
  }).length;
  const claimedCount = claimedList.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0f19] border border-[#232f48] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Bảng Thành Tựu & Cột Mốc Danh Vọng
              </h2>
              <p className="text-xs text-slate-400">
                Chinh phục các kỳ tích trên Đại Lục để nhận vinh danh và kho báu hậu hĩnh
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="p-2 rounded-full bg-slate-800/60 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Progress Summary Banner ── */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-cyan-950/30 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-300">Tiến độ kỳ tích: </span>
              <span className="font-black text-amber-300 font-mono">
                {completedCount} / {totalAchievements}
              </span>
              <span className="text-slate-400 ml-1.5">
                (Đã nhận thưởng: <span className="text-cyan-300 font-mono font-bold">{claimedCount}</span>)
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs self-end sm:self-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab("combat")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === "combat"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Chiến Đấu</span>
            </button>
            <button
              onClick={() => setActiveTab("forge")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === "forge"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Cường Hóa</span>
            </button>
            <button
              onClick={() => setActiveTab("wealth")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === "wealth"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Tài Phú</span>
            </button>
          </div>
        </div>

        {/* ── Modal Body (Achievements List) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-3.5">
          {filteredAchievements.map((ach) => {
            const currentCount = ach.getCurrentCount(worldState);
            const isCompleted = currentCount >= ach.targetCount;
            const isClaimed = claimedList.includes(ach.id);
            const progressPct = Math.min(100, Math.round((currentCount / ach.targetCount) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isClaimed
                    ? "bg-slate-950/40 border-slate-800/60 opacity-80"
                    : isCompleted
                    ? "bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-slate-950 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                        isClaimed
                          ? "bg-slate-900 border-slate-700"
                          : isCompleted
                          ? "bg-amber-500/20 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                          : "bg-slate-900/80 border-slate-800"
                      }`}
                    >
                      {ach.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-white truncate">
                          {ach.title}
                        </h3>
                        {ach.rewardTitle && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-black shrink-0">
                            Danh Hiệu: {ach.rewardTitle}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {ach.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2 max-w-md">
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted
                                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                : "bg-gradient-to-r from-cyan-600 to-blue-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-300 shrink-0">
                          {currentCount.toLocaleString()} / {ach.targetCount.toLocaleString()} ({progressPct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rewards & Claim Button */}
                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                    <div className="flex flex-col items-start sm:items-end text-xs font-mono">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        +{ach.rewardGold.toLocaleString()} Vàng
                      </span>
                      <span className="text-cyan-300 font-bold flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        +{ach.rewardExp.toLocaleString()} EXP
                      </span>
                      {ach.rewardItemName && (
                        <span className="text-[10px] text-emerald-400 font-sans mt-0.5 font-semibold">
                          🎁 {ach.rewardItemName}
                        </span>
                      )}
                    </div>

                    {isClaimed ? (
                      <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-emerald-400 text-xs font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Đã Nhận</span>
                      </div>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaim(ach)}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 animate-pulse"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Nhận Thưởng</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chưa Đạt</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">Y</kbd> để đóng</span>
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

export default AchievementsModal;

