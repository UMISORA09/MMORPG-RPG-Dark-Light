// ==============================================================================
// RightTopMinimapAndDrawer.tsx
// Ergonomic Top-Right Corner HUD:
// 1. Zoomable & Collapsible Minimap Radar with clean Zone Name & Coordinates.
// 2. Collapsible 12-Button System Tray (Default 3 Quick Buttons + Slide Drawer)
// ==============================================================================

import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { MinimapRadar } from "./MinimapRadar";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import {
  Box,
  Backpack,
  ShoppingBag,
  Trophy,
  ScrollText,
  Award,
  Gift,
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Shield,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Hammer,
  BookOpen,
  Store,
} from "lucide-react";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

interface RightTopProps {
  onLogout?: () => void;
}

export const RightTopMinimapAndDrawer = memo(function RightTopMinimapAndDrawer({
  onLogout,
}: RightTopProps) {
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);
  const [isMinimapCollapsed, setIsMinimapCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 0.75>(1);

  const characterRenderMode = useGameWorldStore((s) => s.characterRenderMode);
  const toggleCharacterRenderMode = useGameWorldStore((s) => s.toggleCharacterRenderMode);
  const isMounted = useGameWorldStore((s) => s.isMounted);
  const toggleMount = useGameWorldStore((s) => s.toggleMount);
  const soundMuted = useGameWorldStore((s) => s.soundMuted);
  const toggleSoundMute = useGameWorldStore((s) => s.toggleSoundMute);

  const openModal = (modal: any) => {
    playCombatSFX("holy_bell", 0.3);
    useGameWorldStore.getState().setActiveModal(modal);
  };

  const handleZoomToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    playCombatSFX("coin_chime", 0.2);
    setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 0.75 : 1));
  };

  return (
    <div
      className="pointer-events-auto flex flex-col items-end gap-1.5 select-none font-sans z-30"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── 0. SAVE STATUS INDICATOR (FULL-STATE SNAPSHOT & PERSISTENCE) ── */}
      <SaveStatusIndicator />

      {/* ── 1. MINIMAP CONTAINER (WITH ZOOM & COLLAPSE CONTROLS) ── */}
      <div className="relative flex flex-col items-end group">
        {/* Quick Toolbar on top of Minimap: [Zoom +/-] & [▲/▼ Collapse] */}
        <div className="flex items-center gap-1 mb-1 bg-[#0a0514]/85 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-800 shadow">
          <button
            onClick={handleZoomToggle}
            className="text-[9px] font-mono text-cyan-400 hover:text-white flex items-center gap-0.5 cursor-pointer px-1 py-0.5 hover:bg-slate-800 rounded transition"
            title={`Thu/Phóng bản đồ (Hiện tại: ${zoomLevel}x)`}
          >
            {zoomLevel >= 1 ? <ZoomIn className="w-3 h-3" /> : <ZoomOut className="w-3 h-3" />}
            <span>{zoomLevel}x</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setIsMinimapCollapsed((prev) => !prev)}
            className="text-[9px] text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer px-1 py-0.5 hover:bg-slate-800 rounded transition"
            title={isMinimapCollapsed ? "Mở rộng bản đồ" : "Thu gọn bản đồ"}
          >
            {isMinimapCollapsed ? <ChevronDown className="w-3 h-3 text-amber-400" /> : <ChevronUp className="w-3 h-3" />}
            <span>{isMinimapCollapsed ? "Hiện" : "Ẩn"}</span>
          </button>
        </div>

        {/* Minimap Radar View */}
        {!isMinimapCollapsed ? (
          <div className="animate-in fade-in duration-200">
            <MinimapRadar zoomMultiplier={zoomLevel} />
          </div>
        ) : (
          <div className="px-3 py-1 rounded-xl bg-[#0a0514]/90 border border-amber-500/50 text-[10px] font-mono font-bold text-amber-300 shadow">
            🗺️ Bản Đồ (Đã thu gọn)
          </div>
        )}
      </div>

      {/* ── 2. COLLAPSIBLE SYSTEM TRAY (RADIAL / SLIDING DRAWER) ── */}
      <div className="relative flex items-center justify-end">
        {/* ── EXPANDED TRAY: Dãy 12 nút chức năng trượt êm ái từ phải sang trái ── */}
        {isTrayExpanded ? (
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0a0514]/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.95)] animate-in slide-in-from-right-4 duration-300">
            {/* 1. Toggle Render Mode 2.5D / 3D */}
            <button
              onClick={toggleCharacterRenderMode}
              className={`p-1.5 border rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 ${
                characterRenderMode === "3d_model"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Chuyển chế độ 2.5D Sprite / 3D Model (Phím V)"
            >
              <Box className="w-4 h-4" />
            </button>

            {/* 2. Hành Trang (B / I) */}
            <button
              onClick={() => openModal("inventory")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-cyan-300 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Hành Trang & Trang Bị (Phím B / I)"
            >
              <Backpack className="w-4 h-4" />
            </button>

            {/* 3. Cửa Hàng (P) */}
            <button
              onClick={() => openModal("shop")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-300 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Cửa Hàng Dị Bảo (Phím P)"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* 4. Bảng Xếp Hạng (O) */}
            <button
              onClick={() => openModal("leaderboard")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-400 rounded-xl text-purple-300 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Bảng Vinh Danh Long Tộc (Phím O)"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* 5. Lịch Sử Chiến Đấu (H) */}
            <button
              onClick={() => openModal("battleLog")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-red-400 rounded-xl text-red-300 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Lịch Sử Chiến Đấu (Phím H)"
            >
              <ScrollText className="w-4 h-4" />
            </button>

            {/* 6. Thành Tựu (Y) */}
            <button
              onClick={() => openModal("achievements")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-400 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="Bảng Thành Tựu (Phím Y)"
            >
              <Award className="w-4 h-4" />
            </button>

            {/* 7. Quà Ngày (U) */}
            <button
              onClick={() => openModal("dailyRewards")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 rounded-xl text-emerald-400 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title="Quà Đăng Nhập 7 Ngày (Phím U)"
            >
              <Gift className="w-4 h-4" />
            </button>

            {/* 8. Đấu Trường PvP Arena */}
            <button
              onClick={() => openModal("pvpArena")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-400 rounded-xl text-rose-400 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Đấu Trường 1v1 PvP Xếp Hạng"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* 8.1 Chợ Đấu Giá (Alt+K) */}
            <button
              onClick={() => openModal("auctionHouse")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-yellow-400 rounded-xl text-yellow-400 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              title="Chợ Đấu Giá Liên Người Chơi (Tổ hợp Alt+K)"
            >
              <Store className="w-4 h-4" />
            </button>

            {/* 8.2 Lò Rèn & Khảm Ngọc (Alt+U) */}
            <button
              onClick={() => openModal("blacksmith")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-400 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="Lò Rèn: Cường Hóa, Khảm Ngọc & Tẩy Luyện (Tổ hợp Alt+U)"
            >
              <Hammer className="w-4 h-4" />
            </button>

            {/* 8.3 Chuyển Chức & Thiên Phú (Alt+N) */}
            <button
              onClick={() => openModal("talents")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-cyan-400 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              title="Thức Tỉnh Chuyển Chức & Cây Thiên Phú (Tổ hợp Alt+N)"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* 8.4 Đồ Giám Sưu Tầm (Alt+L) */}
            <button
              onClick={() => openModal("codex")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-400 rounded-xl text-purple-400 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              title="Sách Đồ Giám Quái Vật & Trang Bị (Tổ hợp Alt+L)"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* 9. Cưỡi Thú (Alt+M / Shift+Space) */}
            <button
              onClick={toggleMount}
              className={`p-1.5 border rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 text-xs ${
                isMounted
                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(40,195,225,0.45)]"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Cưỡi Thú (+70% Tốc Độ) - Tổ hợp Alt+M hoặc Shift+Space"
            >
              🐎
            </button>

            {/* 10. Âm Thanh Toggle */}
            <button
              onClick={toggleSoundMute}
              className={`p-1.5 border rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 ${
                soundMuted
                  ? "bg-red-950/70 border-red-700/80 text-red-400"
                  : "bg-cyan-950/60 border-cyan-700/80 text-cyan-400"
              }`}
              title={soundMuted ? "Bật Âm Thanh" : "Tắt Âm Thanh"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* 11. Cài Đặt */}
            <button
              onClick={() => openModal("settings")}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-slate-300 hover:text-white transition cursor-pointer hover:scale-105 active:scale-95"
              title="Cài Đặt Game"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* 12. Đăng Xuất */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 bg-slate-900 hover:bg-red-950 border border-slate-700 hover:border-red-500 rounded-xl text-slate-400 hover:text-red-300 transition cursor-pointer hover:scale-105 active:scale-95"
                title="Đăng Xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Nút Thu Gọn Drawer [▶] */}
            <button
              onClick={() => {
                playCombatSFX("coin_chime", 0.2);
                setIsTrayExpanded(false);
              }}
              className="ml-1 px-2 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 text-cyan-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition hover:scale-105 active:scale-95"
              title="Thu gọn thanh công cụ"
            >
              <span>Thu gọn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── COLLAPSED TRAY (Mặc Định): 3 Nút Quan Trọng + Nút Mở Rộng [◀ +9] ── */
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0a0514]/85 backdrop-blur-md border border-slate-800 shadow-xl">
            {/* Quick 1: Hành Trang (B / I) */}
            <button
              onClick={() => openModal("inventory")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-cyan-300 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              title="Hành Trang & Trang Bị (Phím B / I)"
            >
              <Backpack className="w-4 h-4" />
            </button>

            {/* Quick 2: Nhiệm Vụ (Quests) */}
            <button
              onClick={() => openModal("quests")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-300 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="Nhiệm Vụ & Chỉ Dẫn 3D"
            >
              <ScrollText className="w-4 h-4" />
            </button>

            {/* Quick 3: Âm Thanh Mute Toggle */}
            <button
              onClick={toggleSoundMute}
              className={`p-2 border rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 ${
                soundMuted
                  ? "bg-red-950/70 border-red-700/80 text-red-400"
                  : "bg-cyan-950/60 border-cyan-700/80 text-cyan-400"
              }`}
              title={soundMuted ? "Bật Âm Thanh" : "Tắt Âm Thanh"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Nút Trụ Chính: [◀ +9 Menu] Mở Rộng Toàn Bộ 12 Chức Năng */}
            <button
              onClick={() => {
                playCombatSFX("holy_bell", 0.3);
                setIsTrayExpanded(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/60 text-cyan-300 text-[11px] font-black tracking-wider flex items-center gap-1.5 transition cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,242,255,0.25)]"
              title="Mở rộng menu đầy đủ (12 chức năng)"
            >
              <ChevronLeft className="w-3.5 h-3.5 animate-pulse" />
              <Menu className="w-3.5 h-3.5" />
              <span>+9</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
