// ==============================================================================
// World Atlas Modal (100-Map & Dungeon Explorer - Chiến Long Bá MMORPG)
// Shortcut: Alt + W or click Minimap / Compass
// Displays all 100 maps across 6 Biomes with instant fast-travel teleportation
// ==============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  WORLD_100_MAPS,
  BIOME_CONFIGS,
  type BiomeType,
  type MapAreaDefinition,
} from "@/world/WorldMapRegistry";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import * as THREE from "three";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

const BIOME_TABS: Array<{ key: BiomeType | "all"; label: string; icon: string; range: string }> = [
  { key: "all", label: "Tất Cả 100 Map", icon: "🗺️", range: "Lv.1 - 999" },
  { key: "continent", label: "Lục Địa Khởi Nguyên", icon: "🌿", range: "Map 1-15 (Lv.1-80)" },
  { key: "desert", label: "Đại Sa Mạc Cát Cháy", icon: "🏜️", range: "Map 16-35 (Lv.80-220)" },
  { key: "egypt", label: "Ai Cập & Kim Tự Tháp", icon: "🏛️", range: "Map 36-55 (Lv.220-450)" },
  { key: "ocean", label: "Đại Dương Atlantis", icon: "🌊", range: "Map 56-75 (Lv.450-680)" },
  { key: "snow", label: "Đỉnh Tuyết Sơn", icon: "❄️", range: "Map 76-90 (Lv.680-850)" },
  { key: "void", label: "Hư Không Thần Vực", icon: "🌌", range: "Map 91-100 (Lv.850-999)" },
];

export const WorldAtlasModal: React.FC<Props> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const isOpen = propIsOpen !== undefined ? propIsOpen : activeModal === "worldAtlas";
  const onClose = propOnClose || closeActiveModal;
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const triggerZoneTransition = useGameWorldStore((s) => s.triggerZoneTransition);

  const [activeTab, setActiveTab] = useState<BiomeType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDungeonOnly, setFilterDungeonOnly] = useState(false);

  // Global Alt + W toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredMaps = useMemo(() => {
    return WORLD_100_MAPS.filter((m) => {
      if (activeTab !== "all" && m.biome !== activeTab) return false;
      if (filterDungeonOnly && !m.isDungeon) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = m.name.toLowerCase().includes(term);
        const matchNum = String(m.num).includes(term);
        const matchBoss = m.bossName ? m.bossName.toLowerCase().includes(term) : false;
        if (!matchName && !matchNum && !matchBoss) return false;
      }
      return true;
    });
  }, [activeTab, filterDungeonOnly, searchTerm]);

  const handleFastTravel = (mapDef: MapAreaDefinition) => {
    if (mapDef.id === currentZone) return;

    playCombatSFX("teleport");
    onClose();

    triggerZoneTransition(`DỊCH CHUYỂN TỨC THỜI: ${mapDef.name}`, () => {
      useGameWorldStore.setState({
        currentZone: mapDef.id as any,
        playerPosition: new THREE.Vector3(0, 0, 0),
        zoneNotification: `🗺️ BƯỚC VÀO: ${mapDef.name} [Lv.${mapDef.recommendedLevel[0]} - Lv.${mapDef.recommendedLevel[1]}]`,
        zoneNotificationTimer: 4.5,
      });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl h-[88vh] bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                BẢN ĐỒ THẾ GIỚI — ĐẠI LỤC 100 KHU VỰC & HẦM NGỤC
              </h2>
              <p className="text-xs text-slate-400">
                Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">Alt + W</kbd> • Cấp hiện tại của bạn:{" "}
                <span className="text-amber-400 font-bold">Lv.{playerLevel}</span> / 999
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Biome Filter Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
          {BIOME_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">({tab.range})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/60">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
            <span className="text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên map, số hiệu (#042), hoặc tên Boss..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterDungeonOnly}
              onChange={(e) => setFilterDungeonOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Chỉ xem Hầm Ngục & Cấm Địa Boss</span>
          </label>

          <span className="text-xs text-slate-400">
            Hiển thị <span className="text-cyan-400 font-bold">{filteredMaps.length}</span> / 100 khu vực
          </span>
        </div>

        {/* 100 Maps Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredMaps.map((mapDef) => {
            const isCurrent = mapDef.id === currentZone;
            const cfg = BIOME_CONFIGS[mapDef.biome];
            const isUnderlevel = playerLevel < mapDef.recommendedLevel[0];

            return (
              <div
                key={mapDef.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-emerald-950/30 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/60"
                    : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-[11px] font-mono font-bold text-slate-300">
                      <span>{cfg.icon}</span>
                      <span>#{String(mapDef.num).padStart(3, "0")}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {mapDef.isSafeZone && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          🛡️ AN TOÀN
                        </span>
                      )}
                      {mapDef.isDungeon && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          ⚔️ HẦM NGỤC
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isUnderlevel
                            ? "bg-rose-950/40 text-rose-400 border-rose-800/50"
                            : "bg-amber-950/40 text-amber-300 border-amber-800/50"
                        }`}
                      >
                        Lv.{mapDef.recommendedLevel[0]} - {mapDef.recommendedLevel[1]}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-100 mb-1 line-clamp-1">{mapDef.name}</h3>

                  {/* Desc */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {mapDef.desc}
                  </p>

                  {/* Boss / Monster Info */}
                  {mapDef.bossName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium mb-2 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                      <span>👑</span>
                      <span className="line-clamp-1">{mapDef.bossName}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  {isCurrent ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      Đang Ở Đây
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {isUnderlevel ? "⚠️ Nguy hiểm cao" : "Phù hợp cấp độ"}
                    </span>
                  )}

                  <button
                    onClick={() => handleFastTravel(mapDef)}
                    disabled={isCurrent}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95"
                    }`}
                  >
                    ⚡ Dịch Chuyển Nhanh
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
