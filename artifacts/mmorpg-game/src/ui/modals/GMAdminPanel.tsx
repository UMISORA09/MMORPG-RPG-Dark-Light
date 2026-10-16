import { memo, useState } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
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

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isGMAdminOpen) toggleGMAdmin();
    if (activeModal === "gmAdmin") closeActiveModal();
  };

  const showFeedback = (text: string) => {
    setStatusFeedback(text);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  // 1. Thêm 10 cấp độ & 50 điểm tiềm năng
  const handleAddLevels = async () => {
    setLoadingAction("add_levels");
    try {
      setUnallocatedStatPoints(unallocatedStatPoints + 50);
      healPlayer(9999);
      addFloatingText("⚡ +10 CẤP & +50 ĐIỂM TIỀM NĂNG!", playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#38bdf8");
      playCombatSFX("level_up_fanfare", 0.6);
      showFeedback("Đã cấp +10 Cấp và 50 Điểm Tiềm Năng vào nhân vật!");

      // Call API server
      await fetch("/api/characters/1/gm/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_levels" }),
      }).catch(() => {});
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

      await fetch("/api/characters/1/gm/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_gold_stones" }),
      }).catch(() => {});
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

      await fetch("/api/characters/1/gm/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spawn_legendary" }),
      }).catch(() => {});
    } finally {
      setLoadingAction(null);
    }
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

      await fetch("/api/characters/1/gm/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enhance_max" }),
      }).catch(() => {});
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
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
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

