// ==============================================================================
// DungeonSelectModal.tsx
// Dark Fantasy Instanced Dungeon Portal & Multi-Room Lifecycle Modal
// Difficulties: Thường (Lv.1+), Khó (Lv.10+), Ác Mộng (Lv.20+)
// ==============================================================================

import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { 
  ShieldAlert, 
  Flame, 
  Skull, 
  Crown, 
  Coins, 
  Sparkles, 
  X, 
  ChevronRight,
  Sword,
  Trophy,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Award,
  AlertCircle,
  ArrowRight
} from "lucide-react";

export interface ActiveDungeonState {
  instanceId: string;
  characterId: number;
  characterName: string;
  difficulty: "normal" | "hard" | "nightmare";
  currentRoom: number;
  totalRooms: number;
  startTime: number;
  cleared: boolean;
  clearTimeSeconds?: number;
  roomDetails?: {
    room: number;
    name: string;
    description: string;
    monstersCount: number;
  };
  monstersRemaining?: number;
  monstersList?: Array<{
    id: number;
    name: string;
    hp: number;
    maxHp: number;
    isBoss: boolean;
  }>;
}

export interface DungeonLeaderboardItem {
  rank: number;
  characterId: number;
  characterName: string;
  difficulty: "normal" | "hard" | "nightmare";
  clearTimeSeconds: number;
  clearedAt: string;
}

export const DungeonSelectModal = memo(function DungeonSelectModal() {
  const dungeonModalOpen = useGameWorldStore((s) => s.dungeonModalOpen);
  const closeDungeonModal = useGameWorldStore((s) => s.closeDungeonModal);
  const enterDungeon = useGameWorldStore((s) => s.enterDungeon);
  const leaveDungeon = useGameWorldStore((s) => s.leaveDungeon);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerName = useGameWorldStore((s) => s.playerName);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const updateAfterBattle = useGameWorldStore((s) => s.updateAfterBattle);
  const syncFromBackendCharacter = useGameWorldStore((s) => s.syncFromBackendCharacter);

  // Tabs: select difficulty, active instance tracker, leaderboard
  const [activeTab, setActiveTab] = useState<"select" | "active" | "leaderboard">("select");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"normal" | "hard" | "nightmare">("normal");

  // Active Dungeon State
  const [activeInstance, setActiveInstance] = useState<ActiveDungeonState | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Victory Rewards Modal
  const [victoryData, setVictoryData] = useState<{
    clearTimeSeconds: number;
    rewards: {
      exp: number;
      gold: number;
      stones: number;
      items: Array<{ id: string; name: string; rarity: string; count: number }>;
    };
    message?: string;
  } | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<DungeonLeaderboardItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<"all" | "normal" | "hard" | "nightmare">("all");

  // Timer stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Resolve current active character ID & auth token
  const resolvedCharId = useMemo(() => {
    if (activeCharacterId && activeCharacterId > 0) return activeCharacterId;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedCharacterId");
      if (stored && Number(stored) > 0) return Number(stored);
    }
    return 1;
  }, [activeCharacterId]);

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clb_token");
    }
    return null;
  }, []);

  // Sync elapsed timer when in active dungeon
  useEffect(() => {
    if (!activeInstance || activeInstance.cleared) {
      setElapsedSeconds(0);
      return;
    }
    const updateTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - activeInstance.startTime) / 1000));
      setElapsedSeconds(elapsed);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeInstance]);

  // Fetch Leaderboard
  const fetchLeaderboard = useCallback(async (diffFilter: "all" | "normal" | "hard" | "nightmare" = "all") => {
    setLeaderboardLoading(true);
    try {
      const query = diffFilter !== "all" ? `?difficulty=${diffFilter}` : "";
      const res = await fetch(`/api/dungeon/leaderboard${query}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Check active instance on modal open
  useEffect(() => {
    if (!dungeonModalOpen) return;

    // Check session cache
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("clb_active_dungeon");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.instanceId && !parsed.cleared) {
            setActiveInstance(parsed);
            setActiveTab("active");
          }
        } catch {
          sessionStorage.removeItem("clb_active_dungeon");
        }
      }
    }

    // Also query backend active instance
    const token = getAuthToken();
    fetch(`/api/dungeon/active?characterId=${resolvedCharId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.instance && !data.instance.cleared) {
          const inst = data.instance;
          setActiveInstance((prev) => {
            const next = {
              ...inst,
              roomDetails: inst.roomDetails || prev?.roomDetails,
              monstersRemaining: prev?.monstersRemaining ?? (inst.currentRoom === 3 ? 1 : inst.currentRoom === 2 ? 3 : 4),
              monstersList: prev?.monstersList,
            };
            if (typeof window !== "undefined") {
              sessionStorage.setItem("clb_active_dungeon", JSON.stringify(next));
            }
            return next;
          });
          setActiveTab("active");
        }
      })
      .catch(() => {});

    // Initial leaderboard load
    fetchLeaderboard(leaderboardFilter);
  }, [dungeonModalOpen, resolvedCharId, getAuthToken, fetchLeaderboard, leaderboardFilter]);

  if (!dungeonModalOpen) return null;

  // Handle Tab Change
  const handleTabSwitch = (tab: "select" | "active" | "leaderboard") => {
    setActiveTab(tab);
    playCombatSFX("holy_bell", 0.3);
    if (tab === "leaderboard") {
      fetchLeaderboard(leaderboardFilter);
    }
  };

  const handleSelectDifficulty = (diff: "normal" | "hard" | "nightmare") => {
    setSelectedDifficulty(diff);
    playCombatSFX("holy_bell", 0.4);
  };

  // ── ENTER DUNGEON API ────────────────────────────────────────────────────────
  const handleEnterDungeon = async () => {
    setIsEntering(true);
    setActionError(null);
    playCombatSFX("dragon_roar", 0.6);

    try {
      const token = getAuthToken();
      const res = await fetch("/api/dungeon/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          characterId: resolvedCharId,
          difficulty: selectedDifficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Không thể tạo phòng phó bản cô lập!");
        playCombatSFX("blade_slash", 0.5);
        return;
      }

      const instance = data.instance || {
        instanceId: data.instanceId,
        currentRoom: 1,
        totalRooms: 3,
        difficulty: selectedDifficulty,
        startTime: Date.now(),
        cleared: false,
      };

      const newDungeonState: ActiveDungeonState = {
        instanceId: instance.instanceId,
        characterId: resolvedCharId,
        characterName: instance.characterName || playerName,
        difficulty: selectedDifficulty,
        currentRoom: instance.currentRoom || 1,
        totalRooms: instance.totalRooms || 3,
        startTime: instance.startTime || Date.now(),
        cleared: false,
        roomDetails: data.roomDetails || {
          room: 1,
          name: "Phòng 1: Tiền Đồn Quái Vật",
          description: "Tiêu diệt toàn bộ bầy Yêu Tinh & Slime để mở phong ấn cửa phòng tiếp theo.",
          monstersCount: 4,
        },
        monstersRemaining: data.monstersCount || data.monsters?.length || 4,
        monstersList: data.monsters || [
          { id: 1, name: "Yêu Tinh Đao Phủ", hp: 320, maxHp: 320, isBoss: false },
          { id: 2, name: "Slime Đỏ Biến Dị", hp: 260, maxHp: 260, isBoss: false },
          { id: 3, name: "Yêu Tinh Cung Thủ", hp: 290, maxHp: 290, isBoss: false },
          { id: 4, name: "Slime Chúa Khổng Lồ", hp: 480, maxHp: 480, isBoss: false },
        ],
      };

      setActiveInstance(newDungeonState);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("clb_active_dungeon", JSON.stringify(newDungeonState));
      }

      // Enter 2.5D game world dungeon zone
      enterDungeon(selectedDifficulty);
      setActiveTab("active");
    } catch (err: any) {
      setActionError(err.message || "Lỗi kết nối tới máy chủ phó bản!");
    } finally {
      setIsEntering(false);
    }
  };

  // ── CLEAR ROOM PROGRESSION API ─────────────────────────────────────────────
  const handleClearRoom = async () => {
    if (!activeInstance || isProgressing) return;
    setIsProgressing(true);
    setActionError(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/dungeon/${activeInstance.instanceId}/clear-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          characterId: resolvedCharId,
          roomNumber: activeInstance.currentRoom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Không thể dọn phòng phó bản!");
        return;
      }

      // Check if dungeon fully cleared
      if (data.cleared) {
        playCombatSFX("level_up_fanfare", 0.8);
        playCombatSFX("chest_open", 0.6);

        // Sync character data & rewards
        if (data.character) {
          syncFromBackendCharacter(data.character);
        } else if (data.rewards) {
          updateAfterBattle({
            exp: data.rewards.exp,
            gold: data.rewards.gold,
            level: playerLevel,
          });
        }

        // Show Victory Modal
        setVictoryData({
          clearTimeSeconds: data.clearTimeSeconds || 60,
          rewards: data.rewards,
          message: data.message,
        });

        // Clear active session
        setActiveInstance(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("clb_active_dungeon");
        }

        // Refresh Leaderboard
        fetchLeaderboard("all");
      } else {
        // Advanced to next room (Room 1 -> 2 or Room 2 -> 3)
        playCombatSFX("teleport", 0.7);

        const updatedInstance: ActiveDungeonState = {
          ...activeInstance,
          currentRoom: data.currentRoom,
          roomDetails: data.roomDetails,
          monstersRemaining: data.monsters?.length || data.roomDetails?.monstersCount || (data.currentRoom === 3 ? 1 : 3),
          monstersList: data.monsters || [],
        };

        setActiveInstance(updatedInstance);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("clb_active_dungeon", JSON.stringify(updatedInstance));
        }
      }
    } catch (err: any) {
      setActionError(err.message || "Lỗi đồng bộ tiến độ phòng với máy chủ!");
    } finally {
      setIsProgressing(false);
    }
  };

  // Simulate killing a monster in room
  const handleAttackMonster = () => {
    if (!activeInstance || !activeInstance.monstersRemaining || activeInstance.monstersRemaining <= 0) return;
    playCombatSFX("blade_slash", 0.4);

    const nextRemaining = activeInstance.monstersRemaining - 1;
    const updated = {
      ...activeInstance,
      monstersRemaining: nextRemaining,
    };
    setActiveInstance(updated);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("clb_active_dungeon", JSON.stringify(updated));
    }
  };

  // Leave active dungeon
  const handleLeaveDungeon = () => {
    playCombatSFX("blade_slash", 0.3);
    leaveDungeon();
    setActiveInstance(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("clb_active_dungeon");
    }
    closeDungeonModal();
  };

  const handleClose = () => {
    playCombatSFX("blade_slash", 0.3);
    closeDungeonModal();
  };

  const difficulties = [
    {
      id: "normal" as const,
      name: "Độ Khó: Thường",
      reqLevel: 1,
      color: "border-cyan-500/50 bg-cyan-950/20 text-cyan-300",
      accent: "#00f2ff",
      icon: ShieldAlert,
      mobs: "Yêu Tinh Đao Phủ & Slime Đỏ (Lv.1 - Lv.8)",
      gold: "180",
      exp: "350",
      stones: "2",
      drops: [
        { name: "Đồ Hiếm (Rare)", rarity: "rare", rate: "40%" },
        { name: "Bình Huyết Dược Lớn", rarity: "common", rate: "80%" },
      ],
      desc: "Phù hợp cho tân thủ làm quen cơ chế chiến đấu 3 phòng và thu thập Đá Cường Hóa.",
    },
    {
      id: "hard" as const,
      name: "Độ Khó: Khó",
      reqLevel: 10,
      color: "border-purple-500/50 bg-purple-950/20 text-purple-300",
      accent: "#a855f7",
      icon: Flame,
      mobs: "Chiến Binh Orc Cổ & Kỵ Sĩ Xương (Lv.10 - Lv.16)",
      gold: "650",
      exp: "1,200",
      stones: "5",
      drops: [
        { name: "Hoàng Giáp Long Tộc (Epic)", rarity: "epic", rate: "25%" },
        { name: "Đá Cường Hóa x5", rarity: "rare", rate: "100%" },
      ],
      desc: "Quái vật có giáp kháng đòn và tốc độ tấn công cao. Đòi hỏi chiến thuật né đòn chuẩn xác.",
    },
    {
      id: "nightmare" as const,
      name: "Độ Khó: Ác Mộng",
      reqLevel: 20,
      color: "border-rose-500/50 bg-rose-950/20 text-rose-300",
      accent: "#ef4444",
      icon: Skull,
      mobs: "Hắc Long Tiền Phong & Kỵ Sĩ Diệt Vong (Lv.20+)",
      gold: "2,400",
      exp: "4,500",
      stones: "12",
      drops: [
        { name: "Long Thần Kiếm (Legendary)", rarity: "legendary", rate: "15%" },
        { name: "Đá Cường Hóa x12", rarity: "legendary", rate: "100%" },
      ],
      desc: "Boss bước vào Cuồng Nộ ngay từ đầu, đòn đánh gây choáng diện rộng và thiêu đốt!",
    },
  ];

  const currentDiffData = difficulties.find((d) => d.id === selectedDifficulty)!;
  const isLevelEligible = playerLevel >= currentDiffData.reqLevel;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 pointer-events-auto"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col font-sans max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent Ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f1422] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                <span>CỔNG CẤM ĐỊA — HANG ĐỘNG PHÓ BẢN</span>
              </h2>
              <p className="text-xs text-slate-400">
                Chinh phục hang động 3 phòng cô lập, nhận thưởng EXP, Vàng và ghi danh Bảng Xếp Hạng
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-[#0c101d] border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => handleTabSwitch("select")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "select"
                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sword className="w-4 h-4" />
            <span>Chọn Cấp Độ</span>
          </button>

          <button
            onClick={() => handleTabSwitch("active")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeTab === "active"
                ? "bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Tiến Trình Phó Bản</span>
            {activeInstance && !activeInstance.cleared && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            )}
          </button>

          <button
            onClick={() => handleTabSwitch("leaderboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Bảng Vinh Danh</span>
          </button>
        </div>

        {/* Error notification banner */}
        {actionError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-400 hover:text-white text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="p-6 bg-[#0c101d] overflow-y-auto custom-scrollbar flex-1">
          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: SELECT DIFFICULTY & ENTER DUNGEON */}
          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "select" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Column (2 cols): Difficulty Cards */}
              <div className="md:col-span-2 flex flex-col gap-3">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                  Chọn Cấp Độ Thử Thách:
                </span>
                {difficulties.map((diff) => {
                  const Icon = diff.icon;
                  const isSelected = selectedDifficulty === diff.id;
                  const isLocked = playerLevel < diff.reqLevel;

                  return (
                    <button
                      key={diff.id}
                      onClick={() => handleSelectDifficulty(diff.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? `${diff.color} shadow-lg ring-1 ring-cyan-400/50`
                          : "border-slate-800 bg-[#121726]/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-white">{diff.name}</div>
                          <div className="text-[11px] font-mono opacity-80">
                            Yêu cầu:{" "}
                            <span
                              className={
                                playerLevel >= diff.reqLevel
                                  ? "text-emerald-400 font-bold"
                                  : "text-rose-400 font-bold"
                              }
                            >
                              Cấp {diff.reqLevel}+
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition ${
                          isSelected ? "translate-x-1 text-cyan-400" : "opacity-40"
                        }`}
                      />
                      {isLocked && (
                        <div className="absolute top-1 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-300 font-bold">
                          CHƯA ĐỦ CẤP
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Active Instance Prompt if any */}
                {activeInstance && !activeInstance.cleared && (
                  <div className="mt-2 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      Phó bản đang hoạt động
                    </div>
                    <div className="text-[11px] text-purple-300/80 mb-2">
                      Bạn đang ở Phòng {activeInstance.currentRoom}/3 ({activeInstance.difficulty.toUpperCase()}).
                    </div>
                    <button
                      onClick={() => handleTabSwitch("active")}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Tiếp Tục Phó Bản
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column (3 cols): Selected Dungeon Details & Rewards */}
              <div className="md:col-span-3 flex flex-col justify-between p-5 rounded-2xl bg-[#111625] border border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                      <Sword className="w-4 h-4 text-cyan-400" />
                      {currentDiffData.name}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                      Cấp Đề Xuất: Cấp {currentDiffData.reqLevel}+
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    {currentDiffData.desc}
                  </p>

                  {/* Monster Encounters */}
                  <div className="mb-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Quái Vật Đồn Trú (3 Phòng):
                    </span>
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <span>💀</span>
                      <span>{currentDiffData.mobs}</span>
                    </span>
                  </div>

                  {/* Reward Loot Preview */}
                  <div className="space-y-2 mb-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Phần Thưởng Vượt Ải Dự Kiến:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-950/20 border border-amber-600/30 text-amber-300 text-xs">
                        <Coins className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>+{currentDiffData.gold} Vàng</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-cyan-950/20 border border-cyan-600/30 text-cyan-300 text-xs">
                        <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                        <span>+{currentDiffData.exp} EXP</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-purple-950/20 border border-purple-600/30 text-purple-300 text-xs">
                        <Award className="w-4 h-4 shrink-0 text-purple-400" />
                        <span>+{currentDiffData.stones} Đá C.Hóa</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      {currentDiffData.drops.map((drop, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900/60 border border-slate-800/60"
                        >
                          <span
                            className={
                              drop.rarity === "legendary"
                                ? "text-amber-400 font-bold"
                                : drop.rarity === "epic"
                                ? "text-purple-400 font-bold"
                                : drop.rarity === "rare"
                                ? "text-cyan-400 font-bold"
                                : "text-slate-300"
                            }
                          >
                            ✦ {drop.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            Tỉ lệ: {drop.rate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enter Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    onClick={handleEnterDungeon}
                    disabled={!isLevelEligible || isEntering}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer ${
                      isLevelEligible && !isEntering
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25 active:scale-95"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {isEntering ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang Khởi Tạo...
                      </span>
                    ) : isLevelEligible ? (
                      <span>⚔️ TIẾN VÀO PHÓ BẢN</span>
                    ) : (
                      <span>⚠️ CẤP ĐỘ KHÔNG ĐỦ</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: ACTIVE DUNGEON INSTANCE STATUS & ROOM PROGRESSION */}
          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "active" && (
            <div>
              {!activeInstance || activeInstance.cleared ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Chưa Có Phó Bản Nào Đang Hoạt Động</h3>
                  <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                    Bạn chưa bước vào hang động cấm địa nào. Hãy chọn độ khó tại tab Chọn Cấp Độ và khởi tạo phiên phó bản để bắt đầu khiêu chiến.
                  </p>
                  <button
                    onClick={() => handleTabSwitch("select")}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  >
                    ⚔️ Chọn Cấp Độ Ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Header Status Bar */}
                  <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-[#111625] border border-slate-800 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                        {activeInstance.instanceId}
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs uppercase">
                        Độ Khó: {activeInstance.difficulty.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300 px-3 py-1 rounded-lg bg-amber-950/30 border border-amber-600/30">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Thời Gian: {formatSeconds(elapsedSeconds)}</span>
                    </div>
                  </div>

                  {/* 3-Room Visual Stepper */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        room: 1,
                        name: "Phòng 1: Tiền Đồn",
                        mobs: "Bầy Slime & Goblin",
                      },
                      {
                        room: 2,
                        name: "Phòng 2: Hẻm Tinh Anh",
                        mobs: "Chiến Binh Orc & Kỵ Sĩ",
                      },
                      {
                        room: 3,
                        name: "Phòng 3: Điện Hắc Long",
                        mobs: "Boss Hắc Long Vương",
                      },
                    ].map((step) => {
                      const isCleared = activeInstance.currentRoom > step.room;
                      const isCurrent = activeInstance.currentRoom === step.room;

                      return (
                        <div
                          key={step.room}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                            isCleared
                              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                              : isCurrent
                              ? "bg-cyan-950/30 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] text-white"
                              : "bg-slate-900/40 border-slate-800 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold">PHÒNG {step.room}</span>
                            {isCleared ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                            ) : (
                              <span className="text-[10px] font-mono opacity-60">KHÓA</span>
                            )}
                          </div>
                          <div className="font-bold text-xs text-white mb-1">{step.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{step.mobs}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Active Room Details & Monster Tracking */}
                  <div className="p-5 rounded-2xl bg-[#111625] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sword className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-black text-white uppercase">
                          {activeInstance.roomDetails?.name || `Phòng ${activeInstance.currentRoom}`}
                        </h3>
                      </div>
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold">
                        Quái vật còn lại: {activeInstance.monstersRemaining ?? 0}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                      {activeInstance.roomDetails?.description || "Dọn sạch quái vật trong phòng để giải trừ phong ấn cổng dịch chuyển tiếp theo."}
                    </p>

                    {/* Monsters in Room Status */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                        <span className="flex items-center gap-2">
                          <Skull className="w-4 h-4 text-rose-400" />
                          Tiến Độ Dọn Quái Phòng {activeInstance.currentRoom}:
                        </span>
                        <span className="font-mono text-cyan-300">
                          {activeInstance.monstersRemaining === 0 ? "100% ĐÃ DỌN SẠCH" : `Còn ${activeInstance.monstersRemaining} quái`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                100 - ((activeInstance.monstersRemaining ?? 0) / (activeInstance.roomDetails?.monstersCount || 4)) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Monster simulated attack interaction */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-[11px] text-slate-400">
                          Hạ gục quái vật trong không gian 2.5D hoặc dọn nhanh để mở phong ấn:
                        </span>
                        {(activeInstance.monstersRemaining ?? 0) > 0 && (
                          <button
                            onClick={handleAttackMonster}
                            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Sword className="w-3.5 h-3.5" />
                            <span>Trảm Quái (-1)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Room Progression Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <button
                        onClick={handleLeaveDungeon}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-600/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Rời Phó Bản (Về Làng)</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          Ẩn Giao Diện (Vào Map)
                        </button>

                        <button
                          onClick={handleClearRoom}
                          disabled={isProgressing}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-rose-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isProgressing ? (
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Đang Mở Phong Ấn...
                            </span>
                          ) : activeInstance.currentRoom < activeInstance.totalRooms ? (
                            <span className="flex items-center gap-2">
                              <span>🔓 DỌN PHÒNG & TIẾN VÀO PHÒNG {activeInstance.currentRoom + 1}</span>
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-amber-300" />
                              <span>🐉 HẠ GỤC HẮC LONG & HOÀN TẤT PHÓ BẢN</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: SPEEDRUN LEADERBOARD */}
          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              {/* Leaderboard Controls */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {(["all", "normal", "hard", "nightmare"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setLeaderboardFilter(filter);
                        fetchLeaderboard(filter);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                        leaderboardFilter === filter
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter === "all" ? "Tất Cả" : filter}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchLeaderboard(leaderboardFilter)}
                  disabled={leaderboardLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${leaderboardLoading ? "animate-spin" : ""}`} />
                  <span>Làm Mới</span>
                </button>
              </div>

              {/* Leaderboard List */}
              {leaderboardLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-cyan-400" />
                  <span className="text-xs">Đang tải bảng vinh danh phó bản...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có kỷ lục nào được ghi nhận.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, idx) => {
                    const isTop1 = entry.rank === 1 || idx === 0;
                    const isTop2 = entry.rank === 2 || idx === 1;
                    const isTop3 = entry.rank === 3 || idx === 2;
                    const isSelf = entry.characterName === playerName;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                          isTop1
                            ? "bg-amber-950/25 border-amber-500/40 text-amber-200"
                            : isTop2
                            ? "bg-slate-800/40 border-slate-600/40 text-slate-200"
                            : isTop3
                            ? "bg-amber-900/20 border-amber-700/40 text-amber-300"
                            : "bg-slate-900/50 border-slate-800 text-slate-300"
                        } ${isSelf ? "ring-1 ring-cyan-400" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                              isTop1
                                ? "bg-amber-400 text-black shadow-[0_0_10px_#f59e0b]"
                                : isTop2
                                ? "bg-slate-300 text-black"
                                : isTop3
                                ? "bg-amber-700 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            #{entry.rank || idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-2">
                              <span>{entry.characterName}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 font-mono font-bold">
                                  BẠN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              Độ khó:{" "}
                              <span
                                className={
                                  entry.difficulty === "nightmare"
                                    ? "text-rose-400 font-bold"
                                    : entry.difficulty === "hard"
                                    ? "text-purple-400 font-bold"
                                    : "text-cyan-400 font-bold"
                                }
                              >
                                {entry.difficulty.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono font-black text-sm text-cyan-300">
                              {entry.clearTimeSeconds}s
                            </div>
                            <div className="text-[10px] text-slate-400">Thời gian vượt ải</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* VICTORY MODAL OVERLAY (CHINH PHỤC THÀNH CÔNG) */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {victoryData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-lg bg-[#0f1422] border-2 border-amber-500/60 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                <Crown className="w-10 h-10 animate-bounce" />
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                🎉 CHINH PHỤC PHÓ BẢN THÀNH CÔNG!
              </h2>
              <p className="text-xs text-amber-300 font-mono mb-4">
                ⏱️ Thời gian vượt ải: {victoryData.clearTimeSeconds} giây — Kỷ lục đã được ghi danh!
              </p>

              {/* Reward Cards */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300">
                  <Sparkles className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                  <div className="font-black text-sm">+{victoryData.rewards.exp}</div>
                  <div className="text-[10px] text-slate-400">Kinh Nghiệm</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300">
                  <Coins className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <div className="font-black text-sm">+{victoryData.rewards.gold}</div>
                  <div className="text-[10px] text-slate-400">Vàng</div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300">
                  <Award className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                  <div className="font-black text-sm">+{victoryData.rewards.stones}</div>
                  <div className="text-[10px] text-slate-400">Đá Cường Hóa</div>
                </div>
              </div>

              {/* Items Dropped */}
              {victoryData.rewards.items && victoryData.rewards.items.length > 0 && (
                <div className="mb-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                    Vật Phẩm Rơi Của Boss:
                  </span>
                  {victoryData.rewards.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#111625] border border-amber-500/30 font-bold text-amber-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">x{item.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Victory Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setVictoryData(null);
                    handleTabSwitch("leaderboard");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  🏆 Xem Bảng Xếp Hạng
                </button>

                <button
                  onClick={() => {
                    setVictoryData(null);
                    handleLeaveDungeon();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                >
                  🛡️ Nhận Thưởng & Về Làng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default DungeonSelectModal;
