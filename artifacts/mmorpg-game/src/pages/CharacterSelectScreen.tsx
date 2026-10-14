import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useGetCharacters,
  getGetCharactersQueryKey,
  useLogout,
  type Character,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ClassSprite } from "@/components/ClassSprite";
import { CharacterCreationModal } from "@/components/CharacterCreationModal";
import { useToast } from "@/hooks/use-toast";
import {
  Swords,
  Shield,
  Sparkles,
  Crosshair,
  User,
  LogOut,
  Plus,
  Play,
  Heart,
  Zap,
  Coins,
  Skull,
  Award,
} from "lucide-react";

const CLASS_CONFIG: Record<string, { name: string; color: string; border: string; glow: string; icon: any }> = {
  tank: {
    name: "Hộ Vệ",
    color: "#ffd700",
    border: "border-amber-500/50",
    glow: "rgba(255, 215, 0, 0.35)",
    icon: Shield,
  },
  fighter: {
    name: "Chiến Binh",
    color: "#ff3366",
    border: "border-rose-500/50",
    glow: "rgba(255, 51, 102, 0.35)",
    icon: Swords,
  },
  assassin: {
    name: "Sát Thủ",
    color: "#9d4edd",
    border: "border-purple-500/50",
    glow: "rgba(157, 78, 221, 0.35)",
    icon: Sparkles,
  },
  gunner: {
    name: "Xạ Thủ",
    color: "#00f2ff",
    border: "border-cyan-500/50",
    glow: "rgba(0, 242, 255, 0.35)",
    icon: Crosshair,
  },
};

export default function CharacterSelectScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCharId, setHoveredCharId] = useState<number | null>(null);

  // Queries
  const { data: user, isLoading: userLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const { data: characters, isLoading: charactersLoading } = useGetCharacters({
    query: { queryKey: getGetCharactersQueryKey() },
  });

  const logout = useLogout();

  // Authentication guard
  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/");
    }
  }, [user, userLoading, setLocation]);

  // Action: Enter game with specific character
  const handleSelectCharacter = (char: Character) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCharacterId", String(char.id));
    }
    toast({
      title: "⚔️ Xuất Trận!",
      description: `Đang kết nối thế giới mở với nhân vật ${char.name}...`,
    });
    setLocation("/game");
  };

  // Action: Logout
  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Đã đăng xuất" });
        setLocation("/");
      },
    });
  };

  if (userLoading || charactersLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#030108] text-white">
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#ff3366] border-t-transparent animate-spin" />
          <Swords className="w-8 h-8 text-[#00f2ff] animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-widest uppercase text-cyan-300">
          Đang tải dữ liệu Anh Hùng...
        </p>
      </div>
    );
  }

  const charList = Array.isArray(characters) ? characters : [];

  return (
    <div className="min-h-[100dvh] w-full bg-[#030108] text-white relative overflow-x-hidden flex flex-col justify-between selection:bg-[#ff3366] selection:text-white">
      {/* ── Background Cyber Grid & Atmospheric Glow ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 242, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 51, 102, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-[#ff3366]/20 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#00f2ff]/20 blur-[120px] pointer-events-none" />

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 border-b border-white/10 bg-[#0d071a]/70 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3366] to-[#00f2ff] p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(255,51,102,0.4)]">
            <div className="w-full h-full bg-[#0d071a] rounded-[10px] flex items-center justify-center">
              <Swords className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
              CHIẾN LONG BÁ
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
              Sảnh Anh Hùng (Character Hall)
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white/60">Đại hiệp:</span>
            <span className="font-bold text-white">{user?.username}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff0055] hover:from-[#ff5588] hover:to-[#ff1a66] text-white text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(255,51,102,0.4)] transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Tạo Nhân Vật Mới</span>
            <span className="sm:hidden">Tạo Mới</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col justify-center">
        {/* Title & Slots */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-cyan-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Lựa Chọn Nhân Vật Xuất Chiến
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              DANH SÁCH ANH HÙNG
            </h2>
          </div>
          <div className="text-xs font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 self-start sm:self-auto">
            Số nhân vật đã tạo:{" "}
            <span className="text-amber-400 font-bold">{charList.length}</span> / 4
          </div>
        </div>

        {/* ── EMPTY STATE: If no characters yet ── */}
        {charList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#140b24]/90 via-[#0d071a]/95 to-[#05020a] border border-[#ff3366]/40 shadow-[0_0_50px_rgba(255,51,102,0.2)] text-center backdrop-blur-2xl"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#ff3366]/30 via-[#9d4edd]/20 to-[#00f2ff]/30 border border-[#ff3366]/50 flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(255,51,102,0.3)] animate-pulse">
              <Swords className="w-12 h-12 text-amber-300" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              CHƯA CÓ ANH HÙNG NÀO XUẤT THẾ
            </h3>
            <p className="text-sm text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
              Vùng đất Long Tộc đang chìm trong loạn lạc. Hãy đánh thức thiên mệnh của bạn, chọn 1 trong 4 hệ phái và đặt tên cho huyền thoại đầu tiên!
            </p>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff3366] via-[#ff0055] to-orange-500 hover:from-[#ff5588] hover:to-orange-600 text-white font-extrabold text-base tracking-wide shadow-[0_0_35px_rgba(255,51,102,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>✨ KHỞI TẠO ANH HÙNG ĐẦU TIÊN</span>
            </button>
          </motion.div>
        ) : (
          /* ── CHARACTER CARDS GRID ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {charList.map((char) => {
              const cfg = CLASS_CONFIG[char.classId] || CLASS_CONFIG.fighter;
              const Icon = cfg.icon;
              const isHovered = hoveredCharId === char.id;
              const storedGender =
                typeof window !== "undefined"
                  ? localStorage.getItem(`character_gender_${char.id}`) || "male"
                  : "male";

              return (
                <motion.div
                  key={char.id}
                  onHoverStart={() => setHoveredCharId(char.id)}
                  onHoverEnd={() => setHoveredCharId(null)}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`group relative rounded-3xl bg-gradient-to-b from-[#140b24] via-[#0d071a] to-[#06030c] border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ${
                    isHovered
                      ? `${cfg.border} shadow-[0_0_40px_${cfg.glow}]`
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top Badge: Class & Gender */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
                      style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {char.className || cfg.name}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10">
                      {storedGender === "female" ? "♀ Nữ" : "♂ Nam"}
                    </span>
                  </div>

                  {/* 2.5D Character Sprite Visual with bobbing animation */}
                  <div className="relative my-3 flex items-center justify-center h-44 overflow-hidden rounded-2xl bg-black/40 border border-white/5">
                    <div
                      className="absolute inset-0 rounded-full blur-2xl opacity-25 group-hover:opacity-45 transition-opacity pointer-events-none"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <div className="relative z-10 w-28 h-28 transform transition-transform group-hover:scale-110 duration-300">
                      <ClassSprite classId={char.classId} className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" />
                    </div>
                  </div>

                  {/* Character Identity */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
                      {char.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 mt-1">
                      <Award className="w-3.5 h-3.5" />
                      Cấp Lv. {char.level}
                    </div>
                  </div>

                  {/* Stats Mini Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs mb-5 font-mono">
                    <div className="flex items-center gap-1.5 text-rose-300">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>{char.maxHp || char.hp} HP</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Swords className="w-3.5 h-3.5 text-amber-500" />
                      <span>{char.atk} ATK</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-300">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      <span>{char.def} DEF</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{char.spd} SPD</span>
                    </div>
                  </div>

                  {/* Gold & Kills Banner */}
                  <div className="flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-white/70 mb-5">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{char.gold.toLocaleString()} Vàng</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-400">
                      <Skull className="w-3.5 h-3.5" />
                      <span>{char.kills} Hạ Gục</span>
                    </div>
                  </div>

                  {/* Action: Enter World */}
                  <button
                    type="button"
                    onClick={() => handleSelectCharacter(char)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff3366] to-[#00f2ff] hover:from-[#ff5588] hover:to-[#33f5ff] text-white font-extrabold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,51,102,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>VÀO THẾ GIỚI</span>
                  </button>
                </motion.div>
              );
            })}

            {/* Add New Character Slot (If slots remaining) */}
            {charList.length < 4 && (
              <motion.button
                type="button"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ y: -6 }}
                className="rounded-3xl border-2 border-dashed border-white/20 hover:border-[#00f2ff]/60 bg-white/[0.02] hover:bg-cyan-500/[0.05] p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 min-h-[380px] group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-cyan-500/20 border border-white/10 group-hover:border-cyan-400/40 flex items-center justify-center transition-all group-hover:scale-110">
                  <Plus className="w-8 h-8 text-white/50 group-hover:text-cyan-300" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-white group-hover:text-cyan-300 text-base transition-colors">
                    TẠO NHÂN VẬT MỚI
                  </h4>
                  <p className="text-xs text-white/40 mt-1 max-w-[200px]">
                    Khai mở phong cách chiến đấu và hệ phái mới
                  </p>
                </div>
              </motion.button>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white/30 border-t border-white/5 bg-[#030108]/80 backdrop-blur-md">
        CHIẾN LONG BÁ (Realm of Legends) &copy; 2026 — 2.5D Real-Time Action MMORPG
      </footer>

      {/* ── Character Creation Modal ── */}
      <CharacterCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCharacterCreated={(newChar) => {
          if (newChar) {
            handleSelectCharacter(newChar);
          }
        }}
      />
    </div>
  );
}
