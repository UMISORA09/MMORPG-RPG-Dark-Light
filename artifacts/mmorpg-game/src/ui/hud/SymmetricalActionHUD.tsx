// ==============================================================================
// Korean MMORPG Symmetrical Action HUD
// 1. Center Golden Totem Emblem, Diamond Level & Blazing Emerald Fever / Fury Mode
// 2. Dual Wing Gauges (Left MP Blue Glass, Right HP Red Blood Glass)
// 3. Left 2x5 Combat Skill Slots (Q, W, E, R, T / 6, 7, 8, 9, 10) with Cooldown Radial Sweeps
// 4. Right 2x5 Quick Consumables (1-5 Potions & Buffs, 6-8 Food, 9-10 Level Locked Slots)
// 5. Master EXP Bar with 10 Gold-Segmented Partitions & Shimmer Animation
// ==============================================================================

import { memo, useState, useEffect } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/game/useGameStore";
import { getCharacterBlueprint } from "@/skills";
import { 
  Swords, 
  Wind, 
  Sparkles, 
  Lock, 
  Unlock, 
  Settings, 
  Flame, 
  Shield, 
  Compass, 
  ChevronUp, 
  ChevronDown,
  Zap
} from "lucide-react";

export const SymmetricalActionHUD = memo(function SymmetricalActionHUD() {
  // Store bindings
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const playerPp = useGameWorldStore((s) => s.playerPp);
  const playerMaxPp = useGameWorldStore((s) => s.playerMaxPp);
  const playerExp = useGameWorldStore((s) => s.playerExp);
  const playerExpToNext = useGameWorldStore((s) => s.playerExpToNext);
  const comboIndex = useGameWorldStore((s) => s.comboIndex);
  const comboTimer = useGameWorldStore((s) => s.comboTimer);
  const skillCooldowns = useGameWorldStore((s) => s.skillCooldowns);

  // Fever / Quick Consumables
  const feverGauge = useGameWorldStore((s) => s.feverGauge);
  const feverActive = useGameWorldStore((s) => s.feverActive);
  const feverTimer = useGameWorldStore((s) => s.feverTimer);
  const shieldAmount = useGameWorldStore((s) => s.shieldAmount);
  const atkBuffTimer = useGameWorldStore((s) => s.atkBuffTimer);

  const potionCountHp = useGameWorldStore((s) => s.potionCountHp);
  const potionCountMp = useGameWorldStore((s) => s.potionCountMp);
  const buffScrollAtkCount = useGameWorldStore((s) => s.buffScrollAtkCount);
  const teleportCompassCount = useGameWorldStore((s) => s.teleportCompassCount);
  const shieldScrollCount = useGameWorldStore((s) => s.shieldScrollCount);
  const foodMeatCount = useGameWorldStore((s) => s.foodMeatCount);
  const foodSoupCount = useGameWorldStore((s) => s.foodSoupCount);
  const speedPotionCount = useGameWorldStore((s) => s.speedPotionCount);

  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const triggerSkill = useGameWorldStore((s) => s.triggerSkill);
  const activateFever = useGameWorldStore((s) => s.activateFever);

  const useQuickPotionHp = useGameWorldStore((s) => s.useQuickPotionHp);
  const useQuickPotionMp = useGameWorldStore((s) => s.useQuickPotionMp);
  const useQuickAtkBuff = useGameWorldStore((s) => s.useQuickAtkBuff);
  const useQuickTeleport = useGameWorldStore((s) => s.useQuickTeleport);
  const useQuickShield = useGameWorldStore((s) => s.useQuickShield);
  const useQuickFood = useGameWorldStore((s) => s.useQuickFood);

  const [skillPage, setSkillPage] = useState(1);
  const [isLocked, setIsLocked] = useState(false);

  // Skill Specs from blueprint
  const blueprint = getCharacterBlueprint(playerClassId);
  const skills = blueprint.skills;
  const skill1Spec = skills[0];
  const skill2Spec = skills[1];
  const skill3Spec = skills[2];

  const cd1 = skillCooldowns.skill1 || 0;
  const cd2 = skillCooldowns.skill2 || 0;
  const cd3 = skillCooldowns.skill3 || 0;

  const maxCd1 = skill1Spec?.cooldown || 4.0;
  const maxCd2 = skill2Spec?.cooldown || 6.0;
  const maxCd3 = skill3Spec?.cooldown || 12.0;

  // Percentage calculations
  const hpPct = Math.max(0, Math.min(1, playerHealth / Math.max(1, playerMaxHealth)));
  const mpPct = Math.max(0, Math.min(1, playerPp / Math.max(1, playerMaxPp)));
  const expPct = playerExpToNext > 0 ? Math.min(100, (playerExp / playerExpToNext) * 100) : 0;

  // Delayed white damage bar for HP
  const [delayedHpPct, setDelayedHpPct] = useState(hpPct);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedHpPct(hpPct);
    }, 450);
    return () => clearTimeout(timer);
  }, [hpPct]);

  // Render Cooldown Overlay with Conic Radial Sweep
  const renderCooldownOverlay = (cd: number, maxCd: number) => {
    if (cd <= 0.05) return null;
    const pct = Math.min(1.0, cd / maxCd);
    const deg = pct * 360;

    return (
      <div
        className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none z-20"
        style={{
          background: `conic-gradient(from 0deg, rgba(5, 5, 15, 0.88) ${deg}deg, transparent ${deg}deg)`,
        }}
      >
        <span className="font-mono text-xs sm:text-sm font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
          {Math.ceil(cd)}s
        </span>
      </div>
    );
  };

  return (
    <div
      className="pointer-events-auto flex flex-col items-center select-none font-sans w-full max-w-4xl mx-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Top Floating Notification (Combo chain / Buff status) ── */}
      <div className="flex items-center gap-3 mb-1.5">
        {/* Combo Chain Badge */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#080c18]/90 border border-amber-500/40 backdrop-blur-md shadow-md text-[10px] font-mono">
          <span className="text-amber-400 font-bold">COMBO:</span>
          {[
            { step: 0, label: `1. ${blueprint.comboAttacks[0]?.name.split(" ")[0] || "Đòn 1"}` },
            { step: 1, label: `2. ${blueprint.comboAttacks[1]?.name.split(" ")[0] || "Đòn 2"}` },
            { step: 2, label: `3. ${blueprint.comboAttacks[2]?.name.split(" ")[0] || "Đòn 3"}` },
          ].map(({ step, label }, idx) => {
            const isActive = comboTimer > 0 && comboIndex === step;
            const isPassed = comboTimer > 0 && comboIndex > step;
            return (
              <span key={step} className="flex items-center gap-1">
                <span
                  className={`px-1.5 py-0.2 rounded font-bold transition-all ${
                    isActive
                      ? "bg-amber-400 text-black shadow-[0_0_8px_#f59e0b] scale-105"
                      : isPassed
                      ? "text-amber-300"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
                {idx < 2 && <span className="text-slate-400">›</span>}
              </span>
            );
          })}
        </div>

        {/* ATK Buff active banner */}
        {atkBuffTimer > 0 && (
          <div className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-400 text-[10px] font-mono font-bold text-amber-300 animate-pulse flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> +25% ATK ({Math.ceil(atkBuffTimer)}s)
          </div>
        )}

        {/* Shield active banner */}
        {shieldAmount > 0 && (
          <div className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" /> Giáp Ảo ({shieldAmount})
          </div>
        )}
      </div>

      {/* ── Main Dual Wing Gauges & Center Totem Structure ── */}
      <div className="relative w-full flex items-end justify-center">
        
        {/* ==================================================================== */}
        {/* 1. LEFT WING: MP / NĂNG LƯỢNG GAUGE (Vát chéo về bên trái)           */}
        {/* ==================================================================== */}
        <div className="flex-1 flex flex-col items-end pr-3 z-10">
          <div className="w-full max-w-[270px] relative">
            
            {/* Wing Gauge Label & Numerics */}
            <div className="flex justify-between items-center text-[10px] font-mono font-black text-cyan-300 px-2 mb-0.5 drop-shadow">
              <span>NĂNG LƯỢNG (MP)</span>
              <span>{Math.round(playerPp)} / {playerMaxPp}</span>
            </div>

            {/* Wing Beveled Glass Tube Container */}
            <div
              className="w-full h-5.5 rounded-l-2xl rounded-r-sm p-0.5 bg-[#050b18] border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(0,180,255,0.35)] relative overflow-hidden"
              style={{
                clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
              }}
            >
              {/* Mana Fill (right to left effect) */}
              <div
                className="h-full rounded-l-xl transition-all duration-200"
                style={{
                  width: `${mpPct * 100}%`,
                  background: "linear-gradient(90deg, #1e3a8a 0%, #0284c7 40%, #00b4ff 80%, #a5f3fc 100%)",
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 0 12px rgba(0,180,255,0.7)",
                }}
              />
              {/* Glossy sheen line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/30 rounded-t-full pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. CENTER TOTEM: PHÙ ĐIÊU MẶT NẠ CHIẾN THẦN & FEVER MODE             */}
        {/* ==================================================================== */}
        <div
          onClick={activateFever}
          className="relative shrink-0 -mb-2 z-20 cursor-pointer group"
          title={
            feverActive
              ? `Cuồng Nộ Chiến Thần đang kích hoạt! (${Math.ceil(feverTimer)}s)`
              : feverGauge >= 100
              ? "Nộ Khí đã đầy 100%! Bấm chuột hoặc phím T để bùng nổ Cuồng Nộ"
              : `Nộ Khí: ${Math.round(feverGauge)}% (Tích lũy khi tấn công)`
          }
        >
          {/* Circular Fever Energy Gauge Ring Around Totem */}
          <div
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1.5 flex items-center justify-center transition-all ${
              feverActive
                ? "bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-950 shadow-[0_0_25px_#00ff88] scale-105"
                : feverGauge >= 100
                ? "bg-gradient-to-b from-amber-400 via-orange-500 to-amber-950 shadow-[0_0_20px_#f59e0b] animate-pulse"
                : "bg-gradient-to-b from-[#2a1e0b] via-[#1a140a] to-[#0a0703] border-2 border-amber-600/60"
            }`}
          >
            {/* Center Golden War-God Totem Mask */}
            <div className="w-full h-full rounded-full bg-[#120b1f] border-2 border-amber-300/80 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              
              {/* Diamond Level Badge at Top Forehead */}
              <div className="absolute -top-1 w-6 h-6 rounded-sm bg-[#090514] border border-amber-400 rotate-45 flex items-center justify-center shadow-md z-10">
                <span className="-rotate-45 font-mono text-[9px] font-black text-amber-300">
                  {playerLevel}
                </span>
              </div>

              {/* Totem Face: 2 Glowing Eyes & Carved Emblem */}
              <div className="flex items-center gap-3 mt-2">
                <div
                  className={`w-2.5 h-2 rounded-full transition-all ${
                    feverActive
                      ? "bg-emerald-300 shadow-[0_0_10px_#00ff88] animate-ping"
                      : "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                  }`}
                />
                <div
                  className={`w-2.5 h-2 rounded-full transition-all ${
                    feverActive
                      ? "bg-emerald-300 shadow-[0_0_10px_#00ff88] animate-ping"
                      : "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                  }`}
                />
              </div>

              {/* Totem Mouth / Emblem */}
              <span className="text-xl sm:text-2xl mt-0.5 select-none drop-shadow">
                {feverActive ? "🐲" : "👺"}
              </span>

              {/* 8 Emerald Gem studs around mask */}
              <div className="absolute inset-1 pointer-events-none">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <div
                    key={angle}
                    className={`absolute w-1.5 h-1.5 rounded-full transition-all ${
                      feverActive
                        ? "bg-emerald-400 shadow-[0_0_6px_#00ff88]"
                        : "bg-emerald-800"
                    }`}
                    style={{
                      top: `${50 - 45 * Math.cos((angle * Math.PI) / 180)}%`,
                      left: `${50 + 45 * Math.sin((angle * Math.PI) / 180)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. RIGHT WING: HP / SINH LỰC GAUGE (Vát chéo về bên phải)            */}
        {/* ==================================================================== */}
        <div className="flex-1 flex flex-col items-start pl-3 z-10">
          <div className="w-full max-w-[270px] relative">
            
            {/* Wing Gauge Label & Numerics + Quick Lock / Settings Icons */}
            <div className="flex justify-between items-center text-[10px] font-mono font-black text-rose-300 px-2 mb-0.5 drop-shadow">
              <span>{playerHealth} / {playerMaxHealth}</span>
              <div className="flex items-center gap-1.5">
                <span>SINH LỰC (HP)</span>
                {/* Lock icon */}
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  className="hover:text-white transition cursor-pointer"
                  title={isLocked ? "Đã khóa thanh kỹ năng" : "Mở khóa thanh kỹ năng"}
                >
                  {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                </button>
                {/* Settings icon */}
                <button
                  onClick={() => useGameWorldStore.getState().setActiveModal("settings")}
                  className="hover:text-white transition cursor-pointer"
                  title="Cài đặt nhanh"
                >
                  <Settings className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Wing Beveled Glass Tube Container */}
            <div
              className="w-full h-5.5 rounded-r-2xl rounded-l-sm p-0.5 bg-[#180507] border-2 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.35)] relative overflow-hidden"
              style={{
                clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0 100%)",
              }}
            >
              {/* Delayed White Damage Fill */}
              <div
                className="h-full bg-white/70 absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                style={{ width: `${delayedHpPct * 100}%` }}
              />

              {/* Main Red Blood Fill */}
              <div
                className="h-full rounded-r-xl transition-all duration-200 relative z-10"
                style={{
                  width: `${hpPct * 100}%`,
                  background: "linear-gradient(90deg, #7f1d1d 0%, #b91c1c 40%, #ef4444 80%, #fca5a5 100%)",
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 0 12px rgba(239,68,68,0.7)",
                }}
              />
              {/* Glossy sheen line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/30 rounded-t-full pointer-events-none z-20" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main 20 Slots Deck (Left 10 Skills, Right 10 Consumables) ── */}
      <div className="flex items-center justify-between w-full p-2 rounded-2xl bg-[#080d19]/95 border-2 border-[#1e293b] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] mt-1">
        
        {/* ==================================================================== */}
        {/* 4. LEFT 10 SLOTS: KỸ NĂNG CHIẾN ĐẤU (2 Hàng x 5 Cột)                */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-1.5">
          {/* Page Selector Arrow */}
          <div className="flex flex-col items-center justify-center pr-1 text-slate-400">
            <button
              onClick={() => setSkillPage(skillPage === 1 ? 2 : 1)}
              className="p-0.5 hover:text-cyan-400 transition cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] font-bold text-amber-400">{skillPage}</span>
            <button
              onClick={() => setSkillPage(skillPage === 1 ? 2 : 1)}
              className="p-0.5 hover:text-cyan-400 transition cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2x5 Grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {/* Row 1: J, 1/Q, 2/E, 3/R, T (Strictly conflict-free, WASD reserved for movement) */}
            {/* Slot 0: Basic Attack / Combo (J / Left Click) */}
            <button
              onClick={triggerComboAttack}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#1e1333] to-[#0f081d] border-2 border-amber-400/80 hover:border-amber-300 flex flex-col items-center justify-center transition cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95"
              title="Đánh thường / Combo 1-2-3 (Phím J hoặc Chuột Trái)"
            >
              <Swords className="w-5 h-5 text-amber-300 drop-shadow" />
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-amber-300">
                J
              </span>
            </button>

            {/* Slot 1: Skill 1 (1 / Q) */}
            <button
              disabled={cd1 > 0}
              onClick={() => triggerSkill(1)}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition border-2 overflow-hidden ${
                cd1 > 0
                  ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#181a38] to-[#0c0d24] border-cyan-400/80 hover:border-cyan-300 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
              }`}
              title={`${skill1Spec?.name || "Kỹ năng 1"} (Phím 1 hoặc Q)`}
            >
              {renderCooldownOverlay(cd1, maxCd1)}
              <span className="text-base select-none">⚡</span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-cyan-300">
                1/Q
              </span>
            </button>

            {/* Slot 2: Skill 2 (2 / E) */}
            <button
              disabled={cd2 > 0}
              onClick={() => triggerSkill(2)}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition border-2 overflow-hidden ${
                cd2 > 0
                  ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#261036] to-[#12051f] border-purple-400/80 hover:border-purple-300 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer"
              }`}
              title={`${skill2Spec?.name || "Kỹ năng 2"} (Phím 2 hoặc E)`}
            >
              {renderCooldownOverlay(cd2, maxCd2)}
              <span className="text-base select-none">🌪️</span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-purple-300">
                2/E
              </span>
            </button>

            {/* Slot 3: Skill 3 / Ult (3 / R) */}
            <button
              disabled={cd3 > 0}
              onClick={() => triggerSkill(3)}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition border-2 overflow-hidden ${
                cd3 > 0
                  ? "bg-[#140e21] border-slate-700 opacity-80 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#381119] to-[#1a050b] border-rose-500 hover:border-rose-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer"
              }`}
              title={`${skill3Spec?.name || "Tuyệt Kỹ"} (Phím 3 hoặc R)`}
            >
              {renderCooldownOverlay(cd3, maxCd3)}
              <Sparkles className="w-5 h-5 text-rose-400 drop-shadow" />
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-rose-300">
                3/R
              </span>
            </button>

            {/* Slot T: Ultimate / Fever Awakening */}
            <button
              onClick={activateFever}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition border-2 cursor-pointer ${
                feverActive
                  ? "bg-gradient-to-br from-emerald-600 to-teal-900 border-emerald-300 shadow-[0_0_15px_#00ff88] animate-pulse"
                  : "bg-gradient-to-br from-amber-600/40 to-slate-900 border-amber-500/60 hover:border-amber-400"
              }`}
              title="Cuồng Nộ Thức Tỉnh (Phím T)"
            >
              <Flame className={`w-5 h-5 ${feverActive ? "text-emerald-300 animate-spin" : "text-amber-400"}`} />
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-emerald-300">
                T
              </span>
            </button>

            {/* Row 2: 6, 7, 8, 9, 10 (Utility / Secondary Skills) */}
            {[
              { slot: "6", name: "Tật Phong", icon: "🗡️", color: "border-sky-500/60" },
              { slot: "7", name: "Hộ Thân", icon: "🛡️", color: "border-blue-500/60" },
              { slot: "8", name: "Lướt Né", icon: "💨", color: "border-emerald-500/60" },
              { slot: "9", name: "Huyết Ma", icon: "🩸", color: "border-purple-500/60" },
              { slot: "10", name: "Băng Long", icon: "❄️", color: "border-cyan-500/60" },
            ].map(({ slot, name, icon, color }) => (
              <button
                key={slot}
                onClick={triggerComboAttack}
                className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0c101d] border-2 ${color} hover:border-white/80 flex flex-col items-center justify-center transition cursor-pointer`}
                title={`${name} (Phím ${slot})`}
              >
                <span className="text-sm select-none">{icon}</span>
                <span className="text-[7px] font-bold text-slate-400 truncate max-w-[40px] scale-90">
                  {name}
                </span>
                <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-slate-400">
                  {slot}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. RIGHT 10 SLOTS: BÌNH MÁU & VẬT PHẨM TIÊU HAO (2 Hàng x 5 Cột)     */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-1.5">
          <div className="grid grid-cols-5 gap-1.5">
            
            {/* Slot 1: Bình Máu Đỏ (HP Potion - Phím 4 hoặc Z) */}
            <button
              onClick={useQuickPotionHp}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#2a0b12] to-[#120407] border-2 border-red-500/80 hover:border-red-400 flex flex-col items-center justify-center transition cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.25)] hover:scale-105 active:scale-95"
              title="Bình Máu Thánh: Hồi 35% HP (Phím 4 hoặc Z)"
            >
              <span className="text-base select-none">🧪</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-rose-300">
                4/Z
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] font-black text-white px-1 rounded bg-black/80">
                {potionCountHp}
              </span>
            </button>

            {/* Slot 2: Bình Năng Lượng Xanh (MP Potion - Phím 5 hoặc X) */}
            <button
              onClick={useQuickPotionMp}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0c182e] to-[#050b18] border-2 border-cyan-400/80 hover:border-cyan-300 flex flex-col items-center justify-center transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95"
              title="Bình Năng Lượng: Hồi 40% MP (Phím 5 hoặc X)"
            >
              <span className="text-base select-none">💧</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-cyan-300">
                5/X
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] font-black text-white px-1 rounded bg-black/80">
                {potionCountMp}
              </span>
            </button>

            {/* Slot 3: Cuộn Sách Tăng Công (ATK Buff Scroll - Phím 6 hoặc C) */}
            <button
              onClick={useQuickAtkBuff}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#291b0c] to-[#140b04] border-2 border-amber-500/80 hover:border-amber-400 flex flex-col items-center justify-center transition cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95"
              title="Sách Cổ Tăng Công: +25% ATK trong 15s (Phím 6 hoặc C)"
            >
              <span className="text-base select-none">📜</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-amber-300">
                6/C
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] font-black text-white px-1 rounded bg-black/80">
                {buffScrollAtkCount}
              </span>
            </button>

            {/* Slot 4: La Bàn Dịch Chuyển Làng (Town Teleport - Phím 7) */}
            <button
              onClick={useQuickTeleport}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0c2419] to-[#04120b] border-2 border-emerald-500/80 hover:border-emerald-400 flex flex-col items-center justify-center transition cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95"
              title="La Bàn Dịch Chuyển: Trở về Làng Long Tộc an toàn (Phím 7)"
            >
              <Compass className="w-5 h-5 text-emerald-400" />
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-emerald-300">
                7
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] font-black text-white px-1 rounded bg-black/80">
                {teleportCompassCount}
              </span>
            </button>

            {/* Slot 5: Cuộn Khiên Thánh (Shield Scroll - Phím 8) */}
            <button
              onClick={useQuickShield}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#101e38] to-[#070e1c] border-2 border-sky-400/80 hover:border-sky-300 flex flex-col items-center justify-center transition cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.25)] hover:scale-105 active:scale-95"
              title="Khiên Thánh Bất Hoại: Chặn 35% HP sát thương (Phím 8)"
            >
              <Shield className="w-5 h-5 text-sky-400" />
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-sky-300">
                8
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] font-black text-white px-1 rounded bg-black/80">
                {shieldScrollCount}
              </span>
            </button>

            {/* Row 2: 9 (Thịt Nướng), 0 (Súp Hầm), - (Thuốc Tốc Độ), Locked Lv10, Locked Lv15 */}
            {/* Slot 6: Thịt Nướng (Phím 9) */}
            <button
              onClick={() => useQuickFood("meat")}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#120e18] border-2 border-orange-500/60 hover:border-orange-400 flex flex-col items-center justify-center transition cursor-pointer"
              title="Thịt Rồng Nướng: Hồi 20% HP (Phím 9)"
            >
              <span className="text-sm select-none">🍖</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-orange-300">
                9
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-white px-1 rounded bg-black/80">
                {foodMeatCount}
              </span>
            </button>

            {/* Slot 7: Súp Nấm Hầm (Phím 0) */}
            <button
              onClick={() => useQuickFood("soup")}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#120e18] border-2 border-purple-500/60 hover:border-purple-400 flex flex-col items-center justify-center transition cursor-pointer"
              title="Súp Nấm Linh Chi: Hồi 25% MP (Phím 0)"
            >
              <span className="text-sm select-none">🍲</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-purple-300">
                0
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-white px-1 rounded bg-black/80">
                {foodSoupCount}
              </span>
            </button>

            {/* Slot 8: Thuốc Tăng Tốc */}
            <button
              onClick={() => useQuickFood("speed")}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#120e18] border-2 border-teal-500/60 hover:border-teal-400 flex flex-col items-center justify-center transition cursor-pointer"
              title="Thuốc Tăng Tốc: +30% Tốc chạy trong 10s (Bấm chuột)"
            >
              <span className="text-sm select-none">⚡</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-teal-300">
                SPD
              </span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-black text-white px-1 rounded bg-black/80">
                {speedPotionCount}
              </span>
            </button>

            {/* Slot 9: Locked Slot (Lv.10) */}
            <div
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#090b14] border-2 border-slate-800 flex flex-col items-center justify-center opacity-70"
              title="Ô khóa: Tự động mở khi đạt Cấp 10"
            >
              <Lock className="w-4 h-4 text-amber-500/80" />
              <span className="text-[7px] font-mono text-amber-400 font-bold mt-0.5">Lv.10</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-bold text-slate-400">9</span>
            </div>

            {/* Slot 10: Locked Slot (Lv.15) */}
            <div
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#090b14] border-2 border-slate-800 flex flex-col items-center justify-center opacity-70"
              title="Ô khóa: Tự động mở khi đạt Cấp 15"
            >
              <Lock className="w-4 h-4 text-amber-500/80" />
              <span className="text-[7px] font-mono text-amber-400 font-bold mt-0.5">Lv.15</span>
              <span className="absolute top-0.5 left-1 font-mono text-[8px] font-bold text-slate-400">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. HẠNG MỤC 3: MASTER EXP BAR (10 Phân Đoạn & Shimmer Animation)     */}
      {/* ==================================================================== */}
      <div className="w-full mt-1.5 relative">
        <div className="w-full h-4 rounded-full bg-[#050811] border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] relative overflow-hidden flex items-center">
          
          {/* Main Shimmering Flowing EXP Fill */}
          <div
            className="h-full rounded-full transition-all duration-300 relative"
            style={{
              width: `${expPct}%`,
              background: "linear-gradient(90deg, #10b981 0%, #14b8a6 40%, #f59e0b 80%, #fef08a 100%)",
              boxShadow: "0 0 12px rgba(16, 185, 129, 0.8)",
            }}
          >
            {/* Shimmer Light Stripe running across */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />

            {/* Glowing Leading Orb at Head of Bar */}
            {expPct > 0 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping" />
            )}
          </div>

          {/* 10 Gold-Segmented Divider Notches (Each 10% EXP) */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={`notch-${i}`}
                className="w-0.5 h-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-950 opacity-80"
              />
            ))}
          </div>

          {/* Center Detailed EXP Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-mono text-[9px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
              Lv.{playerLevel} — EXP: {playerExp.toLocaleString()} / {playerExpToNext.toLocaleString()} ({Math.floor(expPct)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
