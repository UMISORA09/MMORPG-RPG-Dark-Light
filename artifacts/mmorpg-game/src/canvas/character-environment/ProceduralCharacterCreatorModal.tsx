import { useState, useRef, useEffect, useCallback } from "react";
import {
  type CustomCharacterConfig,
  drawProceduralPixelCharacter,
  generateRandomCharacterConfig,
  PRESET_CUSTOM_CHARACTERS,
} from "./proceduralPixelGenerator";
import { useCharacterStudioStore } from "./useCharacterStudioStore";
import {
  Sparkles,
  Dices,
  Download,
  Save,
  Check,
  X,
  Palette,
  Shield,
  Swords,
  User,
  Scissors,
  Eye,
  Crosshair,
} from "lucide-react";

interface ProceduralCharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProceduralCharacterCreatorModal({
  isOpen,
  onClose,
}: ProceduralCharacterCreatorModalProps) {
  const storeConfig = useCharacterStudioStore((s) => s.customConfig);
  const setStoreConfig = useCharacterStudioStore((s) => s.setCustomConfig);
  const setCustomGeneratedAssets = useCharacterStudioStore(
    (s) => s.setCustomGeneratedAssets
  );
  const setIsCustomActive = useCharacterStudioStore(
    (s) => s.setIsCustomActive
  );

  const [config, setConfig] = useState<CustomCharacterConfig>(storeConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update canvas and studio whenever config changes
  const updateCharacter = useCallback(
    (newConfig: CustomCharacterConfig) => {
      setConfig(newConfig);
      setStoreConfig(newConfig);

      if (canvasRef.current) {
        try {
          const { standeeDataUrl, partsDataUrls } =
            drawProceduralPixelCharacter(newConfig, canvasRef.current);
          setCustomGeneratedAssets(standeeDataUrl, partsDataUrls);
          setIsCustomActive(true);
        } catch (err) {
          console.error("Failed to generate procedural pixel art:", err);
        }
      }
    },
    [setStoreConfig, setCustomGeneratedAssets, setIsCustomActive]
  );

  useEffect(() => {
    if (isOpen) {
      updateCharacter(config);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randomCfg = generateRandomCharacterConfig();
    updateCharacter(randomCfg);
  };

  const handleApplyPreset = (preset: CustomCharacterConfig) => {
    updateCharacter({ ...preset });
  };

  const handleSaveToGame = () => {
    try {
      const savedCharsStr = localStorage.getItem("clb_custom_characters");
      const list = savedCharsStr ? JSON.parse(savedCharsStr) : [];
      list.push({ ...config, createdAt: new Date().toISOString() });
      localStorage.setItem("clb_custom_characters", JSON.stringify(list));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `${config.name.toLowerCase().replace(/\s+/g, "_")}_pixel.png`;
    a.click();
  };

  const SKIN_PALETTES = [
    { name: "Trắng Hồng", hex: "#ffdab9" },
    { name: "Bánh Mật", hex: "#fad6b4" },
    { name: "Nắng Gió", hex: "#ffe4c8" },
    { name: "Khỏe Khoắn", hex: "#f8d7b9" },
    { name: "Đồng Rám", hex: "#c68642" },
  ];

  const HAIR_PALETTES = [
    { name: "Huyết Long Đỏ", hex: "#ef4444" },
    { name: "Hoàng Kim", hex: "#eab308" },
    { name: "Cam Lửa", hex: "#f97316" },
    { name: "Dạ Khách Tím", hex: "#a855f7" },
    { name: "Lôi Đình Cyan", hex: "#06b6d4" },
    { name: "Bạch Kim", hex: "#cbd5e1" },
    { name: "Hắc Ám", hex: "#18181b" },
  ];

  const EYE_PALETTES = [
    { name: "Đỏ Rực", hex: "#ef4444" },
    { name: "Hổ Phách", hex: "#eab308" },
    { name: "Xanh Biển", hex: "#0ea5e9" },
    { name: "Tím Thần", hex: "#a855f7" },
    { name: "Lượng Tử", hex: "#00f2ff" },
    { name: "Lục Bảo", hex: "#10b981" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-500/40 bg-[#0d131f]/95 shadow-[0_0_50px_rgba(0,242,255,0.25)] overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-[#121c2d] to-[#0a101d]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wider uppercase text-cyan-400 font-display">
                  TỰ TẠO NHÂN VẬT PIXEL ART
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Thuật Toán Thuần Code
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tự thiết kế & sinh nhân vật chuẩn Anime 2.5D — Không sử dụng ảnh mẫu có sẵn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Dices className="w-4 h-4" />
              Sinh Ngẫu Nhiên
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 transition-colors rounded-lg hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid flex-1 grid-cols-1 gap-6 p-6 overflow-y-auto md:grid-cols-12 custom-scrollbar">
          {/* Left Canvas Preview Panel (5 Cols) */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-cyan-500/20 bg-[#070b12] relative md:col-span-5">
            <div className="relative flex items-center justify-center w-full max-w-[340px] aspect-square rounded-xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-[#0d131f] to-[#05080f] border border-cyan-500/30 shadow-inner overflow-hidden">
              {/* Live Canvas */}
              <canvas
                ref={canvasRef}
                width={360}
                height={360}
                className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
                style={{ imageRendering: "pixelated" }}
              />

              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                Canvas 360x360 px
              </div>

              <div className="absolute bottom-2 text-center text-xs font-bold text-slate-300 drop-shadow">
                {config.name}
              </div>
            </div>

            {/* Canvas Actions */}
            <div className="flex items-center gap-2 mt-4 w-full max-w-[340px]">
              <button
                onClick={handleDownloadPng}
                className="flex items-center justify-center flex-1 gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Tải PNG
              </button>
              <button
                onClick={handleSaveToGame}
                className="flex items-center justify-center flex-1 gap-1.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Đã Lưu Vào Game!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Lưu Nhân Vật
                  </>
                )}
              </button>
            </div>

            {/* Presets Quick Roll */}
            <div className="w-full max-w-[340px] mt-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Bộ Thiết Kế Mẫu Nhanh:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_CUSTOM_CHARACTERS.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-[11px] text-left text-slate-300 truncate transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Customization Controls (7 Cols) */}
          <div className="space-y-5 md:col-span-7">
            {/* 1. Name & Gender */}
            <div className="p-4 border rounded-xl border-slate-800 bg-slate-900/40">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Tên Nhân Vật:
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) =>
                      updateCharacter({ ...config, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070b12] border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Giới Tính / Vóc Dáng:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateCharacter({
                          ...config,
                          gender: "male",
                          torsoStyle: "abs_6pack",
                        })
                      }
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        config.gender === "male"
                          ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Nam 6 Múi
                    </button>
                    <button
                      onClick={() =>
                        updateCharacter({
                          ...config,
                          gender: "female",
                          torsoStyle: "abs_11",
                        })
                      }
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        config.gender === "female"
                          ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Nữ Quyến Rũ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Skin Tone Palette */}
            <div className="p-4 border rounded-xl border-slate-800 bg-slate-900/40">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Màu Da & Tông Cơ Thể:
              </label>
              <div className="flex flex-wrap gap-2">
                {SKIN_PALETTES.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      updateCharacter({ ...config, skinTone: s.hex })
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      config.skinTone === s.hex
                        ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: s.hex }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Hair Style & Color */}
            <div className="p-4 border rounded-xl border-slate-800 bg-slate-900/40">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                Kiểu Tóc & Màu Tóc:
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-5">
                {[
                  { id: "spiky", label: "Tóc Gai" },
                  { id: "ponytail", label: "Đuôi Ngựa" },
                  { id: "undercut", label: "Undercut" },
                  { id: "wavy", label: "Tóc Sóng" },
                  { id: "short", label: "Tóc Ngắn" },
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() =>
                      updateCharacter({
                        ...config,
                        hairStyle: h.id as CustomCharacterConfig["hairStyle"],
                      })
                    }
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      config.hairStyle === h.id
                        ? "border-cyan-400 bg-cyan-950/50 text-cyan-300"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {HAIR_PALETTES.map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      updateCharacter({ ...config, hairColor: h.hex })
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                      config.hairColor === h.hex
                        ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold"
                        : "border-slate-800 bg-slate-900 text-slate-300"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: h.hex }}
                    />
                    {h.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Eyes & Weapon */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Eye Color */}
              <div className="p-4 border rounded-xl border-slate-800 bg-slate-900/40">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Màu Mắt Anime:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EYE_PALETTES.map((e, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        updateCharacter({ ...config, eyeColor: e.hex })
                      }
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-all ${
                        config.eyeColor === e.hex
                          ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold"
                          : "border-slate-800 bg-slate-900 text-slate-400"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: e.hex }}
                      />
                      {e.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weapon Type */}
              <div className="p-4 border rounded-xl border-slate-800 bg-slate-900/40">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <Swords className="w-3.5 h-3.5 text-cyan-400" />
                  Binh Khí Chiến Đấu:
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "greatsword", label: "Cự Kiếm Cuồng Long" },
                    { id: "twin_blades", label: "Song Đoản Đao Bóng Đêm" },
                    { id: "shield_sword", label: "Khiên Sư Tử & Kiếm Thánh" },
                    { id: "sniper_plasma", label: "Súng Trường Plasma" },
                    { id: "dual_pistols", label: "Song Súng Lục Laser" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() =>
                        updateCharacter({
                          ...config,
                          weaponType:
                            w.id as CustomCharacterConfig["weaponType"],
                        })
                      }
                      className={`w-full py-1 px-2.5 rounded-lg border text-left text-xs transition-all ${
                        config.weaponType === w.id
                          ? "border-cyan-400 bg-cyan-950/50 text-cyan-300 font-bold"
                          : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Attire Palette */}
            <div className="p-4 border rounded-xl border-slate-800 bg-slate-900/40">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                Màu Trang Phục & Viền Giáp:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Màu Áo/Giáp Chính:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.clothPrimary}
                      onChange={(e) =>
                        updateCharacter({
                          ...config,
                          clothPrimary: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {config.clothPrimary}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Màu Viền & Vũ Khí Phát Sáng:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.weaponGlow}
                      onChange={(e) =>
                        updateCharacter({
                          ...config,
                          weaponGlow: e.target.value,
                          clothAccent: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {config.weaponGlow}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-cyan-500/20 bg-[#070b12]">
          <div className="text-xs text-slate-400">
            Mô hình 2.5D Rig & Sprite đã được tự tạo trực tiếp bằng thuật toán.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all"
          >
            Đóng & Trải Nghiệm Trong Studio
          </button>
        </div>
      </div>
    </div>
  );
}

