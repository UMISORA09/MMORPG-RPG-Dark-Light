// ==============================================================================
// DungeonSelectModal.tsx
// Dark Fantasy Instanced Dungeon Portal Selection Modal
// Difficulties: Thường (Lv.5+), Khó (Lv.10+), Ác Mộng (Lv.15+)
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { 
  ShieldAlert, 
  Flame, 
  Skull, 
  Crown, 
  Coins, 
  Sparkles, 
  X, 
  ChevronRight,
  Sword
} from "lucide-react";

export const DungeonSelectModal = memo(function DungeonSelectModal() {
  const dungeonModalOpen = useGameWorldStore((s) => s.dungeonModalOpen);
  const closeDungeonModal = useGameWorldStore((s) => s.closeDungeonModal);
  const enterDungeon = useGameWorldStore((s) => s.enterDungeon);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);

  const [selectedDifficulty, setSelectedDifficulty] = useState<"normal" | "hard" | "nightmare">("normal");

  if (!dungeonModalOpen) return null;

  const handleSelect = (diff: "normal" | "hard" | "nightmare") => {
    setSelectedDifficulty(diff);
    playCombatSFX("holy_bell", 0.4);
  };

  const handleEnter = () => {
    playCombatSFX("dragon_roar", 0.6);
    enterDungeon(selectedDifficulty);
  };

  const handleClose = () => {
    playCombatSFX("blade_slash", 0.3);
    closeDungeonModal();
  };

  const difficulties = [
    {
      id: "normal" as const,
      name: "Độ Khó: Thường",
      reqLevel: 5,
      color: "border-cyan-500/50 bg-cyan-950/20 text-cyan-300",
      accent: "#00f2ff",
      icon: ShieldAlert,
      mobs: "Yêu Tinh Đao Phủ & Slime Đỏ (Lv.5 - Lv.8)",
      gold: "500 - 800",
      exp: "1,200",
      drops: [
        { name: "Đồ Hiếm (Rare)", rarity: "rare", rate: "25%" },
        { name: "Bình Huyết Dược Lớn", rarity: "common", rate: "60%" },
      ],
      desc: "Phù hợp cho tân thủ làm quen cơ chế né chiêu và săn trang bị xanh lam.",
    },
    {
      id: "hard" as const,
      name: "Độ Khó: Khó",
      reqLevel: 10,
      color: "border-purple-500/50 bg-purple-950/20 text-purple-300",
      accent: "#a855f7",
      icon: Flame,
      mobs: "Chiến Binh Orc Cổ & Kỵ Sĩ Xương (Lv.10 - Lv.14)",
      gold: "1,500 - 2,500",
      exp: "3,800",
      drops: [
        { name: "Đồ Sử Thi (Epic)", rarity: "epic", rate: "12%" },
        { name: "Đồ Hiếm (Rare)", rarity: "rare", rate: "50%" },
        { name: "Đá Cường Hóa", rarity: "rare", rate: "35%" },
      ],
      desc: "Quái vật có giáp kháng đòn và tốc độ tấn công +35%. Yêu cầu combo nhuần nhuyễn.",
    },
    {
      id: "nightmare" as const,
      name: "Độ Khó: Ác Mộng",
      reqLevel: 15,
      color: "border-rose-500/50 bg-rose-950/20 text-rose-300",
      accent: "#ef4444",
      icon: Skull,
      mobs: "Thống Lĩnh Hắc Long & Kỵ Sĩ Diệt Vong (Lv.16 - Lv.20)",
      gold: "4,000 - 6,500",
      exp: "9,500",
      drops: [
        { name: "Long Thần Kiếm (Legendary)", rarity: "legendary", rate: "8%" },
        { name: "Hoàng Giáp Long Tộc (Epic)", rarity: "epic", rate: "35%" },
        { name: "Rương Báu Cổ Đại", rarity: "legendary", rate: "100%" },
      ],
      desc: "Boss bước vào Cuồng Nộ ngay từ đầu, đòn đánh gây choáng diện rộng và thiêu đốt!",
    },
  ];

  const currentDiffData = difficulties.find((d) => d.id === selectedDifficulty)!;
  const isLevelEligible = playerLevel >= currentDiffData.reqLevel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 pointer-events-auto"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f1422]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                <span>CỔNG CẤM ĐỊA — HANG ĐỘNG PHÓ BẢN</span>
              </h2>
              <p className="text-xs text-slate-400">
                Thách thức sào huyệt hắc ám để nhận trang bị Huyền Thoại và tài nguyên quý giá
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Difficulty Selector, Right Detail Card */}
        <div className="grid grid-cols-1 md:grid-cols-5 p-6 gap-6 bg-[#0c101d]">
          {/* Left Column (2 cols): Difficulty Cards */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              Chọn Cấp Độ Thử Thách:
            </span>
            {difficulties.map((diff) => {
              const Icon = diff.icon;
              const isSelected = selectedDifficulty === diff.id;
              const isLocked = playerLevel < diff.reqLevel;

              return (
                <button
                  key={diff.id}
                  onClick={() => handleSelect(diff.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? `${diff.color} shadow-lg ring-1 ring-cyan-400/50`
                      : "border-slate-800 bg-[#121726]/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-white">{diff.name}</div>
                      <div className="text-[11px] font-mono opacity-80">
                        Yêu cầu: <span className={playerLevel >= diff.reqLevel ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>Cấp {diff.reqLevel}+</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition ${isSelected ? "translate-x-1 text-cyan-400" : "opacity-40"}`} />
                  {isLocked && (
                    <div className="absolute top-1 right-2 text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-300 font-bold">
                      CHƯA ĐỦ CẤP
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column (3 cols): Selected Dungeon Details & Rewards */}
          <div className="md:col-span-3 flex flex-col justify-between p-5 rounded-2xl bg-[#111625] border border-slate-800/80">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                  <Sword className="w-4 h-4 text-cyan-400" />
                  {currentDiffData.name}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  Cấp Đề Xuất: {currentDiffData.reqLevel}+
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {currentDiffData.desc}
              </p>

              {/* Monster Encounters */}
              <div className="mb-4 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Quái Vật Đồn Trú:
                </span>
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span>💀</span>
                  <span>{currentDiffData.mobs}</span>
                </span>
              </div>

              {/* Reward Loot Preview */}
              <div className="space-y-2 mb-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Phần Thưởng Vượt Ải Dự Kiến:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/20 border border-amber-600/30 text-amber-300 text-xs">
                    <Coins className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{currentDiffData.gold} Vàng</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/20 border border-cyan-600/30 text-cyan-300 text-xs">
                    <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>+{currentDiffData.exp} EXP</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {currentDiffData.drops.map((drop, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className={
                        drop.rarity === "legendary"
                          ? "text-amber-400 font-bold"
                          : drop.rarity === "epic"
                          ? "text-purple-400 font-bold"
                          : drop.rarity === "rare"
                          ? "text-cyan-400 font-bold"
                          : "text-slate-300"
                      }>
                        ✦ {drop.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Tỉ lệ: {drop.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enter Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleEnter}
                disabled={!isLevelEligible}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer ${
                  isLevelEligible
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25 active:scale-95"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <span>{isLevelEligible ? "⚔️ TIẾN VÀO PHÓ BẢN" : "⚠️ CẤP ĐỘ KHÔNG ĐỦ"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DungeonSelectModal;

