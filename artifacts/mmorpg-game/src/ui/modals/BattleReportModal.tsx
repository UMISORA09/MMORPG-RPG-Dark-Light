// ==============================================================================
// BattleReportModal — Chi Tiết Trận Đánh & Lịch Sử Chiến Báo 20 Trận Gần Nhất
// Standard Dark Fantasy Cinema Teal & Obsidian Slate UI
// Integrated with Database battle_logs, Web Audio API & Game World Store
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGetBattleLog, getGetBattleLogQueryKey } from "@workspace/api-client-react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";
import { 
  X, 
  ScrollText, 
  Clock, 
  Swords, 
  Trophy, 
  Skull, 
  Sparkles, 
  Zap, 
  Coins, 
  Timer, 
  Flame, 
  BarChart3,
  CheckCircle2,
  PackageCheck
} from "lucide-react";

export interface BattleReportModalProps {
  characterId?: number;
}

export const BattleReportModal = memo(function BattleReportModal({
  characterId,
}: BattleReportModalProps) {
  const worldModal = useGameWorldStore((s) => s.activeModal);
  const legacyModal = useGameStore((s) => s.game.activeModal);
  const battleReportOpen = useGameWorldStore((s) => s.battleReportOpen);
  const battleReport = useGameWorldStore((s) => s.battleReport);

  const isOpen = (worldModal as string) === "battleLog" || 
                 (legacyModal as string) === "battle_logs" || 
                 battleReportOpen;

  const [activeTab, setActiveTab] = useState<"report" | "history">("report");

  // Automatically select tab: If triggered by combat result popup -> "report", else -> "history"
  useEffect(() => {
    if (isOpen) {
      if (battleReportOpen || battleReport) {
        setActiveTab("report");
      } else {
        setActiveTab("history");
      }
    }
  }, [isOpen, battleReportOpen, battleReport]);

  const close = () => {
    useGameWorldStore.getState().closeActiveModal();
    useGameWorldStore.getState().closeBattleReport();
    useGameStore.getState().closeActiveModal();
  };

  const selectedCharId =
    characterId ||
    (typeof window !== "undefined"
      ? Number(localStorage.getItem("selectedCharacterId")) || 1
      : 1);

  const { data: rawLogs = [], isLoading: logLoading } = useGetBattleLog(
    selectedCharId,
    {
      query: {
        queryKey: getGetBattleLogQueryKey(selectedCharId),
        enabled: isOpen && !!selectedCharId,
      },
    }
  );

  const isDead = useGameWorldStore((s) => s.isDead);

  const logs = Array.isArray(rawLogs) ? rawLogs : [];

  if (!isOpen || isDead) return null;

  const isVictory = battleReport ? battleReport.victory : true;

  const getRarityBadge = (rarity?: string | null) => {
    switch (rarity) {
      case "legendary":
        return {
          border: "border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.35)]",
          badge: "bg-amber-500/20 text-amber-300 border-amber-400/40",
          text: "Huyền Thoại",
          glow: "from-amber-500/20 to-transparent",
        };
      case "epic":
        return {
          border: "border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.3)]",
          badge: "bg-purple-500/20 text-purple-300 border-purple-400/40",
          text: "Sử Thi",
          glow: "from-purple-500/20 to-transparent",
        };
      case "rare":
        return {
          border: "border-cyan-500/70 shadow-[0_0_10px_rgba(6,182,212,0.25)]",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
          text: "Hiếm",
          glow: "from-cyan-500/20 to-transparent",
        };
      case "uncommon":
        return {
          border: "border-emerald-500/60",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
          text: "Cao Cấp",
          glow: "from-emerald-500/20 to-transparent",
        };
      default:
        return {
          border: "border-slate-700/80",
          badge: "bg-slate-800 text-slate-300 border-slate-700",
          text: "Phổ Thông",
          glow: "from-slate-700/10 to-transparent",
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0b0f19] border border-[#232f48] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {activeTab === "report" ? <Swords className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Bảng Báo Cáo Chiến Đấu
              </h2>
              <p className="text-xs text-slate-400">
                Theo dõi chiến tích tiêu diệt Boss, tỷ lệ chí mạng & lịch sử đấu
              </p>
            </div>
          </div>

          {/* Tab Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "report"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Trận Này</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Lịch Sử 20 Trận</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={close}
            className="p-2 rounded-full bg-slate-800/60 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5">
          
          {/* ════════ TAB 1: CHI TIẾT TRẬN ĐÁNH (VICTORY / DEFEAT CARD) ════════ */}
          {activeTab === "report" && (
            <div className="space-y-5">
              {battleReport ? (
                <>
                  {/* Result Hero Banner */}
                  <div
                    className={`relative overflow-hidden p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left ${
                      isVictory
                        ? "bg-gradient-to-r from-emerald-950/50 via-slate-900 to-amber-950/40 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        : "bg-gradient-to-r from-rose-950/50 via-slate-900 to-red-950/40 border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 border ${
                          isVictory
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                            : "bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                        }`}
                      >
                        {isVictory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                              isVictory
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                            }`}
                          >
                            {isVictory ? "🏆 CHIẾN THẮNG HUYỀN THOẠI" : "💀 TỬ TRẬN TẠI ĐẠI LỤC"}
                          </span>
                          {battleReport.isBoss && (
                            <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/50 text-[10px] font-black">
                              BOSS ĐẠI LỤC
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                          {isVictory
                            ? `Hạ Gục: ${battleReport.monsterName}`
                            : `Tử Trận Trước: ${battleReport.monsterName}`}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Mục tiêu cấp {battleReport.monsterLevel} • Thời gian chiến đấu: {battleReport.durationSeconds} giây
                        </p>
                      </div>
                    </div>

                    {/* Quick Rewards Pill */}
                    {isVictory && (
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-sm">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>+{battleReport.expGained} EXP</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-sm">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>+{battleReport.goldGained} Vàng</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4 Combat Performance Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                        <span>Tổng Sát Thương</span>
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="text-lg sm:text-xl font-mono font-black text-white">
                        {battleReport.totalDamageDealt.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">DPS Hiệu Quả</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                        <span>Đòn Chí Mạng</span>
                        <Zap className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="text-lg sm:text-xl font-mono font-black text-amber-300">
                        {battleReport.critHits} <span className="text-xs font-normal text-slate-400">lần</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Tỷ lệ bạo kích 1.8x</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                        <span>Thời Gian Đấu</span>
                        <Timer className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-lg sm:text-xl font-mono font-black text-cyan-300">
                        {battleReport.durationSeconds}s
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Tốc độ tiêu diệt</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                        <span>Phần Thưởng</span>
                        <Coins className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-lg sm:text-xl font-mono font-black text-emerald-300">
                        +{battleReport.goldGained} <span className="text-xs font-normal text-slate-400">Vàng</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">+{battleReport.expGained} EXP Thăng Cấp</span>
                    </div>
                  </div>

                  {/* Dropped Gear with Rarity Borders */}
                  <div className="p-4 rounded-3xl bg-slate-900/40 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-cyan-400" />
                        <span>Trang Bị & Vật Phẩm Thu Thập Được ({battleReport.drops.length})</span>
                      </h4>
                      {battleReport.highestRarity && (
                        <span className="text-[11px] font-mono font-bold text-amber-300">
                          Phẩm chất cao nhất: {battleReport.highestRarity.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {battleReport.drops.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs font-medium">
                        Không có trang bị rơi trong trận chiến này (chỉ nhận Vàng và Kinh Nghiệm)
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {battleReport.drops.map((drop, idx) => {
                          const badge = getRarityBadge(drop.rarity);
                          return (
                            <div
                              key={`${drop.id}-${idx}`}
                              className={`p-3 rounded-2xl bg-gradient-to-br ${badge.glow} bg-slate-950/80 border ${badge.border} flex items-center justify-between transition hover:scale-[1.02]`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-2xl shrink-0">{drop.icon || "⚔️"}</div>
                                <div>
                                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                    <span>{drop.name}</span>
                                    {drop.quantity && drop.quantity > 1 && (
                                      <span className="text-[10px] text-slate-400 font-mono">x{drop.quantity}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${badge.badge}`}>
                                      {badge.text}
                                    </span>
                                    {drop.type === "gold" && (
                                      <span className="text-[10px] text-amber-300 font-mono">+{drop.value}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400/70 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <Swords className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">Chưa có giao tranh nào vừa diễn ra</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Hãy ra khỏi Làng Tân Thủ để giao chiến với Quái Vật Hoang Dã hoặc khiêu chiến Boss Rồng Lửa để ghi nhận chiến tích!
                  </p>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    Xem Lịch Sử 20 Trận Gần Nhất
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════ TAB 2: LỊCH SỬ 20 TRẬN GẦN NHẤT (DATABASE BATTLE LOGS) ════════ */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Dữ liệu lưu trữ đồng bộ thời gian thực từ PostgreSQL Database</span>
                <span className="font-mono text-cyan-300">{logs.length} / 20 Bản Ghi</span>
              </div>

              {logLoading ? (
                <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải lịch sử chiến đấu từ máy chủ...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ScrollText className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-semibold text-sm">Chưa có bản ghi chiến báo nào!</p>
                  <p className="text-xs text-slate-500">Mọi trận đánh tiêu diệt quái vật hoặc tử trận sẽ được tự động lưu vào đây.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.map((log: any, idx: number) => {
                    const isWin = log.victory !== undefined ? log.victory : (log.result === "VICTORY" || log.result === "win");

                    return (
                      <div
                        key={log.id || `log-${idx}`}
                        className={`p-3.5 rounded-2xl border transition hover:border-slate-600 flex items-center justify-between gap-3 ${
                          isWin
                            ? "bg-emerald-950/20 border-emerald-500/30"
                            : "bg-red-950/20 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                              isWin
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                                : "bg-red-500/20 text-red-300 border-red-400/40"
                            }`}
                          >
                            {isWin ? "WIN" : "LOSE"}
                          </div>

                          <div>
                            <p className="font-bold text-sm text-slate-100 flex items-center gap-2">
                              <span>Hạ gục:</span>
                              <span className="text-amber-300 font-black">{log.monsterName || "Quái vật"}</span>
                            </p>

                            <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
                              {(log.expGained > 0 || log.expGained !== undefined) && (
                                <span className="text-cyan-400">+{log.expGained || 0} EXP</span>
                              )}
                              {(log.goldGained > 0 || log.goldGained !== undefined) && (
                                <span className="text-amber-400">+{log.goldGained || 0} Vàng</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                              : "Vừa xong"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> để đóng</span>
          <button
            onClick={close}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition cursor-pointer"
          >
            {battleReport && !isVictory ? "Hồi Sinh Tại Làng Tân Thủ" : "Tiếp Tục Phiêu Lưu"}
          </button>
        </div>

      </div>
    </div>
  );
});

export default BattleReportModal;

