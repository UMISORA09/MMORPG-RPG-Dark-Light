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
import { playCombatSFX, playButtonClick } from "@/audio/CombatSoundSynth";

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
        {/* ── EXPANDED TRAY: Dãy 12+ nút chức năng trượt thác nước lệch nhịp (staggered 35ms) ── */}
        {isTrayExpanded ? (
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0b0e14]/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_20px_rgba(0,242,255,0.15)] animate-in fade-in duration-200">
            {[
              {
                id: "render_mode",
                icon: <Box className="w-4 h-4" />,
                title: "Chế Độ 2.5D Sprite / 3D Model",
                keybind: "V",
                active: characterRenderMode === "3d_model",
                activeClass: "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
                normalClass: "bg-slate-900 border-slate-700 hover:border-emerald-400 text-slate-300 hover:text-white",
                onClick: toggleCharacterRenderMode,
              },
              {
                id: "inventory",
                icon: <Backpack className="w-4 h-4 text-cyan-300" />,
                title: "Hành Trang & Trang Bị",
                keybind: "B",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-cyan-400 text-cyan-300",
                onClick: () => openModal("inventory"),
              },
              {
                id: "shop",
                icon: <ShoppingBag className="w-4 h-4 text-amber-300" />,
                title: "Cửa Hàng Dị Bảo",
                keybind: "P",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-amber-400 text-amber-300",
                onClick: () => openModal("shop"),
              },
              {
                id: "leaderboard",
                icon: <Trophy className="w-4 h-4 text-purple-300" />,
                title: "Bảng Vinh Danh Long Tộc",
                keybind: "O",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-purple-400 text-purple-300",
                onClick: () => openModal("leaderboard"),
              },
              {
                id: "battleLog",
                icon: <ScrollText className="w-4 h-4 text-red-300" />,
                title: "Lịch Sử Chiến Đấu",
                keybind: "H",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-red-400 text-red-300",
                onClick: () => openModal("battleLog"),
              },
              {
                id: "achievements",
                icon: <Award className="w-4 h-4 text-amber-400" />,
                title: "Bảng Thành Tựu",
                keybind: "Y",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-amber-400 text-amber-400",
                onClick: () => openModal("achievements"),
              },
              {
                id: "dailyRewards",
                icon: <Gift className="w-4 h-4 text-emerald-400" />,
                title: "Quà Đăng Nhập 7 Ngày",
                keybind: "U",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-emerald-400 text-emerald-400",
                onClick: () => openModal("dailyRewards"),
              },
              {
                id: "pvpArena",
                icon: <Shield className="w-4 h-4 text-rose-400" />,
                title: "Đấu Trường 1v1 PvP Xếp Hạng",
                keybind: "K",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-rose-400 text-rose-400",
                onClick: () => openModal("pvpArena"),
              },
              {
                id: "auctionHouse",
                icon: <Store className="w-4 h-4 text-yellow-400" />,
                title: "Chợ Đấu Giá Liên Người Chơi",
                keybind: "Alt+K",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]",
                onClick: () => openModal("auctionHouse"),
              },
              {
                id: "blacksmith",
                icon: <Hammer className="w-4 h-4 text-amber-400" />,
                title: "Lò Rèn: Cường Hóa, Khảm Ngọc & Tẩy Luyện",
                keybind: "Alt+U",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                onClick: () => openModal("blacksmith"),
              },
              {
                id: "talents",
                icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
                title: "Thức Tỉnh Chuyển Chức & Cây Thiên Phú",
                keybind: "Alt+N",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
                onClick: () => openModal("talents"),
              },
              {
                id: "codex",
                icon: <BookOpen className="w-4 h-4 text-purple-400" />,
                title: "Sách Đồ Giám Quái Vật & Trang Bị",
                keybind: "Alt+L",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-purple-400 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
                onClick: () => openModal("codex"),
              },
              {
                id: "mount",
                icon: <span className="text-xs">🐎</span>,
                title: "Cưỡi Thú (+70% Tốc Độ)",
                keybind: "Alt+M",
                active: isMounted,
                activeClass: "bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(40,195,225,0.45)]",
                normalClass: "bg-slate-900 border-slate-700 text-slate-300 hover:text-white",
                onClick: toggleMount,
              },
              {
                id: "sound",
                icon: soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />,
                title: soundMuted ? "Bật Âm Thanh" : "Tắt Âm Thanh",
                keybind: "M",
                active: soundMuted,
                activeClass: "bg-red-950/70 border-red-700/80 text-red-400",
                normalClass: "bg-cyan-950/60 border-cyan-700/80 text-cyan-400",
                onClick: toggleSoundMute,
              },
              {
                id: "settings",
                icon: <Settings className="w-4 h-4" />,
                title: "Cài Đặt Game",
                keybind: "Esc",
                normalClass: "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white",
                onClick: () => openModal("settings"),
              },
              ...(onLogout ? [{
                id: "logout",
                icon: <LogOut className="w-4 h-4" />,
                title: "Đăng Xuất",
                keybind: "X",
                normalClass: "bg-slate-900 hover:bg-red-950 border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-300",
                onClick: onLogout,
              }] : []),
            ].map((btn, idx) => (
              <button
                key={btn.id}
                onClick={() => {
                  playButtonClick();
                  btn.onClick();
                }}
                style={{
                  animationDelay: `${idx * 35}ms`,
                }}
                className={`relative p-1.5 border rounded-xl transition cursor-pointer hover:scale-[1.08] hover:brightness-110 active:scale-[0.95] animate-in fade-in slide-in-from-right-3 duration-200 fill-mode-backwards group ${
                  btn.active ? btn.activeClass : btn.normalClass
                }`}
                title={`${btn.title} (Phím [${btn.keybind}])`}
              >
                {btn.icon}
                {/* Micro Keybind Badge */}
                <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-black/90 border border-amber-400/40 text-[8px] font-mono font-black text-amber-200 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all pointer-events-none">
                  {btn.keybind}
                </span>
              </button>
            ))}

            {/* Nút Thu Gọn Drawer [▶] */}
            <button
              onClick={() => {
                playButtonClick();
                playCombatSFX("coin_chime", 0.2);
                setIsTrayExpanded(false);
              }}
              className="ml-1 px-2 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 text-cyan-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition hover:scale-[1.05] hover:brightness-110 active:scale-[0.95]"
              title="Thu gọn thanh công cụ"
            >
              <span>Thu gọn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── COLLAPSED TRAY (Mặc Định): 3 Nút Quan Trọng + Nút Mở Rộng [◀ +12] ── */
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-md border border-slate-800 shadow-xl">
            {/* Quick 1: Hành Trang (B / I) */}
            <button
              onClick={() => {
                playButtonClick();
                openModal("inventory");
              }}
              className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-cyan-300 transition cursor-pointer hover:scale-[1.08] hover:brightness-110 active:scale-[0.95] shadow-[0_0_10px_rgba(6,182,212,0.2)] group"
              title="Hành Trang & Trang Bị (Phím [B] / [I])"
            >
              <Backpack className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-black/90 border border-amber-400/40 text-[7px] font-mono font-black text-amber-200 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                B
              </span>
            </button>

            {/* Quick 2: Nhiệm Vụ (Quests) */}
            <button
              onClick={() => {
                playButtonClick();
                openModal("quests");
              }}
              className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-amber-300 transition cursor-pointer hover:scale-[1.08] hover:brightness-110 active:scale-[0.95] shadow-[0_0_10px_rgba(245,158,11,0.2)] group"
              title="Nhiệm Vụ & Chỉ Dẫn 3D (Phím [L])"
            >
              <ScrollText className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-black/90 border border-amber-400/40 text-[7px] font-mono font-black text-amber-200 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                L
              </span>
            </button>

            {/* Quick 3: Âm Thanh Mute Toggle */}
            <button
              onClick={() => {
                playButtonClick();
                toggleSoundMute();
              }}
              className={`relative p-2 border rounded-xl transition cursor-pointer hover:scale-[1.08] hover:brightness-110 active:scale-[0.95] group ${
                soundMuted
                  ? "bg-red-950/70 border-red-700/80 text-red-400"
                  : "bg-cyan-950/60 border-cyan-700/80 text-cyan-400"
              }`}
              title={soundMuted ? "Bật Âm Thanh (Phím [M])" : "Tắt Âm Thanh (Phím [M])"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-black/90 border border-amber-400/40 text-[7px] font-mono font-black text-amber-200 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                M
              </span>
            </button>

            {/* Nút Trụ Chính: [◀ +12 Menu] Mở Rộng Toàn Bộ 12+ Chức Năng */}
            <button
              onClick={() => {
                playButtonClick();
                playCombatSFX("holy_bell", 0.3);
                setIsTrayExpanded(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/60 text-cyan-300 text-[11px] font-black tracking-wider flex items-center gap-1.5 transition cursor-pointer hover:scale-[1.05] hover:brightness-110 active:scale-[0.95] shadow-[0_0_15px_rgba(0,242,255,0.25)]"
              title="Mở rộng menu đầy đủ (12+ chức năng)"
            >
              <ChevronLeft className="w-3.5 h-3.5 animate-pulse" />
              <Menu className="w-3.5 h-3.5" />
              <span>+12</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
