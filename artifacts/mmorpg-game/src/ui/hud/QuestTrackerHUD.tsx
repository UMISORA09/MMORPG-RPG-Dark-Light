import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Scroll, Compass, CheckCircle2 } from "lucide-react";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

export const QuestTrackerHUD = memo(function QuestTrackerHUD() {
  const trackedQuest = useGameWorldStore((s) => s.trackedQuest);
  const setTrackedQuest = useGameWorldStore((s) => s.setTrackedQuest);

  if (!trackedQuest) return null;

  const isComplete = trackedQuest.status === "READY_TO_CLAIM";

  return (
    <div className="absolute top-28 left-4 z-20 w-64 pointer-events-auto">
      <div className="p-3 rounded-2xl bg-slate-950/85 border border-amber-500/40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhiệm Vụ Chính Tuyến</span>
          </div>
          <button
            onClick={() => {
              useGameWorldStore.getState().setActiveModal("quests");
              playCombatSFX("holy_bell", 0.3);
            }}
            className="text-[10px] text-slate-400 hover:text-cyan-400 transition cursor-pointer"
          >
            [Chi tiết]
          </button>
        </div>

        {/* Quest Title & Description */}
        <h4 className="font-extrabold text-xs text-slate-100 leading-tight">
          {trackedQuest.title}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
          {trackedQuest.description}
        </p>

        {/* Objective Progress */}
        <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
            <span className={isComplete ? "text-emerald-400 font-bold" : "text-slate-300"}>
              {trackedQuest.targetName}:
            </span>
          </div>
          <span className="font-mono font-bold text-amber-300">
            {trackedQuest.progress || 0} / {trackedQuest.requiredCount || 1}
          </span>
        </div>

        {/* Waypoint Compass Action */}
        <div className="mt-2 flex items-center justify-between pt-1">
          <div className="text-[10px] text-slate-500">
            Khu vực: <span className="text-cyan-400 font-semibold">{trackedQuest.targetZone || "Làng Tân Thủ"}</span>
          </div>
          <button
            onClick={() => {
              playCombatSFX("holy_bell", 0.35);
              setTrackedQuest(trackedQuest);
            }}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Compass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Chỉ Đường 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
});

