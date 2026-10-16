// ==============================================================================
// Dark-Light RPG HUD — Action Combat Bar
// Beveled hexagonal/angled skill slots, Combo 1-2-3 chain indicators,
// clockwise conic-gradient cooldown sweeps & class neon glow
// ==============================================================================

import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { getCharacterBlueprint } from "@/skills";
import { Swords, Wind, Sparkles } from "lucide-react";

const CLASS_COMBAT_THEMES: Record<string, {
  basicIcon: string;
  basicLabel: string;
  skill1Icon: string;
  skill2Icon: string;
  skill3Icon: string;
  skill1Grad: string;
  skill2Grad: string;
  skill3Grad: string;
  skill1Border: string;
  skill2Border: string;
  skill3Border: string;
  skill1Glow: string;
  skill2Glow: string;
  skill3Glow: string;
}> = {
  gunner: {
    basicIcon: "🎯",
    basicLabel: "Bắn Kép",
    skill1Icon: "⚡",
    skill2Icon: "🚀",
    skill3Icon: "🛰️",
    skill1Grad: "from-[#082f49] to-[#0c1e33]",
    skill2Grad: "from-[#0369a1] to-[#075985]",
    skill3Grad: "from-[#0284c7] to-[#0369a1]",
    skill1Border: "border-cyan-400 hover:border-cyan-300",
    skill2Border: "border-sky-400 hover:border-sky-300",
    skill3Border: "border-teal-400 hover:border-teal-300",
    skill1Glow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    skill2Glow: "shadow-[0_0_15px_rgba(56,189,248,0.4)]",
    skill3Glow: "shadow-[0_0_20px_rgba(20,184,166,0.5)]",
  },
  assassin: {
    basicIcon: "🗡️",
    basicLabel: "Song Đoản",
    skill1Icon: "👤",
    skill2Icon: "🥷",
    skill3Icon: "🩸",
    skill1Grad: "from-[#3b0764] to-[#1e0b36]",
    skill2Grad: "from-[#4c0519] to-[#2e0514]",
    skill3Grad: "from-[#881337] to-[#4c0519]",
    skill1Border: "border-purple-400 hover:border-purple-300",
    skill2Border: "border-rose-400 hover:border-rose-300",
    skill3Border: "border-pink-500 hover:border-pink-300",
    skill1Glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    skill2Glow: "shadow-[0_0_15px_rgba(244,63,94,0.4)]",
    skill3Glow: "shadow-[0_0_20px_rgba(236,72,153,0.5)]",
  },
  fighter: {
    basicIcon: "⚔️",
    basicLabel: "Hỏa Quyền",
    skill1Icon: "🔥",
    skill2Icon: "🌪️",
    skill3Icon: "☄️",
    skill1Grad: "from-[#451a03] to-[#271004]",
    skill2Grad: "from-[#7c2d12] to-[#431407]",
    skill3Grad: "from-[#991b1b] to-[#450a0a]",
    skill1Border: "border-amber-500 hover:border-amber-300",
    skill2Border: "border-orange-500 hover:border-orange-300",
    skill3Border: "border-red-500 hover:border-red-300",
    skill1Glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    skill2Glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]",
    skill3Glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
  },
  tank: {
    basicIcon: "🛡️",
    basicLabel: "Khiên Kích",
    skill1Icon: "✨",
    skill2Icon: "🐎",
    skill3Icon: "☀️",
    skill1Grad: "from-[#3f2e04] to-[#1f1602]",
    skill2Grad: "from-[#713f12] to-[#3f2305]",
    skill3Grad: "from-[#854d0e] to-[#422006]",
    skill1Border: "border-yellow-400 hover:border-yellow-200",
    skill2Border: "border-amber-400 hover:border-amber-300",
    skill3Border: "border-yellow-300 hover:border-yellow-100",
    skill1Glow: "shadow-[0_0_15px_rgba(250,204,21,0.4)]",
    skill2Glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    skill3Glow: "shadow-[0_0_20px_rgba(254,240,138,0.5)]",
  },
};

export const ActionCombatBar = memo(function ActionCombatBar() {
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerColorHex = useGameWorldStore((s) => s.playerColorHex);
  const comboIndex = useGameWorldStore((s) => s.comboIndex);
  const comboTimer = useGameWorldStore((s) => s.comboTimer);
  const skillCooldowns = useGameWorldStore((s) => s.skillCooldowns);
  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const triggerSkill = useGameWorldStore((s) => s.triggerSkill);

  const blueprint = getCharacterBlueprint(playerClassId);
  const theme = CLASS_COMBAT_THEMES[playerClassId] || CLASS_COMBAT_THEMES.fighter;
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

  const comboLabels = [
    { step: 0, label: `1. ${blueprint.comboAttacks[0]?.name.split(" ")[0] || "Đòn 1"}` },
    { step: 1, label: `2. ${blueprint.comboAttacks[1]?.name.split(" ")[0] || "Đòn 2"}` },
    { step: 2, label: `3. ${blueprint.comboAttacks[2]?.name.split(" ")[0] || "Đòn 3"}` },
  ];

  return (
    <div
      className="pointer-events-auto flex flex-col items-center gap-1.5 select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Dynamic Class Combo Step Indicator ── */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#080d1a]/95 border-2 border-amber-500/60 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
        <span className="text-[10px] font-mono font-black text-amber-400 mr-1 tracking-wider">COMBO:</span>
        {comboLabels.map(({ step, label }, idx) => {
          const isActive = comboTimer > 0 && comboIndex === step;
          const isPassed = comboTimer > 0 && comboIndex > step;
          return (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border transition-all duration-150 ${
                  isActive
                    ? "bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_12px_#f59e0b] scale-105"
                    : isPassed
                    ? "bg-amber-950/80 text-amber-300 border-amber-600/60"
                    : "bg-slate-900/80 text-slate-400 border-slate-700/60"
                }`}
              >
                {label}
              </div>
              {idx < 2 && <span className="text-[10px] text-amber-500/60 font-bold">›</span>}
            </div>
          );
        })}
      </div>

      {/* ── Main Skills Dock (Pixel Angled Slots: J, 1/Q, 2/E, 3/R, Space) ── */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-2xl bg-[#0c0618]/95 border-2 border-amber-500/50 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.95)]">
        
        {/* Slot 0: Basic Attack (Left Mouse / J) */}
        <button
          onClick={triggerComboAttack}
          className="relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl bg-gradient-to-br from-[#1e1333] to-[#0f081d] border-2 border-amber-400 hover:border-amber-300 flex flex-col items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95"
          title={`${blueprint.comboAttacks[0]?.name || "Đánh Thường"} (Chuột Trái hoặc phím J)`}
        >
          <span className="text-xl drop-shadow select-none">{theme.basicIcon}</span>
          <span className="text-[9px] font-black text-slate-200 mt-0.5 truncate max-w-[50px]">
            {theme.basicLabel}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono text-[9px] font-black border border-black shadow">
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
              : `bg-gradient-to-br ${theme.skill1Grad} ${theme.skill1Border} hover:scale-105 active:scale-95 ${theme.skill1Glow} cursor-pointer`
          }`}
          title={`${skill1Spec?.name || "Kỹ năng 1"}: ${skill1Spec?.description || ""} (Phím 1 hoặc Q)`}
        >
          {renderCooldownOverlay(cd1, maxCd1)}
          <span className="text-xl drop-shadow select-none">{theme.skill1Icon}</span>
          <span className="text-[9px] font-black text-slate-100 mt-0.5 truncate max-w-[50px]">
            {skill1Spec?.name.slice(0, 6) || "Chiêu 1"}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono text-[9px] font-black border border-black shadow">
            1/Q
          </span>
        </button>

        {/* Slot 2: Skill 2 (2 / E) */}
        <button
          disabled={cd2 > 0}
          onClick={() => triggerSkill(2)}
          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
            cd2 > 0
              ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
              : `bg-gradient-to-br ${theme.skill2Grad} ${theme.skill2Border} hover:scale-105 active:scale-95 ${theme.skill2Glow} cursor-pointer`
          }`}
          title={`${skill2Spec?.name || "Kỹ năng 2"}: ${skill2Spec?.description || ""} (Phím 2 hoặc E)`}
        >
          {renderCooldownOverlay(cd2, maxCd2)}
          <span className="text-xl drop-shadow select-none">{theme.skill2Icon}</span>
          <span className="text-[9px] font-black text-slate-100 mt-0.5 truncate max-w-[50px]">
            {skill2Spec?.name.slice(0, 6) || "Chiêu 2"}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono text-[9px] font-black border border-black shadow">
            2/E
          </span>
        </button>

        {/* Slot 3: Ultimate Skill 3 (3 / R) */}
        <button
          disabled={cd3 > 0}
          onClick={() => triggerSkill(3)}
          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
            cd3 > 0
              ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
              : `bg-gradient-to-br ${theme.skill3Grad} ${theme.skill3Border} hover:scale-105 active:scale-95 ${theme.skill3Glow} cursor-pointer`
          }`}
          title={`${skill3Spec?.name || "Tuyệt Kỹ"}: ${skill3Spec?.description || ""} (Phím 3 hoặc R)`}
        >
          {renderCooldownOverlay(cd3, maxCd3)}
          <span className="text-xl drop-shadow select-none animate-pulse">{theme.skill3Icon}</span>
          <span className="text-[9px] font-black text-amber-200 mt-0.5 truncate max-w-[50px]">
            {skill3Spec?.name.slice(0, 6) || "Tuyệt Kỹ"}
          </span>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[9px] font-black border border-black shadow">
            3/R
          </span>
        </button>

        {/* Slot 4: Evade / Dash (Space) */}
        <div
          className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-[#140e21] border-2 border-slate-700/80 flex flex-col items-center justify-center opacity-90 shadow"
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
