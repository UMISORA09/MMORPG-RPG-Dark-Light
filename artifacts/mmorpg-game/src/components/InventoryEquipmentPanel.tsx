import { useState, useEffect, useMemo, memo } from "react";
import type { Character, InventoryItem, Item } from "@workspace/api-client-react";
import { 
  Heart, 
  Shield, 
  Zap, 
  Swords, 
  Coins, 
  Check, 
  Sparkles, 
  X, 
  Star, 
  ChevronsUp, 
  ScrollText, 
  Trophy, 
  Settings, 
  Users, 
  Flame, 
  ShoppingBag,
  Package,
  User,
  ArrowUpRight
} from "lucide-react";
import { ClassSprite } from "./ClassSprite";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/game/useGameStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

export interface InventoryEquipmentPanelProps {
  character: Character;
  inventory: InventoryItem[];
  shopItems: Item[];
  inventoryLoading: boolean;
  shopLoading: boolean;
  busy: boolean;
  initialSection?: "storage" | "shop";
  onEquip: (item: InventoryItem) => void;
  onBuy: (item: Item) => void;
  onClose?: () => void;
}

// ── 12 Equipment Slot Silhouette SVGs (matching reference photo) ──────────────
function HelmetSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M12 2a8 8 0 0 0-8 8v3a6 6 0 0 0 2 4.47V21a1 1 0 0 0 1.5.86L12 19.5l4.5 2.36a1 1 0 0 0 1.5-.86v-3.53A6 6 0 0 0 20 13v-3a8 8 0 0 0-8-8z" />
      <path d="M8 12h8" />
      <path d="M12 8v4" />
      <path d="M9 15h6" />
    </svg>
  );
}

function ArmorSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M4 4l4-2h8l4 2v4a8 8 0 0 1-3 6.32V21a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-6.68A8 8 0 0 1 4 8V4z" />
      <path d="M9 2v4a3 3 0 0 0 6 0V2" />
      <path d="M4 11h16" />
      <path d="M7 16h10" />
    </svg>
  );
}

function GlovesSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M6 14v4a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-4" />
      <path d="M6 14V6a2 2 0 0 1 4 0v5" />
      <path d="M10 11V4a2 2 0 0 1 4 0v7" />
      <path d="M14 11V6a2 2 0 0 1 4 0v8" />
      <path d="M6 14a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3" />
    </svg>
  );
}

function PantsSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M5 3h14v4l-2 14h-3.5L12 12l-1.5 9H7L5 7V3z" />
      <path d="M5 7h14" />
      <path d="M12 7v5" />
    </svg>
  );
}

function BootsSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M7 3h6v9l5 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a6 6 0 0 1 3-5.2V3z" />
      <path d="M4 16h14" />
      <path d="M6 10h6" />
    </svg>
  );
}

function BeltSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <rect x="3" y="6" width="18" height="6" rx="2" />
      <rect x="9" y="4" width="6" height="10" rx="1" />
      <path d="M10 12l2 8 2-8" />
    </svg>
  );
}

function NecklaceSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M4 4c0 6 3.5 11 8 11s8-5 8-11" />
      <circle cx="12" cy="18" r="3" />
      <path d="M12 15v-1" />
    </svg>
  );
}

function EarringSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v3" />
      <path d="M12 11l-3 4 3 6 3-6-3-4z" />
    </svg>
  );
}

function RingSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <ellipse cx="12" cy="14" rx="7" ry="5" />
      <ellipse cx="12" cy="14" rx="4" ry="2.5" />
      <path d="M9 9l3-4 3 4" />
      <circle cx="12" cy="5" r="1.5" />
    </svg>
  );
}

function WeaponSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M14.5 4l5.5 5.5-9 9-3 1 1-3 5.5-5.5" />
      <path d="M18 7.5L7.5 18" />
      <path d="M5 19l-2 2" />
      <path d="M16 2l6 6" />
    </svg>
  );
}

function ShieldSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M12 2l7 3v6c0 5.25-3.5 10-7 11-3.5-1-7-5.75-7-11V5l7-3z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  );
}

function BannerSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-45">
      <path d="M4 2v20" />
      <path d="M4 4h14l-3 5 3 5H4" />
      <circle cx="4" cy="2" r="1" />
    </svg>
  );
}

// ── 12 Equipment Slots Spec ──────────────────────────────────────────────────
interface SlotDefinition {
  id: string;
  key: string;
  name: string;
  column: "left" | "right";
  icon: () => React.ReactNode;
  matchedTypes: string[];
}

const EQUIPMENT_SLOTS: SlotDefinition[] = [
  // Cột trái (6 ô)
  { id: "slot-helmet", key: "helmet", name: "Mũ / Nón", column: "left", icon: HelmetSvg, matchedTypes: ["helmet"] },
  { id: "slot-armor", key: "armor", name: "Áo Giáp", column: "left", icon: ArmorSvg, matchedTypes: ["armor"] },
  { id: "slot-gloves", key: "gloves", name: "Găng Tay", column: "left", icon: GlovesSvg, matchedTypes: ["gloves"] },
  { id: "slot-pants", key: "pants", name: "Quần Giáp", column: "left", icon: PantsSvg, matchedTypes: ["pants"] },
  { id: "slot-boots", key: "boots", name: "Giày Chiến", column: "left", icon: BootsSvg, matchedTypes: ["boots"] },
  { id: "slot-belt", key: "belt", name: "Thắt Lưng", column: "left", icon: BeltSvg, matchedTypes: ["belt"] },
  // Cột phải (6 ô)
  { id: "slot-necklace", key: "necklace", name: "Dây Chuyền", column: "right", icon: NecklaceSvg, matchedTypes: ["necklace", "accessory"] },
  { id: "slot-earring", key: "earring", name: "Hoa Tai / Ngọc", column: "right", icon: EarringSvg, matchedTypes: ["earring"] },
  { id: "slot-ring", key: "ring", name: "Nhẫn Giới Chỉ", column: "right", icon: RingSvg, matchedTypes: ["ring"] },
  { id: "slot-weapon", key: "weapon", name: "Vũ Khí Chính", column: "right", icon: WeaponSvg, matchedTypes: ["weapon"] },
  { id: "slot-shield", key: "shield", name: "Khiên / Pháp Bảo", column: "right", icon: ShieldSvg, matchedTypes: ["shield"] },
  { id: "slot-banner", key: "banner", name: "Áo Choàng / Ấn", column: "right", icon: BannerSvg, matchedTypes: ["banner"] },
];

export const InventoryEquipmentPanel = memo(function InventoryEquipmentPanel({
  character,
  inventory,
  shopItems,
  inventoryLoading,
  shopLoading,
  busy,
  initialSection = "storage",
  onEquip,
  onBuy,
  onClose,
}: InventoryEquipmentPanelProps) {
  const [section, setSection] = useState<"storage" | "shop">(initialSection);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeSubModal, setActiveSubModal] = useState<"stats" | "quests" | "forge" | null>(null);
  const [enhanceSuccess, setEnhanceSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const equippedItems = useMemo(() => inventory.filter((item) => item.equipped), [inventory]);
  const ownedIds = useMemo(() => new Set(inventory.map((item) => item.id)), [inventory]);
  const availableItems = useMemo(
    () => shopItems.filter((item) => !ownedIds.has(item.id) && (item.classId === null || item.classId === character.classId)),
    [shopItems, ownedIds, character.classId]
  );

  // Compute Equipment Rating (Lực chiến trang bị)
  const equipmentRating = useMemo(() => {
    let score = 20; // Điểm cơ bản
    for (const it of equippedItems) {
      score += (it.atkBoost || 0) * 2.2;
      score += (it.defBoost || 0) * 1.8;
      score += (it.hpBoost || 0) * 0.35;
      score += (it.spdBoost || 0) * 1.5;
      if (it.rarity === "rare") score += 15;
      if (it.rarity === "epic") score += 30;
      if (it.rarity === "legendary") score += 50;
    }
    return Math.round(score);
  }, [equippedItems]);

  // Map equipped items to the 12 slots
  const slotEquippedMap = useMemo(() => {
    const map: Record<string, InventoryItem | null> = {};
    for (const slot of EQUIPMENT_SLOTS) {
      // Find matching equipped item
      const item = equippedItems.find((it) => {
        const type = it.type.toLowerCase();
        const name = it.name.toLowerCase();
        if (slot.key === "weapon" && type === "weapon" && !name.includes("khiên")) return true;
        if (slot.key === "shield" && (name.includes("khiên") || type === "shield")) return true;
        if (slot.key === "armor" && type === "armor") return true;
        if (slot.key === "necklace" && (type === "necklace" || type === "accessory")) return true;
        if (slot.key === "ring" && (type === "ring" || name.includes("nhẫn"))) return true;
        if (slot.matchedTypes.includes(type)) return true;
        return false;
      });
      map[slot.key] = item || null;
    }
    return map;
  }, [equippedItems]);

  const leftSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "left");
  const rightSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "right");

  // Grid total slots: exactly 24 slots (4 rows x 6 columns)
  const totalSlotsCount = 24;
  const gridCells = useMemo(() => {
    const cells = [...inventory];
    while (cells.length < totalSlotsCount) {
      cells.push(null as any);
    }
    return cells;
  }, [inventory]);

  const currentItem = selectedItem || inventory[0] || null;

  // Handle Equipment Slot Click
  const handleSlotClick = (slotKey: string) => {
    const item = slotEquippedMap[slotKey];
    if (item) {
      setSelectedItem(item);
      playCombatSFX("coin_chime", 0.3);
    }
  };

  // Mock Enhance Action for Item
  const handleEnhanceItem = (item: InventoryItem) => {
    if (character.gold < 50) {
      alert("Cần tối thiểu 50 Vàng để cường hóa!");
      return;
    }
    playCombatSFX("heavy_slam", 0.4);
    setEnhanceSuccess(true);
    setTimeout(() => setEnhanceSuccess(null), 1800);
  };

  return (
    <div className="relative w-full max-w-[960px] mx-auto rounded-[28px] bg-[#11141c]/95 border border-[#273044] shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-4 sm:p-6 text-slate-100 flex flex-col gap-4 font-sans backdrop-blur-xl select-none animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar my-auto">
      
      {/* ═════════════════════════════════════════════════════════════════════════
          TOP BAR: Stat Highlights (Máu, Sát Thương, Giáp, Tốc Độ) & Controls
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between border-b border-[#232a3b] pb-3 px-2">
        {/* 4 Core Combat Stats */}
        <div className="flex items-center gap-6 sm:gap-10 text-xs">
          {/* Health (HP) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500/30" />
            </div>
            <div>
              <p className="font-mono text-base font-black text-white leading-tight">{character.maxHp}</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Sinh lực</p>
            </div>
          </div>

          {/* Damage (ATK) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono text-base font-black text-white leading-tight">{character.atk}.0</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Sát thương</p>
            </div>
          </div>

          {/* Defense (DEF) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono text-base font-black text-white leading-tight">{character.def}.0%</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Phòng thủ</p>
            </div>
          </div>

          {/* Attack Speed (SPD) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono text-base font-black text-white leading-tight">{(character.spd * 20 + 100).toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Tốc độ đánh</p>
            </div>
          </div>
        </div>

        {/* Gold & Close Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-black text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{character.gold.toLocaleString()} Vàng</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#1c2230] hover:bg-rose-950/60 hover:text-rose-300 border border-[#2b3447] text-slate-400 transition cursor-pointer"
              title="Đóng (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          MAIN BODY: 2 Panels (Left: 12-Slot Character Showcase, Right: Grid & 8 Buttons)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[460px]">
        
        {/* ── LEFT PANEL (5 cols): 12 Equipment Slots & Character Ritual Pedestal ── */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-[#141822] border border-[#242c3d] p-4 relative overflow-hidden">
          
          {/* Rating Header */}
          <div className="text-center mb-1">
            <h4 className="font-serif text-sm font-black text-slate-200 tracking-wider">
              Lực chiến trang bị: <span className="font-mono text-cyan-300 font-black text-base drop-shadow-[0_0_8px_rgba(40,195,225,0.6)]">{equipmentRating}</span>
            </h4>
          </div>

          {/* Center Stage: Character Sprite on Magical Pedestal surrounded by 12 slots */}
          <div className="relative flex-1 flex items-center justify-between px-1 py-2">
            
            {/* 6 Left Equipment Slots */}
            <div className="flex flex-col gap-2 z-10">
              {leftSlots.map((slot) => {
                const item = slotEquippedMap[slot.key];
                const IconComponent = slot.icon;
                const isSelected = selectedItem?.id === item?.id && item !== null;

                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotClick(slot.key)}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                      item
                        ? isSelected
                          ? "bg-[#1f283b] border-cyan-400 shadow-[0_0_12px_rgba(40,195,225,0.6)] scale-105"
                          : "bg-[#181f2c] border-cyan-500/40 hover:border-cyan-300"
                        : "bg-[#161a25]/90 border-[#283144] hover:border-slate-500"
                    }`}
                    title={`${slot.name}${item ? `: ${item.name}` : " (Chưa trang bị)"}`}
                  >
                    {item ? (
                      <div className="relative flex flex-col items-center justify-center">
                        <span className="text-xl drop-shadow">{item.icon || "◇"}</span>
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#28c3e1]" />
                      </div>
                    ) : (
                      <IconComponent />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Character Showcase in Center with Ritual Circle */}
            <div className="relative flex-1 flex flex-col items-center justify-end h-full min-h-[280px]">
              {/* Rune Pedestal Circle Floor Glow */}
              <div className="absolute bottom-2 w-44 h-16 rounded-[100%] bg-gradient-to-t from-cyan-950/60 to-transparent border-t border-cyan-500/30 shadow-[0_0_30px_rgba(40,195,225,0.25)] flex items-center justify-center pointer-events-none">
                <div className="w-36 h-10 rounded-[100%] border border-cyan-400/20 animate-pulse" />
              </div>

              {/* Character Pixel/Sprite Art */}
              <div className="relative z-10 w-44 h-56 flex items-end justify-center pb-2">
                <ClassSprite
                  classId={character.classId}
                  className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Character Name & Level Plate */}
              <div className="z-10 px-3 py-1 rounded-full bg-[#111622]/90 border border-[#2b354a] text-center shadow-lg">
                <p className="text-xs font-black text-white tracking-wide">
                  {character.name} <span className="text-cyan-300 text-[10px] font-mono">Lv.{character.level}</span>
                </p>
              </div>
            </div>

            {/* 6 Right Equipment Slots */}
            <div className="flex flex-col gap-2 z-10">
              {rightSlots.map((slot) => {
                const item = slotEquippedMap[slot.key];
                const IconComponent = slot.icon;
                const isSelected = selectedItem?.id === item?.id && item !== null;

                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotClick(slot.key)}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                      item
                        ? isSelected
                          ? "bg-[#1f283b] border-cyan-400 shadow-[0_0_12px_rgba(40,195,225,0.6)] scale-105"
                          : "bg-[#181f2c] border-cyan-500/40 hover:border-cyan-300"
                        : "bg-[#161a25]/90 border-[#283144] hover:border-slate-500"
                    }`}
                    title={`${slot.name}${item ? `: ${item.name}` : " (Chưa trang bị)"}`}
                  >
                    {item ? (
                      <div className="relative flex flex-col items-center justify-center">
                        <span className="text-xl drop-shadow">{item.icon || "◇"}</span>
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#28c3e1]" />
                      </div>
                    ) : (
                      <IconComponent />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-1">
            Bấm vào ô trang bị để xem chi tiết hoặc tháo đồ
          </div>
        </div>

        {/* ── RIGHT PANEL (7 cols): 24-Slot Inventory Grid + 8 Action Buttons ── */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          
          {/* Storage (Hành Trang) / Shop View */}
          {section === "storage" ? (
            <div className="rounded-2xl bg-[#141822] border border-[#242c3d] p-3.5 flex-1 flex flex-col justify-between">
              
              {/* Inventory Header with Filter/Item Counter */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-400" /> Túi Hành Trang ({inventory.length}/24)
                </span>
                <span className="text-[11px] text-slate-400">Nhặt từ quái hoặc rèn thần binh</span>
              </div>

              {/* 24 Item Grid (6 columns x 4 rows) */}
              <div className="grid grid-cols-6 gap-2 flex-1 max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                {gridCells.map((item, idx) => {
                  if (!item) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="w-full aspect-square rounded-xl bg-[#171b26]/70 border border-[#222a3a] flex items-center justify-center text-slate-600/40 select-none"
                      >
                        <span className="text-sm">✦</span>
                      </div>
                    );
                  }

                  const isSelected = currentItem?.id === item.id;
                  const isEquipped = item.equipped;

                  // Rarity outline & glow
                  const rarityBorder = 
                    item.rarity === "legendary" ? "border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                    item.rarity === "epic" ? "border-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.3)]" :
                    item.rarity === "rare" ? "border-cyan-400/80 shadow-[0_0_10px_rgba(40,195,225,0.3)]" :
                    "border-[#2e374c]";

                  return (
                    <button
                      key={item.ownershipId || item.id || idx}
                      onClick={() => {
                        setSelectedItem(item);
                        playCombatSFX("coin_chime", 0.25);
                      }}
                      className={`relative w-full aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer border ${rarityBorder} ${
                        isSelected
                          ? "bg-[#232c3f] ring-2 ring-cyan-400 scale-105 z-10"
                          : "bg-[#181d29] hover:bg-[#1d2331]"
                      }`}
                      title={`${item.name} (${item.rarity.toUpperCase()})`}
                    >
                      <span className="text-2xl drop-shadow select-none">{item.icon || "◇"}</span>

                      {/* Equipped Badge */}
                      {isEquipped && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#28c3e1] flex items-center justify-center">
                          <Check className="w-2 h-2 text-slate-950 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Item Quick Action Bar */}
              {currentItem && (
                <div className="mt-3 p-2.5 rounded-xl bg-[#181e2b] border border-[#2b3548] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{currentItem.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate text-white flex items-center gap-1.5">
                        {currentItem.name}
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {currentItem.rarity}
                        </span>
                      </p>
                      <div className="flex gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        {currentItem.atkBoost > 0 && <span className="text-amber-300">+{currentItem.atkBoost} ATK</span>}
                        {currentItem.defBoost > 0 && <span className="text-sky-300">+{currentItem.defBoost} DEF</span>}
                        {currentItem.hpBoost > 0 && <span className="text-rose-300">+{currentItem.hpBoost} HP</span>}
                        {currentItem.spdBoost > 0 && <span className="text-emerald-300">+{currentItem.spdBoost} SPD</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={busy}
                      onClick={() => handleEnhanceItem(currentItem)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      title="Cường hóa nâng cấp chỉ số"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" /> Nâng Cấp
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => onEquip(currentItem)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                        currentItem.equipped
                          ? "bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700"
                          : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(40,195,225,0.4)]"
                      }`}
                    >
                      {currentItem.equipped ? "Tháo Ra" : "Trang Bị"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Shop View inside the same modal */
            <div className="rounded-2xl bg-[#141822] border border-[#242c3d] p-3.5 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-400" /> Cửa Hàng Thần Binh
                </span>
                <button
                  onClick={() => setSection("storage")}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  ← Về Hành Trang
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                {shopLoading ? (
                  <div className="col-span-2 py-10 text-center text-xs text-slate-400">Đang tải cửa hàng...</div>
                ) : availableItems.length === 0 ? (
                  <div className="col-span-2 py-10 text-center text-xs text-slate-400">Đã sở hữu toàn bộ trang bị trong cửa hàng!</div>
                ) : (
                  availableItems.map((item) => {
                    const locked = character.level < item.requiredLevel;
                    const canAfford = character.gold >= item.price;

                    return (
                      <div key={item.id} className="p-2.5 rounded-xl bg-[#181d29] border border-[#293245] flex items-center justify-between gap-2 hover:border-amber-400/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              {item.atkBoost > 0 && `+${item.atkBoost} ATK `}
                              {item.defBoost > 0 && `+${item.defBoost} DEF`}
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={busy || locked || !canAfford}
                          onClick={() => onBuy(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0 disabled:opacity-40"
                        >
                          <Coins className="w-3 h-3" /> {locked ? `Lv.${item.requiredLevel}` : item.price}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              LOWER HALF: 8 Navigation / Quick Action Buttons (2 rows x 4 columns)
              Matching the reference photo:
              1. Nhân vật (Character)  2. Phụ bản (Lairs)   3. Nhiệm vụ (Quests)   4. Ưu đãi (Offers/Shop)
              5. Cường hóa (Upgrades)  6. Chế tạo (Craft)    7. Mạng Xã Hội (Social) 8. Cài đặt (Settings)
          ═════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-4 gap-2">
            
            {/* 1. Nhân vật (Character Sheet) */}
            <button
              onClick={() => setActiveSubModal(activeSubModal === "stats" ? null : "stats")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                activeSubModal === "stats"
                  ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(40,195,225,0.3)]"
                  : "bg-[#161a25] hover:bg-[#1d2331] border-[#262f42] text-slate-200"
              }`}
            >
              <User className="w-5 h-5 mb-1 text-cyan-400" />
              <span className="text-[11px] font-bold">Nhân vật</span>
            </button>

            {/* 2. Phụ bản (Lairs / Dungeons) */}
            <button
              onClick={() => {
                useGameWorldStore.getState().setActiveModal("battleLog");
                useGameStore.getState().setActiveModal("battle_logs");
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#161a25] hover:bg-[#1d2331] border border-[#262f42] text-slate-200 transition-all cursor-pointer"
            >
              <Flame className="w-5 h-5 mb-1 text-rose-400" />
              <span className="text-[11px] font-bold">Phụ bản</span>
            </button>

            {/* 3. Nhiệm vụ (Quests) */}
            <button
              onClick={() => setActiveSubModal(activeSubModal === "quests" ? null : "quests")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                activeSubModal === "quests"
                  ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(40,195,225,0.3)]"
                  : "bg-[#161a25] hover:bg-[#1d2331] border-[#262f42] text-slate-200"
              }`}
            >
              <ScrollText className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-[11px] font-bold">Nhiệm vụ</span>
            </button>

            {/* 4. Ưu đãi (Offers / Shop) */}
            <button
              onClick={() => setSection(section === "shop" ? "storage" : "shop")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                section === "shop"
                  ? "bg-amber-950/40 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-[#161a25] hover:bg-[#1d2331] border-[#262f42] text-slate-200"
              }`}
            >
              <Star className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-[11px] font-bold">Ưu đãi</span>
            </button>

            {/* 5. Cường hóa (Enhance / Upgrades) */}
            <button
              onClick={() => {
                if (currentItem) {
                  handleEnhanceItem(currentItem);
                } else {
                  alert("Hãy chọn một món trang bị để cường hóa!");
                }
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#161a25] hover:bg-[#1d2331] border border-[#262f42] text-slate-200 transition-all cursor-pointer"
            >
              <ChevronsUp className="w-5 h-5 mb-1 text-emerald-400" />
              <span className="text-[11px] font-bold">Cường hóa</span>
            </button>

            {/* 6. Chế tạo (Crafting / Forge) */}
            <button
              onClick={() => setActiveSubModal(activeSubModal === "forge" ? null : "forge")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                activeSubModal === "forge"
                  ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(40,195,225,0.3)]"
                  : "bg-[#161a25] hover:bg-[#1d2331] border-[#262f42] text-slate-200"
              }`}
            >
              <Sparkles className="w-5 h-5 mb-1 text-purple-400" />
              <span className="text-[11px] font-bold">Chế tạo</span>
            </button>

            {/* 7. Mạng xã hội / Bảng vinh danh (Social / Leaderboard) */}
            <button
              onClick={() => {
                useGameWorldStore.getState().setActiveModal("leaderboard");
                useGameStore.getState().setActiveModal("leaderboard");
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#161a25] hover:bg-[#1d2331] border border-[#262f42] text-slate-200 transition-all cursor-pointer"
            >
              <Users className="w-5 h-5 mb-1 text-sky-400" />
              <span className="text-[11px] font-bold">Cộng đồng</span>
            </button>

            {/* 8. Cài đặt (Settings) */}
            <button
              onClick={() => {
                useGameWorldStore.getState().setActiveModal("settings");
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#161a25] hover:bg-[#1d2331] border border-[#262f42] text-slate-200 transition-all cursor-pointer"
            >
              <Settings className="w-5 h-5 mb-1 text-slate-300" />
              <span className="text-[11px] font-bold">Cài đặt</span>
            </button>

          </div>

        </div>

      </div>

      {/* ── Sub-Modal: Character Detailed Stats Popup ── */}
      {activeSubModal === "stats" && (
        <div className="absolute inset-x-6 top-16 bottom-6 z-30 rounded-2xl bg-[#0e121a]/95 border border-cyan-500/40 p-5 flex flex-col justify-between backdrop-blur-md shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" /> BẢNG THÔNG TIN CHI TIẾT ANH HÙNG
            </h3>
            <button onClick={() => setActiveSubModal(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40]">
              <span className="text-slate-400 block text-[10px]">SINH LỰC TỐI ĐA</span>
              <span className="text-base font-bold text-rose-400">{character.maxHp} HP</span>
            </div>
            <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40]">
              <span className="text-slate-400 block text-[10px]">CÔNG KÍCH VẬT LÝ</span>
              <span className="text-base font-bold text-amber-400">{character.atk} ATK</span>
            </div>
            <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40]">
              <span className="text-slate-400 block text-[10px]">PHÒNG THỦ GIÁP</span>
              <span className="text-base font-bold text-sky-400">{character.def} DEF</span>
            </div>
            <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40]">
              <span className="text-slate-400 block text-[10px]">TỐC ĐỘ DI CHUYỂN</span>
              <span className="text-base font-bold text-emerald-400">{character.spd} SPD</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40] text-xs">
            <p className="font-bold text-cyan-300">Đặc tính chức nghiệp: {character.className}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Trang bị thêm các món thần binh hiếm để gia tăng điểm lực chiến, mở khóa các ấn ký và đột phá cấp độ.
            </p>
          </div>

          <div className="text-right">
            <button onClick={() => setActiveSubModal(null)} className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs">
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* ── Sub-Modal: Quests Popup ── */}
      {activeSubModal === "quests" && (
        <div className="absolute inset-x-6 top-16 bottom-6 z-30 rounded-2xl bg-[#0e121a]/95 border border-amber-500/40 p-5 flex flex-col justify-between backdrop-blur-md shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-400" /> NHIỆM VỤ HÀNG NGÀY & CHIẾN TÍCH
            </h3>
            <button onClick={() => setActiveSubModal(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 my-4">
            <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Diệt quái vật Đấu Trường Hoang Dã</p>
                <p className="text-[10px] text-slate-400">Tiêu diệt quái vật bất kỳ ngoài làng an toàn (Tiến độ: Hoàn thành)</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                ✓ Nhận 50 Vàng
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#151a24] border border-[#252e40] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Thách thức Cổ Long Tộc Boss</p>
                <p className="text-[10px] text-slate-400">Tiến vào Cấm Địa Săn Boss và phá vỡ thanh Choáng Váng</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold">
                Thưởng: Rương Thần
              </span>
            </div>
          </div>

          <div className="text-right">
            <button onClick={() => setActiveSubModal(null)} className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
              Đóng bảng nhiệm vụ
            </button>
          </div>
        </div>
      )}

      {/* ── Sub-Modal: Forge / Crafting ── */}
      {activeSubModal === "forge" && (
        <div className="absolute inset-x-6 top-16 bottom-6 z-30 rounded-2xl bg-[#0e121a]/95 border border-purple-500/40 p-5 flex flex-col justify-between backdrop-blur-md shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> LÒ RÈN & CHẾ TẠO THẦN BINH
            </h3>
            <button onClick={() => setActiveSubModal(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-auto text-center space-y-3 py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl">
              ⚔️
            </div>
            <h4 className="text-sm font-black text-white">Chế Tạo Thần Binh Tối Thượng</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sử dụng các mảnh nguyên liệu rơi ra từ Boss Rồng Cổ Đại để tôi luyện vũ khí và giáp trụ cấp Thần Thoại.
            </p>
          </div>

          <div className="text-right">
            <button onClick={() => setActiveSubModal(null)} className="px-4 py-1.5 rounded-xl bg-purple-500 text-white font-black text-xs">
              Quay lại
            </button>
          </div>
        </div>
      )}

      {/* ── Enhance Success Flash Alert ── */}
      {enhanceSuccess && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-6 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-black text-xs flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.7)] animate-bounce">
          <Sparkles className="w-4 h-4" /> CƯỜNG HÓA THÀNH CÔNG! CHỈ SỐ GIA TĂNG!
        </div>
      )}

    </div>
  );
});
