// ==============================================================================
// Dark-Light RPG HUD — Real-Time Minimap Radar
// Circular compass bezel, live player arrow, village sanctuary ring,
// monster markers, boss skull indicator, and dropped loot stars
// ==============================================================================

import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { Compass, Skull, Star, Navigation } from "lucide-react";

interface MinimapRadarProps {
  zoomMultiplier?: number;
}

export const MinimapRadar = memo(function MinimapRadar({ zoomMultiplier = 1 }: MinimapRadarProps) {
  const playerPos = useGameWorldStore((s) => s.playerPosition);
  const playerFacingLeft = useGameWorldStore((s) => s.playerFacingLeft);
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const monsterMarkers = useGameWorldStore((s) => s.monsterMarkers);
  const droppedLoot = useGameWorldStore((s) => s.droppedLoot);
  const bossActive = useGameWorldStore((s) => s.bossActive);

  // Radar display properties
  const radarSize = 150; // pixels
  const center = radarSize / 2;
  const worldMaxRadius = 85.0; // meters
  const scale = ((center - 10) / worldMaxRadius) * zoomMultiplier; // Scaled pixels per meter

  // Transform world (x, z) to radar (rx, ry)
  const toRadar = (x: number, z: number) => ({
    x: center + x * scale,
    y: center + z * scale,
  });

  const pRadar = toRadar(playerPos.x, playerPos.z);
  const villageRadiusPx = 21.5 * scale;
  const bossCenterRadar = toRadar(0, -70);
  const bossRadiusPx = 17.5 * scale;
  const dungeonPortalRadar = toRadar(0, -48);
  const deadMarshRadar = toRadar(35, 0);

  return (
    <div
      className="pointer-events-auto flex flex-col items-center select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Circular Radar Frame with Compass Bezel ── */}
      <div
        className="relative rounded-full bg-[#080512]/92 border-2 border-amber-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{ width: radarSize, height: radarSize }}
      >
        {/* Compass Cardinal Indicators */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-amber-300/80 z-20">
          N
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-slate-500 z-20">
          S
        </span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-black text-slate-500 z-20">
          W
        </span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-black text-slate-500 z-20">
          E
        </span>

        {/* Radar Crosshair / Range Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-full h-[1px] bg-cyan-400" />
          <div className="h-full w-[1px] bg-cyan-400 absolute" />
        </div>

        {/* ── World Zones Outlines ── */}
        {/* 1. Safe Village Sanctuary (Emerald Green Ring r = 21.5m) */}
        <div
          className="absolute rounded-full border border-emerald-400/70 bg-emerald-500/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_8px_rgba(16,185,129,0.3)]"
          style={{
            left: center,
            top: center,
            width: villageRadiusPx * 2,
            height: villageRadiusPx * 2,
          }}
          title="Làng Long Tộc (An Toàn)"
        />

        {/* 2. Dead Marsh & Wasteland Sector (Purple East Area) */}
        <div
          className="absolute rounded-full border border-purple-500/50 bg-purple-900/15 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: deadMarshRadar.x,
            top: deadMarshRadar.y,
            width: 28 * scale * 2,
            height: 28 * scale * 2,
          }}
          title="Vùng Đất Chết & Đầm Lầy (Lv.6 - Lv.10)"
        />

        {/* 3. Dungeon Portal Gate Marker at [0, -48] */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-cyan-300 drop-shadow-[0_0_8px_#00f2ff] animate-pulse"
          style={{ left: dungeonPortalRadar.x, top: dungeonPortalRadar.y }}
          title="Cổng Hang Động Phó Bản"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center text-[8px] font-black">
            🌀
          </div>
        </div>

        {/* 4. Boss Altar (Crimson/Fiery Ring at North z = -70) */}
        <div
          className="absolute rounded-full border border-rose-500/70 bg-rose-500/15 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_10px_rgba(244,63,94,0.35)]"
          style={{
            left: bossCenterRadar.x,
            top: bossCenterRadar.y,
            width: bossRadiusPx * 2,
            height: bossRadiusPx * 2,
          }}
          title="Cấm Địa Săn Boss"
        />

        {/* ── Dropped Loot (Gold Stars) ── */}
        {droppedLoot.map((loot) => {
          const lPos = toRadar(loot.position[0], loot.position[2]);
          return (
            <div
              key={`loot-${loot.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-amber-300 drop-shadow-[0_0_4px_#f59e0b] animate-bounce z-10"
              style={{ left: lPos.x, top: lPos.y }}
              title={`Vật phẩm rơi: ${loot.name}`}
            >
              <Star className="w-2.5 h-2.5 fill-amber-300" />
            </div>
          );
        })}


        {/* ── Living Monsters & Boss Markers ── */}
        {monsterMarkers.map((m) => {
          const mPos = toRadar(m.x, m.z);
          return (
            <div
              key={`marker-${m.id}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 ${
                m.isBoss ? "text-purple-400" : "text-rose-500"
              }`}
              style={{ left: mPos.x, top: mPos.y }}
              title={m.name}
            >
              {m.isBoss ? (
                <div className="w-4 h-4 rounded-full bg-purple-900/80 border border-purple-400 flex items-center justify-center shadow-[0_0_8px_#a855f7] animate-pulse">
                  <Skull className="w-2.5 h-2.5 text-amber-300" />
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_#f43f5e] border border-white/50" />
              )}
            </div>
          );
        })}

        {/* ── Player Directional Arrow (Cyan Glow) ── */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-75"
          style={{
            left: pRadar.x,
            top: pRadar.y,
            transform: `translate(-50%, -50%) rotate(${playerFacingLeft ? -90 : 90}deg)`,
          }}
        >
          <div className="w-3.5 h-3.5 flex items-center justify-center text-cyan-300 drop-shadow-[0_0_6px_#00f2ff]">
            <Navigation className="w-3.5 h-3.5 fill-cyan-400" />
          </div>
        </div>
      </div>

      {/* ── Current Zone Banner & Coordinates ── */}
      <div className="mt-1 px-3 py-0.5 rounded-full bg-[#0a0514]/90 border border-slate-800 text-center shadow-md">
        <p className="text-[10px] font-black tracking-wide text-slate-200">
          {currentZone === "SAFE_VILLAGE"
            ? "🛡️ LÀNG TÂN THỦ (AN TOÀN)"
            : currentZone === "WILDERNESS"
            ? "⚔️ RỪNG NGUYÊN SINH (LV.1-5)"
            : currentZone === "DEAD_MARSH"
            ? "☠️ ĐẦM LẦY CHẾT (LV.6-10)"
            : currentZone === "DUNGEON"
            ? "🏰 HANG ĐỘNG PHÓ BẢN"
            : "🔥 CẤM ĐỊA BOSS (LV.20)"}
        </p>
        <p className="text-[8px] font-mono text-slate-400">
          X: {Math.round(playerPos.x)} · Z: {Math.round(playerPos.z)}
        </p>
      </div>
    </div>
  );
});
