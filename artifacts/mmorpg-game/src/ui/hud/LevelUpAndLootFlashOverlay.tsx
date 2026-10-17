import { memo, useState, useEffect, useRef } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { Crown, Sparkles, Star } from "lucide-react";

export const LevelUpAndLootFlashOverlay = memo(function LevelUpAndLootFlashOverlay() {
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const droppedLoot = useGameWorldStore((s) => s.droppedLoot);

  const prevLevel = useRef<number>(playerLevel);
  const prevLootCount = useRef<number>(droppedLoot.length);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpNumber, setLevelUpNumber] = useState(playerLevel);
  const [showRarityFlash, setShowRarityFlash] = useState<string | null>(null);

  // Level Up Detection
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (prevLevel.current && playerLevel > prevLevel.current) {
      setLevelUpNumber(playerLevel);
      setShowLevelUp(true);
      playCombatSFX("level_up_fanfare", 0.6);

      timer = setTimeout(() => {
        setShowLevelUp(false);
      }, 2400);
    }
    prevLevel.current = playerLevel;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [playerLevel]);

  // Rare/Epic/Legendary Loot Detection
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (droppedLoot.length > prevLootCount.current) {
      const newLoots = droppedLoot.slice(prevLootCount.current);
      const highTier = newLoots.find((l) =>
        ["miracle", "legendary", "epic"].includes(l.rarity?.toLowerCase() || "")
      );
      if (highTier) {
        setShowRarityFlash(highTier.rarity?.toLowerCase() || "epic");
        playCombatSFX("rarity_chime", 0.45);
        timer = setTimeout(() => setShowRarityFlash(null), 800);
      }
    }
    prevLootCount.current = droppedLoot.length;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [droppedLoot]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 1. Screen Edge Flash on High-Tier Loot */}
      {showRarityFlash && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            showRarityFlash === "miracle"
              ? "shadow-[inset_0_0_120px_rgba(244,63,94,0.7)]"
              : showRarityFlash === "legendary"
              ? "shadow-[inset_0_0_100px_rgba(245,158,11,0.65)]"
              : "shadow-[inset_0_0_90px_rgba(168,85,247,0.6)]"
          } animate-pulse`}
        />
      )}

      {/* 2. Golden Edge Radiance on Level Up */}
      {showLevelUp && (
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(245,158,11,0.85)] animate-pulse" />
      )}

      {/* 3. Epic Cinematic Level Up Flying Banner */}
      {showLevelUp && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center animate-in zoom-in-50 fade-in duration-300">
          {/* Radiant Sunburst Background Glow */}
          <div className="absolute w-96 h-96 rounded-full bg-amber-500/20 blur-3xl -z-10 animate-ping duration-1000" />

          {/* Level Crown Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_50px_rgba(245,158,11,0.8)] animate-bounce mb-2">
            <div className="w-full h-full rounded-2xl bg-[#120803] flex items-center justify-center text-3xl">
              👑
            </div>
          </div>

          {/* Main Title: LEVEL UP! */}
          <h1
            className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 drop-shadow-[0_4px_20px_rgba(245,158,11,0.8)] font-mono uppercase"
          >
            Level Up!
          </h1>

          {/* Level Number Ribbon */}
          <div className="mt-2 px-6 py-1.5 rounded-full bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <span className="font-mono text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-300 text-amber-300 animate-spin" />
              Đạt Cấp Độ {levelUpNumber}
              <Star className="w-4 h-4 fill-amber-300 text-amber-300 animate-spin" />
            </span>
          </div>

          {/* Stat Boosts announcement */}
          <p className="mt-3 text-xs sm:text-sm font-bold text-yellow-100 drop-shadow flex items-center gap-3">
            <span className="text-emerald-400">+Sinh Lực HP</span>
            <span className="text-cyan-400">+Năng Lượng MP</span>
            <span className="text-rose-400">+Sát Thương ATK</span>
            <span className="text-amber-400">+1 Điểm Thiên Phú</span>
          </p>
        </div>
      )}
    </div>
  );
});
