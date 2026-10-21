import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { WORLD_100_MAPS, getMapById } from "@/world/WorldMapRegistry";
import * as THREE from "three";
import {
  X,
  Shield,
  Zap,
  Coins,
  Sparkles,
  Flame,
  CloudSun,
  Crown,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Terminal,
  MapPin,
  Rocket,
  Gift,
} from "lucide-react";

export const GMAdminPanel = memo(function GMAdminPanel() {
  const isGMAdminOpen = useGameWorldStore((s) => s.isGMAdminOpen);
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const toggleGMAdmin = useGameWorldStore((s) => s.toggleGMAdmin);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);

  const isOpen = isGMAdminOpen || activeModal === "gmAdmin";

  const godMode = useGameWorldStore((s) => s.godMode);
  const toggleGodMode = useGameWorldStore((s) => s.toggleGodMode);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const addGold = useGameWorldStore((s) => s.addGold);
  const healPlayer = useGameWorldStore((s) => s.healPlayer);
  const setHighestEnhanceLevel = useGameWorldStore((s) => s.setHighestEnhanceLevel);
  const weather = useGameWorldStore((s) => s.weather);
  const setWeather = useGameWorldStore((s) => s.setWeather);
  const spawnLoot = useGameWorldStore((s) => s.spawnLoot);
  const setUnallocatedStatPoints = useGameWorldStore((s) => s.setUnallocatedStatPoints);
  const unallocatedStatPoints = useGameWorldStore((s) => s.unallocatedStatPoints);
  const setZone = useGameWorldStore((s) => s.setZone);
  const activeCharId = useGameWorldStore((s) => (s as any).characterId || (s as any).activeCharacterId || 1);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [selectedMapId, setSelectedMapId] = useState<string>("MAP_036");

  if (!isOpen) return null;

  const handleClose = () => {
    if (isGMAdminOpen) toggleGMAdmin();
    if (activeModal === "gmAdmin") closeActiveModal();
  };

  const showFeedback = (text: string) => {
    setStatusFeedback(text);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const callGMAction = async (action: string, payload: any = {}) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clb_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/characters/${activeCharId}/gm/action`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.character) {
        useGameWorldStore.getState().syncFromBackendCharacter(data.character);
      }
      return { ok: res.ok, data };
    } catch (err: any) {
      return { ok: false, data: { error: err?.message || "Lỗi kết nối máy chủ GM" } };
    }
  };

  // Set direct Level 500 or 999
  const handleSetTargetLevel = async (targetLevel: number) => {
    setLoadingAction(`set_level_${targetLevel}`);
    try {
      const currentLv = useGameWorldStore.getState().playerLevel;
      const lvDiff = Math.max(0, targetLevel - currentLv);
      const bonusStats = lvDiff * 5;
      const bonusSkill = lvDiff * 1;
      const newStatPoints = unallocatedStatPoints + bonusStats;

      // Tính toán trực tiếp chỉ số cơ bản tương ứng với cấp độ mới
      const levelOffset = Math.max(0, targetLevel - 1);
      const addedHp = levelOffset * 35;
      const addedMp = levelOffset * 15;
      const addedAtk = levelOffset * 4;
      const addedDef = levelOffset * 2;
      const addedSpd = Math.floor(levelOffset * 0.5);
      const baseMaxHp = 120 + addedHp;
      const baseMaxMp = 65 + addedMp;

      useGameWorldStore.setState((s) => ({
        playerLevel: targetLevel,
        playerExp: 0,
        playerExpToNext: 99999999,
        playerSkillPoints: (s.playerSkillPoints || 0) + bonusSkill,
        unallocatedStatPoints: newStatPoints,
        playerMaxHealth: Math.max(s.playerMaxHealth, baseMaxHp),
        playerHealth: Math.max(s.playerMaxHealth, baseMaxHp),
        playerMaxPp: Math.max(s.playerMaxPp, baseMaxMp),
        playerPp: Math.max(s.playerMaxPp, baseMaxMp),
        playerAtk: s.playerAtk + addedAtk,
        playerDef: s.playerDef + addedDef,
        playerSpd: s.playerSpd + addedSpd,
      }));

      playCombatSFX("level_up_fanfare", 0.85);
      addFloatingText(
        `⭐ THĂNG CẤP THẦN THOẠI LV.${targetLevel}! (+⭐${bonusStats} Điểm Tiềm Năng)`,
        playerPosition.clone().add(new THREE.Vector3(0, 3.0, 0)),
        "#eab308"
      );
      showFeedback(`Nhân vật đã thăng cấp trực tiếp lên Lv.${targetLevel} (+⭐${bonusStats} Điểm Tiềm Năng & Tăng Vọt Chỉ Số Chiến Đấu)!`);

      const { ok, data } = await callGMAction("set_level", { level: targetLevel });
      if (!ok) {
        showFeedback(data.error || "Lệnh GM bị từ chối: Yêu cầu quyền Quản trị viên (GM/Admin)!");
        return;
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleWarpTo100Map = (mapId: string) => {
    const targetMap = getMapById(mapId);
    useGameWorldStore.getState().triggerZoneTransition(`DỊCH CHUYỂN: ${targetMap.name}`, () => {
      useGameWorldStore.setState({
        currentZone: mapId as any,
        playerPosition: new THREE.Vector3(0, 0, 0),
        zoneNotification: `🗺️ [GM WARP] Đã đến: ${targetMap.name} (${targetMap.biomeName})`,
        zoneNotificationTimer: 4.5,
      });
    });
    playCombatSFX("teleport", 0.6);
    showFeedback(`Đã dịch chuyển tức thời đến: ${targetMap.name}!`);
  };

  // 1. Thêm 10 cấp độ & 50 điểm tiềm năng
  const handleAddLevels = async () => {
    setLoadingAction("add_levels");
    try {
      const currentLv = useGameWorldStore.getState().playerLevel;
      const targetLevel = Math.min(999, currentLv + 10);
      const bonusStats = 50;
      const bonusSkill = 10;
      const newStatPoints = unallocatedStatPoints + bonusStats;

      const addedHp = 10 * 35;
      const addedMp = 10 * 15;
      const addedAtk = 10 * 4;
      const addedDef = 10 * 2;
      const addedSpd = 5;

      useGameWorldStore.setState((s) => ({
        playerLevel: targetLevel,
        playerSkillPoints: (s.playerSkillPoints || 0) + bonusSkill,
        unallocatedStatPoints: newStatPoints,
        playerMaxHealth: s.playerMaxHealth + addedHp,
        playerHealth: s.playerMaxHealth + addedHp,
        playerMaxPp: s.playerMaxPp + addedMp,
        playerPp: s.playerMaxPp + addedMp,
        playerAtk: s.playerAtk + addedAtk,
        playerDef: s.playerDef + addedDef,
        playerSpd: s.playerSpd + addedSpd,
      }));

      playCombatSFX("level_up_fanfare", 0.6);
      addFloatingText("⚡ +10 CẤP & +50 ĐIỂM TIỀM NĂNG!", playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#38bdf8");
      showFeedback(`Đã cấp +10 Cấp (Hiện tại Lv.${targetLevel}) và 50 Điểm Tiềm Năng!`);

      const { ok, data } = await callGMAction("add_levels");
      if (!ok) {
        showFeedback(data.error || "Lệnh GM bị từ chối: Yêu cầu quyền Quản trị viên (GM/Admin)!");
        return;
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Nhận 50,000 Vàng & 10 Đá Cường Hóa
  const handleAddGoldAndStones = async () => {
    setLoadingAction("add_gold");
    try {
      addGold(50000);
      playCombatSFX("coin_chime", 0.5);
      addFloatingText("🪙 +50,000 VÀNG & ĐÁ CƯỜNG HÓA!", playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#f59e0b");
      showFeedback("Đã cấp +50,000 Vàng vào tài khoản!");

      const { ok, data: errData } = await callGMAction("add_gold_stones");
      const gmRes = { ok, json: async () => errData };
      if (gmRes && !gmRes.ok) {
        const errData = await gmRes.json().catch(() => ({}));
        showFeedback(errData.error || "Lệnh GM bị từ chối: Yêu cầu quyền Quản trị viên (GM/Admin)!");
        return;
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Rơi Rương Huyền Thoại & Đồ Hoàng Kim
  const handleSpawnLegendary = async () => {
    setLoadingAction("legendary");
    try {
      playCombatSFX("level_up_fanfare", 0.5);
      spawnLoot([
        {
          id: `gm-loot-${Date.now()}-1`,
          itemId: "gear_dragon_sword_legendary",
          name: "Long Kiếm Hoàng Kim Thần Binh",
          type: "weapon",
          rarity: "legendary",
          position: [playerPosition.x + 1.5, playerPosition.y + 0.5, playerPosition.z + 1],
          velocity: [0, 1.5, 0],
          value: 5000,
          icon: "⚔️",
          color: "#ffaa00",
          statText: "ATK +120, HP +500",
          bounceCount: 0,
          isGrounded: true,
          lifetime: 90,
        },
        {
          id: `gm-loot-${Date.now()}-2`,
          itemId: "gear_dragon_ring_legendary",
          name: "Nhẫn Long Thần Tối Thượng",
          type: "accessory",
          rarity: "legendary",
          position: [playerPosition.x - 1.5, playerPosition.y + 0.5, playerPosition.z + 1.2],
          velocity: [0, 1.5, 0],
          value: 2500,
          icon: "💍",
          color: "#ffaa00",
          statText: "ATK +60, Crit +10%",
          bounceCount: 0,
          isGrounded: true,
          lifetime: 90,
        },
      ]);
      addFloatingText("🎁 RƯƠNG HOÀNG KIM ĐÃ RƠI DƯỚI CHÂN!", playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#ffaa00");
      showFeedback("Rương Thần Binh Hoàng Kim đã xuất hiện ngay cạnh bạn!");

      const { ok, data: errData } = await callGMAction("spawn_legendary");
      const gmRes = { ok, json: async () => errData };
      if (gmRes && !gmRes.ok) {
        const errData = await gmRes.json().catch(() => ({}));
        showFeedback(errData.error || "Lệnh GM bị từ chối: Yêu cầu quyền Quản trị viên (GM/Admin)!");
        return;
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Triệu hồi Rương Kho Báu Tự Sinh (Dynamic Respawing Treasure Chest)
  const handleSpawnDynamicChest = (tier: "GOLDEN" | "MIRACLE_CHEST" = "GOLDEN") => {
    useGameWorldStore.getState().spawnGMTestChest(tier);
    showFeedback(
      tier === "MIRACLE_CHEST"
        ? "✨ Đã triệu hồi Rương Thần Tích Hư Không (10 Món Kì Tích Cực Phẩm) trước mặt!"
        : "🎁 Đã triệu hồi Rương Hoàng Kim Long Tộc (8-9 Món Theo Cấp) trước mặt!"
    );
  };


  // 4. Triệu hồi Hỏa Long Ma Thần (World Boss)
  const handleSummonBoss = () => {
    useGameWorldStore.setState({
      bossActive: true,
      bossName: "HỎA LONG MA THẦN (WORLD BOSS CẤP 50)",
      bossHealth: 6000,
      bossMaxHealth: 6000,
      bossPhase: 2,
      currentZone: "BOSS_ALTAR",
      zoneNotification: "🔥 CẢNH BÁO: HỎA LONG MA THẦN ĐÃ GIÁNG LÂM!",
      zoneNotificationTimer: 6.0,
    });
    playCombatSFX("dragon_roar", 0.7);
    addFloatingText("🐉 HỎA LONG MA THẦN ĐÃ XUẤT HIỆN!", playerPosition.clone().add(new THREE.Vector3(0, 2.8, 0)), "#ef4444");
    showFeedback("Đã triệu hồi World Boss giai đoạn cuồng bạo!");
  };

  // 5. Bất tử (God Mode Toggle)
  const handleToggleGodMode = () => {
    toggleGodMode();
    healPlayer(9999);
    playCombatSFX("holy_bell", 0.4);
    showFeedback(!godMode ? "Đã KÍCH HOẠT God Mode (Bất tử + Vô hạn HP)!" : "Đã TẮT God Mode!");
  };

  // 6. Đổi thời tiết tức thì
  const weatherList: Array<"SUNNY" | "RAIN" | "BLOOD_MOON"> = ["SUNNY", "RAIN", "BLOOD_MOON"];
  const handleCycleWeather = () => {
    const currentIndex = weatherList.indexOf(weather as any);
    const nextIndex = (currentIndex + 1) % weatherList.length;
    const nextWeather = weatherList[nextIndex];
    setWeather(nextWeather);
    playCombatSFX("laser_pew", 0.2);

    const labels: Record<string, string> = {
      SUNNY: "Nắng Ráo Thần Thoại",
      RAIN: "Mưa Giông Sấm Sét",
      BLOOD_MOON: "Huyết Nguyệt Cuồng Bạo",
    };
    addFloatingText(`🌦️ Thời tiết: ${labels[nextWeather]}`, playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#38bdf8");
    showFeedback(`Thời tiết chuyển sang: ${labels[nextWeather]}`);
  };

  // 7. Vũ khí cường hóa +15 (Rồng Lửa Cháy Rực)
  const handleEnhanceMax = async () => {
    setLoadingAction("enhance_max");
    try {
      setHighestEnhanceLevel(15);
      playCombatSFX("holy_bell", 0.6);
      addFloatingText("🔥 VŨ KHÍ CƯỜNG HÓA +15 (RỒNG LỬA TỐI THƯỢNG)!", playerPosition.clone().add(new THREE.Vector3(0, 2.8, 0)), "#ffaa00");
      showFeedback("Vũ khí đã đạt +15 Thần Cấp, kích hoạt Aura Rồng Lửa!");

      const gmRes = await fetch(`/api/characters/${activeCharId}/gm/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enhance_max" }),
      }).catch(() => null);
      if (gmRes && !gmRes.ok) {
        const errData = await gmRes.json().catch(() => ({}));
        showFeedback(errData.error || "Lệnh GM bị từ chối: Yêu cầu quyền Quản trị viên (GM/Admin)!");
        return;
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Fast Teleport
  const handleTeleport = (x: number, z: number, zoneName: string) => {
    playerPosition.set(x, 0, z);
    setZone("SAFE_VILLAGE", `📍 Dịch chuyển tức thời đến: ${zoneName}`);
    playCombatSFX("holy_bell", 0.4);
    addFloatingText(`📍 Đến: ${zoneName}`, playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#a855f7");
    showFeedback(`Đã dịch chuyển đến ${zoneName}!`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in duration-200 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-[780px] bg-[#0c0507]/95 border-2 border-rose-500/70 rounded-[28px] overflow-hidden shadow-[0_0_80px_rgba(244,63,94,0.35),0_20px_50px_rgba(0,0,0,0.9)] flex flex-col backdrop-blur-2xl text-slate-100">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-rose-500/30 bg-gradient-to-r from-rose-950/80 via-black to-red-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <Crown className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                  👑 BẢNG ĐIỀU HÀNH GAME MASTER (GM CONSOLE)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-mono font-bold tracking-wider uppercase">
                  MASTER MODE
                </span>
              </div>
              <p className="text-xs text-rose-300/70 font-mono">
                Công cụ điều hành & quản trị kỹ thuật thế giới Chiến Long Bá
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Feedback Toast Banner */}
        {statusFeedback && (
          <div className="px-6 py-2 bg-rose-500/20 border-b border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[75vh]">
          
          {/* Section 1: 7 Core Instant Powers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> 7 Quyền Năng Thao Túng Toàn Cục Tức Thì
              </h3>
              <span className="text-[11px] font-mono text-slate-400">1-Click Fast Execution</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Tăng 10 Cấp & 50 Điểm */}
              <button
                onClick={handleAddLevels}
                disabled={loadingAction === "add_levels"}
                className="p-3.5 rounded-2xl bg-[#170a0e] hover:bg-[#251017] border border-rose-500/30 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                      +10 Cấp & 50 Điểm Tiềm Năng
                    </h4>
                    <p className="text-[11px] text-slate-400">Tăng cấp tức thì để phân bổ chỉ số</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>

              {/* 1.1 Lên Thẳng Lv.500 (Giai Đoạn Đại Dương & Atlantis) */}
              <button
                onClick={() => handleSetTargetLevel(500)}
                disabled={loadingAction === "set_level_500"}
                className="p-3.5 rounded-2xl bg-[#091e2b] hover:bg-[#0c2a3d] border border-cyan-500/40 hover:border-cyan-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-cyan-200 group-hover:text-cyan-100 transition-colors">
                      🚀 Lên Cấp Lv.500 (Đại Dương - Atlantis)
                    </h4>
                    <p className="text-[11px] text-cyan-400/70">+2500 Điểm Tiềm Năng & Hồi Đầy HP</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 1.2 Lên Thẳng Lv.999 (MAX Tối Thượng Thần Thoại) */}
              <button
                onClick={() => handleSetTargetLevel(999)}
                disabled={loadingAction === "set_level_999"}
                className="p-3.5 rounded-2xl bg-[#2a1306] hover:bg-[#381a08] border border-amber-500/50 hover:border-amber-400 transition flex items-center justify-between group cursor-pointer text-left shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 group-hover:text-amber-100 transition-colors">
                      👑 Lên Cấp Lv.999 (MAX TỐI THƯỢNG)
                    </h4>
                    <p className="text-[11px] text-amber-400/80">+4990 Điểm Tiềm Năng & Hồi Phục Thần Cấp</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 2. Nhận 50,000 Vàng & 10 Đá Cường Hóa */}
              <button
                onClick={handleAddGoldAndStones}
                disabled={loadingAction === "add_gold"}
                className="p-3.5 rounded-2xl bg-[#170a0e] hover:bg-[#251017] border border-rose-500/30 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                      +50,000 Vàng & 10 Đá Rèn
                    </h4>
                    <p className="text-[11px] text-slate-400">Bơm kinh tế để trải nghiệm Lò Rèn</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
              </button>

              {/* 3. Rơi Rương Huyền Thoại Hoàng Kim */}
              <button
                onClick={handleSpawnLegendary}
                disabled={loadingAction === "legendary"}
                className="p-3.5 rounded-2xl bg-[#170a0e] hover:bg-[#251017] border border-rose-500/30 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-orange-300 transition-colors">
                      Rơi Rương Thần Binh Hoàng Kim
                    </h4>
                    <p className="text-[11px] text-slate-400">Spawn trang bị Legendary Cam +7</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition" />
              </button>

              {/* 3.1 Spawn Ngay Rương Hoàng Kim Trước Mặt */}
              <button
                onClick={() => handleSpawnDynamicChest("GOLDEN")}
                className="p-3.5 rounded-2xl bg-[#231505] hover:bg-[#321e07] border border-amber-500/40 hover:border-amber-400 transition flex items-center justify-between group cursor-pointer text-left shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 group-hover:text-amber-100 transition-colors">
                      🎁 Spawn Rương Hoàng Kim (8-9 Món)
                    </h4>
                    <p className="text-[11px] text-amber-400/70">Rương 3D hào quang vàng, rơi đồ chuẩn theo Lv</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 3.2 Spawn Ngay Rương Kì Tích Hư Không Trước Mặt */}
              <button
                onClick={() => handleSpawnDynamicChest("MIRACLE_CHEST")}
                className="p-3.5 rounded-2xl bg-[#2a0822] hover:bg-[#3b0b30] border border-fuchsia-500/50 hover:border-fuchsia-400 transition flex items-center justify-between group cursor-pointer text-left shadow-[0_0_20px_rgba(217,70,239,0.25)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/60 flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-fuchsia-300 group-hover:text-fuchsia-100 transition-colors">
                      ✨ Spawn Rương Kì Tích (10 Món Siêu Cấp)
                    </h4>
                    <p className="text-[11px] text-fuchsia-400/80">Cột sáng chọc trời, 10 món Miracle cực hiếm</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-fuchsia-400 group-hover:translate-x-1 transition-transform" />
              </button>


              {/* 4. Triệu hồi Hỏa Long Ma Thần */}
              <button
                onClick={handleSummonBoss}
                className="p-3.5 rounded-2xl bg-[#170a0e] hover:bg-[#251017] border border-rose-500/30 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-rose-300 transition-colors">
                      Triệu Hồi Hỏa Long Ma Thần
                    </h4>
                    <p className="text-[11px] text-slate-400">Đánh thức World Boss Phase 2</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition" />
              </button>

              {/* 5. God Mode Toggle */}
              <button
                onClick={handleToggleGodMode}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between group cursor-pointer text-left ${
                  godMode
                    ? "bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "bg-[#170a0e] hover:bg-[#251017] border-rose-500/30 hover:border-rose-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                    godMode ? "bg-emerald-500/20 border-emerald-400 text-emerald-400" : "bg-rose-500/20 border-rose-400/40 text-rose-400"
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white">Bất Tử (God Mode)</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-black ${
                        godMode ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                      }`}>
                        {godMode ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Vô hạn HP, 0s hồi chiêu, bất tử chiến đấu</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              {/* 6. Đổi Thời Tiết Tức Thì */}
              <button
                onClick={handleCycleWeather}
                className="p-3.5 rounded-2xl bg-[#170a0e] hover:bg-[#251017] border border-rose-500/30 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <CloudSun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white group-hover:text-sky-300 transition-colors">
                        Đổi Thời Tiết Tức Thì
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300">
                        {weather}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Xoay vòng Nắng / Mưa / Tuyết / Tro Bụi</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
              </button>

              {/* 7. Vũ khí cường hóa +15 Rồng Lửa */}
              <button
                onClick={handleEnhanceMax}
                disabled={loadingAction === "enhance_max"}
                className="sm:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-red-950/40 to-amber-950/40 border border-amber-500/50 hover:border-amber-400 transition flex items-center justify-between group cursor-pointer text-left shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 group-hover:text-amber-200 transition-colors flex items-center gap-2">
                      ✨ Vũ Khí Cường Hóa +15 (Kích Hoạt Hào Quang Rồng Lửa Tối Thượng)
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Bật ngay bộ hiệu ứng hạt Dragon Fire Aura 3D quanh vũ khí nhân vật
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 8. Reset Toàn Bộ Dữ Liệu Tài Khoản */}
              <button
                onClick={async () => {
                  if (window.confirm("CẢNH BÁO GM: Bạn có chắc chắn muốn xóa toàn bộ tài khoản cũ và đưa Server về ban đầu?")) {
                    setLoadingAction("reset_all");
                    try {
                      await fetch("/api/admin/reset-database", { method: "POST" });
                      localStorage.clear();
                      sessionStorage.clear();
                      showFeedback("♻️ Đã xóa sạch toàn bộ tài khoản cũ!");
                      setTimeout(() => { window.location.href = "/"; }, 1200);
                    } catch {
                      localStorage.clear();
                      window.location.href = "/";
                    } finally {
                      setLoadingAction(null);
                    }
                  }
                }}
                disabled={loadingAction === "reset_all"}
                className="sm:col-span-2 p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/50 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-300">
                      🚨 Xóa Hết Tài Khoản Cũ & Đặt Lại Server (Wipe All Accounts)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Xóa sạch bảng users, characters, items trong database và dọn sạch bộ nhớ đệm
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>
          </div>

          {/* Section 2: Quick World Coordinates Teleport */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-purple-400" /> Dịch Chuyển Tức Thời Các Phân Khu (Fast Travel)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleTeleport(0, 0, "Làng Tân Thủ (Safe Zone)")}
                className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🏡 Làng Tân Thủ
              </button>
              <button
                onClick={() => handleTeleport(35, 20, "Rừng Nguyên Sinh")}
                className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🌲 Rừng Nguyên Sinh
              </button>
              <button
                onClick={() => handleTeleport(80, 60, "Vực Tử Thần & Lãnh Địa Boss")}
                className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🌋 Vực Tử Thần
              </button>
              <button
                onClick={() => {
                  useGameWorldStore.getState().setActiveModal("pvpArena");
                  handleClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-xs font-bold text-rose-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ⚔️ Đấu Trường 1v1
              </button>
            </div>
          </div>

          {/* Section 3: 100-Map Procedural Registry Teleport */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" /> 🗺️ Dịch Chuyển Tức Thời 100 Bản Đồ & Hầm Ngục (Lv.1 - Lv.999)
              </h3>
              <span className="text-[10px] font-mono text-cyan-400/80">Active Zone Culling 60 FPS</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <select
                value={selectedMapId}
                onChange={(e) => setSelectedMapId(e.target.value)}
                className="flex-1 bg-black/80 border border-cyan-500/50 rounded-xl px-3 py-2 text-xs font-medium text-cyan-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {WORLD_100_MAPS.map((map) => (
                  <option key={map.id} value={map.id} className="bg-slate-900 text-slate-100">
                    #{map.num.toString().padStart(3, "0")} • {map.name} [Lv.{map.recommendedLevel[0]}-{map.recommendedLevel[1]} | {map.biomeName}] {map.isDungeon ? "🏰 [DUNGEON]" : ""}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  handleWarpTo100Map(selectedMapId);
                  handleClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer shrink-0 transition"
              >
                <Rocket className="w-3.5 h-3.5" />
                Dịch Chuyển Ngay
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rose-500/30 bg-black/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold">F12</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold">ESC</kbd> để đóng GM Panel</span>
          <span className="text-rose-400 font-bold">CHIẾN LONG BÁ • REALM OF LEGENDS MMORPG</span>
        </div>

      </div>
    </div>
  );
});

