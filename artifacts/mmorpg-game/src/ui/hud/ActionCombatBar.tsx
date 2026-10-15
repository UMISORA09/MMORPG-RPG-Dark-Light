// ==============================================================================
// Dark-Light RPG HUD — Action Combat Bar
// Beveled hexagonal/angled skill slots, Combo 1-2-3 chain indicators,
// clockwise conic-gradient cooldown sweeps & class neon glow
// ==============================================================================

import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { getCharacterBlueprint } from "@/skills";
import { Swords, Wind, Sparkles } from "lucide-react";

export const ActionCombatBar = memo(function ActionCombatBar() {
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerColorHex = useGameWorldStore((s) => s.playerColorHex);
  const comboIndex = useGameWorldStore((s) => s.comboIndex);
  const comboTimer = useGameWorldStore((s) => s.comboTimer);
  const skillCooldowns = useGameWorldStore((s) => s.skillCooldowns);
  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const triggerSkill = useGameWorldStore((s) => s.triggerSkill);

  const blueprint = getCharacterBlueprint(playerClassId);
  const skills = blueprint.skills;

  const skill1Spec = skills[0];
  const skill2Spec = skills[1];
  const skill3Spec = skills[2];

  const cd1 = skillCooldowns.skill1 || 0;
  const cd2 = skillCooldowns.skill2 || 0;
  const cd3 = skillCooldowns.skill3 || 0;

  const maxCd1 = skill1Spec?.cooldown || 4.0;
  const maxCd2 = skill2Spec?.cooldown || 6.0;
  const maxCd3 = skill3Spec?.cooldown || 10.0;

  // Render Cooldown Overlay with Conic-Gradient
  const renderCooldownOverlay = (cd: number, maxCd: number) => {
    if (cd <= 0.05) return null;
    const pct = Math.min(1.0, cd / maxCd);
    const deg = pct * 360;

    return (
      <div
        className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none z-10"
        style={{
          background: `conic-gradient(from 0deg, rgba(8, 4, 18, 0.88) ${deg}deg, transparent ${deg}deg)`,
        }}
      >
        <span className="font-mono text-xs sm:text-sm font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {cd.toFixed(1)}s
        </span>
      </div>
    );
  };

  return (
    <div
      className="pointer-events-auto flex flex-col items-center gap-1.5 select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Combo Step Indicator (Above Basic Attack) ── */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0514]/85 border border-amber-500/30 backdrop-blur-md shadow-lg">
        <span className="text-[10px] font-mono font-bold text-slate-300">COMBO:</span>
        {[0, 1, 2].map((step) => {
          const isFilled = comboIndex >= step && comboTimer > 0;
          return (
            <div
              key={step}
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                isFilled
                  ? "bg-amber-400 border-amber-200 shadow-[0_0_8px_#f59e0b] scale-110"
                  : "bg-slate-900 border-slate-700"
              }`}
            />
          );
        })}
      </div>

      {/* ── Main Skills Dock (Hexagonal / Beveled Angled Slots) ── */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-2xl bg-[#0c0618]/90 border border-amber-500/40 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.9)]">
        
        {/* Slot 0: Basic Attack (Left Mouse / J) */}
        <button
          onClick={triggerComboAttack}
          className="relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl bg-gradient-to-br from-[#1e1333] to-[#0f081d] border-2 border-amber-400/70 hover:border-amber-300 flex flex-col items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95"
          title="Đánh Thường / Combo 1-2-3 (Chuột Trái hoặc phím J)"
        >
          <Swords className="w-6 h-6 text-amber-300 drop-shadow" />
          <span className="text-[9px] font-black text-slate-200 mt-0.5 truncate max-w-[50px]">
            Chém
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono text-[9px] font-black shadow">
            J
          </span>
        </button>

        {/* Slot 1: Skill 1 (1 / Q) */}
        <button
          disabled={cd1 > 0}
          onClick={() => triggerSkill(1)}
          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
            cd1 > 0
              ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
              : "bg-gradient-to-br from-[#181a38] to-[#0c0d24] border-cyan-400/80 hover:border-cyan-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          }`}
          title={`${skill1Spec?.name || "Kỹ năng 1"} (Phím 1 hoặc Q)`}
        >
          {renderCooldownOverlay(cd1, maxCd1)}
          <span className="text-xl drop-shadow select-none">⚡</span>
          <span className="text-[9px] font-black text-cyan-200 mt-0.5 truncate max-w-[50px]">
            {skill1Spec?.name.slice(0, 6) || "Chiêu 1"}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-mono text-[9px] font-black shadow">
            1
          </span>
        </button>

        {/* Slot 2: Skill 2 (2 / E) */}
        <button
          disabled={cd2 > 0}
          onClick={() => triggerSkill(2)}
          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
            cd2 > 0
              ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
              : "bg-gradient-to-br from-[#261036] to-[#12051f] border-purple-400/80 hover:border-purple-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
          }`}
          title={`${skill2Spec?.name || "Kỹ năng 2"} (Phím 2 hoặc E)`}
        >
          {renderCooldownOverlay(cd2, maxCd2)}
          <span className="text-xl drop-shadow select-none">🌪️</span>
          <span className="text-[9px] font-black text-purple-200 mt-0.5 truncate max-w-[50px]">
            {skill2Spec?.name.slice(0, 6) || "Chiêu 2"}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-purple-500 text-slate-950 font-mono text-[9px] font-black shadow">
            2
          </span>
        </button>

        {/* Slot 3: Ultimate Skill 3 (3 / R) */}
        <button
          disabled={cd3 > 0}
          onClick={() => triggerSkill(3)}
          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
            cd3 > 0
              ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
              : "bg-gradient-to-br from-[#381119] to-[#1a050b] border-rose-500 hover:border-rose-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer"
          }`}
          title={`${skill3Spec?.name || "Tuyệt Kỹ"} (Phím 3 hoặc R)`}
        >
          {renderCooldownOverlay(cd3, maxCd3)}
          <Sparkles className="w-6 h-6 text-rose-400 drop-shadow animate-pulse" />
          <span className="text-[9px] font-black text-rose-200 mt-0.5 truncate max-w-[50px]">
            {skill3Spec?.name.slice(0, 6) || "Tuyệt Kỹ"}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[9px] font-black shadow">
            3
          </span>
        </button>

        {/* Slot 4: Evade / Dash (Space) */}
        <div
          className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-[#140e21] border border-slate-700/80 flex flex-col items-center justify-center opacity-85"
          title="Nhảy / Lướt né đòn (Phím Space)"
        >
          <Wind className="w-5 h-5 text-emerald-400" />
          <span className="text-[8px] font-mono font-bold text-slate-400 mt-0.5">
            Space
          </span>
        </div>

      </div>
    </div>
  );
});
