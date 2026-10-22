// ==============================================================================
// RightEdgeQuickDock.tsx
// Semi-circle Right-Edge Quick Dock:
// 1. Semi-circular tabs attached to the right screen edge for [💬 Chat] and [📜 Nhật Ký].
// 2. Translucent frosted glass slide drawer (backdrop-blur-md bg-slate-950/80)
//    without blocking the character in the center of the screen.
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { MessageSquare, ScrollText, X, Send } from "lucide-react";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

export const RightEdgeQuickDock = memo(function RightEdgeQuickDock() {
  const [activeTab, setActiveTab] = useState<"chat" | "logs" | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string; channel: string }>>([
    { sender: "Hệ Thống", text: "Chào mừng đến với đại lục Chiến Long Bá!", time: "10:00", channel: "sys" },
    { sender: "Trưởng Làng", text: "Các dũng sĩ hãy đến gặp ta để nhận nhiệm vụ khai hoang.", time: "10:01", channel: "world" },
  ]);

  const playerName = useGameWorldStore((s) => s.playerName);
  const triggerOverheadChat = useGameWorldStore((s) => s.triggerOverheadChat);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: playerName || "Chiến Binh",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: "world",
    };

    setChatMessages((prev) => [...prev.slice(-30), newMsg]);
    triggerOverheadChat(chatInput.trim());
    playCombatSFX("coin_chime", 0.2);
    setChatInput("");
  };

  const toggleTab = (tab: "chat" | "logs") => {
    playCombatSFX("coin_chime", 0.2);
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-start select-none pointer-events-auto font-sans"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Slide Drawer Panel (Anchored to Right Edge) ── */}
      {activeTab && (
        <div className="w-72 sm:w-80 h-96 mr-1 flex flex-col rounded-l-2xl bg-slate-950/85 backdrop-blur-md border-y border-l border-cyan-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.9)] animate-in slide-in-from-right-6 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
              {activeTab === "chat" ? <MessageSquare className="w-4 h-4 text-cyan-400" /> : <ScrollText className="w-4 h-4 text-amber-400" />}
              <span>{activeTab === "chat" ? "Kênh Chat Thế Giới" : "Nhật Ký Phiêu Lưu"}</span>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body: Chat Message Feed or Adventure Logs */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2 text-xs font-sans">
            {activeTab === "chat" ? (
              chatMessages.map((m, idx) => (
                <div key={idx} className="flex flex-col bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className={m.channel === "sys" ? "text-amber-400 font-bold" : "text-cyan-300 font-bold"}>
                      [{m.sender}]
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">{m.time}</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-snug">{m.text}</p>
                </div>
              ))
            ) : (
              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-amber-400 font-bold">📜 Khởi Đầu:</span> Đã thức tỉnh tại Làng Huyền Vũ.
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-cyan-400 font-bold">⚔️ Khám Phá:</span> Có thể vượt qua ranh giới làng để săn quái tại Rừng Nguyên Sinh.
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-rose-400 font-bold">🔥 Cảnh Báo:</span> Tránh xa Cấm Địa Săn Boss nếu chưa đủ cấp 15.
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          {activeTab === "chat" && (
            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 flex items-center gap-1.5 bg-slate-900/40">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập nội dung chat..."
                maxLength={80}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/50 transition cursor-pointer hover:scale-105 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Semi-Circle Edge Dock Tabs ── */}
      <div className="flex flex-col gap-1.5 -mr-1">
        {/* Chat Dock Button */}
        <button
          onClick={() => toggleTab("chat")}
          className={`px-2 py-3 rounded-l-2xl border-y border-l transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 shadow-lg hover:scale-105 active:scale-95 ${
            activeTab === "chat"
              ? "bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.4)]"
              : "bg-slate-950/90 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50"
          }`}
          title="Mở Kênh Chat (Bên Lề)"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-wider writing-mode-vertical">
            Chat
          </span>
        </button>

        {/* Adventure Logs Dock Button */}
        <button
          onClick={() => toggleTab("logs")}
          className={`px-2 py-3 rounded-l-2xl border-y border-l transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 shadow-lg hover:scale-105 active:scale-95 ${
            activeTab === "logs"
              ? "bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              : "bg-slate-950/90 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/50"
          }`}
          title="Mở Nhật Ký Phiêu Lưu"
        >
          <ScrollText className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-wider writing-mode-vertical">
            Ký
          </span>
        </button>
      </div>
    </div>
  );
});
