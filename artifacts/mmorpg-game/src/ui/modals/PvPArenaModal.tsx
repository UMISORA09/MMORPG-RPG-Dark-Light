import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { X, Trophy, Swords, Shield, Zap, Skull, Award } from "lucide-react";

interface OpponentCard {
  id: string;
  name: string;
  classId: "fighter" | "tank" | "assassin" | "gunner";
  className: string;
  level: number;
  combatPower: number;
  hp: number;
  rank: string;
  avatar: string;
}

const PVP_CHAMPIONS: OpponentCard[] = [
  {
    id: "champ_1",
    name: "Chiến Vương Huyết Lôi",
    classId: "fighter",
    className: "Chiến Binh",
    level: 12,
    combatPower: 1450,
    hp: 950,
    rank: "Bạc II",
    avatar: "⚔️",
  },
  {
    id: "champ_2",
    name: "Bóng Ma Đoạt Mệnh",
    classId: "assassin",
    className: "Sát Thủ",
    level: 14,
    combatPower: 1820,
    hp: 800,
    rank: "Vàng III",
    avatar: "🗡️",
  },
  {
    id: "champ_3",
    name: "Thần Khiên Kim Cang",
    classId: "tank",
    className: "Hộ Vệ",
    level: 15,
    combatPower: 2200,
    hp: 1400,
    rank: "Kim Cương",
    avatar: "🛡️",
  },
];

export const PvPArenaModal = memo(function PvPArenaModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const honorPoints = useGameWorldStore((s) => s.honorPoints);
  const arenaRank = useGameWorldStore((s) => s.arenaRank);
  const startPvPArena = useGameWorldStore((s) => s.startPvPArena);
  const setZone = useGameWorldStore((s) => s.setZone);

  if (activeModal !== "pvpArena") return null;

  const handleStartDuel = (champ: OpponentCard) => {
    playCombatSFX("dragon_roar", 0.5);
    setZone("DUNGEON", "⚔️ ĐẤU TRƯỜNG VINH DANH 1v1 — 90 GIÂY SINH TỬ!");
    startPvPArena(champ);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0e121d] border border-rose-500/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(244,63,94,0.3)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Swords className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Đấu Trường Vinh Danh 1v1 (Ranked Arena)
              </h2>
              <p className="text-xs text-slate-400">Quyết đấu đỉnh cao • Thăng hạng Chiến Thần • Đoạt danh hiệu</p>
            </div>
          </div>
          <button
            onClick={closeActiveModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Player Rank Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-rose-950/60 to-purple-950/60 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs text-slate-400 block">Bậc Hạng Hiện Tại:</span>
              <strong className="text-sm font-black text-amber-300 font-mono">
                {arenaRank || "Đồng I"}
              </strong>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Điểm Danh Vọng:</span>
            <span className="px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-mono font-black text-xs">
              {honorPoints || 120} PTS
            </span>
          </div>
        </div>

        {/* Opponent Selection List */}
        <div className="p-6 space-y-3.5 overflow-y-auto max-h-[380px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Chọn Đối Thủ Khiêu Chiến
          </h4>

          {PVP_CHAMPIONS.map((champ) => (
            <div
              key={champ.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 transition flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  {champ.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">{champ.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">
                      {champ.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {champ.className} • Cấp {champ.level}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-slate-400">
                    <span>❤️ {champ.hp} HP</span>
                    <span>⚔️ {champ.combatPower} Lực Chiến</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartDuel(champ)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xs transition shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer active:scale-95 shrink-0"
              >
                Quyết Đấu 1v1
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Trận đấu kéo dài tối đa 90 giây trong Đấu Trường Biệt Lập.</span>
          <span className="text-amber-400 font-semibold">Thắng: +35 PTS • Thua: +10 PTS</span>
        </div>
      </div>
    </div>
  );
});

