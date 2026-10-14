import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateCharacter, useGetClasses, getGetCharactersQueryKey, getGetClassesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ClassSprite } from "@/components/ClassSprite";
import { getCharacterBlueprint } from "@/skills";
import { Shield, Swords, Sparkles, Dna, Dice5, X, Check, Heart, Zap, Crosshair } from "lucide-react";

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated?: (character: any) => void;
}

// Epic martial arts / cyberpunk names database
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

const CLASS_ROLES = [
  {
    id: "tank",
    name: "Hộ Vệ",
    title: "Thần Thuẫn Bất Tử",
    role: "Đỡ Đòn & Phản Kích",
    icon: Shield,
    color: "#ffd700",
    bgGradient: "from-amber-600/30 to-yellow-900/40",
    borderColor: "border-amber-500/50",
    glowColor: "rgba(255, 215, 0, 0.4)",
    baseHp: 1400,
    baseAtk: 60,
    baseDef: 120,
    baseSpd: 55,
    passive: "Giáp Long Cốt: Giảm 30% sát thương nhận vào, tự động kích hoạt làn sóng thần thánh phản đòn khi bị tấn công.",
  },
  {
    id: "fighter",
    name: "Chiến Binh",
    title: "Quyền Vương Cuồng Lôi",
    role: "Cận Chiến Toàn Năng",
    icon: Swords,
    color: "#ff3366",
    bgGradient: "from-rose-600/30 to-red-900/40",
    borderColor: "border-rose-500/50",
    glowColor: "rgba(255, 51, 102, 0.4)",
    baseHp: 950,
    baseAtk: 95,
    baseDef: 70,
    baseSpd: 70,
    passive: "Nộ Huyết: Đòn đánh liên hoàn thứ 3 kích hoạt cú đấm lôi đình bộc phá diện rộng và hồi phục sinh lực.",
  },
  {
    id: "assassin",
    name: "Sát Thủ",
    title: "Bóng Ma Đoạt Mệnh",
    role: "Chí Mạng & Biến Ảo",
    icon: Sparkles,
    color: "#9d4edd",
    bgGradient: "from-purple-600/30 to-indigo-950/40",
    borderColor: "border-purple-500/50",
    glowColor: "rgba(157, 78, 221, 0.4)",
    baseHp: 650,
    baseAtk: 125,
    baseDef: 40,
    baseSpd: 110,
    passive: "Bộ Pháp Bóng Tối: Tăng 20% tốc độ di chuyển cơ bản và 40% tỷ lệ sát thương chí mạng khi tấn công từ phía sau.",
  },
  {
    id: "gunner",
    name: "Xạ Thủ",
    title: "Chuyên Gia Hỏa Lực",
    role: "Sát Thương Tầm Xa",
    icon: Crosshair,
    color: "#00f2ff",
    bgGradient: "from-cyan-600/30 to-blue-950/40",
    borderColor: "border-cyan-500/50",
    glowColor: "rgba(0, 242, 255, 0.4)",
    baseHp: 750,
    baseAtk: 110,
    baseDef: 45,
    baseSpd: 85,
    passive: "Hỏa Lực Kép: Bắn đạn kép tự động đẩy lùi kẻ địch khi tấn công thường và sạc thanh năng lượng công nghệ.",
  },
];

export function CharacterCreationModal({ isOpen, onClose, onCharacterCreated }: CharacterCreationModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("fighter");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [characterName, setCharacterName] = useState("");
  const [nameError, setNameError] = useState("");

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
      { data: { name: trimmed, classId: selectedClassId } },
      {
        onSuccess: async (created: any) => {
          // Persist gender and selection
          if (typeof window !== "undefined") {
            const charId = created?.id || created?.character?.id;
            if (charId) {
              localStorage.setItem("selectedCharacterId", String(charId));
              localStorage.setItem(`character_gender_${charId}`, gender);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop with cyber blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#030108]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#140b24] via-[#0d071a] to-[#05020a] border border-[#ff3366]/40 shadow-[0_0_60px_rgba(255,51,102,0.25)] p-5 sm:p-8 text-white z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="font-sans inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ff3366]/20 to-[#00f2ff]/20 border border-[#00f2ff]/30 text-xs font-black uppercase tracking-widest text-cyan-300 mb-2">
                <Dna className="w-3.5 h-3.5 text-cyan-400" />
                Thiên Mệnh Thức Tỉnh — Tạo Nhân Vật Mới
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-rose-300 to-cyan-300 bg-clip-text text-transparent text-glow-red">
                CHỌN HỆ PHÁI & THIẾT LẬP ANH HÙNG
              </h2>
            </div>

            {/* 1. LỰA CHỌN 4 HỆ PHÁI */}
            <div className="mb-6">
              <label className="font-sans block text-xs uppercase tracking-wider font-bold text-white/70 mb-2.5">
                Bước 1: Chọn Hệ Phái Chiến Đấu
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CLASS_ROLES.map((cls) => {
                  const Icon = cls.icon;
                  const isSelected = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`relative flex flex-col items-center p-3.5 rounded-2xl border transition-all duration-200 text-center ${
                        isSelected
                          ? `bg-gradient-to-b ${cls.bgGradient} ${cls.borderColor} shadow-[0_0_25px_${cls.glowColor}] scale-[1.02]`
                          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      {isSelected && (
                        <div
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                          style={{ backgroundColor: cls.color }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 shadow-inner"
                        style={{ backgroundColor: `${cls.color}25` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: cls.color }} />
                      </div>
                      <span className="font-sans font-black text-sm sm:text-base text-white">{cls.name}</span>
                      <span className="font-sans text-[11px] text-white/50">{cls.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN PREVIEW & STATS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-6">
              {/* Left Column: 2.5D Visual & Gender Selection */}
              <div className="md:col-span-5 flex flex-col items-center justify-between p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="w-full text-center">
                  <span
                    className="font-sans text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${currentClass.color}20`, color: currentClass.color }}
                  >
                    {currentClass.title}
                  </span>
                  <div className="font-display text-xl sm:text-2xl font-black text-white mt-1 text-glow-cyan">{currentClass.name}</div>
                </div>

                {/* 2.5D Sprite Avatar Preview with glow */}
                <div className="relative my-4 flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse"
                    style={{ backgroundColor: currentClass.color }}
                  />
                  <div className="relative z-10 w-full h-full transform transition-transform hover:scale-110">
                    <ClassSprite classId={selectedClassId} className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" />
                  </div>
                </div>

                {/* 2. TÙY CHỌN GIỚI TÍNH (GENDER TOGGLE) */}
                <div className="w-full">
                  <div className="text-xs text-center text-white/50 mb-2 font-medium">Giới Tính Anh Hùng</div>
                  <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all ${
                        gender === "male"
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <span>♂</span> Nam (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all ${
                        gender === "female"
                          ? "bg-gradient-to-r from-rose-600 to-pink-500 text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <span>♀</span> Nữ (Female)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Stats & Skills */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  {/* Base Stats Bar */}
                  <h3 className="text-xs uppercase tracking-wider font-bold text-white/60 mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Chỉ Số Cơ Bản
                  </h3>
                  <div className="space-y-2 mb-4">
                    {/* HP */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-rose-300">
                          <Heart className="w-3 h-3 text-rose-500" /> Sinh Lực (HP)
                        </span>
                        <span className="text-white font-mono">{currentClass.baseHp}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-rose-500 to-red-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (currentClass.baseHp / 1500) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* ATK */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Swords className="w-3 h-3 text-amber-500" /> Tấn Công (ATK)
                        </span>
                        <span className="text-white font-mono">{currentClass.baseAtk}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (currentClass.baseAtk / 130) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* DEF */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-blue-300">
                          <Shield className="w-3 h-3 text-blue-500" /> Phòng Thủ (DEF)
                        </span>
                        <span className="text-white font-mono">{currentClass.baseDef}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (currentClass.baseDef / 130) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* SPD */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <Zap className="w-3 h-3 text-emerald-500" /> Thân Pháp (SPD)
                        </span>
                        <span className="text-white font-mono">{currentClass.baseSpd}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (currentClass.baseSpd / 120) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passive Trait */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 text-xs">
                    <span className="font-bold text-amber-300">🛡️ Nội Tại Đặc Trưng: </span>
                    <span className="text-white/80">{currentClass.passive}</span>
                  </div>

                  {/* Skills List Preview */}
                  <h3 className="text-xs uppercase tracking-wider font-bold text-white/60 mb-2">
                    Bộ Kỹ Năng Chiến Đấu ({blueprint.skills.length} Chiêu)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {blueprint.skills.map((skill, idx) => (
                      <div
                        key={skill.id}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 text-left hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
                          <span className="truncate">{skill.name}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                            {idx === 0 ? "Phím 1/K" : idx === 1 ? "Phím 2/L" : "Phím 3/U"}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/50 line-clamp-1">{skill.description}</div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-amber-300 font-mono">
                          <span>ST: {Math.round(skill.targetImpact.damageMultiplier * 100)}%</span>
                          <span>{skill.cooldown}s CD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ĐẶT TÊN & RANDOM TÊN (NAME INPUT & RANDOMIZER) */}
            <div className="mb-6">
              <label className="font-sans block text-xs uppercase tracking-wider font-bold text-white/70 mb-2">
                Bước 2: Danh Xưng Anh Hùng (2 - 20 Ký Tự)
              </label>
              <div className="flex gap-2">
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
                    className={`font-sans w-full h-12 px-4 rounded-xl bg-black/50 border text-white placeholder-white/30 text-sm font-semibold focus:outline-none transition-all ${
                      nameError
                        ? "border-rose-500 focus:border-rose-400"
                        : "border-white/20 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]"
                    }`}
                  />
                  <span className="font-mono absolute right-3 top-3.5 text-xs text-white/40">
                    {characterName.length}/20
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRandomName}
                  className="font-sans px-4 h-12 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(157,78,221,0.2)]"
                >
                  <Dice5 className="w-4 h-4 text-purple-300 animate-spin-slow" />
                  <span>🎲 Random Tên</span>
                </button>
              </div>
              {nameError && (
                <p className="font-sans mt-1.5 text-xs text-rose-400 font-medium">{nameError}</p>
              )}
            </div>

            {/* 4. ACTIONS: CANCEL & CONFIRM */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="font-sans px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-sm transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={createCharacter.isPending}
                className="font-sans flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#ff3366] via-[#ff0055] to-orange-500 hover:from-[#ff5588] hover:to-orange-600 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_0_30px_rgba(255,51,102,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {createCharacter.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang Khởi Tạo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span>BẮT ĐẦU HÀNH TRÌNH</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
