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
  Globe2,
  Database,
} from "lucide-react";
import { REGIONS, SERVERS, useCommunityPortalStore } from "@/stores/useCommunityPortalStore";

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
  const assignCharacterToRealm = useCommunityPortalStore((state) => state.assignCharacterToRealm);
  const launchRequested = useCommunityPortalStore((state) => state.launchRequested);
  const setLaunchRequested = useCommunityPortalStore((state) => state.setLaunchRequested);
  const selectedRegion = useCommunityPortalStore((state) => state.selectedRegion);
  const selectedServer = useCommunityPortalStore((state) => state.selectedServer);
  const regionInfo = REGIONS.find((region) => region.id === selectedRegion) ?? REGIONS[0];
  const serverInfo = SERVERS.find((server) => server.id === selectedServer) ?? SERVERS[0];

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
    if (user) {
      useCommunityPortalStore.getState().syncWithUserProfile(user);
    }
  }, [user, userLoading, setLocation]);

  // Synchronize and preserve characters in localStorage across logins & serverless cold starts
  useEffect(() => {
    if (Array.isArray(characters) && characters.length > 0) {
      try {
        localStorage.setItem("clb_client_characters", JSON.stringify(characters));
        if (user?.username) {
          localStorage.setItem(`clb_characters_${user.username}`, JSON.stringify(characters));
        }
      } catch {}
    } else if (Array.isArray(characters) && characters.length === 0 && user?.username) {
      // If serverless container has empty memory, check if localStorage has saved characters
      try {
        const backupStr = localStorage.getItem(`clb_characters_${user.username}`) || localStorage.getItem("clb_client_characters");
        if (backupStr) {
          const parsed = JSON.parse(backupStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Push cached characters to backend sync endpoint to restore container memory
            fetch("/api/characters/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ characters: parsed }),
              credentials: "include",
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() });
            }).catch(() => {});
          }
        }
      } catch {}
    }
  }, [characters, user?.username, queryClient]);

  // Action: Enter game with specific character
  const handleSelectCharacter = (char: Character) => {
    assignCharacterToRealm(char.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCharacterId", String(char.id));
      localStorage.setItem("clb_selected_character", JSON.stringify(char));
      const gender = (char as any).gender || "male";
      localStorage.setItem(`character_gender_${char.id}`, gender);
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
        try {
          localStorage.removeItem("clb_token");
        } catch {}
        queryClient.setQueryData(getGetMeQueryKey(), null);
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Đã đăng xuất" });
        setLocation("/");
      },
    });
  };

  if (userLoading || charactersLoading) {
    return (
      <div
        className="min-h-[100dvh] w-full flex flex-col items-center justify-center text-white relative overflow-hidden"
        style={{
          backgroundColor: "#4c6e6f",
          backgroundImage: "radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)",
        }}
      >
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#28c3e1] border-t-transparent animate-spin" />
          <Swords className="w-8 h-8 text-[#28c3e1] animate-pulse" />
        </div>
        <p className="text-xs font-bold tracking-widest uppercase text-white/80">
          Đang tải dữ liệu Anh Hùng...
        </p>
      </div>
    );
  }

  const charList = Array.isArray(characters) ? characters : [];

  return (
    <div
      className="min-h-[100dvh] w-full text-white relative overflow-x-hidden flex flex-col justify-between selection:bg-[#28c3e1] selection:text-[#1c161a]"
      style={{
        backgroundColor: "#4c6e6f",
        backgroundImage: "radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)",
      }}
    >
      {/* ── Top Navigation Bar (Header) ── */}
      <header className="relative z-20 w-full px-5 sm:px-10 py-4 border-b border-[#5d4648]/60 bg-[#342a2b]/85 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4a383a] border border-[#5d4648] flex items-center justify-center shadow-md">
            <Swords className="w-5 h-5 text-[#28c3e1]" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-xl font-bold tracking-tight text-white">
              CHIẾN LONG BÁ
            </h1>
            <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#28c3e1]">
              Realm of Legends — Sảnh Anh Hùng
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden border border-[#5d4648] bg-[#4a383a] px-3 py-1.5 text-[10px] sm:block">
            <span className="text-[#8e7a7c]">{regionInfo.shortName}</span>
            <span className="mx-1 text-[#28c3e1]">/</span>
            <span className="font-bold text-white">{serverInfo.code} · {serverInfo.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocation("/portal")}
            className="font-sans flex items-center gap-1.5 rounded-full border border-[#5d4648] bg-[#4a383a] px-3 py-2 text-[10px] font-bold text-white transition hover:border-[#28c3e1] hover:text-[#28c3e1]"
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Về Trang Chủ / Đổi Server</span>
            <span className="md:hidden">Đổi Server</span>
          </button>
          <button
            type="button"
            onClick={() => setLocation("/admin")}
            className="font-sans flex items-center gap-1.5 rounded-full border border-[#28c3e1]/50 bg-[#28c3e1]/15 px-3 py-2 text-[10px] font-bold text-[#28c3e1] transition hover:bg-[#28c3e1] hover:text-[#1c161a] shadow-[0_0_12px_rgba(40,195,225,0.25)]"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Quản Trị Admin</span>
          </button>
          <div className="font-sans hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#4a383a] border border-[#5d4648] text-xs">
            <User className="w-3.5 h-3.5 text-[#28c3e1]" />
            <span className="text-[#8e7a7c]">Đại hiệp:</span>
            <span className="font-mono font-bold text-white">{user?.username}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="font-sans flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black tracking-wider uppercase shadow-[0_0_20px_rgba(40,195,225,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Tạo Nhân Vật Mới</span>
            <span className="sm:hidden">Tạo Mới</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#8e7a7c] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col justify-center">
        {/* Title & Slot Info */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <div className="font-sans inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-[#28c3e1] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Lựa Chọn Nhân Vật Xuất Chiến
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl font-black tracking-tight text-white">
              DANH SÁCH ANH HÙNG
            </h2>
          </div>
          <div className="font-mono text-xs text-[#8e7a7c] bg-[#342a2b] px-3.5 py-1.5 rounded-xl border border-[#5d4648] self-start sm:self-auto shadow-sm">
            Số nhân vật đã tạo:{" "}
            <span className="text-[#28c3e1] font-bold">{charList.length}</span> / 4
          </div>
        </div>

        {/* ── EMPTY STATE: Split-Screen Card Matching AuthScreen ── */}
        {charList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative w-full max-w-[860px] mx-auto min-h-[460px] rounded-[34px] bg-[#342a2b] shadow-[0_30px_90px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.4)] border border-[#5d4648]/40 flex flex-col md:flex-row items-stretch overflow-hidden my-4"
          >
            {/* Left Column: Artwork Illustration Panel */}
            <div className="relative md:w-[48%] flex items-end justify-center rounded-t-[34px] md:rounded-t-none md:rounded-l-[34px] overflow-hidden min-h-[240px] md:min-h-full bg-[#271f20]">
              <img
                src="/auth-character-art-2x.png"
                alt="Chiến Long Bá Hero"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-[#342a2b] pointer-events-none hidden md:block" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#342a2b] to-transparent pointer-events-none md:hidden" />
              {/* Subtle badge on bottom */}
              <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                <span className="font-sans text-[10px] text-[#28c3e1] font-bold tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  🐉 Chiến Long Bá — Hành Trình Huyền Thoại
                </span>
              </div>
            </div>

            {/* Right Column: Information & Action */}
            <div className="relative z-10 md:w-[52%] p-8 sm:p-12 flex flex-col justify-between text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4a383a] border border-[#5d4648] text-[11px] font-bold text-[#28c3e1] uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3 text-[#28c3e1]" />
                  Thiên Mệnh Đang Chờ Đợi
                </div>

                <h3 className="font-sans text-2xl sm:text-3xl font-black text-white mb-3">
                  CHƯA CÓ ANH HÙNG XUẤT THẾ
                </h3>

                <p className="font-sans text-xs sm:text-sm text-[#8e7a7c] leading-relaxed mb-6">
                  Vùng đất Long Tộc đang chìm trong loạn lạc. Hãy đánh thức thiên mệnh của bạn, chọn 1 trong 4 hệ phái kinh điển và khắc tên vào bảng vàng danh vọng!
                </p>

                {/* Features Highlights */}
                <div className="grid grid-cols-2 gap-2.5 mb-8">
                  <div className="p-3 rounded-xl bg-[#4a383a] border border-[#5d4648]">
                    <div className="text-white font-bold text-xs">4 Hệ Phái Độc Đáo</div>
                    <div className="text-[11px] text-[#8e7a7c] mt-0.5">Hộ Vệ, Chiến Binh, Sát Thủ, Xạ Thủ</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#4a383a] border border-[#5d4648]">
                    <div className="text-white font-bold text-xs">Thế Giới Mở 2.5D</div>
                    <div className="text-[11px] text-[#8e7a7c] mt-0.5">Săn Boss & Chiến Đấu Thời Gian Thực</div>
                  </div>
                </div>
              </div>

              {/* Action Button: Pill Cyan */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="font-sans w-full py-3.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(40,195,225,0.45)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Khởi Tạo Anh Hùng Đầu Tiên</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── CHARACTER CARDS GRID (Harmonious with Login Card Theme) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {charList.map((char) => {
              const cfg = CLASS_CONFIG[char.classId] || CLASS_CONFIG.fighter;
              const Icon = cfg.icon;
              const isHovered = hoveredCharId === char.id;
              const storedGender =
                (char as any).gender ||
                (typeof window !== "undefined"
                  ? localStorage.getItem(`character_gender_${char.id}`) || "male"
                  : "male");

              return (
                <motion.div
                  key={char.id}
                  onHoverStart={() => setHoveredCharId(char.id)}
                  onHoverEnd={() => setHoveredCharId(null)}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`group relative rounded-[28px] bg-[#342a2b] border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ${
                    isHovered
                      ? "border-[#28c3e1] shadow-[0_0_30px_rgba(40,195,225,0.35)]"
                      : "border-[#5d4648] hover:border-[#8e7a7c]"
                  }`}
                >
                  {/* Top Badge: Class & Gender */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4a383a] border border-[#5d4648] text-white">
                      <Icon className="w-3.5 h-3.5 text-[#28c3e1]" />
                      {char.className || cfg.name}
                    </span>
                    <span className="font-sans text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#4a383a] text-[#8e7a7c] border border-[#5d4648]">
                      {storedGender === "female" ? "♀ Nữ" : "♂ Nam"}
                    </span>
                  </div>

                  {/* 2.5D Character Sprite Visual */}
                  <div className="relative my-3 flex items-center justify-center h-44 overflow-hidden rounded-2xl bg-[#271f20] border border-[#5d4648]/60">
                    <div
                      className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <div className="relative z-10 w-28 h-28 transform transition-transform group-hover:scale-110 duration-300">
                      <ClassSprite
                        classId={char.classId}
                        gender={storedGender as "male" | "female"}
                        className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                      />
                    </div>
                  </div>

                  {/* Character Identity */}
                  <div className="text-center mb-4">
                    <h3 className="font-sans text-lg font-bold text-white tracking-tight group-hover:text-[#28c3e1] transition-colors">
                      {char.name}
                    </h3>
                    <div className="font-mono inline-flex items-center gap-1 text-xs font-bold text-[#28c3e1] mt-1">
                      <Award className="w-3.5 h-3.5" />
                      Cấp Lv. {char.level}
                    </div>
                  </div>

                  {/* Stats Mini Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-xs mb-5 font-mono">
                    <div className="flex items-center gap-1.5 text-rose-300">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>{char.maxHp || char.hp} HP</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Swords className="w-3.5 h-3.5 text-amber-400" />
                      <span>{char.atk} ATK</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-300">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>{char.def} DEF</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{char.spd} SPD</span>
                    </div>
                  </div>

                  {/* Gold & Kills Banner */}
                  <div className="font-mono flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl bg-[#271f20] border border-[#5d4648]/60 text-[#8e7a7c] mb-5">
                    <div className="flex items-center gap-1 text-amber-300">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{char.gold.toLocaleString()} Vàng</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-300">
                      <Skull className="w-3.5 h-3.5" />
                      <span>{char.kills} Hạ Gục</span>
                    </div>
                  </div>

                  {/* Action: Enter World (Pill Cyan Button) */}
                  <button
                    type="button"
                    onClick={() => handleSelectCharacter(char)}
                    className="font-sans w-full py-3 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-bold text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(40,195,225,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-[#1c161a]" />
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
                className="rounded-[28px] border-2 border-dashed border-[#5d4648] hover:border-[#28c3e1] bg-[#342a2b]/60 hover:bg-[#342a2b] p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 min-h-[380px] group shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-[#4a383a] group-hover:bg-[#28c3e1]/20 border border-[#5d4648] group-hover:border-[#28c3e1] flex items-center justify-center transition-all group-hover:scale-110">
                  <Plus className="w-8 h-8 text-[#8e7a7c] group-hover:text-[#28c3e1]" />
                </div>
                <div className="text-center">
                  <h4 className="font-sans font-bold text-white group-hover:text-[#28c3e1] text-base transition-colors">
                    TẠO NHÂN VẬT MỚI
                  </h4>
                  <p className="font-sans text-xs text-[#8e7a7c] mt-1 max-w-[200px]">
                    Khai mở phong cách chiến đấu và hệ phái mới
                  </p>
                </div>
              </motion.button>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-[#8e7a7c]/60 border-t border-[#5d4648]/40 bg-[#342a2b]/60 backdrop-blur-md">
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
