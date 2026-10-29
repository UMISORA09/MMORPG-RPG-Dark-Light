import { useState } from "react";
import {
  X,
  BookOpen,
  Sparkles,
  Flame,
  Zap,
  Play,
  RotateCcw,
  Check,
  Copy,
  Download,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Film,
  Layers,
  Shield,
  Swords,
  Info,
} from "lucide-react";
import { useCharacterStudioStore } from "./useCharacterStudioStore";
import type { ModularRigPose } from "./types";

interface TutorialLesson {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  theory: string;
  keyPoints: string[];
  tips: string;
  interactivePresets: Array<{
    name: string;
    description: string;
    pose: Partial<ModularRigPose>;
    fps: number;
    color: string;
  }>;
}

const TUTORIAL_LESSONS: TutorialLesson[] = [
  {
    id: "lesson_1_action_phases",
    badge: "Bài 1 • Cốt Lõi Chiến Đấu",
    title: "Nguyên Lý 4 Giai Đoạn Đòn Đánh (The 4 Action Phases)",
    subtitle: "Windup (Lấy thế) → Active Impact (Sát thương) → Follow-Through (Quán tính) → Recovery (Thu chiêu)",
    theory:
      "Trong Action RPG Pixel Art chuẩn mực (như Chiến Long Bá), một đòn chém đao không bao giờ chuyển động đều. Nó bắt buộc phải tuân theo nhịp điệu gia tốc 4 giai đoạn để tạo cảm giác chém sắc lẹm, uy lực và đầm tay.",
    keyPoints: [
      "1. Windup (Anticipation - 2-3 frames): Trọng tâm ngả lùi, co gối, rút binh khí ra sau để nạp động năng.",
      "2. Active Impact (1-2 frames): Tốc độ bộc phát cực đại, eo vặn xoay, thân người lao tới, sinh ra vệt đao khí (Swoosh Trail) và kích hoạt Hitbox sát thương.",
      "3. Follow-Through (2 frames): Mũi đao và thân người vươn dài hết biên độ quán tính, vạt áo/khăn quàng bay cuộn sóng.",
      "4. Recovery / Combo Cancel (2 frames): Thu đao về thế thủ hoặc kích hoạt hủy chiêu (Animation Canceling) sang đòn kế tiếp.",
    ],
    tips: "Mẹo nhà nghề: Frame Active Impact phải diễn ra chỉ trong 1 frame ở 14 FPS, kết hợp vệt đao màu trắng bạc để mắt người cảm nhận được cú chém thần tốc!",
    interactivePresets: [
      {
        name: "Phase 1: Lấy Thế (Windup)",
        description: "Ngả người -0.22, xoay eo -0.35, rút tay kiếm -1.1, co gối chuẩn bị phóng lực.",
        pose: {
          torsoLean: -0.22,
          torsoTwist: -0.35,
          headPitch: 0.15,
          headYaw: 0.1,
          rightShoulderPitch: -1.1,
          rightShoulderRoll: -0.3,
          rightElbow: 0.95,
          weaponAngle: -1.8,
          leftShoulderPitch: 0.6,
          leftShoulderRoll: 0.2,
          leftElbow: 0.4,
          leftHipPitch: -0.35,
          leftKnee: 0.65,
          rightHipPitch: 0.4,
          rightKnee: 0.3,
          scarfWave: -0.4,
        },
        fps: 8,
        color: "amber",
      },
      {
        name: "Phase 2: Chém Tác Động (Active Slash)",
        description: "Đổ người tới +0.38, xoay eo +0.45, vung tay kiếm +0.85, vệt đao khí bùng nổ.",
        pose: {
          torsoLean: 0.38,
          torsoTwist: 0.45,
          headPitch: -0.1,
          headYaw: -0.15,
          rightShoulderPitch: 0.85,
          rightShoulderRoll: 0.1,
          rightElbow: 0.15,
          weaponAngle: 0.65,
          leftShoulderPitch: -0.7,
          leftShoulderRoll: -0.2,
          leftElbow: 0.2,
          leftHipPitch: 0.6,
          leftKnee: 0.45,
          rightHipPitch: -0.5,
          rightKnee: 0.1,
          scarfWave: 0.85,
        },
        fps: 14,
        color: "rose",
      },
      {
        name: "Phase 3: Quán Tính (Follow-Through)",
        description: "Cánh tay và mũi đao vươn dài hết biên độ quán tính, khăn quàng bay cuộn.",
        pose: {
          torsoLean: 0.25,
          torsoTwist: 0.55,
          headPitch: 0.05,
          headYaw: -0.2,
          rightShoulderPitch: 1.25,
          rightShoulderRoll: 0.15,
          rightElbow: 0.35,
          weaponAngle: 0.95,
          leftShoulderPitch: -0.5,
          leftShoulderRoll: -0.1,
          leftElbow: 0.3,
          leftHipPitch: 0.4,
          leftKnee: 0.5,
          rightHipPitch: -0.6,
          rightKnee: 0.2,
          scarfWave: 0.5,
        },
        fps: 12,
        color: "cyan",
      },
      {
        name: "Phase 4: Thu Chiêu (Recovery)",
        description: "Trọng tâm cân bằng trở lại, hạ mũi đao về trước ngực sẵn sàng phòng thủ hoặc cancel.",
        pose: {
          torsoLean: 0.05,
          torsoTwist: 0.1,
          headPitch: 0,
          headYaw: 0,
          rightShoulderPitch: -0.15,
          rightShoulderRoll: -0.1,
          rightElbow: 0.45,
          weaponAngle: -0.55,
          leftShoulderPitch: 0.2,
          leftShoulderRoll: 0.1,
          leftElbow: 0.3,
          leftHipPitch: 0.1,
          leftKnee: 0.15,
          rightHipPitch: -0.1,
          rightKnee: 0.15,
          scarfWave: 0.1,
        },
        fps: 10,
        color: "emerald",
      },
    ],
  },
  {
    id: "lesson_2_idle_breathing",
    badge: "Bài 2 • Trạng Thái Cơ Bản",
    title: "Tạo Chu Kỳ Thở Đứng Yên (Idle Breathing Cycle - 8 FPS)",
    subtitle: "Quy luật Squash & Stretch nhẹ 1-2px, nhịp thở ngực, đầu gật và khăn quàng đu đưa",
    theory:
      "Một nhân vật pixel đứng bất động sẽ trông như một bức tượng chết. Hoạt ảnh Idle thổi hồn cho nhân vật thông qua chuyển động bồng bềnh 8 khung hình/giây. Nhịp thở làm cơ ngực phập phồng, đầu gật nhẹ và vạt áo đung đưa theo gió.",
    keyPoints: [
      "1. Frame 0 (Base Pose): Dáng đứng tự nhiên, hai chân mở rộng bằng vai, đao hạ thấp nghiêng 45 độ.",
      "2. Frame 2 (Hít Vào - Inhale): Cơ thể nâng cao 1-2px, cơ ngực phồng ra, vai hơi nâng lên.",
      "3. Frame 4 (Đỉnh Thở - Peak): Biên độ giãn cơ thể cao nhất, vạt khăn quàng bay lên điểm cực đại.",
      "4. Frame 6 (Thở Ra - Exhale / Squash): Thân người chùng xuống 1-2px, đầu gối hơi khuỵu nhẹ, mắt chớp.",
      "5. Frame 7 (Hồi Vị): Chuẩn bị lặp lại vòng lặp (Looping seamlessly).",
    ],
    tips: "Mẹo nhà nghề: Không bao giờ di chuyển cả bàn chân khi làm Idle! Hai bàn chân phải bám chặt đất (Grounded), chỉ có hông, ngực và đầu di chuyển tịnh tiến.",
    interactivePresets: [
      {
        name: "Pose 1: Tư Thế Đứng Chuẩn (Neutral Base)",
        description: "Hai chân vững vàng, lưng thẳng, cơ bắp thả lỏng tự nhiên.",
        pose: {
          torsoLean: 0,
          torsoTwist: 0,
          headPitch: 0,
          headYaw: 0,
          rightShoulderPitch: -0.2,
          rightShoulderRoll: -0.15,
          rightElbow: 0.35,
          weaponAngle: -0.8,
          leftShoulderPitch: 0.1,
          leftShoulderRoll: 0.15,
          leftElbow: 0.2,
          leftHipPitch: 0,
          leftKnee: 0.05,
          rightHipPitch: 0,
          rightKnee: 0.05,
          scarfWave: 0,
        },
        fps: 8,
        color: "cyan",
      },
      {
        name: "Pose 2: Hít Vào Nở Ngực (Inhale Peak)",
        description: "Thân người hơi ngửa và giãn cao, vai nâng nhẹ, khăn quàng dâng lên.",
        pose: {
          torsoLean: -0.1,
          torsoTwist: 0.02,
          headPitch: -0.06,
          headYaw: 0,
          rightShoulderPitch: -0.12,
          rightShoulderRoll: -0.18,
          rightElbow: 0.4,
          weaponAngle: -0.75,
          leftShoulderPitch: 0.18,
          leftShoulderRoll: 0.18,
          leftElbow: 0.25,
          leftHipPitch: 0,
          leftKnee: 0,
          rightHipPitch: 0,
          rightKnee: 0,
          scarfWave: 0.4,
        },
        fps: 8,
        color: "amber",
      },
      {
        name: "Pose 3: Thở Ra Chùng Trọng Tâm (Exhale Squash)",
        description: "Cơ thể chùng xuống, đầu gật nhẹ, đầu gối chùng nhẹ 1px tạo độ thở sống động.",
        pose: {
          torsoLean: 0.08,
          torsoTwist: -0.02,
          headPitch: 0.09,
          headYaw: 0,
          rightShoulderPitch: -0.25,
          rightShoulderRoll: -0.12,
          rightElbow: 0.3,
          weaponAngle: -0.85,
          leftShoulderPitch: 0.05,
          leftShoulderRoll: 0.12,
          leftElbow: 0.18,
          leftHipPitch: 0.05,
          leftKnee: 0.18,
          rightHipPitch: 0.05,
          rightKnee: 0.18,
          scarfWave: -0.25,
        },
        fps: 8,
        color: "rose",
      },
    ],
  },
  {
    id: "lesson_3_run_cycle",
    badge: "Bài 3 • Chuyển Động Chạy",
    title: "Chu Kỳ Bước Chạy Chiến Đấu (Run Cycle - 12 FPS)",
    subtitle: "Nguyên lý 4 điểm mốc: Contact → Down → Passing → Up & Đánh tay ngược chiều chân",
    theory:
      "Chạy bộ là hoạt ảnh phức tạp nhất trong đồ họa 2.5D. Để nhân vật chạy tự nhiên và mạnh mẽ, thân người phải hơi đổ về trước góc 15-20 độ, cánh tay vung ngược chiều với chân (Chân phải bước tới thì Tay trái vung tới).",
    keyPoints: [
      "1. Contact (Frame 0 & 4): Gót chân trước chạm đất, chân sau duỗi thẳng hết cỡ, hai tay vung xa nhất.",
      "2. Down (Frame 1 & 5): Trọng tâm hạ thấp nhất (Squash), đầu gối chân trước gập chịu toàn bộ lực nâng cơ thể.",
      "3. Passing (Frame 2 & 6): Chân sau co đầu gối lướt vượt qua chân trụ, hai tay lướt ngang hông.",
      "4. Up (Frame 3 & 7): Chân trụ đẩy mạnh nâng trọng tâm bay khỏi mặt đất (Flight Phase), thân người nẩy cao nhất.",
    ],
    tips: "Mẹo nhà nghề: Không bao giờ để cánh tay đung đưa thẳng đuỗn. Khuỷu tay luôn phải gập ít nhất 30-45 độ để tạo dáng chạy thể thao, dứt khoát của một kiếm sĩ chuyên nghiệp!",
    interactivePresets: [
      {
        name: "Pose 1: Chân Phải Tiếp Đất (Right Contact)",
        description: "Chân phải vươn trước, chân trái duỗi sau, tay trái đánh tới, tay phải rút sau.",
        pose: {
          torsoLean: 0.24,
          torsoTwist: -0.3,
          headPitch: -0.05,
          headYaw: 0.05,
          rightShoulderPitch: -0.7,
          rightShoulderRoll: -0.15,
          rightElbow: 0.6,
          weaponAngle: -1.2,
          leftShoulderPitch: 0.75,
          leftShoulderRoll: 0.2,
          leftElbow: 0.5,
          leftHipPitch: -0.65,
          leftKnee: 0.2,
          rightHipPitch: 0.7,
          rightKnee: 0.1,
          scarfWave: 0.6,
        },
        fps: 12,
        color: "cyan",
      },
      {
        name: "Pose 2: Chùng Gối Chịu Lực (Right Down)",
        description: "Trọng tâm hạ thấp nhất, gối phải gập chịu lực, chân trái chuẩn bị co lướt.",
        pose: {
          torsoLean: 0.28,
          torsoTwist: -0.15,
          headPitch: 0,
          headYaw: 0,
          rightShoulderPitch: -0.4,
          rightShoulderRoll: -0.1,
          rightElbow: 0.5,
          weaponAngle: -0.9,
          leftShoulderPitch: 0.45,
          leftShoulderRoll: 0.15,
          leftElbow: 0.4,
          leftHipPitch: -0.45,
          leftKnee: 0.7,
          rightHipPitch: 0.35,
          rightKnee: 0.65,
          scarfWave: 0.3,
        },
        fps: 12,
        color: "amber",
      },
      {
        name: "Pose 3: Co Chân Lướt Qua (Passing Position)",
        description: "Chân trái gập gối nhấc cao lướt qua hông, trọng tâm bắt đầu nẩy lên cao.",
        pose: {
          torsoLean: 0.18,
          torsoTwist: 0.05,
          headPitch: -0.05,
          headYaw: 0,
          rightShoulderPitch: 0.05,
          rightShoulderRoll: -0.1,
          rightElbow: 0.4,
          weaponAngle: -0.6,
          leftShoulderPitch: -0.05,
          leftShoulderRoll: 0.1,
          leftElbow: 0.3,
          leftHipPitch: 0.5,
          leftKnee: 1.25,
          rightHipPitch: -0.1,
          rightKnee: 0.25,
          scarfWave: 0.5,
        },
        fps: 12,
        color: "purple",
      },
      {
        name: "Pose 4: Chân Trái Tiếp Đất (Left Contact)",
        description: "Chân trái chạm đất gót, chân phải duỗi sau, tay phải cầm kiếm đánh tới.",
        pose: {
          torsoLean: 0.24,
          torsoTwist: 0.3,
          headPitch: -0.05,
          headYaw: -0.05,
          rightShoulderPitch: 0.75,
          rightShoulderRoll: 0.15,
          rightElbow: 0.4,
          weaponAngle: 0.2,
          leftShoulderPitch: -0.7,
          leftShoulderRoll: -0.15,
          leftElbow: 0.5,
          leftHipPitch: 0.7,
          leftKnee: 0.1,
          rightHipPitch: -0.65,
          rightKnee: 0.2,
          scarfWave: 0.6,
        },
        fps: 12,
        color: "rose",
      },
    ],
  },
  {
    id: "lesson_4_smear_vfx",
    badge: "Bài 4 • Kỹ Thuật Đỉnh Cao",
    title: "Kỹ Thuật Smear Frames & Vệt Đao Khí (Swoosh Trails)",
    subtitle: "Hiệu ứng mắt người, hình cung trăng khuyết và nguyên tắc phối màu đao khí theo hệ phái",
    theory:
      "Trong đồ họa pixel 14-24 FPS, một vật thể di chuyển cực nhanh sẽ bị mờ đi theo thị giác người. 'Smear Frame' là kỹ thuật vẽ biến dạng kéo dài lưỡi kiếm hoặc tạo vệt năng lượng hình vòng cung bao quanh quỹ đạo vung đao.",
    keyPoints: [
      "1. Quỹ đạo vòng cung (Arc of Motion): Mũi kiếm vẽ một đường cong parabol hoặc bán nguyệt 120-180 độ.",
      "2. Quy tắc 2 lớp màu: Lõi trong cùng luôn là Màu Trắng Tinh khiết (#FFFFFF) tượng trưng cho nhiệt năng và tốc độ. Viền ngoài phát quang mang màu nguyên tố của hệ phái.",
      "3. Màu sắc đao khí theo hệ phái Chiến Long Bá:",
      "   • Chiến Binh: Đỏ Lửa Rồng (#EF4444) & Cam Cháy (#F97316).",
      "   • Hộ Vệ: Hoàng Kim Thần Thánh (#FACC15) & Trắng Bạc.",
      "   • Sát Thủ: Tím Huyền Bí Ảnh Tộc (#A855F7) & Đen Tinh Vân.",
      "   • Xạ Thủ: Lượng Tử Plasma Cyan (#00F2FF) & Xanh Neon.",
    ],
    tips: "Mẹo nhà nghề: Frame có vệt đao khí thường chỉ tồn tại trong duy nhất 1-2 frame, ngay sau đó phải thu biến thành các đốm hạt tàn lửa (Sparkles) để tạo độ nổ mắt!",
    interactivePresets: [
      {
        name: "Pose: Chém Cung Trăng Khuyết (Crescent Slash)",
        description: "Vặn eo cực đại 60 độ, vai kéo hết tầm, mũi đao cắt chéo góc 45 độ tạo vệt chém khổng lồ.",
        pose: {
          torsoLean: 0.35,
          torsoTwist: 0.6,
          headPitch: -0.1,
          headYaw: -0.25,
          rightShoulderPitch: 1.1,
          rightShoulderRoll: 0.25,
          rightElbow: 0.2,
          weaponAngle: 0.85,
          leftShoulderPitch: -0.8,
          leftShoulderRoll: -0.25,
          leftElbow: 0.2,
          leftHipPitch: 0.55,
          leftKnee: 0.5,
          rightHipPitch: -0.55,
          rightKnee: 0.15,
          scarfWave: 0.9,
        },
        fps: 14,
        color: "rose",
      },
      {
        name: "Pose: Trảm Kích Bổ Từ Trên Cao (Air Heavy Slam)",
        description: "Hai tay ghì chuôi đao giáng thẳng từ trên cao xuống sàn đấu tạo chấn động địa chấn.",
        pose: {
          torsoLean: 0.45,
          torsoTwist: 0,
          headPitch: 0.3,
          headYaw: 0,
          rightShoulderPitch: 0.45,
          rightShoulderRoll: -0.1,
          rightElbow: 0.8,
          weaponAngle: 1.15,
          leftShoulderPitch: 0.45,
          leftShoulderRoll: 0.1,
          leftElbow: 0.8,
          leftHipPitch: 0.4,
          leftKnee: 0.8,
          rightHipPitch: 0.4,
          rightKnee: 0.8,
          scarfWave: 1.1,
        },
        fps: 12,
        color: "amber",
      },
    ],
  },
  {
    id: "lesson_5_export_pipeline",
    badge: "Bài 5 • Tích Hợp Dự Án",
    title: "Quy Trình Xuất File Hoạt Ảnh Cho Game (Export & Integration)",
    subtitle: "Kết nối 17 lớp PNG tách rời với Spine 2D, Aseprite hoặc Engine Game Three.js",
    theory:
      "Tất cả các bộ phận của nhân vật đã được phân tách và lưu trữ trong thư mục public của game. Bạn có thể sao chép cấu hình góc xoay JSON hoặc tải xuống file thông số để dùng trực tiếp trong code hoặc phần mềm làm phim hoạt họa.",
    keyPoints: [
      "1. Vị trí 17 bộ phận PNG chuẩn: artifacts/mmorpg-game/public/assets/character-environment/modular-parts/",
      "2. Điểm neo gốc toạ độ (Pivot Points): Đầu (cổ), Bắp tay (khớp vai), Cẳng tay (khuỷu tay), Đùi (khớp háng), Bắp chân (khớp gối).",
      "3. Định dạng góc xoay: Đơn vị Radians chuẩn Three.js/WebGL.",
      "4. Tương thích trực tiếp: Có thể nạp vào Spine 2D, DragonBones, Unity Sprites, hoặc render thời gian thực qua Three.js Billboard.",
    ],
    tips: "Mẹo nhà nghề: Bấm nút 'Sao Chép JSON' bên dưới để dán ngay vào mã nguồn PlayerEntity25D.tsx hoặc lưu lại keyframe mà bạn vừa tùy chỉnh ưng ý!",
    interactivePresets: [],
  },
];

export function PixelArtAnimationTutorialModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const customPose = useCharacterStudioStore((s) => s.customPose);
  const applyFullPose = useCharacterStudioStore((s) => s.applyFullPose);
  const setAnimationState = useCharacterStudioStore((s) => s.setAnimationState);
  const setDisplayMode = useCharacterStudioStore((s) => s.setDisplayMode);
  const setExplodeDistance = useCharacterStudioStore((s) => s.setExplodeDistance);
  const resetCustomPose = useCharacterStudioStore((s) => s.resetCustomPose);

  if (!isOpen) return null;

  const currentLesson = TUTORIAL_LESSONS[activeLessonIndex];

  const handleCopyPoseJson = () => {
    const jsonStr = JSON.stringify(customPose, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleDownloadPoseJson = () => {
    const jsonStr = JSON.stringify(customPose, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clb_character_pose_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 text-slate-100 overflow-hidden pointer-events-auto">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950/90 via-slate-900 to-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-rose-300 uppercase">
                  Hướng Dẫn Hoạt Ảnh Pixel Art (Interactive Tutorial)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  CHIẾN LONG BÁ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bộ quy chuẩn tạo hoạt ảnh chuyển động 2.5D từ các bộ phận đã phân tách của nhân vật
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Lesson Stepper Navigation Bar ── */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto">
          {TUTORIAL_LESSONS.map((lesson, idx) => {
            const isCurrent = idx === activeLessonIndex;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/30 scale-102"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isCurrent ? "bg-slate-950 text-cyan-300" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{lesson.title.split("(")[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* ── Modal Content Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Lesson Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800/90 shadow-inner">
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-2">
              {currentLesson.badge}
            </span>
            <h3 className="text-xl font-black text-slate-100 tracking-wide mb-1">
              {currentLesson.title}
            </h3>
            <p className="text-xs font-medium text-amber-300/90 mb-3">
              {currentLesson.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentLesson.theory}
            </p>
          </div>

          {/* Interactive Presets Grid (Click to Live Update 3D Character) */}
          {currentLesson.interactivePresets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Thử Nghiệm Pose Trực Tiếp Lên Khung Nhân Vật 3D
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 italic">
                  (Nhấp chuột vào từng nút để nhân vật đổi tư thế ngay tức thì)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentLesson.interactivePresets.map((preset, pIdx) => {
                  return (
                    <div
                      key={pIdx}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 transition-all group space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-200 tracking-wider">
                          {preset.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                          {preset.fps} FPS
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            applyFullPose(preset.pose);
                            setDisplayMode("modular_pixel_rig");
                            setExplodeDistance(0);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Áp Dụng Pose Này Lên Model</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Principles List */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/70 space-y-2.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Các Điểm Mấu Chốt Cần Nhớ (Keyframe Rules)
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentLesson.keyPoints.map((pt, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Tips Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {currentLesson.tips}
            </p>
          </div>

          {/* Special Section for Lesson 5: Exporting & Code Usage */}
          {currentLesson.id === "lesson_5_export_pipeline" && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Thông Số Khớp Xương Hiện Tại (Current JSON Transform)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPoseJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã Sao Chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao Chép JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadPoseJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải File .JSON</span>
                  </button>
                </div>
              </div>

              <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-400/90 max-h-36 overflow-y-auto border border-slate-850">
                {JSON.stringify(customPose, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetCustomPose();
                setDisplayMode("modular_pixel_rig");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Dáng Ban Đầu</span>
            </button>

            <button
              onClick={() => {
                setDisplayMode("2d_combat_anim");
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Xem Bảng 9 Hàng Combat Spritesheet</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activeLessonIndex === 0}
              onClick={() => setActiveLessonIndex((prev) => Math.max(0, prev - 1))}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeLessonIndex === 0
                  ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bài Trước</span>
            </button>

            {activeLessonIndex < TUTORIAL_LESSONS.length - 1 ? (
              <button
                onClick={() =>
                  setActiveLessonIndex((prev) =>
                    Math.min(TUTORIAL_LESSONS.length - 1, prev + 1)
                  )
                }
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <span>Bài Kế Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <span>Bắt Đầu Tự Tạo Hoạt Ảnh</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
