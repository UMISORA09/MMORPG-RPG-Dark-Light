import { memo } from "react";
import { Zap, Clock, Target, Sparkles, Swords } from "lucide-react";

export interface SkillTooltipData {
  name: string;
  keybind?: string;
  icon?: string;
  mpCost?: number;
  cooldown?: number;
  damageMultiplier?: number;
  description?: string;
  range?: number;
  aoeRadius?: number;
  classId?: string;
  levelReq?: number;
}

interface SkillTooltipCardProps {
  skill: SkillTooltipData;
  className?: string;
}

export const SkillTooltipCard = memo(function SkillTooltipCard({
  skill,
  className = "",
}: SkillTooltipCardProps) {
  const classNameMap: Record<string, string> = {
    assassin: "Sát Thủ (Ảnh Vũ)",
    warrior: "Chiến Binh (Cuồng Long)",
    tanker: "Đỡ Đòn (Kim Cương)",
    gunner: "Xạ Thủ (Pháo Thủ)",
  };

  const classLabel = skill.classId
    ? classNameMap[skill.classId] || skill.classId
    : "Tất cả Hệ Phái";

  return (
    <div
      className={`w-72 sm:w-80 p-3.5 rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-b from-[#091a29]/95 via-[#06101c]/95 to-[#040810]/95 shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-xl text-white select-none pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      {/* Header: Skill Icon, Name, Keybind Badge */}
      <div className="flex items-center gap-3 pb-2.5 border-b border-slate-800/80">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
          <span>{skill.icon || "⚡"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-black text-cyan-300 truncate">{skill.name}</h4>
            {skill.keybind && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black text-[10px] border border-amber-400/40 shadow shrink-0">
                [{skill.keybind}]
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Hệ phái: <strong className="text-slate-200">{classLabel}</strong>
          </span>
        </div>
      </div>

      {/* Resource & Timing Metrics */}
      <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-800/60 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tiêu hao: <strong className="font-bold">{skill.mpCost || 15} MP</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Hồi chiêu: <strong className="font-bold">{skill.cooldown || 4.0}s</strong></span>
        </div>
      </div>

      {/* Combat Range & Damage Multiplier */}
      <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-800/60 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-rose-300">
          <Swords className="w-3.5 h-3.5 text-rose-400" />
          <span>Sát thương: <strong className="font-bold">x{Math.round((skill.damageMultiplier || 1.8) * 100)}% ATK</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-300">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tầm: <strong className="font-bold">{skill.range || 3.5}m</strong></span>
        </div>
      </div>

      {/* Description & Effect Details */}
      <div className="py-2.5 text-xs text-slate-300 leading-relaxed font-sans">
        {skill.description || "Tung đòn tấn công năng lượng cực mạnh lên kẻ địch trong phạm vi ảnh hưởng."}
      </div>

      {/* Tip footer */}
      <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-cyan-400/80">
          <Sparkles className="w-3 h-3" /> Tự động combo khi Auto-Combat bật
        </span>
      </div>
    </div>
  );
});
