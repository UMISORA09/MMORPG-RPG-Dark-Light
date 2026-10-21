// ==============================================================================
// Detailed Stats & Rune Inspector Drawer (Chiến Long Bá MMORPG)
// Section 1: Stat Breakdown (Gốc + Trang Bị = Tổng)
// Section 2: Active Rune Effects Summary
// Section 3: 12 Equipped Gear Class Affinity & CP Contribution
// ==============================================================================

import { memo } from "react";
import {
  X,
  Swords,
  Shield,
  Heart,
  Zap,
  Sparkles,
  Target,
  Wind,
  Flame,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Percent,
} from "lucide-react";
import {
  getActiveRuneEffects,
  isItemClassMatched,
  getClassName,
  calculateItemCombatPower,
  type ItemRune,
} from "@/skills/EquipmentRuneEngine";

export interface DetailedStatsInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterClassId: string;
  characterLevel: number;
  equippedItems: any[];
  baseStats: {
    atk: number;
    matk: number;
    def: number;
    mdef: number;
    hp: number;
    mp: number;
    spd: number;
    critRate: number;
    critDmg: number;
    accuracy: number;
    evasion: number;
  };
  gearStats: {
    atk: number;
    matk: number;
    def: number;
    mdef: number;
    hp: number;
    mp: number;
    spd: number;
    critRate: number;
    critDmg: number;
    accuracy: number;
    evasion: number;
  };
  totalCombatPower: number;
  equipmentCombatPower: number;
}

export const DetailedStatsInspectorPanel = memo(function DetailedStatsInspectorPanel({
  isOpen,
  onClose,
  characterName,
  characterClassId,
  characterLevel,
  equippedItems,
  baseStats,
  gearStats,
  totalCombatPower,
  equipmentCombatPower,
}: DetailedStatsInspectorProps) {
  if (!isOpen) return null;

  const runeEffects = getActiveRuneEffects(equippedItems, characterClassId);

  const STAT_ROWS = [
    {
      id: "atk",
      label: "Sát Thương Vật Lý (ATK)",
      icon: Swords,
      color: "text-rose-400",
      base: baseStats.atk,
      gear: gearStats.atk,
      unit: "",
    },
    {
      id: "matk",
      label: "Sát Thương Phép Thuật (MATK)",
      icon: Flame,
      color: "text-purple-400",
      base: baseStats.matk,
      gear: gearStats.matk,
      unit: "",
    },
    {
      id: "def",
      label: "Giáp Hộ Thể (DEF)",
      icon: Shield,
      color: "text-blue-400",
      base: baseStats.def,
      gear: gearStats.def,
      unit: "",
    },
    {
      id: "mdef",
      label: "Kháng Ma Pháp (MDEF)",
      icon: Shield,
      color: "text-indigo-400",
      base: baseStats.mdef,
      gear: gearStats.mdef,
      unit: "",
    },
    {
      id: "hp",
      label: "Sinh Lực Tối Đa (HP)",
      icon: Heart,
      color: "text-emerald-400",
      base: baseStats.hp,
      gear: gearStats.hp,
      unit: "",
    },
    {
      id: "mp",
      label: "Nội Lực / Năng Lượng (MP)",
      icon: Zap,
      color: "text-cyan-400",
      base: baseStats.mp,
      gear: gearStats.mp,
      unit: "",
    },
    {
      id: "spd",
      label: "Tốc Độ Di Chuyển (SPD)",
      icon: Wind,
      color: "text-amber-400",
      base: baseStats.spd,
      gear: gearStats.spd,
      unit: "",
    },
    {
      id: "critRate",
      label: "Tỉ Lệ Bạo Kích (Crit Rate)",
      icon: Sparkles,
      color: "text-yellow-400",
      base: baseStats.critRate,
      gear: gearStats.critRate,
      unit: "%",
    },
    {
      id: "critDmg",
      label: "Sát Thương Bạo Kích (Crit DMG)",
      icon: Percent,
      color: "text-orange-400",
      base: baseStats.critDmg,
      gear: gearStats.critDmg,
      unit: "%",
    },
    {
      id: "accuracy",
      label: "Độ Chính Xác (Accuracy)",
      icon: Target,
      color: "text-teal-400",
      base: baseStats.accuracy,
      gear: gearStats.accuracy,
      unit: "",
    },
    {
      id: "evasion",
      label: "Khả Năng Né Tránh (Evasion)",
      icon: Wind,
      color: "text-sky-400",
      base: baseStats.evasion,
      gear: gearStats.evasion,
      unit: "",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in duration-200 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-[820px] bg-[#0d0910]/95 border-2 border-cyan-500/70 rounded-[28px] overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.35),0_20px_50px_rgba(0,0,0,0.95)] flex flex-col backdrop-blur-2xl text-slate-100 max-h-[90vh]">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-black to-blue-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/30 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <BarChart3 className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                  📊 BẢNG PHÂN TÍCH THÔNG SỐ TOÀN DIỆN & PHÙ VĂN
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono font-bold tracking-wider uppercase">
                  STAT INSPECTOR
                </span>
              </div>
              <p className="text-xs text-cyan-300/70 font-mono">
                {characterName} — Cấp {characterLevel} | {getClassName(characterClassId)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Combat Power Banner */}
        <div className="px-6 py-3 bg-[#130d17] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">⚔️</span>
            <span className="text-slate-300">Tổng Lực Chiến Nhân Vật:</span>
            <strong className="text-amber-300 text-sm font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              {totalCombatPower.toLocaleString()}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-sm">🛡️</span>
            <span className="text-slate-300">Lực Chiến Từ Trang Bị & Phù Văn:</span>
            <strong className="text-cyan-300 font-black">
              +{equipmentCombatPower.toLocaleString()} ({equippedItems.length}/12 Món)
            </strong>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[72vh]">
          
          {/* ── PHẦN 1: PHÂN TÁCH CHỈ SỐ (GỐC + TRANG BỊ = TỔNG) ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚔️</span> Phần 1: Phân Tách Chỉ Số Chi Tiết (Gốc + Trang Bị = Tổng)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">11 Chỉ Số Cốt Lõi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {STAT_ROWS.map((st) => {
                const IconComp = st.icon;
                const total = st.base + st.gear;
                return (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-xl bg-[#140e19] border border-cyan-500/20 flex items-center justify-between font-mono text-xs"
                  >
                    <div className="flex items-center gap-2 font-sans">
                      <IconComp className={`w-3.5 h-3.5 ${st.color} shrink-0`} />
                      <span className="text-slate-300 text-[11px] truncate">{st.label}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-slate-400 text-[11px]">
                        {st.base}{st.unit} <span className="text-slate-600">(Gốc)</span>
                      </span>
                      {st.gear > 0 && (
                        <span className="text-cyan-400 text-[11px] font-bold">
                          {" "}+ {st.gear}{st.unit} <span className="text-slate-600">(Đồ)</span>
                        </span>
                      )}
                      <span className="text-white font-black ml-1.5">
                        = {total}{st.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PHẦN 2: TỔNG HỢP HIỆU ỨNG PHÙ VĂN ĐANG KÍCH HOẠT ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔮</span> Phần 2: Hiệu Ứng Phù Văn Đang Kích Hoạt ({runeEffects.activeRunesCount} Dòng)
              </h3>
              {runeEffects.deactivatedRunesCount > 0 && (
                <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-full">
                  ⚠️ {runeEffects.deactivatedRunesCount} dòng bị vô hiệu hóa do trái phái
                </span>
              )}
            </div>

            {runeEffects.activeRunesCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {runeEffects.totalLifestealPercent > 0 && (
                  <div className="p-3 rounded-xl bg-[#1c0d12] border border-rose-500/40 flex items-start gap-2 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
                    <span className="text-lg">🩸</span>
                    <div>
                      <h5 className="font-bold text-rose-300">Tổng Hút Máu (Life Steal)</h5>
                      <p className="font-mono font-black text-rose-400 text-sm">
                        +{runeEffects.totalLifestealPercent.toFixed(1)}% DMG
                      </p>
                      <span className="text-[10px] text-slate-400">Hồi HP trên mỗi đòn đánh</span>
                    </div>
                  </div>
                )}

                {runeEffects.totalPoisonDmgPerSec > 0 && (
                  <div className="p-3 rounded-xl bg-[#0b1c13] border border-emerald-500/40 flex items-start gap-2 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <span className="text-lg">☠️</span>
                    <div>
                      <h5 className="font-bold text-emerald-300">Sát Thương Độc Tố</h5>
                      <p className="font-mono font-black text-emerald-400 text-sm">
                        {runeEffects.totalPoisonDmgPerSec} DMG / Giây
                      </p>
                      <span className="text-[10px] text-slate-400">Rút máu liên tục 4 giây & -20% hồi máu</span>
                    </div>
                  </div>
                )}

                {runeEffects.totalDarkCurseChance > 0 && (
                  <div className="p-3 rounded-xl bg-[#1a0c24] border border-purple-500/40 flex items-start gap-2 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                    <span className="text-lg">🌑</span>
                    <div>
                      <h5 className="font-bold text-purple-300">Tỉ Lệ Nổ Hắc Văn</h5>
                      <p className="font-mono font-black text-purple-400 text-sm">
                        {runeEffects.totalDarkCurseChance}% Tỉ Lệ
                      </p>
                      <span className="text-[10px] text-slate-400">+150% Sát thương Hắc Ám & suy yếu mục tiêu</span>
                    </div>
                  </div>
                )}

                {runeEffects.totalThunderstrikeChance > 0 && (
                  <div className="p-3 rounded-xl bg-[#241d08] border border-yellow-500/40 flex items-start gap-2 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                    <span className="text-lg">⚡</span>
                    <div>
                      <h5 className="font-bold text-yellow-300">Sét Dây Chuyền</h5>
                      <p className="font-mono font-black text-yellow-400 text-sm">
                        {runeEffects.totalThunderstrikeChance}% Kích Hoạt
                      </p>
                      <span className="text-[10px] text-slate-400">Lan sang 3-4 mục tiêu xung quanh</span>
                    </div>
                  </div>
                )}

                {runeEffects.totalHpRegenPercent > 0 && (
                  <div className="p-3 rounded-xl bg-[#0d1e13] border border-green-500/40 flex items-start gap-2">
                    <span className="text-lg">💚</span>
                    <div>
                      <h5 className="font-bold text-green-300">Hồi Máu Theo Giây</h5>
                      <p className="font-mono font-black text-green-400 text-sm">
                        +{runeEffects.totalHpRegenPercent.toFixed(1)}% + {runeEffects.totalHpRegenFlat} HP / 2s
                      </p>
                      <span className="text-[10px] text-slate-400">Tự động hồi phục liên tục trong chiến đấu</span>
                    </div>
                  </div>
                )}

                {runeEffects.totalThornsPercent > 0 && (
                  <div className="p-3 rounded-xl bg-[#161a24] border border-slate-500/40 flex items-start gap-2">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <h5 className="font-bold text-slate-300">Phản Đòn Cận Chiến</h5>
                      <p className="font-mono font-black text-slate-200 text-sm">
                        {runeEffects.totalThornsPercent}% DMG Nhận
                      </p>
                      <span className="text-[10px] text-slate-400">Trả sát thương ngược lại kẻ tấn công</span>
                    </div>
                  </div>
                )}

                {runeEffects.hasGuardianShield && (
                  <div className="p-3 rounded-xl bg-[#091e2b] border border-cyan-500/40 flex items-start gap-2">
                    <span className="text-lg">✨</span>
                    <div>
                      <h5 className="font-bold text-cyan-300">Khiên Chắn Hộ Mệnh</h5>
                      <p className="font-mono font-black text-cyan-400 text-sm">
                        {runeEffects.guardianShieldPercent}% Max HP
                      </p>
                      <span className="text-[10px] text-slate-400">Tự bung khiên bảo vệ khi máu &lt; 30%</span>
                    </div>
                  </div>
                )}

                {runeEffects.totalArmorPiercePercent > 0 && (
                  <div className="p-3 rounded-xl bg-[#24140a] border border-orange-500/40 flex items-start gap-2">
                    <span className="text-lg">🗡️</span>
                    <div>
                      <h5 className="font-bold text-orange-300">Phá Giáp Phòng Thủ</h5>
                      <p className="font-mono font-black text-orange-400 text-sm">
                        Bỏ qua {runeEffects.totalArmorPiercePercent}% DEF
                      </p>
                      <span className="text-[10px] text-slate-400">Xuyên thấu lớp giáp quái vật và Boss</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#130f17] border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Chưa có dòng Phù Văn nào được kích hoạt. Hãy trang bị vũ khí hoặc trang bị phẩm chất Sử Thi/Huyền Thoại/Kì Tích đúng hệ phái!
              </div>
            )}
          </div>

          {/* ── PHẦN 3: DANH SÁCH 12 MÓN ĐANG MẶC & TRẠNG THÁI HỆ PHÁI ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛡️</span> Phần 3: Trạng Thái 12 Trang Bị & Tương Thích Hệ Phái
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{equippedItems.length}/12 Ô Đang Mặc</span>
            </div>

            <div className="space-y-1.5">
              {equippedItems.map((item, idx) => {
                const isMatched = isItemClassMatched(item.classId, characterClassId);
                const itemCP = calculateItemCombatPower(item, isMatched);

                const runes: ItemRune[] = Array.isArray(item.runesJson)
                  ? item.runesJson
                  : typeof item.runesJson === "string"
                  ? (() => {
                      try {
                        return JSON.parse(item.runesJson);
                      } catch {
                        return [];
                      }
                    })()
                  : [];

                return (
                  <div
                    key={item.id || idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      isMatched
                        ? "bg-[#140f1a] border-purple-500/30"
                        : "bg-rose-950/30 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{item.icon || "🛡️"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white truncate max-w-[200px]">
                            {item.name}
                          </h4>
                          {(item.enhanceLevel || 0) > 0 && (
                            <span className="text-[10px] font-mono font-bold text-amber-400">
                              +{item.enhanceLevel}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            (Lv.{item.requiredLevel || 1})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] mt-0.5">
                          {isMatched ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> ĐÚNG HỆ PHÁI (100% Sức mạnh)
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                              <AlertTriangle className="w-3 h-3" /> TRÁI HỆ PHÁI (-50% Chỉ số & Tắt Phù Văn)
                            </span>
                          )}
                          {runes.length > 0 && (
                            <span className="text-purple-300 font-mono">
                              | {runes.length} Phù Văn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="text-amber-300 font-black text-xs block">
                        ⚡ +{itemCP.toLocaleString()} CP
                      </span>
                      {!isMatched && (
                        <span className="text-[9px] text-rose-400 block font-sans">
                          (Đã chia đôi)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {equippedItems.length === 0 && (
                <div className="p-4 rounded-xl bg-[#140f1a] border border-slate-800 text-center text-xs text-slate-400">
                  Nhân vật hiện chưa mặc món trang bị nào trên người.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
});
