import { useState } from "react";
import { useLocation } from "wouter";
import { Canvas } from "@react-three/fiber";
import {
  VirtualCharacterStudio,
  useCharacterStudioStore,
  type CharacterClassId,
  type CharacterGender,
  type CharacterAnimationState,
  type StudioLightingPresetId,
  type StudioCameraPresetId,
  type PedestalThemeId,
  type CharacterDisplayMode,
  PixelArtAnimationTutorialModal,
  ProceduralCharacterCreatorModal,
} from "@/canvas/character-environment";
import {
  Swords,
  Shield,
  Sparkles,
  Crosshair,
  User,
  Sun,
  Camera,
  Play,
  Pause,
  ChevronLeft,
  Flame,
  Layers,
  Film,
  Box,
  Split,
  Sliders,
  RotateCcw,
  Bone,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CLASS_CONFIGS: Array<{
  id: CharacterClassId;
  name: string;
  subtitle: string;
  icon: any;
  color: string;
  glow: string;
}> = [
  {
    id: "fighter",
    name: "Chiến Binh",
    subtitle: "Cuồng Long Kiếm Sĩ",
    icon: Swords,
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.4)",
  },
  {
    id: "tank",
    name: "Hộ Vệ",
    subtitle: "Thần Thuẫn Bất Tử",
    icon: Shield,
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "assassin",
    name: "Sát Thủ",
    subtitle: "Ảnh Vũ Đoạt Hồn",
    icon: Sparkles,
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.4)",
  },
  {
    id: "gunner",
    name: "Xạ Thủ",
    subtitle: "Lượng Tử Thiện Xạ",
    icon: Crosshair,
    color: "#00f2ff",
    glow: "rgba(0, 242, 255, 0.4)",
  },
];

const LIGHTING_OPTIONS: Array<{ id: StudioLightingPresetId; name: string }> = [
  { id: "cinematic_dark_fantasy", name: "Hắc Ám Kỳ Ảo" },
  { id: "cyberpunk_neon", name: "Lượng Tử Cyberpunk" },
  { id: "celestial_gold", name: "Hoàng Kim Thần Thánh" },
  { id: "neutral_studio", name: "Studio 5500K" },
];

const PEDESTAL_OPTIONS: Array<{ id: PedestalThemeId; name: string }> = [
  { id: "dark_fantasy_runic", name: "Bục Cổ Ngữ Long Hồn" },
  { id: "cyberpunk_hologram", name: "Bục Hologram Lượng Tử" },
  { id: "celestial_altar", name: "Tế Đàn Hoàng Kim" },
  { id: "minimal_studio", name: "Sàn Studio Tối Giản" },
];

const CAMERA_OPTIONS: Array<{ id: StudioCameraPresetId; name: string }> = [
  { id: "full_body", name: "Toàn Thân" },
  { id: "portrait", name: "Chân Dung" },
  { id: "three_quarter_action", name: "Góc 3/4 Heroic" },
  { id: "weapon_inspect", name: "Soi Vũ Khí" },
  { id: "back_profile", name: "Sau Lưng" },
];

const ANIMATION_OPTIONS: Array<{ id: CharacterAnimationState; label: string }> = [
  { id: "idle", label: "Đứng Thở (Idle)" },
  { id: "run", label: "Chạy Bộ (Run)" },
  { id: "attack_slash", label: "Chém Kích (Attack)" },
  { id: "skill_cast", label: "Niệm Nộ (Skill)" },
  { id: "death", label: "Tử Trận (Death)" },
  { id: "custom_pose", label: "Thủ Công (Custom Pose)" },
];

export default function CharacterEnvironmentPage() {
  const [, setLocation] = useLocation();

  const selectedClass = useCharacterStudioStore((s) => s.selectedClass);
  const setSelectedClass = useCharacterStudioStore((s) => s.setSelectedClass);
  const gender = useCharacterStudioStore((s) => s.gender);
  const setGender = useCharacterStudioStore((s) => s.setGender);
  const animationState = useCharacterStudioStore((s) => s.animationState);
  const setAnimationState = useCharacterStudioStore((s) => s.setAnimationState);
  const displayMode = useCharacterStudioStore((s) => s.displayMode);
  const setDisplayMode = useCharacterStudioStore((s) => s.setDisplayMode);
  const explodeDistance = useCharacterStudioStore((s) => s.explodeDistance);
  const setExplodeDistance = useCharacterStudioStore((s) => s.setExplodeDistance);
  const showBoneGizmos = useCharacterStudioStore((s) => s.showBoneGizmos);
  const setShowBoneGizmos = useCharacterStudioStore((s) => s.setShowBoneGizmos);
  const customPose = useCharacterStudioStore((s) => s.customPose);
  const setCustomPosePart = useCharacterStudioStore((s) => s.setCustomPosePart);
  const resetCustomPose = useCharacterStudioStore((s) => s.resetCustomPose);
  const lightingPreset = useCharacterStudioStore((s) => s.lightingPreset);
  const setLightingPreset = useCharacterStudioStore((s) => s.setLightingPreset);
  const cameraPreset = useCharacterStudioStore((s) => s.cameraPreset);
  const setCameraPreset = useCharacterStudioStore((s) => s.setCameraPreset);
  const pedestalTheme = useCharacterStudioStore((s) => s.pedestalTheme);
  const setPedestalTheme = useCharacterStudioStore((s) => s.setPedestalTheme);
  const isAutoRotating = useCharacterStudioStore((s) => s.isAutoRotating);
  const setIsAutoRotating = useCharacterStudioStore((s) => s.setIsAutoRotating);
  const showParticles = useCharacterStudioStore((s) => s.showParticles);
  const setShowParticles = useCharacterStudioStore((s) => s.setShowParticles);
  const isCustomActive = useCharacterStudioStore((s) => s.isCustomActive);
  const setIsCustomActive = useCharacterStudioStore((s) => s.setIsCustomActive);

  const [activeTab, setActiveTab] = useState<"class" | "animation" | "rig_pose" | "environment" | "camera">("rig_pose");
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

  const activeClassConfig = CLASS_CONFIGS.find((c) => c.id === selectedClass) || CLASS_CONFIGS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* ── Top Navigation Bar ── */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent pointer-events-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/characters")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold tracking-wider">Trở Về Game</span>
          </button>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-300 to-cyan-400 uppercase">
              Phòng Mô Hình Tách Bộ Phận Hoạt Ảnh Pixel Art
            </h1>
            <p className="text-[11px] text-slate-400 tracking-wider">
              Hệ Thống Khớp Xương Tách Rời (Modular Rig) & Tạo Hoạt Ảnh Thủ Công — Chiến Long Bá
            </p>
          </div>
        </div>

        {/* Quick controls on the top right */}
        <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700/60 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
          {/* Display Mode Switch */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mr-1">
            <button
              onClick={() => setDisplayMode("modular_pixel_rig")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === "modular_pixel_rig"
                  ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Khung nhân vật tách từng bộ phận khớp xương"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Khớp Rời (Rig)</span>
            </button>

            <button
              onClick={() => setDisplayMode("2d_pixel_hd")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === "2d_pixel_hd"
                  ? "bg-rose-500 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Nhân vật HD Pixel Art 360x360 nguyên bản"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pixel HD Gốc</span>
            </button>

            <button
              onClick={() => setDisplayMode("2d_combat_anim")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === "2d_combat_anim"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Ảnh động chiến đấu 9 hàng theo từng frame"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Combat 9 Hàng</span>
            </button>

            <button
              onClick={() => setDisplayMode("3d_voxel_pixel")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === "3d_voxel_pixel"
                  ? "bg-purple-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Khối điểm ảnh 3D Voxel Pixel"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Voxel 3D</span>
            </button>
          </div>

          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
              isAutoRotating
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-white border border-transparent"
            }`}
            title="Bật/Tắt xoay 360 độ"
          >
            {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">Xoay 360°</span>
          </button>

          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
              showParticles
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-white border border-transparent"
            }`}
            title="Bật/Tắt hiệu ứng hạt ma pháp"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Custom Character Creator Button (Tự Tạo Nhân Vật) */}
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs tracking-wider shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-cyan-300 ml-1"
            title="Mở bảng Tự Tạo & Thiết Kế Nhân Vật Pixel Art"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Tự Tạo Nhân Vật</span>
            <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-slate-950 text-cyan-300 font-black uppercase">
              Tự Tạo
            </span>
          </button>

          {/* Interactive Animation Tutorial Button */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300 ml-1"
            title="Mở giáo trình hướng dẫn tạo hoạt ảnh pixel art"
          >
            <BookOpen className="w-4 h-4 fill-slate-950" />
            <span className="hidden sm:inline">Giáo Trình Hoạt Ảnh</span>
            <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-slate-950 text-amber-300 font-black uppercase">
              Tutorial
            </span>
          </button>
        </div>
      </header>

      {/* ── Center 3D Interactive Canvas ── */}
      <main className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas shadows camera={{ position: [0, 1.05, 3.2], fov: 40 }}>
          <VirtualCharacterStudio />
        </Canvas>
      </main>

      {/* ── Floating Explode Separator Slider HUD (Top Left) ── */}
      <aside className="absolute top-24 left-6 z-20 w-80 pointer-events-auto">
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-700/70 backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Tách Rời Bộ Phận
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {Math.round(explodeDistance * 100)}%
            </span>
          </div>

          {/* Range Slider for Exploded View */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodeDistance}
              onChange={(e) => {
                setExplodeDistance(parseFloat(e.target.value));
                if (displayMode !== "modular_pixel_rig") {
                  setDisplayMode("modular_pixel_rig");
                }
              }}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Ráp Liền)</span>
              <span>50% (Bóc Tách)</span>
              <span>100% (Phân Tán)</span>
            </div>
          </div>

          {/* Bone Gizmo Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowBoneGizmos(!showBoneGizmos)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                showBoneGizmos
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Bone className="w-3.5 h-3.5" />
              <span>{showBoneGizmos ? "Ẩn Khung Xương" : "Hiện Khung Xương"}</span>
            </button>

            <button
              onClick={() => {
                setExplodeDistance(explodeDistance > 0 ? 0 : 0.6);
                if (displayMode !== "modular_pixel_rig") {
                  setDisplayMode("modular_pixel_rig");
                }
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              {explodeDistance > 0 ? "Thu Gọn Lại" : "Bung Tách 60%"}
            </button>
          </div>

          {/* Quick Access Character Creator Button */}
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 hover:from-purple-500/35 hover:to-cyan-500/35 border border-purple-400/50 text-purple-200 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Tự Tạo Nhân Vật (Tùy Biến Pixel)</span>
          </button>

          {/* Quick Access Animation Tutorial Button */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 hover:from-cyan-500/25 hover:to-purple-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Hướng Dẫn Hoạt Ảnh (Tutorial)</span>
          </button>
        </div>
      </aside>

      {/* ── Main Studio Controller Hub (Bottom Center Floating Panel) ── */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl pointer-events-auto">
        <div className="bg-slate-900/90 border border-slate-700/70 backdrop-blur-xl rounded-3xl p-4 shadow-2xl shadow-cyan-950/50">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("rig_pose")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "rig_pose"
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Chỉnh Góc Khớp Xương</span>
              </button>

              <button
                onClick={() => setActiveTab("animation")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "animation"
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Hoạt Ảnh Mẫu</span>
              </button>

              <button
                onClick={() => setActiveTab("class")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "class"
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Nhân Vật</span>
              </button>

              <button
                onClick={() => setActiveTab("environment")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "environment"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Ánh Sáng & Bục</span>
              </button>

              <button
                onClick={() => setActiveTab("camera")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "camera"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Camera</span>
              </button>
            </div>

            {/* Gender Toggle Pill & Collapse Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setGender("male")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    gender === "male"
                      ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Nam 6 Múi
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    gender === "female"
                      ? "bg-rose-500/25 text-rose-300 border border-rose-500/50"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Nữ Sexy
                </button>
              </div>

              <button
                onClick={() => setIsFooterCollapsed(!isFooterCollapsed)}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
                title={isFooterCollapsed ? "Mở rộng bảng điều khiển" : "Thu gọn bảng điều khiển"}
              >
                {isFooterCollapsed ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isFooterCollapsed && (
            <>
              {/* Tab: Joint Rotator / Pose Maker (Dễ Tạo Hoạt Ảnh Thủ Công) */}
          {activeTab === "rig_pose" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300">
                    Điều Chỉnh Từng Khớp Xương (Kéo thanh trượt để thử nghiệm góc xoay chuyển động)
                  </span>
                  <button
                    onClick={() => setIsTutorialOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold hover:bg-cyan-500/30 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Xem Giáo Trình Hoạt Ảnh</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    resetCustomPose();
                    setAnimationState("custom_pose");
                  }}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt Lại Góc Xoay</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                {/* 1. Head Pitch */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Đầu (Gật/Ngửa)</span>
                    <span className="font-mono text-cyan-400">{customPose.headPitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.6"
                    max="0.6"
                    step="0.02"
                    value={customPose.headPitch}
                    onChange={(e) => {
                      setCustomPosePart("headPitch", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 2. Head Yaw */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Đầu (Quay Trái/Phải)</span>
                    <span className="font-mono text-cyan-400">{customPose.headYaw.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.8"
                    max="0.8"
                    step="0.02"
                    value={customPose.headYaw}
                    onChange={(e) => {
                      setCustomPosePart("headYaw", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 3. Torso Lean */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Thân (Nghiêng Tới/Lui)</span>
                    <span className="font-mono text-cyan-400">{customPose.torsoLean.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.02"
                    value={customPose.torsoLean}
                    onChange={(e) => {
                      setCustomPosePart("torsoLean", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 4. Torso Twist */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Eo (Vặn Xoay)</span>
                    <span className="font-mono text-cyan-400">{customPose.torsoTwist.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.8"
                    max="0.8"
                    step="0.02"
                    value={customPose.torsoTwist}
                    onChange={(e) => {
                      setCustomPosePart("torsoTwist", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 5. Right Shoulder (Vung Tay Phải) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Vai Phải (Vung Kiếm)</span>
                    <span className="font-mono text-amber-400">{customPose.rightShoulderPitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.8"
                    max="1.5"
                    step="0.05"
                    value={customPose.rightShoulderPitch}
                    onChange={(e) => {
                      setCustomPosePart("rightShoulderPitch", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 6. Right Elbow (Gập Khuỷu Tay Phải) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Khuỷu Tay Phải</span>
                    <span className="font-mono text-amber-400">{customPose.rightElbow.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="1.5"
                    step="0.05"
                    value={customPose.rightElbow}
                    onChange={(e) => {
                      setCustomPosePart("rightElbow", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 7. Weapon Angle (Góc Kiếm / Súng) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Góc Binh Khí</span>
                    <span className="font-mono text-rose-400">{customPose.weaponAngle.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.2"
                    max="1.2"
                    step="0.05"
                    value={customPose.weaponAngle}
                    onChange={(e) => {
                      setCustomPosePart("weaponAngle", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 8. Left Shoulder (Vai Trái / Khiên) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Vai Trái (Thủ Khiên)</span>
                    <span className="font-mono text-amber-400">{customPose.leftShoulderPitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.5"
                    max="1.5"
                    step="0.05"
                    value={customPose.leftShoulderPitch}
                    onChange={(e) => {
                      setCustomPosePart("leftShoulderPitch", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 9. Left Hip (Khớp Hông Trái) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Hông Trái (Bước Chân)</span>
                    <span className="font-mono text-purple-400">{customPose.leftHipPitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.05"
                    value={customPose.leftHipPitch}
                    onChange={(e) => {
                      setCustomPosePart("leftHipPitch", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 10. Right Hip (Khớp Hông Phải) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Hông Phải (Bước Chân)</span>
                    <span className="font-mono text-purple-400">{customPose.rightHipPitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.05"
                    value={customPose.rightHipPitch}
                    onChange={(e) => {
                      setCustomPosePart("rightHipPitch", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 11. Left Knee (Đầu Gối Trái) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Gối Trái (Gập Chân)</span>
                    <span className="font-mono text-purple-400">{customPose.leftKnee.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.2"
                    max="1.5"
                    step="0.05"
                    value={customPose.leftKnee}
                    onChange={(e) => {
                      setCustomPosePart("leftKnee", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 12. Right Knee (Đầu Gối Phải) */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Gối Phải (Gập Chân)</span>
                    <span className="font-mono text-purple-400">{customPose.rightKnee.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-0.2"
                    max="1.5"
                    step="0.05"
                    value={customPose.rightKnee}
                    onChange={(e) => {
                      setCustomPosePart("rightKnee", parseFloat(e.target.value));
                      if (animationState !== "custom_pose") setAnimationState("custom_pose");
                    }}
                    className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Animation Selection */}
          {activeTab === "animation" && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {ANIMATION_OPTIONS.map((anim) => {
                const isSelected = animationState === anim.id;
                return (
                  <button
                    key={anim.id}
                    onClick={() => setAnimationState(anim.id)}
                    className={`flex items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25 scale-102"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {anim.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Class Selection */}
          {activeTab === "class" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CLASS_CONFIGS.map((cls) => {
                const isSelected = selectedClass === cls.id;
                const Icon = cls.icon;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-400 shadow-md scale-102"
                        : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" style={{ color: cls.color }} />
                    <span className="text-xs font-bold text-slate-200">{cls.name}</span>
                    <span className="text-[10px] text-slate-400">{cls.subtitle}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 4: Environment Settings */}
          {activeTab === "environment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Preset Ánh Sáng Studio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LIGHTING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setLightingPreset(opt.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        lightingPreset === opt.id
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40"
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Chủ Đề Bục Đỡ 3D
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PEDESTAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPedestalTheme(opt.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        pedestalTheme === opt.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40"
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

              {/* Tab 5: Camera Presets */}
              {activeTab === "camera" && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {CAMERA_OPTIONS.map((cam) => {
                    const isSelected = cameraPreset === cam.id;
                    return (
                      <button
                        key={cam.id}
                        onClick={() => setCameraPreset(cam.id)}
                        className={`flex items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-102"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {cam.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </footer>

      {/* ── Interactive Pixel Art Animation Tutorial Modal ── */}
      <PixelArtAnimationTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* ── Procedural Pixel Art Character Creator Modal (Tự Tạo Nhân Vật) ── */}
      <ProceduralCharacterCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
      />
    </div>
  );
}
