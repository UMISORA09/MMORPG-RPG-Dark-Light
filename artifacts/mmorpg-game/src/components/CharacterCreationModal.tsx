import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateCharacter, getGetCharactersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ClassSprite } from "@/components/ClassSprite";
import { getCharacterBlueprint } from "@/skills";
import {
  Shield,
  Swords,
  Sparkles,
  Dna,
  Dice5,
  X,
  Check,
  Heart,
  Zap,
  Crosshair,
  Scissors,
  Shirt,
  Wand2,
} from "lucide-react";

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated?: (character: any) => void;
}

// Random character names database
const RANDOM_NAMES = {
  male: [
    "HắcLong", "DạXoa", "ThiênPhạt", "CyberKiemSĩ", "LãnhHuyết",
    "CuồngLôi", "TửThần", "PhiLong", "MaẢnh", "KiếmThánh",
    "BáVương", "ThầnLong", "HuyếtMa", "TiêuDao", "PhongVân",
    "DạLân", "KiếmMa", "LôiThần", "ĐộcCô", "VôDanh"
  ],
  female: [
    "BăngNhi", "NguyệtHoa", "DạThần", "CyberPhượng", "LãnhNguyệt",
    "VũĐiệu", "TuyếtNhi", "MộngĐiệp", "HuyếtLiên", "UMinh",
    "ThầnNữ", "TiênCơ", "CầmMa", "BíchDao", "LinhNhi",
    "HànBăng", "BạchHạc", "ThanhXà", "ThụcNữ", "TửLinh"
  ]
};

// 4 Character Classes
const CLASS_ROLES = [
  {
    id: "tank",
    name: "Hộ Vệ",
    title: "Thần Thuẫn Bất Tử",
    role: "Đỡ Đòn & Phản Kích",
    icon: Shield,
    color: "#ffd700",
    glowColor: "rgba(255, 215, 0, 0.4)",
    baseHp: 320,
    baseAtk: 16,
    baseDef: 14,
    baseSpd: 10,
    baseCrit: 8,
    passive: "Giáp Long Cốt: Giảm 30% sát thương nhận vào, phản hồi làn sóng thần thánh phản đòn khi bị tấn công.",
  },
  {
    id: "fighter",
    name: "Chiến Binh",
    title: "Quyền Vương Cuồng Lôi",
    role: "Cận Chiến Toàn Năng",
    icon: Swords,
    color: "#ff3366",
    glowColor: "rgba(255, 51, 102, 0.4)",
    baseHp: 260,
    baseAtk: 22,
    baseDef: 10,
    baseSpd: 11,
    baseCrit: 15,
    passive: "Nộ Huyết: Đòn đánh liên hoàn thứ 3 kích hoạt cú đấm lôi đình bộc phá diện rộng và hồi phục sinh lực.",
  },
  {
    id: "assassin",
    name: "Sát Thủ",
    title: "Bóng Ma Đoạt Mệnh",
    role: "Chí Mạng & Biến Ảo",
    icon: Sparkles,
    color: "#9d4edd",
    glowColor: "rgba(157, 78, 221, 0.4)",
    baseHp: 200,
    baseAtk: 26,
    baseDef: 6,
    baseSpd: 13,
    baseCrit: 25,
    passive: "Bộ Pháp Bóng Tối: Tăng 20% tốc độ di chuyển và 40% sát thương chí mạng khi tấn công từ phía sau.",
  },
  {
    id: "gunner",
    name: "Xạ Thủ",
    title: "Chuyên Gia Hỏa Lực",
    role: "Sát Thương Tầm Xa",
    icon: Crosshair,
    color: "#00f2ff",
    glowColor: "rgba(0, 242, 255, 0.4)",
    baseHp: 210,
    baseAtk: 24,
    baseDef: 7,
    baseSpd: 12,
    baseCrit: 20,
    passive: "Hỏa Lực Kép: Bắn đạn kép tự động đẩy lùi kẻ địch khi tấn công thường và sạc thanh năng lượng công nghệ.",
  },
];

// Radar Spider Chart Dimensions & Metric Values
const RADAR_AXES = [
  { key: "hp", label: "Sinh Lực", unit: "HP" },
  { key: "atk", label: "Công Kích", unit: "ATK" },
  { key: "def", label: "Phòng Ngự", unit: "DEF" },
  { key: "spd", label: "Thân Pháp", unit: "SPD" },
  { key: "crit", label: "Bạo Kích", unit: "CRIT" },
  { key: "cc", label: "Khống Chế", unit: "CC/TẦM" },
];

const CLASS_RADAR_DATA: Record<string, number[]> = {
  tank: [98, 55, 98, 45, 38, 85],
  fighter: [82, 88, 70, 70, 75, 62],
  assassin: [52, 98, 40, 96, 96, 68],
  gunner: [58, 92, 42, 80, 88, 96],
};

// Character Customization: Hairstyles
const HAIR_STYLES = [
  { id: "wind", name: "Phong Vân", desc: "Bay bổng lãng tử" },
  { id: "short", name: "Đoản Phát", desc: "Sắc bén dũng cảm" },
  { id: "tail", name: "Đuôi Ngựa", desc: "Chiến tướng oai nghiêm" },
  { id: "wild", name: "Cuồng Lôi", desc: "Hùng bá cuồng phóng" },
];

// Hair Colors
const HAIR_COLORS = [
  { id: "black", name: "Hắc Dạ", hex: "#1e1e1e" },
  { id: "silver", name: "Bạch Ngân", hex: "#e2e8f0" },
  { id: "crimson", name: "Huyết Hỏa", hex: "#ef4444" },
  { id: "cyan", name: "Băng Lam", hex: "#06b6d4" },
  { id: "gold", name: "Hoàng Kim", hex: "#eab308" },
  { id: "purple", name: "Tử Lôi", hex: "#a855f7" },
];

// Character Customization: Outfits & Shaders
const OUTFITS = [
  { id: "basic", name: "Khởi Nguyên", desc: "Chiến giáp chuẩn mực", filter: "none" },
  { id: "shadow", name: "Dạ Hành", desc: "Áo choàng nhung đen", filter: "brightness(0.85) contrast(1.25) saturate(0.9)" },
  { id: "crimson", name: "Xích Viêm", desc: "Giáp lửa vảy rồng", filter: "sepia(0.35) hue-rotate(-25deg) saturate(1.4)" },
  { id: "frost", name: "Băng Tinh", desc: "Thánh y hàn băng", filter: "hue-rotate(160deg) saturate(1.2) brightness(1.05)" },
];

// Character Customization: Starter Talents (Thiên Phú Khởi Đầu)
const STARTER_TALENTS = [
  {
    id: "fury",
    name: "Cuồng Nộ Chiến Ý",
    icon: Swords,
    buff: "+12% Sát Thương Kỹ Năng",
    desc: "Đòn đánh liên hoàn thứ 3 tạo nổ chấn động diện rộng.",
    color: "#ff3366",
  },
  {
    id: "iron",
    name: "Kim Cang Bất Hoại",
    icon: Shield,
    buff: "+15% HP & Giảm 10% Sát Thương",
    desc: "Kháng lại đòn chí mạng từ quái vật tinh anh.",
    color: "#ffd700",
  },
  {
    id: "gale",
    name: "Tật Phong Lưu Ảnh",
    icon: Zap,
    buff: "+15% Tốc Chạy & +8% Né Tránh",
    desc: "Thân thủ lướt gió tạo ảo ảnh phân thân.",
    color: "#00f2ff",
  },
  {
    id: "vamp",
    name: "Huyết Ma Nghịch Chuyển",
    icon: Heart,
    buff: "Hồi 5% HP Khi Hạ Quái",
    desc: "Chuyển hóa sinh lực đối phương thành nguyên khí trị thương.",
    color: "#a855f7",
  },
];

// Character Customization: Starter Relics & Aura (Pháp Bảo / Khí Linh Hộ Thể)
const STARTER_RELICS = [
  {
    id: "dragon",
    name: "Long Hồn Châu",
    auraColor: "rgba(255, 215, 0, 0.45)",
    buff: "+120 HP & +60 MP",
    desc: "Hào quang rồng thiêng hộ mệnh sinh tồn.",
    glowHex: "#ffd700",
  },
  {
    id: "thunder",
    name: "Lôi Điểu Phù",
    auraColor: "rgba(168, 85, 247, 0.45)",
    buff: "+6% Tỉ Lệ Bạo Kích",
    desc: "Tia sét tím bao bọc đòn tấn công bộc phá.",
    glowHex: "#a855f7",
  },
  {
    id: "tiger",
    name: "Bạch Hổ Ấn",
    auraColor: "rgba(239, 68, 68, 0.45)",
    buff: "+15 Sát Thương Cơ Bản",
    desc: "Uy lực mãnh hổ gia tăng sát thương vũ khí.",
    glowHex: "#ef4444",
  },
  {
    id: "tortoise",
    name: "Huyền Vũ Thuẫn",
    auraColor: "rgba(34, 197, 94, 0.45)",
    buff: "+18 Phòng Thủ Cơ Bản",
    desc: "Lá chắn ngọc bích chặn đứng mọi đòn đánh lén.",
    glowHex: "#22c55e",
  },
];

export function CharacterCreationModal({ isOpen, onClose, onCharacterCreated }: CharacterCreationModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("fighter");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [characterName, setCharacterName] = useState("");
  const [nameError, setNameError] = useState("");

  // Appearance & Upgrade states
  const [hairStyle, setHairStyle] = useState<string>("wind");
  const [hairColor, setHairColor] = useState<string>("#1e1e1e");
  const [outfit, setOutfit] = useState<string>("basic");
  const [starterTalent, setStarterTalent] = useState<string>("fury");
  const [starterRelic, setStarterRelic] = useState<string>("dragon");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCharacter = useCreateCharacter();

  // Selected class definition
  const currentClass = useMemo(() => {
    return CLASS_ROLES.find((c) => c.id === selectedClassId) || CLASS_ROLES[1];
  }, [selectedClassId]);

  // Skill blueprints from data-driven skills directory
  const blueprint = useMemo(() => {
    return getCharacterBlueprint(selectedClassId);
  }, [selectedClassId]);

  // Active outfit filter & relic aura
  const currentOutfitObj = useMemo(() => {
    return OUTFITS.find((o) => o.id === outfit) || OUTFITS[0];
  }, [outfit]);

  const currentRelicObj = useMemo(() => {
    return STARTER_RELICS.find((r) => r.id === starterRelic) || STARTER_RELICS[0];
  }, [starterRelic]);

  // Randomize character name
  const handleRandomName = () => {
    const pool = RANDOM_NAMES[gender];
    const baseName = pool[Math.floor(Math.random() * pool.length)];
    const suffix = Math.floor(10 + Math.random() * 90);
    const generated = `${baseName}_${suffix}`;
    setCharacterName(generated);
    setNameError("");
  };

  // Submit creation
  const handleConfirmCreate = () => {
    const trimmed = characterName.trim();
    if (!trimmed) {
      setNameError("Vui lòng nhập tên nhân vật");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNameError("Tên nhân vật phải từ 2 đến 20 ký tự");
      return;
    }
    if (!/^[a-zA-Z0-9_\u00C0-\u1EF9]+$/.test(trimmed)) {
      setNameError("Tên chỉ được chứa chữ cái, số và dấu gạch dưới");
      return;
    }

    createCharacter.mutate(
      { data: { name: trimmed, classId: selectedClassId, gender } as any },
      {
        onSuccess: async (created: any) => {
          if (typeof window !== "undefined") {
            const charId = created?.id || created?.character?.id;
            if (charId) {
              localStorage.setItem("selectedCharacterId", String(charId));
              localStorage.setItem(`character_gender_${charId}`, gender);
              localStorage.setItem("clb_selected_character", JSON.stringify(created));

              // Persist detailed character customization & upgrades
              const customizationData = {
                hairStyle,
                hairColor,
                outfit,
                starterTalent,
                starterRelic,
              };
              localStorage.setItem(`character_customization_${charId}`, JSON.stringify(customizationData));
              localStorage.setItem("clb_selected_character_customization", JSON.stringify(customizationData));

              try {
                const existingStr = localStorage.getItem("clb_client_characters");
                const existing = existingStr ? JSON.parse(existingStr) : [];
                const updated = [...existing.filter((c: any) => c.id !== charId), { ...created, gender, customization: customizationData }];
                localStorage.setItem("clb_client_characters", JSON.stringify(updated));
              } catch {}
            }
          }

          await queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() });

          toast({
            title: "✨ Khởi tạo Anh Hùng Thành Công!",
            description: `Chào mừng ${trimmed} (${currentClass.name}) bước vào Chiến Long Bá!`,
          });

          if (onCharacterCreated) {
            onCharacterCreated(created);
          }
          onClose();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Tạo nhân vật thất bại",
            description: err?.message || "Tên nhân vật có thể đã tồn tại, hãy thử tên khác",
          });
        },
      }
    );
  };

  // SVG Radar Spider Chart calculation
  const radarPoints = useMemo(() => {
    const data = CLASS_RADAR_DATA[selectedClassId] || CLASS_RADAR_DATA.fighter;
    const cx = 105;
    const cy = 95;
    const maxRadius = 65;

    return data.map((val, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const r = (val / 100) * maxRadius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        val,
      };
    });
  }, [selectedClassId]);

  const radarPolygonPointsStr = useMemo(() => {
    return radarPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }, [radarPoints]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container: Widescreen Cinematic Layout (No vertical scroll needed!) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[1240px] max-h-[96vh] rounded-[28px] bg-[#271f20] border border-[#5d4648] shadow-[0_30px_90px_rgba(0,0,0,0.85)] p-4 sm:p-5 text-white z-10 flex flex-col justify-between overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#8e7a7c] hover:text-white transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Compact Top Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#5d4648]/60">
              <div className="flex items-center gap-3">
                <div className="font-sans inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#4a383a] border border-[#5d4648] text-[11px] font-bold uppercase tracking-wider text-[#28c3e1]">
                  <Dna className="w-3 h-3 text-[#28c3e1]" />
                  Thiên Mệnh Thức Tỉnh
                </div>
                <h2 className="font-sans text-lg sm:text-xl font-black text-white tracking-wide">
                  CHỌN HỆ PHÁI & TÙY BIẾN ANH HÙNG
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#8e7a7c]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Hệ thống 2.5D Real-Time MMORPG
              </div>
            </div>

            {/* Main 3-Column Content: Spacious Landscape Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
              {/* ═══════════ CỘT 1: HỆ PHÁI & SÂN KHẤU NHÂN VẬT (Col 4) ═══════════ */}
              <div className="lg:col-span-4 flex flex-col justify-between p-3 rounded-2xl bg-[#342a2b] border border-[#5d4648]">
                {/* 1. Chọn 4 Hệ Phái */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1.5 flex items-center justify-between">
                    <span>1. Hệ Phái Chiến Đấu</span>
                    <span className="font-bold text-xs" style={{ color: currentClass.color }}>
                      {currentClass.title}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    {CLASS_ROLES.map((cls) => {
                      const Icon = cls.icon;
                      const isSelected = selectedClassId === cls.id;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedClassId(cls.id)}
                          className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#584245] border-[#28c3e1] shadow-[0_0_15px_rgba(40,195,225,0.35)] scale-[1.02]"
                              : "bg-[#4a383a]/80 border-[#5d4648] hover:border-[#8e7a7c] hover:bg-[#533f42]"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#28c3e1] text-[#1c161a]">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#271f20] border border-[#5d4648] shrink-0">
                            <Icon className="w-4 h-4" style={{ color: cls.color }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-sans font-bold text-xs text-white truncate">{cls.name}</div>
                            <div className="font-sans text-[10px] text-[#8e7a7c] truncate">{cls.role}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Sân Khấu Avatar 2.5D Preview */}
                <div className="relative flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-[#271f20] border border-[#5d4648]/60 my-1 min-h-[160px]">
                  {/* Aura & Ambient Glow */}
                  <div
                    className="absolute inset-4 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none"
                    style={{ backgroundColor: currentRelicObj.glowHex || currentClass.color }}
                  />

                  {/* Character Sprite with Custom Outfit Filter & Relic Aura */}
                  <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36">
                    <ClassSprite
                      classId={selectedClassId}
                      gender={gender}
                      auraColor={currentRelicObj.auraColor}
                      filterStyle={{ filter: currentOutfitObj.filter }}
                      className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                    />
                  </div>

                  {/* Badges Info below preview */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 z-10">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#342a2b] border border-[#5d4648] text-[#8e7a7c]">
                      Tóc: <span className="text-white font-medium">{HAIR_STYLES.find((h) => h.id === hairStyle)?.name}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#342a2b] border border-[#5d4648] text-[#8e7a7c]">
                      Y phục: <span className="text-white font-medium">{currentOutfitObj.name}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#342a2b] border border-[#5d4648]" style={{ color: currentRelicObj.glowHex }}>
                      {currentRelicObj.name}
                    </span>
                  </div>
                </div>

                {/* 3. Lựa Chọn Giới Tính */}
                <div>
                  <div className="text-[11px] text-[#8e7a7c] mb-1 font-medium flex justify-between">
                    <span>Giới Tính Nhân Vật:</span>
                    <span className="text-white font-bold">{gender === "male" ? "♂ Nam (Male)" : "♀ Nữ (Female)"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#271f20] p-1 rounded-xl border border-[#5d4648]">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        gender === "male"
                          ? "bg-[#28c3e1] text-[#1c161a] shadow-[0_0_12px_rgba(40,195,225,0.4)]"
                          : "text-[#8e7a7c] hover:text-white"
                      }`}
                    >
                      <span>♂</span> Nam (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        gender === "female"
                          ? "bg-[#28c3e1] text-[#1c161a] shadow-[0_0_12px_rgba(40,195,225,0.4)]"
                          : "text-[#8e7a7c] hover:text-white"
                      }`}
                    >
                      <span>♀</span> Nữ (Female)
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══════════ CỘT 2: MẠNG NHỆN CHỈ SỐ & BỘ KỸ NĂNG (Col 4) ═══════════ */}
              <div className="lg:col-span-4 flex flex-col justify-between p-3 rounded-2xl bg-[#342a2b] border border-[#5d4648]">
                {/* 1. MẠNG NHỆN CHỈ SỐ (RADAR SPIDER WEB CHART) */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#28c3e1]" /> Mạng Nhện Đánh Giá Chỉ Số
                    </span>
                    <span className="text-[10px] text-[#28c3e1] font-mono">6 Chiều Năng Lực</span>
                  </div>

                  {/* Interactive SVG Radar Web */}
                  <div className="relative flex items-center justify-center w-full h-[185px] bg-[#271f20] rounded-xl border border-[#5d4648]/60 p-1">
                    <svg viewBox="0 0 210 190" className="w-full h-full max-h-[175px] select-none">
                      <defs>
                        <radialGradient id="radarRadialGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={currentClass.color} stopOpacity="0.35" />
                          <stop offset="100%" stopColor={currentClass.color} stopOpacity="0.02" />
                        </radialGradient>
                        <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="glow" />
                          <feComposite in="SourceGraphic" in2="glow" operator="over" />
                        </filter>
                      </defs>

                      {/* Concentric Hexagon Grid Rings */}
                      {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
                        const ringPoints = RADAR_AXES.map((_, i) => {
                          const angle = -Math.PI / 2 + (i * Math.PI) / 3;
                          const r = 65 * scale;
                          return `${(105 + r * Math.cos(angle)).toFixed(1)},${(95 + r * Math.sin(angle)).toFixed(1)}`;
                        }).join(" ");
                        return (
                          <polygon
                            key={sIdx}
                            points={ringPoints}
                            fill="none"
                            stroke="#5d4648"
                            strokeOpacity={sIdx === 3 ? 0.8 : 0.4}
                            strokeWidth={sIdx === 3 ? "1.5" : "1"}
                            strokeDasharray={sIdx === 3 ? "none" : "2,2"}
                          />
                        );
                      })}

                      {/* 6 Axis Radial Spokes */}
                      {RADAR_AXES.map((_, i) => {
                        const angle = -Math.PI / 2 + (i * Math.PI) / 3;
                        const x2 = 105 + 65 * Math.cos(angle);
                        const y2 = 95 + 65 * Math.sin(angle);
                        return (
                          <line
                            key={i}
                            x1={105}
                            y1={95}
                            x2={x2}
                            y2={y2}
                            stroke="#5d4648"
                            strokeOpacity={0.6}
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Filled Radar Polygon */}
                      <polygon
                        points={radarPolygonPointsStr}
                        fill="url(#radarRadialGlow)"
                        stroke={currentClass.color}
                        strokeWidth="2.2"
                        filter="url(#radarGlow)"
                        className="transition-all duration-300"
                      />

                      {/* Glowing Vertex Points */}
                      {radarPoints.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={3.5}
                          fill="#ffffff"
                          stroke={currentClass.color}
                          strokeWidth="2"
                          className="transition-all duration-300"
                        />
                      ))}

                      {/* Axis Labels & Values */}
                      {RADAR_AXES.map((axis, i) => {
                        const angle = -Math.PI / 2 + (i * Math.PI) / 3;
                        const labelRadius = 82;
                        const lx = 105 + labelRadius * Math.cos(angle);
                        const ly = 95 + labelRadius * Math.sin(angle);
                        const val = CLASS_RADAR_DATA[selectedClassId]?.[i] || 60;
                        return (
                          <g key={i}>
                            <text
                              x={lx}
                              y={ly}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#cbd5e1"
                              fontSize="9.5"
                              fontWeight="bold"
                              className="font-sans"
                            >
                              {axis.unit}
                            </text>
                            <text
                              x={lx}
                              y={ly + 9}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={currentClass.color}
                              fontSize="8"
                              fontWeight="bold"
                              className="font-mono"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* 2. Chỉ Số Cơ Bản Chi Tiết */}
                <div className="space-y-1.5 my-1.5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center bg-[#271f20] px-2.5 py-1 rounded-lg border border-[#5d4648]/60">
                      <span className="text-rose-300 flex items-center gap-1 font-medium">
                        <Heart className="w-3 h-3 text-rose-400" /> Sinh Lực
                      </span>
                      <span className="font-mono font-bold text-white">{currentClass.baseHp}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#271f20] px-2.5 py-1 rounded-lg border border-[#5d4648]/60">
                      <span className="text-amber-300 flex items-center gap-1 font-medium">
                        <Swords className="w-3 h-3 text-amber-400" /> Tấn Công
                      </span>
                      <span className="font-mono font-bold text-white">{currentClass.baseAtk}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#271f20] px-2.5 py-1 rounded-lg border border-[#5d4648]/60">
                      <span className="text-blue-300 flex items-center gap-1 font-medium">
                        <Shield className="w-3 h-3 text-blue-400" /> Phòng Thủ
                      </span>
                      <span className="font-mono font-bold text-white">{currentClass.baseDef}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#271f20] px-2.5 py-1 rounded-lg border border-[#5d4648]/60">
                      <span className="text-emerald-300 flex items-center gap-1 font-medium">
                        <Zap className="w-3 h-3 text-emerald-400" /> Thân Pháp
                      </span>
                      <span className="font-mono font-bold text-white">{currentClass.baseSpd}</span>
                    </div>
                  </div>

                  {/* Nội Tại Đặc Trưng */}
                  <div className="p-2 rounded-xl bg-[#271f20] border border-[#5d4648]/80 text-[11px] leading-tight">
                    <span className="font-bold text-amber-300">🛡️ Nội Tại: </span>
                    <span className="text-[#a89a9c]">{currentClass.passive}</span>
                  </div>
                </div>

                {/* 3. Bộ 3 Kỹ Năng Chiến Đấu */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1">
                    Bộ Kỹ Năng ({blueprint.skills.length} Chiêu)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {blueprint.skills.map((skill, idx) => (
                      <div
                        key={skill.id}
                        className="p-1.5 rounded-xl bg-[#271f20] border border-[#5d4648] hover:border-[#28c3e1]/60 transition-all text-left"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-white mb-0.5">
                          <span className="truncate">{skill.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#4a383a] text-[#8e7a7c] font-mono">
                            {idx === 0 ? "1/K" : idx === 1 ? "2/L" : "3/U"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#28c3e1] font-mono">
                          <span>ST: {Math.round(skill.targetImpact.damageMultiplier * 100)}%</span>
                          <span>{skill.cooldown}s CD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ═══════════ CỘT 3: TÙY BIẾN TÓC, QUẦN ÁO & NÂNG CẤP MỚI (Col 4) ═══════════ */}
              <div className="lg:col-span-4 flex flex-col justify-between p-3 rounded-2xl bg-[#342a2b] border border-[#5d4648]">
                {/* 1. KIỂU TÓC & MÀU TÓC */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5 text-[#28c3e1]" /> Kiểu Tóc & Sắc Tóc
                    </span>
                    <span className="text-white text-[10px] font-bold">
                      {HAIR_STYLES.find((h) => h.id === hairStyle)?.name}
                    </span>
                  </div>
                  {/* Hairstyle Chips */}
                  <div className="grid grid-cols-4 gap-1 mb-1.5">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHairStyle(h.id)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold truncate transition-all text-center ${
                          hairStyle === h.id
                            ? "bg-[#28c3e1] text-[#1c161a] shadow-sm font-black"
                            : "bg-[#271f20] text-[#8e7a7c] hover:text-white border border-[#5d4648]/60"
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                  {/* Hair Colors Swatches */}
                  <div className="flex items-center justify-between gap-1 bg-[#271f20] p-1.5 rounded-xl border border-[#5d4648]/60 mb-2.5">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.name}
                        onClick={() => setHairColor(c.hex)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          hairColor === c.hex ? "scale-115 border-[#28c3e1] shadow-[0_0_8px_rgba(40,195,225,0.6)]" : "border-[#5d4648] hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. NGOẠI TRANG & TRANG PHỤC */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-[#28c3e1]" /> Ngoại Trang / Y Phục
                    </span>
                    <span className="text-white text-[10px] font-bold">{currentOutfitObj.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    {OUTFITS.map((o) => {
                      const isSelected = outfit === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setOutfit(o.id)}
                          className={`p-1.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#584245] border-[#28c3e1] text-white shadow-sm"
                              : "bg-[#271f20] border-[#5d4648]/60 text-[#8e7a7c] hover:text-white"
                          }`}
                        >
                          <div className="font-bold text-[11px] truncate">{o.name}</div>
                          <div className="text-[9px] text-[#8e7a7c] truncate">{o.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. THIÊN PHÚ KHỞI ĐẦU (NÂNG CẤP MỚI) */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5 text-[#28c3e1]" /> Thiên Phú Khởi Nguyên (Nâng Cấp)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    {STARTER_TALENTS.map((t) => {
                      const Icon = t.icon;
                      const isSelected = starterTalent === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setStarterTalent(t.id)}
                          className={`p-1.5 rounded-xl border text-left transition-all flex items-start gap-1.5 ${
                            isSelected
                              ? "bg-[#584245] border-[#28c3e1] text-white shadow-[0_0_12px_rgba(40,195,225,0.25)]"
                              : "bg-[#271f20] border-[#5d4648]/60 text-[#8e7a7c] hover:text-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: t.color }} />
                          <div className="min-w-0">
                            <div className="font-bold text-[10px] text-white truncate">{t.name}</div>
                            <div className="text-[9px] font-mono" style={{ color: t.color }}>{t.buff}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. PHÁP BẢO / KHÍ LINH HỘ THỂ (AURA & RELIC) */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8e7a7c] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" /> Khí Linh Hộ Thể (Hào Quang)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STARTER_RELICS.map((r) => {
                      const isSelected = starterRelic === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setStarterRelic(r.id)}
                          className={`p-1.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#584245] border-[#ffd700] text-white shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                              : "bg-[#271f20] border-[#5d4648]/60 text-[#8e7a7c] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] text-white truncate">{r.name}</span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.glowHex }} />
                          </div>
                          <div className="text-[9px] font-mono text-[#ffd700] truncate">{r.buff}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════ FOOTER BAR: NHẬP TÊN & NÚT KHỞI TẠO ═══════════ */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 mt-2 border-t border-[#5d4648]/60">
              {/* Ô Nhập Tên & Random Tên */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-lg">
                <span className="text-xs font-bold text-[#8e7a7c] shrink-0 hidden md:inline">
                  Danh Xưng:
                </span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => {
                      setCharacterName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    placeholder={`VD: ${gender === "male" ? "HắcLong_88" : "BăngNhi_99"}`}
                    maxLength={20}
                    className={`font-sans w-full h-9 px-3 rounded-xl bg-[#4a383a] border text-white placeholder-[#8e7a7c] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#28c3e1] focus:border-transparent transition-all ${
                      nameError ? "border-rose-500" : "border-[#5d4648]"
                    }`}
                  />
                  <span className="font-mono absolute right-2.5 top-2.5 text-[10px] text-[#8e7a7c]">
                    {characterName.length}/20
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRandomName}
                  className="font-sans px-3 h-9 rounded-xl bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#28c3e1] font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                >
                  <Dice5 className="w-3.5 h-3.5 text-[#28c3e1]" />
                  <span>Random</span>
                </button>
                {nameError && (
                  <span className="font-sans text-[11px] text-rose-400 font-medium whitespace-nowrap">
                    {nameError}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-sans px-5 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#8e7a7c] hover:text-white font-bold text-xs transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={createCharacter.isPending}
                  className="font-sans flex items-center justify-center gap-1.5 px-7 py-2.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(40,195,225,0.45)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {createCharacter.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#1c161a] border-t-transparent rounded-full animate-spin" />
                      <span>Đang Khởi Tạo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#1c161a]" />
                      <span>BẮT ĐẦU HÀNH TRÌNH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
