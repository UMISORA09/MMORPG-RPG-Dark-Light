import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Users, Swords, MessageSquare, Shield, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const PlayerTargetHUD = memo(function PlayerTargetHUD() {
  const selectedTarget = useGameWorldStore((s) => s.selectedPlayerTarget);
  const setSelectedTarget = useGameWorldStore((s) => s.setSelectedPlayerTarget);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!selectedTarget) return null;

  const hp = Math.max(0, Number(selectedTarget.hp || 500));
  const maxHp = Math.max(1, Number(selectedTarget.maxHp || 500));
  const hpPct = Math.max(0, Math.min(1, hp / maxHp));

  const classNames: Record<string, string> = {
    fighter: "Cuồng Kiếm Sĩ",
    tank: "Kim Cang Hộ Vệ",
    assassin: "Ảnh Đao Thích Khách",
    gunner: "Long Thần Xạ Thủ",
  };

  const classColors: Record<string, string> = {
    fighter: "#ff3366",
    tank: "#f59e0b",
    assassin: "#9d4edd",
    gunner: "#00f2ff",
  };

  const classNameStr = classNames[selectedTarget.classId] || "Hiệp Khách";
  const classColor = classColors[selectedTarget.classId] || "#00f2ff";

  // Action 1: Invite to Party
  const handleInviteParty = async () => {
    setLoadingAction("party");
    const myCharId = activeCharacterId || Number(localStorage.getItem("selectedCharacterId")) || 0;
    const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;

    try {
      if (selectedTarget.isBot) {
        // Chiêu mộ bot
        const res = await fetch("/api/party/invite-bot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ characterId: myCharId, botType: selectedTarget.classId === "tank" ? "tank" : "healer" }),
        });
        const data = await res.json();
        if (res.ok) {
          toast({ title: "Tổ Đội", description: `Đã chiêu mộ ${selectedTarget.name} vào tổ đội!` });
        } else {
          toast({ title: "Thông báo", description: data.error || "Không thể mời tổ đội.", variant: "destructive" });
        }
      } else {
        // Mời người chơi thật
        const res = await fetch("/api/party/invite-player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            characterId: myCharId,
            targetCharacterId: selectedTarget.characterId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast({ title: "Tổ Đội", description: `Đã gửi lời mời tổ đội tới ${selectedTarget.name}!` });
        } else {
          toast({ title: "Thông báo", description: data.error || "Không thể gửi lời mời tổ đội.", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Lỗi kết nối", description: "Không thể kết nối tới máy chủ tổ đội.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  // Action 2: Challenge 1v1 PvP
  const handleChallengePvP = () => {
    toast({
      title: "Thách Đấu 1v1",
      description: `Đã gửi chiến thư thách đấu PvP tới [${selectedTarget.name}]! Chờ đối phương chấp thuận...`,
    });
  };

  // Action 3: Whisper / Chat
  const handleWhisper = () => {
    const dockInput = document.querySelector<HTMLInputElement>("input[placeholder*='Trò chuyện'], input[placeholder*='Nhập tin nhắn']");
    if (dockInput) {
      dockInput.focus();
      dockInput.value = `@${selectedTarget.name} `;
      dockInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    toast({
      title: "Mật Ngữ",
      description: `Đang trò chuyện riêng với [${selectedTarget.name}]`,
    });
  };

  // Action 4: Inspect Player
  const handleInspect = () => {
    toast({
      title: `Hồ Sơ: ${selectedTarget.name} (Lv.${selectedTarget.level})`,
      description: `Môn phái: ${classNameStr} | Cường hóa: +${selectedTarget.enhanceLevel || 0} | HP: ${hp}/${maxHp}`,
    });
  };

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="w-[340px] sm:w-[460px] p-2.5 rounded-2xl bg-gradient-to-b from-[#091b24]/95 via-[#061219]/95 to-[#02080d]/95 border-2 border-cyan-500/70 shadow-[0_10px_35px_rgba(6,182,212,0.35)] backdrop-blur-md">
        
        {/* Top row: Level, Class Icon, Name, Class Name & Dismiss */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Level badge */}
            <span className="px-1.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/60 font-mono font-black text-[10px] text-cyan-300 shadow shrink-0">
              Lv.{selectedTarget.level}
            </span>

            {/* Avatar / Class Icon */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow shrink-0"
              style={{ backgroundColor: `${classColor}25`, border: `1.5px solid ${classColor}` }}
            >
              {selectedTarget.isBot ? "🤖" : "👤"}
            </div>

            {/* Player name */}
            <div className="min-w-0 flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-white truncate drop-shadow">
                {selectedTarget.name}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 shrink-0" style={{ color: classColor }}>
                • {classNameStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedTarget.enhanceLevel >= 7 && (
              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/40">
                +{selectedTarget.enhanceLevel} Aura
              </span>
            )}
            <button
              onClick={() => setSelectedTarget(null)}
              className="w-5 h-5 rounded-full bg-slate-800/80 hover:bg-rose-500 hover:text-white text-slate-400 flex items-center justify-center transition cursor-pointer text-xs"
              title="Bỏ chọn mục tiêu"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* HP Bar Container */}
        <div className="relative w-full h-4.5 rounded-xl bg-slate-950 border-2 border-cyan-600/80 overflow-hidden shadow-inner p-0.5 mb-2">
          {/* Main Cyan/Green Fill */}
          <div
            className="h-full rounded-lg transition-all duration-200 relative z-10"
            style={{
              width: `${hpPct * 100}%`,
              background: "linear-gradient(90deg, #0284c7 0%, #06b6d4 50%, #10b981 100%)",
              boxShadow: "0 0 12px rgba(6,182,212,0.6)",
            }}
          />

          {/* Numeric HP digits overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-20">
            {Math.round(hp).toLocaleString()} / {Math.round(maxHp).toLocaleString()} ({Math.round(hpPct * 100)}%)
          </div>

          {/* Glass Sheen */}
          <div className="absolute top-0 inset-x-0 h-1 bg-white/30 rounded-t-full pointer-events-none z-30" />
        </div>

        {/* Quick Action Interaction Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-cyan-900/40">
          <button
            onClick={handleInviteParty}
            disabled={loadingAction === "party"}
            className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/50 text-[10px] font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Mời vào tổ đội 4 người"
          >
            <Users className="w-3 h-3 shrink-0" />
            <span>Mời Nhóm</span>
          </button>

          <button
            onClick={handleChallengePvP}
            className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/50 text-[10px] font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Thách đấu 1v1 PvP"
          >
            <Swords className="w-3 h-3 shrink-0" />
            <span>Thách Đấu</span>
          </button>

          <button
            onClick={handleWhisper}
            className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 text-[10px] font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Trò chuyện riêng tư"
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span>Mật Ngữ</span>
          </button>

          <button
            onClick={handleInspect}
            className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 text-[10px] font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Xem chi tiết nhân vật"
          >
            <Eye className="w-3 h-3 shrink-0" />
            <span>Chi Tiết</span>
          </button>
        </div>
      </div>
    </div>
  );
});
