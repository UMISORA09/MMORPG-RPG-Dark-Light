import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice5,
  Lock,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Heart,
  Flame,
  Award,
  Crown,
} from "lucide-react";

export type DestinyTier = "F" | "C" | "A" | "S" | "Miracle";

export interface DestinySlotItem {
  id: string;
  name: string;
  type: "talent" | "aura";
  tier: DestinyTier;
  tierName: string;
  buff: string;
  desc: string;
  color: string;
  glowHex: string;
  auraColor?: string;
}

export const TIER_CONFIG: Record<
  DestinyTier,
  { label: string; badgeBg: string; border: string; glow: string; textColor: string; particleColor: string }
> = {
  F: {
    label: "Thường (F)",
    badgeBg: "bg-slate-700/80",
    border: "border-slate-500/40",
    glow: "rgba(148, 163, 184, 0.2)",
    textColor: "text-slate-400",
    particleColor: "#94a3b8",
  },
  C: {
    label: "Trung Cấp (C)",
    badgeBg: "bg-emerald-950/80",
    border: "border-emerald-500/60",
    glow: "rgba(34, 197, 94, 0.35)",
    textColor: "text-emerald-400",
    particleColor: "#22c55e",
  },
  A: {
    label: "Cao Cấp (A)",
    badgeBg: "bg-cyan-950/80",
    border: "border-cyan-500/70",
    glow: "rgba(56, 189, 248, 0.5)",
    textColor: "text-cyan-400",
    particleColor: "#38bdf8",
  },
  S: {
    label: "Huyền Thoại (S)",
    badgeBg: "bg-amber-950/80",
    border: "border-amber-500",
    glow: "rgba(249, 115, 22, 0.75)",
    textColor: "text-amber-400",
    particleColor: "#f97316",
  },
  Miracle: {
    label: "KÌ TÍCH (1/1000)",
    badgeBg: "bg-rose-950/90",
    border: "border-rose-500",
    glow: "rgba(244, 63, 94, 0.95)",
    textColor: "text-rose-400",
    particleColor: "#ec4899",
  },
};

// Initial default talent & relic slots
const DEFAULT_TALENTS: DestinySlotItem[] = [
  {
    id: "talent_epic_fury",
    name: "Cuồng Nộ Chiến Ý",
    type: "talent",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+20% Sát Thương Kỹ Năng",
    desc: "Đòn đánh liên hoàn thứ 3 phát nổ diện rộng.",
    color: "#38bdf8",
    glowHex: "#0284c7",
  },
  {
    id: "talent_epic_iron",
    name: "Kim Cang Hộ Thể",
    type: "talent",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+20% HP & -15% Sát Thương",
    desc: "Giáp cốt kim cang giảm nhẹ sát thương đòn đánh.",
    color: "#38bdf8",
    glowHex: "#0ea5e9",
  },
  {
    id: "talent_epic_wind",
    name: "Tật Phong Lưu Ảnh",
    type: "talent",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+18% Tốc Chạy & +10% Né",
    desc: "Thân pháp lướt gió tạo ảo ảnh tránh đòn.",
    color: "#38bdf8",
    glowHex: "#06b6d4",
  },
  {
    id: "talent_epic_vamp",
    name: "Huyết Ma Nghịch Chuyển",
    type: "talent",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "Hồi 8% HP Khi Diệt Quái",
    desc: "Chuyển hóa sinh lực đối phương trị thương.",
    color: "#38bdf8",
    glowHex: "#6366f1",
  },
];

const DEFAULT_AURAS: DestinySlotItem[] = [
  {
    id: "aura_epic_dragon",
    name: "Long Hồn Châu",
    type: "aura",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+120 HP & +60 MP",
    desc: "Hào quang rồng xanh lam bao bọc sinh mệnh.",
    color: "#38bdf8",
    glowHex: "#0284c7",
    auraColor: "rgba(56, 189, 248, 0.5)",
  },
  {
    id: "aura_epic_thunder",
    name: "Lôi Điểu Phù",
    type: "aura",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+6% Tỉ Lệ Bạo Kích",
    desc: "Tia sét tím quấn quanh vũ khí nhân vật.",
    color: "#38bdf8",
    glowHex: "#8b5cf6",
    auraColor: "rgba(139, 92, 246, 0.5)",
  },
  {
    id: "aura_epic_tiger",
    name: "Bạch Hổ Ấn",
    type: "aura",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+15 Sát Thương Cơ Bản",
    desc: "Hào quang mãnh hổ gia tăng lực chém.",
    color: "#38bdf8",
    glowHex: "#f43f5e",
    auraColor: "rgba(244, 63, 94, 0.5)",
  },
  {
    id: "aura_epic_tortoise",
    name: "Huyền Vũ Thuẫn",
    type: "aura",
    tier: "A",
    tierName: "Cao Cấp (9%)",
    buff: "+18 Phòng Thủ Cơ Bản",
    desc: "Mai rùa bích lục chắn đòn đánh lén.",
    color: "#38bdf8",
    glowHex: "#10b981",
    auraColor: "rgba(16, 185, 129, 0.5)",
  },
];

interface DestinyRandomizerProps {
  onDestinyRolled: (talents: DestinySlotItem[], auras: DestinySlotItem[]) => void;
  isLockedInitially?: boolean;
  initialTalents?: DestinySlotItem[];
  initialAuras?: DestinySlotItem[];
}

export function DestinyRandomizer({
  onDestinyRolled,
  isLockedInitially = false,
  initialTalents,
  initialAuras,
}: DestinyRandomizerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [isLocked, setIsLocked] = useState(isLockedInitially);
  const [hasRolled, setHasRolled] = useState(isLockedInitially);
  const [talents, setTalents] = useState<DestinySlotItem[]>(initialTalents || DEFAULT_TALENTS);
  const [auras, setAuras] = useState<DestinySlotItem[]>(initialAuras || DEFAULT_AURAS);
  const [revealedSlots, setRevealedSlots] = useState<number[]>(isLockedInitially ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7]);
  const [highlightMiracle, setHighlightMiracle] = useState(false);

  // Audio Context Synthesizer for Gacha SFX
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Sound: Spinning tick sound
  const playTickSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400 + Math.random() * 300, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [getAudioContext]);

  // Sound: Card stop impact thud
  const playImpactSound = useCallback((isRare: boolean) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(isRare ? 180 : 120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(isRare ? 0.25 : 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, [getAudioContext]);

  // Sound: Miracle / Legendary Chime Fanfare
  const playMiracleFanfare = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.7);
      });
    } catch {}
  }, [getAudioContext]);

  // Handle Roll Button Action
  const handleRollDestiny = async () => {
    if (isRolling || isLocked) return;

    setIsRolling(true);
    setRevealedSlots([]);
    setHighlightMiracle(false);

    // Call Backend Gacha API
    let rollData: { talents: DestinySlotItem[]; auras: DestinySlotItem[]; hasMiracle: boolean; hasLegendary: boolean } | null = null;
    try {
      const res = await fetch("/api/characters/roll-destiny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        rollData = await res.json();
      }
    } catch {}

    // Fallback if network or offline: client-side RNG matching backend odds
    if (!rollData || !rollData.talents) {
      const { rollFullDestiny } = await import("@/services/clientDestinyGenerator");
      rollData = rollFullDestiny();
    }

    const finalTalents = rollData.talents;
    const finalAuras = rollData.auras;
    const hasMiracle = rollData.hasMiracle;
    const hasLegendary = rollData.hasLegendary;

    // Spinning tick intervals
    const tickInterval = setInterval(() => {
      playTickSound();
    }, 90);

    // Staggered reveal sequence across the 8 slots (4 Talents + 4 Auras)
    const totalSlots = 8;
    const baseDuration = 1800;
    const staggerStep = 180;

    for (let slot = 0; slot < totalSlots; slot++) {
      setTimeout(() => {
        setRevealedSlots((prev) => [...prev, slot]);
        const isTalent = slot < 4;
        const currentItem = isTalent ? finalTalents[slot] : finalAuras[slot - 4];
        const isRare = currentItem?.tier === "S" || currentItem?.tier === "Miracle";
        playImpactSound(isRare);

        if (slot === totalSlots - 1) {
          clearInterval(tickInterval);
          setIsRolling(false);
          setIsLocked(true);
          setHasRolled(true);
          setTalents(finalTalents);
          setAuras(finalAuras);
          onDestinyRolled(finalTalents, finalAuras);

          if (hasMiracle || hasLegendary) {
            setHighlightMiracle(true);
            playMiracleFanfare();
          }
        }
      }, baseDuration + slot * staggerStep);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* ── TOP: TITLE & BUTTON ── */}
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#5d4648]/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            Thiên Mệnh & Khí Linh (Roll 1 Lần Duy Nhất)
          </span>
        </div>

        {/* Lock indicator / Status */}
        {isLocked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-[10px] text-rose-300 font-bold">
            <Lock className="w-3 h-3 text-rose-400" /> ĐÃ KHÓA
          </span>
        )}
      </div>

            {/* ── 8 SLOTS DISPLAY (4 Talents + 4 Auras) ── */}
      <div className="space-y-2 flex-1 my-1">
        {/* 1. 4 Thiên Phú Khởi Nguyên */}
        <div>
          <div className="text-[10px] font-bold text-[#8e7a7c] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Swords className="w-3 h-3 text-[#ff3366]" /> 4 Thiên Phú Khởi Nguyên
            </span>
            <span className="text-[9px] text-[#28c3e1] font-mono">Xác Suất Kì Tích: 0.1%</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {!hasRolled && !isRolling ? (
              [0, 1, 2, 3].map((idx) => (
                <div
                  key={"unrevealed-talent-" + idx}
                  className="relative p-2 rounded-xl border border-dashed border-[#5d4648] bg-[#221a1b] text-left transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-[10px] text-[#8e7a7c] flex items-center gap-1">
                      <span className="text-amber-400">❓</span> Thiên Phú #{idx + 1}
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded font-mono bg-black/50 text-amber-300 border border-amber-500/40">
                      ?
                    </span>
                  </div>
                  <div className="text-[9.5px] font-mono text-amber-400/90 font-bold">
                    Chưa Thức Tỉnh
                  </div>
                  <div className="text-[8.5px] text-[#8e7a7c]/70 line-clamp-1 leading-tight mt-0.5">
                    Nhấn Quay để mở khóa
                  </div>
                </div>
              ))
            ) : (
              talents.map((t, idx) => {
                const isRevealed = revealedSlots.includes(idx);
                const tierCfg = TIER_CONFIG[t.tier] || TIER_CONFIG.F;
                const isMiracle = t.tier === "Miracle";
                const isLegend = t.tier === "S";

                return (
                  <div
                    key={t.id + idx}
                    className={`relative p-1.5 rounded-xl border text-left transition-all overflow-hidden ${
                      isRolling && !isRevealed
                        ? "bg-[#271f20] border-amber-500/60 animate-pulse"
                        : isMiracle
                        ? "bg-rose-950/60 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                        : isLegend
                        ? "bg-amber-950/60 border border-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        : "bg-[#271f20] border-[#5d4648]/80"
                    }`}
                  >
                    {isRolling && !isRevealed ? (
                      <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[9px] font-mono text-amber-300 tracking-widest animate-pulse">
                          ĐANG CUỘN...
                        </span>
                      </div>
                    ) : (
                      <>
                        {(isMiracle || isLegend) && (
                          <div className="absolute top-1 right-1">
                            <Crown className={`w-3.5 h-3.5 ${isMiracle ? "text-rose-400" : "text-amber-400"} animate-bounce`} />
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-[10px] text-white truncate max-w-[110px]">
                            {t.name}
                          </span>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.2 rounded font-mono ${tierCfg.badgeBg} ${tierCfg.textColor} border ${tierCfg.border}`}
                          >
                            {t.tier}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono font-bold truncate" style={{ color: t.color }}>
                          {t.buff}
                        </div>
                        <div className="text-[8.5px] text-[#8e7a7c] line-clamp-1 leading-tight mt-0.5">
                          {t.desc}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. 4 Khí Linh Hộ Thể (Auras) */}
        <div>
          <div className="text-[10px] font-bold text-[#8e7a7c] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#ffd700]" /> 4 Khí Linh Hộ Thể
            </span>
            <span className="text-[9px] text-amber-300 font-mono">Tỉ Lệ Huyền Thoại: 2.9%</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {!hasRolled && !isRolling ? (
              [0, 1, 2, 3].map((idx) => (
                <div
                  key={"unrevealed-aura-" + idx}
                  className="relative p-2 rounded-xl border border-dashed border-[#5d4648] bg-[#221a1b] text-left transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-[10px] text-[#8e7a7c] flex items-center gap-1">
                      <span className="text-cyan-400">❓</span> Khí Linh #{idx + 1}
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded font-mono bg-black/50 text-cyan-300 border border-cyan-500/40">
                      ?
                    </span>
                  </div>
                  <div className="text-[9.5px] font-mono text-cyan-400/90 font-bold">
                    Chưa Thức Tỉnh
                  </div>
                  <div className="text-[8.5px] text-[#8e7a7c]/70 line-clamp-1 leading-tight mt-0.5">
                    Nhấn Quay để mở khóa
                  </div>
                </div>
              ))
            ) : (
              auras.map((a, idx) => {
                const slotIdx = idx + 4;
                const isRevealed = revealedSlots.includes(slotIdx);
                const tierCfg = TIER_CONFIG[a.tier] || TIER_CONFIG.F;
                const isMiracle = a.tier === "Miracle";
                const isLegend = a.tier === "S";

                return (
                  <div
                    key={a.id + slotIdx}
                    className={`relative p-1.5 rounded-xl border text-left transition-all overflow-hidden ${
                      isRolling && !isRevealed
                        ? "bg-[#271f20] border-cyan-500/60 animate-pulse"
                        : isMiracle
                        ? "bg-rose-950/60 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                        : isLegend
                        ? "bg-amber-950/60 border border-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        : "bg-[#271f20] border-[#5d4648]/80"
                    }`}
                  >
                    {isRolling && !isRevealed ? (
                      <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[9px] font-mono text-cyan-300 tracking-widest animate-pulse">
                          ĐANG CUỘN...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.glowHex }} />
                            <span className="font-bold text-[10px] text-white truncate max-w-[100px]">
                              {a.name}
                            </span>
                          </div>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.2 rounded font-mono ${tierCfg.badgeBg} ${tierCfg.textColor} border ${tierCfg.border}`}
                          >
                            {a.tier}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono font-bold truncate" style={{ color: a.color }}>
                          {a.buff}
                        </div>
                        <div className="text-[8.5px] text-[#8e7a7c] line-clamp-1 leading-tight mt-0.5">
                          {a.desc}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION: GACHA RANDOM BUTTON (1 LẦN DUY NHẤT) ── */}
      <div className="pt-2 border-t border-[#5d4648]/60 text-center">
        {!isLocked ? (
          <button
            type="button"
            onClick={handleRollDestiny}
            disabled={isRolling}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.45)] transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isRolling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang Gacha Cuộn Thiên Mệnh...</span>
              </>
            ) : (
              <>
                <Dice5 className="w-4 h-4 animate-spin text-white" />
                <span>🎲 RANDOM THIÊN MỆNH & KHÍ LINH (BẮT BUỘC)</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-2 rounded-xl bg-[#271f20] border border-[#5d4648] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>[🔒 ĐÃ KHÓA THIÊN MỆNH]</span>
            </div>
            <p className="text-[10px] text-[#a89a9c] leading-tight">
              Thiên mệnh đã định, chỉ được random một lần duy nhất trước khi bắt đầu hành trình!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
