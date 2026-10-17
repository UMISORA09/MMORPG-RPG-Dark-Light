// ==============================================================================
// CodexModal.tsx — Sách Đồ Giám Sưu Tầm Quái Vật & Trang Bị (Codex)
// Cộng chỉ số vĩnh viễn cho nhân vật khi đạt mốc sưu tầm
// Phím tắt mở nhanh: Alt + L
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useToast } from "@/hooks/use-toast";
import { playCombatSFX, playButtonClick } from "@/audio/CombatSoundSynth";
import {
  X,
  BookOpen,
  Sparkles,
  Award,
  CheckCircle,
  Shield,
  Swords,
  Heart,
  Crown,
} from "lucide-react";

export const CodexModal = memo(function CodexModal() {
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const codexUnlocked = useGameWorldStore((s) => s.codexUnlocked || []);
  const monsterKillCounts = useGameWorldStore((s) => s.monsterKillCounts || {});
  const setCodexUnlocked = useGameWorldStore((s) => s.setCodexUnlocked);
  const syncFromBackendCharacter = useGameWorldStore((s) => s.syncFromBackendCharacter);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"monsters" | "equipment">("monsters");

  const monstersList = [
    { id: "slime", name: "Slime Đầm Lầy", level: 1, icon: "🟢", target: 10, bonus: "+20 HP, +3 ATK" },
    { id: "slime_red", name: "Slime Đỏ Bãi Cỏ", level: 2, icon: "🔴", target: 10, bonus: "+20 HP, +3 DEF" },
    { id: "wolf", name: "Sói Hoang Hoang Dã", level: 5, icon: "🐺", target: 15, bonus: "+30 HP, +4 ATK" },
    { id: "goblin", name: "Yêu Tinh Thảo Nguyên", level: 5, icon: "👺", target: 15, bonus: "+30 HP, +4 DEF" },
    { id: "goblin_executioner", name: "Yêu Tinh Đao Phủ", level: 6, icon: "🪓", target: 20, bonus: "+40 HP, +5 ATK" },
    { id: "skeleton", name: "Chiến Binh Xương Khô", level: 7, icon: "💀", target: 20, bonus: "+40 HP, +5 DEF" },
    { id: "orc", name: "Chiến Binh Orc Cổ", level: 8, icon: "👹", target: 25, bonus: "+50 HP, +6 ATK" },
    { id: "dark_knight_elite", name: "Kỵ Sĩ Hắc Ám (Tinh Anh)", level: 9, icon: "🛡️", target: 25, bonus: "+60 HP, +8 DEF" },
    { id: "vampire", name: "Dơi Huyết Nguyệt", level: 10, icon: "🦇", target: 30, bonus: "+70 HP, +9 ATK" },
    { id: "void_mage", name: "Pháp Sư Hư Không", level: 12, icon: "🔮", target: 30, bonus: "+80 HP, +10 MATK" },
    { id: "abyss_guardian", name: "Hộ Vệ Thâm Uyên", level: 13, icon: "🗿", target: 35, bonus: "+100 HP, +12 DEF" },
    { id: "black_dragon_king", name: "Hắc Long Vương Bạo Chúa (Boss)", level: 15, icon: "🐉", target: 1, bonus: "+200 HP, +25 ATK, +20 DEF" },
    { id: "dragon", name: "Rồng Lửa Cổ Đại (Boss Cấm Địa)", level: 20, icon: "🔥", target: 1, bonus: "+300 HP, +35 ATK, +30 DEF" },
  ];

  const equipmentSets = [
    { id: "set_rare", name: "Bộ Sưu Tập Trang Bị Hiếm (Rare)", count: "12 Món", bonus: "+50 HP, +10 ATK, +10 DEF", color: "border-cyan-500 text-cyan-300" },
    { id: "set_epic", name: "Bộ Sưu Tập Sử Thi (Epic)", count: "12 Món", bonus: "+120 HP, +25 ATK, +25 DEF", color: "border-purple-500 text-purple-300" },
    { id: "set_legendary", name: "Bộ Sưu Tập Huyền Thoại (Legendary)", count: "12 Món", bonus: "+250 HP, +50 ATK, +50 DEF", color: "border-amber-500 text-amber-300" },
    { id: "set_miracle", name: "Bộ Sưu Tập Kì Tích Tối Cao (Miracle)", count: "12 Món", bonus: "+500 HP, +100 ATK, +100 DEF, +5000 Lực Chiến", color: "border-fuchsia-500 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.4)]" },
  ];

  const handleClaimCodex = async (entryId: string) => {
    if (!activeCharacterId) return;
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/codex/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codexEntryId: entryId }),
      });
      const data = await res.json();
      if (data.success) {
        playCombatSFX("holy_bell", 0.7);
        setCodexUnlocked(data.codexUnlocked);
        if (data.character) syncFromBackendCharacter(data.character);
        toast({ title: "Kích Hoạt Đồ Giám!", description: data.message });
      } else {
        toast({ title: "Lỗi", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playButtonClick();
          closeActiveModal();
        }
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0b0e14]/95 border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_40px_rgba(6,182,212,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-[#0c1222] to-cyan-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400 shadow-[0_0_15px_#00f2ff]">
              <BookOpen className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow">
                  Sách Đồ Giám Đại Lục (Codex)
                </h2>
                <span className="font-mono text-[10px] font-black text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400">
                  Alt + L
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sưu tầm quái vật & trang bị để nhận vĩnh viễn chỉ số thuộc tính cộng thẳng vào nhân vật
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClick();
              closeActiveModal();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-red-500 hover:text-white border border-slate-700 text-slate-400 flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-md hover:scale-110 active:scale-95"
            title="Đóng (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#060a12]">
          <button
            onClick={() => setActiveTab("monsters")}
            className={`px-5 py-2.5 text-xs font-black uppercase rounded-t-xl transition cursor-pointer border-t border-x ${
              activeTab === "monsters"
                ? "bg-[#090c16] border-cyan-500/60 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            👾 Đồ Giám Quái Vật ({monstersList.length})
          </button>
          <button
            onClick={() => setActiveTab("equipment")}
            className={`px-5 py-2.5 text-xs font-black uppercase rounded-t-xl transition cursor-pointer border-t border-x ${
              activeTab === "equipment"
                ? "bg-[#090c16] border-cyan-500/60 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            🛡️ Đồ Giám Trang Bị ({equipmentSets.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "monsters" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {monstersList.map((m) => {
                const kills = Number(monsterKillCounts[m.id]) || 0;
                const isClaimed = codexUnlocked.includes(`monster_${m.id}`);
                const canClaim = kills >= m.target && !isClaimed;

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-black/50 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none">{m.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{m.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">Lv.{m.level}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          Thưởng: {m.bonus}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="w-28 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${Math.min(100, (kills / m.target) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 font-bold">
                            {kills}/{m.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isClaimed ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-600 text-emerald-400 text-xs font-bold font-mono flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Đã Kích Hoạt
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaimCodex(`monster_${m.id}`)}
                          disabled={!canClaim}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            canClaim
                              ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 text-white shadow-[0_0_15px_#06b6d4]"
                              : "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                          }`}
                        >
                          ✨ Kích Hoạt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipmentSets.map((s) => {
                const isClaimed = codexUnlocked.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-3xl border-2 bg-black/60 flex flex-col justify-between gap-3 ${s.color}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white">{s.name}</h4>
                        <span className="text-xs font-mono font-bold text-amber-300">{s.count}</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-mono mt-2">
                        Hiệu ứng vĩnh viễn: {s.bonus}
                      </p>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800/80">
                      {isClaimed ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Đã Kích Hoạt
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaimCodex(s.id)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black uppercase transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        >
                          ✨ Kích Hoạt Bộ Sưu Tập
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
});
