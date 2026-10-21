// ==============================================================================
// TalentAndAwakeningModal.tsx — Thức Tỉnh Chuyển Chức & Cây Thiên Phú 3 Nhánh
// Phím tắt mở nhanh: Alt + N
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useToast } from "@/hooks/use-toast";
import { playCombatSFX, playButtonClick } from "@/audio/CombatSoundSynth";
import {
  X,
  Sparkles,
  Zap,
  Flame,
  Shield,
  Wind,
  RotateCcw,
  CheckCircle,
  Lock,
  ChevronRight,
  Award,
} from "lucide-react";

export const TalentAndAwakeningModal = memo(function TalentAndAwakeningModal() {
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const awakeningTier = useGameWorldStore((s) => s.awakeningTier || 0);
  const talents = useGameWorldStore((s) => s.talents || {});
  const setAwakeningTier = useGameWorldStore((s) => s.setAwakeningTier);
  const setTalents = useGameWorldStore((s) => s.setTalents);
  const syncFromBackendCharacter = useGameWorldStore((s) => s.syncFromBackendCharacter);
  const { toast } = useToast();

  const [isUpgrading, setIsUpgrading] = useState(false);

  // Available skill points
  const [skillPoints, setSkillPoints] = useState<number>(() => {
    return (useGameWorldStore.getState() as any).unallocatedStatPoints || 3;
  });

  const titles: Record<string, string[]> = {
    assassin: ["Thích Khách", "Ảnh Vũ Sát Thần", "Huyết Nguyệt Ma Tôn", "Chân Thần Huyết Nguyệt"],
    warrior: ["Võ Sĩ", "Cuồng Long Chiến Tướng", "Chiến Thần Bất Bại", "Chân Thần Chiến Long"],
    tank: ["Hộ Vệ", "Kim Cương Thiết Giáp", "Thánh Khiên Bất Diệt", "Chân Thần Bất Hoại"],
    gunner: ["Thiện Xạ", "Pháo Thủ Quỹ Đạo", "Thiên Phạt Thần Cơ", "Chân Thần Tinh Tú"],
  };

  const currentTitle = titles[playerClassId]?.[awakeningTier] || "Chiến Binh";
  const nextTier = awakeningTier + 1;
  const nextTitle = titles[playerClassId]?.[nextTier] || "Thần Cấp";
  const requiredLevels = [0, 5, 10, 15];
  const requiredLevel = requiredLevels[nextTier] || 15;
  const goldCosts = [0, 1000, 5000, 15000];
  const upgradeCost = goldCosts[nextTier] || 15000;

  // Handle Class Awakening Upgrade
  const handleAwakeningUpgrade = async () => {
    if (!activeCharacterId) return;
    if (awakeningTier >= 3) {
      toast({ title: "Đã đạt cảnh giới tối cao Bậc 3 (Thần Hóa)!" });
      return;
    }
    if (playerLevel < requiredLevel) {
      toast({
        title: "Cấp độ chưa đủ",
        description: `Cần đạt cấp ${requiredLevel} để đột phá Bậc ${nextTier} (Hiện tại: Cấp ${playerLevel})`,
        variant: "destructive",
      });
      return;
    }
    if (playerGold < upgradeCost) {
      toast({
        title: "Không đủ Vàng",
        description: `Cần ${upgradeCost.toLocaleString()} Vàng để đột phá chuyển chức.`,
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/awakening/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        playCombatSFX("holy_bell", 0.8);
        setAwakeningTier(data.awakeningTier);
        if (data.character) syncFromBackendCharacter(data.character);
        toast({
          title: "⚡ ĐỘT PHÁ THÀNH CÔNG!",
          description: data.message,
        });
      } else {
        toast({ title: "Thất bại", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle Allocate Talent Point
  const handleAllocateTalent = async (talentKey: string) => {
    if (!activeCharacterId) return;
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/talents/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talentKey }),
      });
      const data = await res.json();
      if (data.success) {
        playCombatSFX("coin_chime", 0.4);
        setTalents(data.talents);
        if (data.character) syncFromBackendCharacter(data.character);
        setSkillPoints(data.skillPoints);
        toast({ title: "Thăng Cấp Thiên Phú", description: data.message });
      } else {
        toast({ title: "Lỗi", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  // Handle Reset Talents
  const handleResetTalents = async () => {
    if (!activeCharacterId) return;
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/talents/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        playCombatSFX("holy_bell", 0.5);
        setTalents({});
        if (data.character) syncFromBackendCharacter(data.character);
        setSkillPoints(data.skillPoints);
        toast({ title: "Tẩy Điểm Thành Công", description: data.message });
      } else {
        toast({ title: "Lỗi", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  // 3-Branch Talent Definitions
  const talentBranches = [
    {
      id: "fury",
      name: "Nhánh Cuồng Nộ (Công Kích)",
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      color: "border-rose-500/50 bg-rose-950/20",
      talents: [
        { key: "fury_1", name: "Cuồng Long Trảm", desc: "+8 Sát thương Tấn công mỗi điểm", max: 5 },
        { key: "fury_2", name: "Tử Thần Chi Nhãn", desc: "+2% Tỉ lệ Bạo kích mỗi điểm", max: 5 },
        { key: "fury_3", name: "Thiên Băng Trảm", desc: "+250 Lực chiến & Uy lực tuyệt kỹ", max: 5 },
      ],
    },
    {
      id: "fortitude",
      name: "Nhánh Kiên Cường (Sinh Tồn)",
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      color: "border-emerald-500/50 bg-emerald-950/20",
      talents: [
        { key: "fort_1", name: "Kim Cương Hộ Thể", desc: "+8 Phòng ngự (DEF) mỗi điểm", max: 5 },
        { key: "fort_2", name: "Bất Diệt Sinh Mệnh", desc: "+120 Máu tối đa (HP) mỗi điểm", max: 5 },
        { key: "fort_3", name: "Thánh Thuẫn Giảm Thương", desc: "+10 MDEF & 4% Giảm sát thương Boss", max: 5 },
      ],
    },
    {
      id: "agility",
      name: "Nhánh Linh Hoạt (Tiện Ích)",
      icon: <Wind className="w-4 h-4 text-cyan-400" />,
      color: "border-cyan-500/50 bg-cyan-950/20",
      talents: [
        { key: "agility_1", name: "Thần Tốc Du Long", desc: "+1 Tốc độ di chuyển mỗi điểm", max: 5 },
        { key: "agility_2", name: "Thời Khắc Tinh Thông", desc: "+2% Né tránh & -3% Giảm hồi chiêu", max: 5 },
        { key: "agility_3", name: "Phúc Lành Thần Tài", desc: "+5% Vàng & EXP nhặt được", max: 5 },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0b0e14]/95 border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-gradient-to-r from-amber-950/80 via-[#100c1e] to-amber-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400 shadow-[0_0_15px_#f59e0b]">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow">
                  Thức Tỉnh Chuyển Chức & Cây Thiên Phú
                </h2>
                <span className="font-mono text-[10px] font-black text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400">
                  Alt + N
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đột phá đẳng cấp cảnh giới (+20% toàn bộ chỉ số/bậc) & phân bổ điểm kỹ năng thiên phú
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClick();
              closeActiveModal();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-red-500 hover:text-white border border-slate-700 text-slate-400 flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-md hover:scale-110 active:scale-95"
            title="Đóng Bảng Thiên Phú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* SECTION 1: THỨC TỈNH CHUYỂN CHỨC (AWAKENING TIERS) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#120f26] via-[#090b14] to-[#120f26] border-2 border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-500/30 to-purple-600/30 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <span className="text-3xl">👑</span>
                <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-black/90 border border-amber-400 font-mono text-[9px] font-black text-amber-300">
                  BẬC {awakeningTier}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                  Cảnh Giới Hiện Tại
                </span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>{currentTitle}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    +{awakeningTier * 20}% Toàn Chỉ Số
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mở khóa Hào quang Chân Thần uy lực dưới chân nhân vật.
                </p>
              </div>
            </div>

            {/* Upgrade Action Box */}
            <div className="flex items-center gap-4">
              {awakeningTier < 3 ? (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="text-xs font-mono text-slate-300 flex items-center gap-3">
                    <span>Yêu cầu: <strong className="text-cyan-400">Lv.{requiredLevel}</strong></span>
                    <span>Chi phí: <strong className="text-amber-400">{upgradeCost.toLocaleString()} Vàng</strong></span>
                  </div>
                  <button
                    onClick={handleAwakeningUpgrade}
                    disabled={isUpgrading || playerLevel < requiredLevel || playerGold < upgradeCost}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                      playerLevel < requiredLevel || playerGold < upgradeCost
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:scale-105 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>⚡ Đột Phá Bậc {nextTier} ({nextTitle})</span>
                  </button>
                </div>
              ) : (
                <div className="px-5 py-2 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-xs font-black">
                  ✨ ĐÃ ĐẠT CẢNH GIỚI THẦN HÓA TỐI CAO
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: CÂY KỸ NĂNG THIÊN PHÚ 3 NHÁNH */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>🌟 Cây Thiên Phú 3 Nhánh</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 font-mono text-xs font-black text-cyan-300">
                  Điểm khả dụng: {skillPoints}
                </span>
              </div>

              <button
                onClick={handleResetTalents}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                title="Tẩy toàn bộ điểm thiên phú (Phí 500 Vàng)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Tẩy Điểm (500 Vàng)</span>
              </button>
            </div>

            {/* 3 Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {talentBranches.map((branch) => (
                <div
                  key={branch.id}
                  className={`p-4 rounded-3xl border-2 flex flex-col gap-3 ${branch.color}`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    {branch.icon}
                    <h4 className="text-xs font-black text-white uppercase">
                      {branch.name}
                    </h4>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {branch.talents.map((t) => {
                      const current = Number(talents[t.key]) || 0;
                      return (
                        <div
                          key={t.key}
                          className="p-3 rounded-2xl bg-black/60 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{t.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold">
                                {current}/{t.max}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                          </div>

                          <button
                            onClick={() => handleAllocateTalent(t.key)}
                            disabled={current >= t.max || skillPoints <= 0}
                            className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-black transition cursor-pointer ${
                              current >= t.max || skillPoints <= 0
                                ? "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_10px_#06b6d4]"
                            }`}
                          >
                            +1
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});
