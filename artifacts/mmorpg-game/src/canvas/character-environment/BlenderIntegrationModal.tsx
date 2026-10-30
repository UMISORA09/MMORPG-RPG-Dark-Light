import { memo, useState } from "react";
import {
  X,
  Box,
  Bone,
  Code,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Copy,
  Check,
  Download,
  Flame,
  Layers,
  Sparkles,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { useCharacterStudioStore } from "./useCharacterStudioStore";
import type { CharacterClassId, BuiltinBlenderModel } from "./types";

interface BlenderIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUILTIN_BLENDER_MODELS: BuiltinBlenderModel[] = [
  {
    id: "fighter_3d",
    classId: "fighter",
    name: "Cuồng Long Chiến Binh (3D Model)",
    description: "Chiến binh cận chiến song thủ đại kiếm, giáp vảy rồng đỏ.",
    url: "/assets/models/characters/fighter.glb",
    defaultWeaponUrl: "/assets/models/weapons/weapon_sword.glb",
    polycount: 12450,
  },
  {
    id: "assassin_3d",
    classId: "assassin",
    name: "Ám Dạ Sát Thủ (3D Model)",
    description: "Sát thủ bóng đêm tốc độ cao, song đoản đao sắc bén.",
    url: "/assets/models/characters/assassin.glb",
    defaultWeaponUrl: "/assets/models/weapons/weapon_daggers.glb",
    polycount: 9800,
  },
  {
    id: "tank_3d",
    classId: "tank",
    name: "Hoàng Kim Hộ Vệ (3D Model)",
    description: "Đỡ đòn vững chãi, khiên tháp thánh quang hộ thể.",
    url: "/assets/models/characters/tank.glb",
    defaultWeaponUrl: "/assets/models/weapons/weapon_shield.glb",
    polycount: 14200,
  },
  {
    id: "gunner_3d",
    classId: "gunner",
    name: "Lượng Tử Xạ Thủ (3D Model)",
    description: "Xạ thủ cơ giới bắn đạn năng lượng tầm xa.",
    url: "/assets/models/characters/gunner.glb",
    defaultWeaponUrl: "/assets/models/weapons/weapon_blaster.glb",
    polycount: 11600,
  },
  {
    id: "hero_base_3d",
    classId: "hero_base",
    name: "Khung Xương Mẫu (Base Humanoid Rig)",
    description: "Khung xương tiêu chuẩn 5 khớp cử động dùng để retargeting trong Blender.",
    url: "/assets/models/characters/hero_base.glb",
    polycount: 6500,
  },
];

export const BlenderIntegrationModal = memo(function BlenderIntegrationModal({
  isOpen,
  onClose,
}: BlenderIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<
    "models" | "rig_spec" | "script" | "validator"
  >("models");
  const [hasCopiedScript, setHasCopiedScript] = useState(false);

  const selectedClass = useCharacterStudioStore((s) => s.selectedClass);
  const setSelectedClass = useCharacterStudioStore((s) => s.setSelectedClass);
  const blenderModelUrl = useCharacterStudioStore((s) => s.blenderModelUrl);
  const setBlenderModelUrl = useCharacterStudioStore((s) => s.setBlenderModelUrl);
  const setBlenderCustomFile = useCharacterStudioStore((s) => s.setBlenderCustomFile);
  const blenderModelStats = useCharacterStudioStore((s) => s.blenderModelStats);
  const showWireframe = useCharacterStudioStore((s) => s.showWireframe);
  const setShowWireframe = useCharacterStudioStore((s) => s.setShowWireframe);
  const showSkeletonHelper = useCharacterStudioStore((s) => s.showSkeletonHelper);
  const setShowSkeletonHelper = useCharacterStudioStore((s) => s.setShowSkeletonHelper);
  const setDisplayMode = useCharacterStudioStore((s) => s.setDisplayMode);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setBlenderModelUrl(blobUrl);
      setBlenderCustomFile(file);
      setDisplayMode("blender_3d");
    }
  };

  const handleSelectBuiltin = (model: BuiltinBlenderModel) => {
    setSelectedClass(model.classId);
    setBlenderModelUrl(model.url);
    setDisplayMode("blender_3d");
  };

  const pythonScriptCode = `import bpy
# Chiến Long Bá Humanoid Rig Auto-Generator
def setup_clb_rig():
    arm_data = bpy.data.armatures.new("CLB_Humanoid_Rig")
    arm_obj = bpy.data.objects.new("Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    # Sockets: weapon_slot (RightHand), shield_slot (LeftForeArm)
    # Head: head_socket, Spine2: back_socket
    bpy.ops.object.mode_set(mode='OBJECT')
    print("CLB Rig Ready for Export!")
setup_clb_rig()`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(pythonScriptCode);
    setHasCopiedScript(true);
    setTimeout(() => setHasCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-[#070b14]/98 border-2 border-orange-500/50 rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-slate-900/60 to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 p-2 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-cyan-300 uppercase flex items-center gap-2">
                <span>Trung Tâm Tích Hợp Blender 3D & Không Gian</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 font-mono">
                  v2.5 GLTF
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhập xuất mô hình nhân vật 3D thực tế từ Blender vào môi trường không gian vũ trụ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab("models")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "models"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Thư Viện Mô Hình 3D</span>
          </button>

          <button
            onClick={() => setActiveTab("rig_spec")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "rig_spec"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Bone className="w-4 h-4" />
            <span>Quy Chuẩn Xương & Sockets</span>
          </button>

          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "script"
                ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Kịch Bản Python Blender</span>
          </button>

          <button
            onClick={() => setActiveTab("validator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "validator"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kiểm Định Hiệu Năng (Validator)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: MODELS */}
          {activeTab === "models" && (
            <div className="space-y-6">
              {/* Drag & Drop Custom GLB */}
              <div className="p-6 rounded-3xl border-2 border-dashed border-orange-500/40 bg-orange-950/10 flex flex-col items-center justify-center text-center space-y-3 hover:border-orange-400 hover:bg-orange-950/20 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Tải Tệp Nhân Vật 3D Xuất Từ Blender (.glb / .gltf)
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mt-1">
                    Kéo thả hoặc duyệt tệp từ máy tính để đưa ngay mô hình nhân vật của bạn vào không gian vũ trụ Chiến Long Bá.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-orange-500/30 transition transform hover:scale-105 active:scale-95">
                  <span>Chọn Tệp .GLB Từ Máy</span>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Built-in Models Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Mô Hình Mẫu Chuẩn Blender Trong Dự Án
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    5 Mô Hình Sẵn Có
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BUILTIN_BLENDER_MODELS.map((model) => {
                    const isSelected =
                      blenderModelUrl === model.url ||
                      (!blenderModelUrl && selectedClass === model.classId);

                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectBuiltin(model)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "bg-orange-950/40 border-orange-400 shadow-lg shadow-orange-500/20"
                            : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                              <span>{model.name}</span>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-orange-500 text-slate-950 font-black">
                                  Đang Xem
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {model.description}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                            ~{model.polycount.toLocaleString()} tris
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                          <span className="text-slate-500 font-mono">
                            {model.url.split("/").pop()}
                          </span>
                          <button className="text-orange-400 font-bold hover:underline">
                            Nạp Vào Không Gian Vũ Trụ →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Viewport Debugging Toggles */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-300">
                  Công Cụ Soi Mô Hình 3D Trong Không Gian:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowWireframe(!showWireframe)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      showWireframe
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {showWireframe ? "Tắt Lưới Đa Giác (Wireframe)" : "Bật Lưới Đa Giác (Wireframe)"}
                  </button>

                  <button
                    onClick={() => setShowSkeletonHelper(!showSkeletonHelper)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      showSkeletonHelper
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {showSkeletonHelper ? "Ẩn Xương (Skeleton)" : "Hiện Xương (Skeleton)"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIG & SOCKETS SPECIFICATION */}
          {activeTab === "rig_spec" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 text-xs text-cyan-200">
                💡 <strong>Quy chuẩn tương thích Blender:</strong> Để nhân vật hoạt động mượt mà với hệ thống vũ khí, kỹ năng và không gian 2.5D/3D của game, mô hình cần dựng theo đúng tên xương và vị trí socket dưới đây.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sockets Table */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>4 Điểm Gắn Phụ Kiện (Sockets)</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex justify-between font-bold text-slate-200">
                        <code>weapon_slot</code>
                        <span className="text-amber-400">Bàn Tay Phải (RightHand)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Gắn đại kiếm, song đao, súng plasma Mk-I. Hướng trục Z theo chiều mũi kiếm.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex justify-between font-bold text-slate-200">
                        <code>shield_slot</code>
                        <span className="text-amber-400">Cẳng Tay Trái (LeftForeArm)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Gắn khiên tháp thánh quang, vũ khí phụ. Xoay 90 độ úp vào cẳng tay.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex justify-between font-bold text-slate-200">
                        <code>head_socket</code>
                        <span className="text-amber-400">Đỉnh Đầu (Head)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Gắn mũ trụ rồng, sừng lửa, vòng hào quang thần thánh. Offset +0.15m trục Y.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex justify-between font-bold text-slate-200">
                        <code>back_socket</code>
                        <span className="text-amber-400">Lưng Trên (Spine2)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Gắn áo choàng hắc ám, cánh tinh thể rồng. Offset -0.15m trục Z.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animation Actions Table */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>5 Hoạt Ảnh Bắt Buộc (Action Strips)</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <strong className="text-cyan-400 font-mono">idle</strong>
                        <p className="text-[11px] text-slate-400">Đứng thở, tư thế chiến đấu tự nhiên</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        Loop (30 FPS)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <strong className="text-cyan-400 font-mono">run</strong>
                        <p className="text-[11px] text-slate-400">Chạy bộ xung kích lao tới</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        Loop (30 FPS)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <strong className="text-cyan-400 font-mono">attack_slash</strong>
                        <p className="text-[11px] text-slate-400">Vung đao/kiếm chém xé gió</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        One-shot
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <strong className="text-cyan-400 font-mono">skill_cast</strong>
                        <p className="text-[11px] text-slate-400">Gồng nộ phóng tuyệt chiêu tối thượng</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        One-shot
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <strong className="text-cyan-400 font-mono">death</strong>
                        <p className="text-[11px] text-slate-400">Tử trận ngã tiếp đất</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        Clamp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BLENDER PYTHON SCRIPT */}
          {activeTab === "script" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Kịch Bản Tự Động Hóa Dựng Rig & Xuất GLB Trong Blender
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chạy tệp <code>tools/blender_character_pipeline.py</code> trực tiếp trong Text Editor của Blender.
                  </p>
                </div>

                <button
                  onClick={copyScriptToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                >
                  {hasCopiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{hasCopiedScript ? "Đã Sao Chép!" : "Sao Chép Script"}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
                <pre>{`# Chạy bằng lệnh dòng lệnh (CLI):
blender --background --python tools/blender_character_pipeline.py

# Hoặc nạp kịch bản vào Blender Text Editor:
import bpy

# Tự động dựng khung xương và gắn socket
arm = create_chien_long_ba_armature()
setup_basic_actions(arm)
export_character_glb("artifacts/mmorpg-game/public/assets/models/characters/my_hero.glb")`}</pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-amber-300">Lưu ý khi xuất glTF / GLB từ Blender:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Định dạng: <strong>glTF Binary (.glb)</strong></li>
                  <li>Include: <strong>Selected Objects, Armatures, Meshes, Animations</strong></li>
                  <li>Transform: <strong>+Y Up</strong> (chuẩn Three.js)</li>
                  <li>Animation Mode: <strong>Actions / NLA Strips</strong></li>
                  <li>Tối ưu hóa: Bật <strong>Draco Mesh Compression</strong> để giảm dung lượng file xuống dưới 3MB.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: VALIDATOR */}
          {activeTab === "validator" && (
            <div className="space-y-6">
              {blenderModelStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {blenderModelStats.fileName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {blenderModelStats.meshesCount} Meshes · {blenderModelStats.bones.length} Bones
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {blenderModelStats.budgetStatus === "pass" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đạt Chuẩn Game Web</span>
                        </span>
                      )}
                      {blenderModelStats.budgetStatus === "warn" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Mức Trung Bình</span>
                        </span>
                      )}
                      {blenderModelStats.budgetStatus === "fail" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Vượt Quá Ngưỡng Đa Giác</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Budget Meters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Số Lượng Đa Giác (Triangles)</span>
                        <span className="font-mono text-cyan-400">
                          {blenderModelStats.triangles.toLocaleString()} / 25,000
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            blenderModelStats.triangles > 25000
                              ? "bg-rose-500"
                              : blenderModelStats.triangles > 15000
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (blenderModelStats.triangles / 25000) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Số Lượng Đỉnh (Vertices)</span>
                        <span className="font-mono text-purple-400">
                          {blenderModelStats.vertices.toLocaleString()} / 20,000
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (blenderModelStats.vertices / 20000) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Animations & Sockets Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                      <h5 className="text-xs font-bold text-slate-300">
                        Hoạt Ảnh Phát Hiện ({blenderModelStats.animations.length}):
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {blenderModelStats.animations.map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800 font-mono"
                          >
                            ✓ {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                      <h5 className="text-xs font-bold text-slate-300">
                        Kiểm Tra Socket Khung Xương:
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          {blenderModelStats.hasWeaponSocket ? (
                            <span className="text-emerald-400">✓ weapon_slot</span>
                          ) : (
                            <span className="text-slate-500">✗ weapon_slot (thiếu)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {blenderModelStats.hasShieldSocket ? (
                            <span className="text-emerald-400">✓ shield_slot</span>
                          ) : (
                            <span className="text-slate-500">✗ shield_slot (thiếu)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <p className="text-sm text-slate-300 font-bold">
                    Chưa Có Dữ Liệu Kiểm Định Mô Hình
                  </p>
                  <p className="text-xs text-slate-400">
                    Hãy chọn một mô hình ở thẻ &quot;Thư Viện Mô Hình 3D&quot; hoặc tải lên một tệp .glb từ máy tính để phân tích hiệu năng ngay.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Chiến Long Bá MMORPG 2.5D — Blender GLTF 2.0 Integration Suite
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
});
