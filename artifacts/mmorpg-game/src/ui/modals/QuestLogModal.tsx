import { memo, useEffect, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX, playButtonClick } from "@/audio/CombatSoundSynth";
import { X, Scroll, Award, CheckCircle2, ChevronRight, Compass } from "lucide-react";

export const QuestLogModal = memo(function QuestLogModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const setTrackedQuest = useGameWorldStore((s) => s.setTrackedQuest);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId) || 1;

  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any | null>(null);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/characters/${activeCharacterId}/quests`);
      if (res.ok) {
        const data = await res.json();
        setQuests(data);
        if (data.length > 0 && !selectedQuest) {
          const active = data.find((q: any) => q.status === "IN_PROGRESS" || q.status === "READY_TO_CLAIM") || data[0];
          setSelectedQuest(active);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === "quests") {
      fetchQuests();
    }
  }, [activeModal]);

  if (activeModal !== "quests") return null;

  const handleAccept = async (questId: string) => {
    playCombatSFX("holy_bell", 0.4);
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/quests/${questId}/accept`, { method: "POST" });
      if (res.ok) {
        addFloatingText("📜 Đã Tiếp Nhận Nhiệm Vụ!", playerPosition.clone(), "#00f2ff");
        await fetchQuests();
      }
    } catch {
      // ignore
    }
  };

  const handleClaim = async (questId: string) => {
    playCombatSFX("level_up_fanfare", 0.6);
    try {
      const res = await fetch(`/api/characters/${activeCharacterId}/quests/${questId}/claim`, { method: "POST" });
      if (res.ok) {
        addFloatingText("🎉 Hoàn Thành Nhiệm Vụ — Nhận Mưa Vàng & EXP!", playerPosition.clone(), "#fbbf24");
        await fetchQuests();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playButtonClick();
          closeActiveModal();
        }
      }}
    >
      <div className="relative w-full max-w-4xl h-[560px] bg-[#0b0e14]/95 border border-amber-500/40 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_50px_rgba(245,158,11,0.25)] flex flex-col animate-in fade-in zoom-in-95 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Sổ Tay Nhiệm Vụ Cốt Truyện
              </h2>
              <p className="text-xs text-slate-400">Chuỗi 8 nhiệm vụ thần thoại Long Tộc</p>
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

        {/* Content Split Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Quest List */}
          <div className="w-2/5 border-r border-slate-800/80 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải nhiệm vụ...</div>
            ) : (
              quests.map((q) => {
                const isSelected = selectedQuest?.id === q.id;
                const isReady = q.status === "READY_TO_CLAIM";
                const isCompleted = q.status === "COMPLETED";

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuest(q);
                      playCombatSFX("holy_bell", 0.25);
                    }}
                    className={`w-full p-3 rounded-2xl text-left border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "bg-slate-900/50 hover:bg-slate-900 border-slate-800/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isCompleted
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isReady
                            ? "bg-amber-400 text-slate-950 animate-pulse"
                            : q.status === "IN_PROGRESS"
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {isCompleted ? "Đã Xong" : isReady ? "Nhận Thưởng" : q.status === "IN_PROGRESS" ? "Đang Làm" : "Chưa Mở"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">
                          {q.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        Mục tiêu: {q.targetName} ({q.progress || 0}/{q.requiredCount})
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Quest Detail */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
            {selectedQuest ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      {selectedQuest.npcName}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-cyan-400 font-semibold">
                      Khu vực: {selectedQuest.targetZone}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    {selectedQuest.title}
                  </h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    {selectedQuest.description}
                  </p>
                </div>

                {/* Objective Progress Box */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                    Tiến Độ Nhiệm Vụ
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200 font-semibold">
                      {selectedQuest.targetName}
                    </span>
                    <span className="font-mono font-black text-amber-400">
                      {selectedQuest.progress || 0} / {selectedQuest.requiredCount}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((selectedQuest.progress || 0) / selectedQuest.requiredCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Rewards Box */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> Phần Thưởng Nhiệm Vụ
                  </h4>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-yellow-400">🪙 +{selectedQuest.rewardGold} Vàng</span>
                    <span className="text-blue-400">⚡ +{selectedQuest.rewardExp} EXP</span>
                    {selectedQuest.rewardItemName && (
                      <span className="text-purple-400">
                        🎁 {selectedQuest.rewardItemName} x{selectedQuest.rewardItemCount || 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {selectedQuest.status === "AVAILABLE" && (
                    <button
                      onClick={() => handleAccept(selectedQuest.id)}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    >
                      Tiếp Nhận Nhiệm Vụ
                    </button>
                  )}

                  {selectedQuest.status === "READY_TO_CLAIM" && (
                    <button
                      onClick={() => handleClaim(selectedQuest.id)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse"
                    >
                      🎉 Nhận Thưởng Ngay
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setTrackedQuest(selectedQuest);
                      addFloatingText("📍 Đã kích hoạt la bàn chỉ đường 3D!", playerPosition.clone(), "#00f2ff");
                      closeActiveModal();
                      playCombatSFX("holy_bell", 0.4);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Theo Dõi & Chỉ Đường 3D</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Chọn một nhiệm vụ ở danh sách bên trái để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

