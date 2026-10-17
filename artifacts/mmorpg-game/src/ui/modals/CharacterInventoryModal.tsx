// ==============================================================================
// Dark-Fantasy Ornate Modal: HÀNH TRANG & TRANG BỊ CHIẾN ĐẤU (UNIFIED MASTER EDITION)
// Hợp nhất hoàn hảo:
// - Thẩm mỹ Ảnh 1: Khung Dark Fantasy Cinema Slate Teal, Header 4 chỉ số lớn,
//   Sprite Pixel Art trên đài sen phát sáng, viền tối mờ sang trọng cho ô trống,
//   8 nút menu tính năng dưới đáy.
// - Tính năng Ảnh 2: 5 Tab phân loại (Tất Cả, Trang Bị, Tiêu Hao, Nguyên Liệu, Nhiệm Vụ),
//   30 ô đồ (6x5), 12 ô trang bị chuẩn, nút Sắp Xếp, Thùng Rác bán nhanh, Bảng chỉ số
//   chi tiết (STR/DEX/INT/LUK/VIT & ATK/DEF/Crit/ACC/EVA...), so sánh lực chiến trực quan,
//   cường hóa trang bị (+1 -> +15) tăng 10% chỉ số kèm hiệu ứng và âm thanh rực rỡ.
// ==============================================================================

import { useState, useMemo, useEffect, useCallback, memo, type ReactElement } from "react";
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
  Settings, 
  Users, 
  Flame, 
  Package, 
  User, 
  ArrowUpDown, 
  Trash2, 
  BarChart3, 
  Sparkle, 
  Plus,
  Lock,
  Unlock,
  Ticket,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ClassSprite } from "@/components/ClassSprite";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/game/useGameStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { triggerGlobalAutoSave } from "@/hooks/useCharacterAutoSave";
import type { Character, InventoryItem } from "@workspace/api-client-react";

export interface CharacterInventoryModalProps {
  character?: Character;
  inventory?: InventoryItem[];
  onEquip?: (item: InventoryItem) => void;
  onClose?: () => void;
}

export type ItemCategory = "equipment" | "consumable" | "material" | "quest";
export type ItemRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface UnifiedItem {
  id: string;
  name: string;
  category: ItemCategory;
  type: string;
  rarity: ItemRarity;
  equipped: boolean;
  icon: string;
  quantity?: number;
  enhanceLevel?: number;
  requiredLevel: number;
  atkBoost: number;
  defBoost: number;
  hpBoost: number;
  spdBoost: number;
  critBoost?: number;
  description: string;
  lore?: string;
  price: number;
}

// ── 12 Equipment Slot Silhouette SVGs (Line-art tối giản sang trọng) ──────────
function HelmetSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M12 2a8 8 0 0 0-8 8v3a6 6 0 0 0 2 4.47V21a1 1 0 0 0 1.5.86L12 19.5l4.5 2.36a1 1 0 0 0 1.5-.86v-3.53A6 6 0 0 0 20 13v-3a8 8 0 0 0-8-8z" />
      <path d="M8 12h8" />
      <path d="M12 8v4" />
      <path d="M9 15h6" />
    </svg>
  );
}

function ArmorSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M4 4l4-2h8l4 2v4a8 8 0 0 1-3 6.32V21a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-6.68A8 8 0 0 1 4 8V4z" />
      <path d="M9 2v4a3 3 0 0 0 6 0V2" />
      <path d="M4 11h16" />
      <path d="M7 16h10" />
    </svg>
  );
}

function GlovesSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M5 3h14v4l-2 14h-3.5L12 12l-1.5 9H7L5 7V3z" />
      <path d="M5 7h14" />
      <path d="M12 7v5" />
    </svg>
  );
}

function BootsSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M7 3h6v9l5 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a6 6 0 0 1 3-5.2V3z" />
      <path d="M4 16h14" />
      <path d="M6 10h6" />
    </svg>
  );
}

function BeltSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <rect x="3" y="6" width="18" height="6" rx="2" />
      <rect x="9" y="4" width="6" height="10" rx="1" />
      <path d="M10 12l2 8 2-8" />
    </svg>
  );
}

function NecklaceSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M4 4c0 6 3.5 11 8 11s8-5 8-11" />
      <circle cx="12" cy="18" r="3" />
      <path d="M12 15v-1" />
    </svg>
  );
}

function EarringSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v3" />
      <path d="M12 11l-3 4 3 6 3-6-3-4z" />
    </svg>
  );
}

function RingSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <ellipse cx="12" cy="14" rx="7" ry="5" />
      <ellipse cx="12" cy="14" rx="4" ry="2.5" />
      <path d="M9 9l3-4 3 4" />
      <circle cx="12" cy="5" r="1.5" />
    </svg>
  );
}

function WeaponSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M14.5 4l5.5 5.5-9 9-3 1 1-3 5.5-5.5" />
      <path d="M18 7.5L7.5 18" />
      <path d="M5 19l-2 2" />
      <path d="M16 2l6 6" />
    </svg>
  );
}

function ShieldSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 opacity-60">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 2v20" />
      <path d="M12 11h6" />
      <path d="M6 11h6" />
    </svg>
  );
}

// ── 12 Slots Definition ───────────────────────────────────────────────────────
export interface EquipmentSlotConfig {
  id: number;
  key: string;
  name: string;
  column: "left" | "right";
  icon: () => ReactElement;
  matchedTypes: string[];
}

const EQUIPMENT_SLOTS: EquipmentSlotConfig[] = [
  {
    id: 1,
    key: "weapon",
    name: "Vũ Khí Chính",
    column: "left",
    icon: WeaponSvg,
    matchedTypes: ["weapon", "sword", "dagger", "bow", "hammer", "blaster"],
  },
  {
    id: 2,
    key: "helmet",
    name: "Mũ Chiến Binh",
    column: "left",
    icon: HelmetSvg,
    matchedTypes: ["helmet", "helm", "crown", "cap"],
  },
  {
    id: 3,
    key: "armor",
    name: "Áo Giáp",
    column: "left",
    icon: ArmorSvg,
    matchedTypes: ["armor", "chest", "robe", "plate"],
  },
  {
    id: 4,
    key: "gloves",
    name: "Găng Tay",
    column: "left",
    icon: GlovesSvg,
    matchedTypes: ["gloves", "gauntlet", "bracer"],
  },
  {
    id: 5,
    key: "pants",
    name: "Quần Giáp",
    column: "left",
    icon: PantsSvg,
    matchedTypes: ["pants", "legs", "greaves"],
  },
  {
    id: 6,
    key: "boots",
    name: "Giày Bốt",
    column: "left",
    icon: BootsSvg,
    matchedTypes: ["boots", "shoes"],
  },
  {
    id: 7,
    key: "shield",
    name: "Vũ Khí Phụ / Khiên",
    column: "right",
    icon: ShieldSvg,
    matchedTypes: ["shield", "offhand", "dagger_off"],
  },
  {
    id: 8,
    key: "necklace",
    name: "Dây Chuyền",
    column: "right",
    icon: NecklaceSvg,
    matchedTypes: ["necklace", "amulet", "pendant"],
  },
  {
    id: 9,
    key: "earring",
    name: "Hoa Tai",
    column: "right",
    icon: EarringSvg,
    matchedTypes: ["earring"],
  },
  {
    id: 10,
    key: "ring1",
    name: "Nhẫn Thần Binh 1",
    column: "right",
    icon: RingSvg,
    matchedTypes: ["ring1", "ring"],
  },
  {
    id: 11,
    key: "ring2",
    name: "Nhẫn Ma Pháp 2",
    column: "right",
    icon: RingSvg,
    matchedTypes: ["ring2", "ring"],
  },
  {
    id: 12,
    key: "belt",
    name: "Thắt Lưng",
    column: "right",
    icon: BeltSvg,
    matchedTypes: ["belt", "sash"],
  },
];

// ── 5 Tabs Configuration ──────────────────────────────────────────────────────
const INVENTORY_TABS = [
  { id: "all", label: "Tất Cả", icon: "📦" },
  { id: "equipment", label: "Trang Bị", icon: "⚔️" },
  { id: "consumable", label: "Tiêu Hao", icon: "🧪" },
  { id: "material", label: "Nguyên Liệu", icon: "💎" },
  { id: "quest", label: "Nhiệm Vụ", icon: "📜" },
] as const;

export type TabType = typeof INVENTORY_TABS[number]["id"];

// ── Initial Mock Items Pool ───────────────────────────────────────────────────
const INITIAL_MOCK_ITEMS: UnifiedItem[] = [
  // Equipped Gear
  {
    id: "item-dragon-blade",
    name: "Hắc Long Kiếm",
    category: "equipment",
    type: "weapon",
    rarity: "epic",
    equipped: true,
    icon: "⚔️",
    enhanceLevel: 3,
    requiredLevel: 7,
    atkBoost: 32,
    defBoost: 8,
    hpBoost: 45,
    spdBoost: 12,
    critBoost: 15,
    description: "Thần kiếm luyện từ vảy Hắc Long tỏa luồng sát khí ngập trời.",
    lore: "Vũ khí gắn liền với chiến tích trảm long đoạt soái nơi chiến trường cổ.",
    price: 350,
  },
  {
    id: "item-shield-fortress",
    name: "Khiên Pháo Đài",
    category: "equipment",
    type: "shield",
    rarity: "rare",
    equipped: true,
    icon: "🛡️",
    enhanceLevel: 1,
    requiredLevel: 5,
    atkBoost: 6,
    defBoost: 24,
    hpBoost: 55,
    spdBoost: 0,
    critBoost: 0,
    description: "Tấm khiên kim loại hạng nặng giảm 25% sát thương nhận vào.",
    lore: "Đúc từ quặng thép lãnh nguyên không thể xuyên thủng.",
    price: 180,
  },
  {
    id: "item-dark-armor",
    name: "Chiến Giáp Dạ Xoa",
    category: "equipment",
    type: "armor",
    rarity: "legendary",
    equipped: true,
    icon: "🥋",
    enhanceLevel: 2,
    requiredLevel: 7,
    atkBoost: 16,
    defBoost: 35,
    hpBoost: 120,
    spdBoost: 6,
    critBoost: 5,
    description: "Chiến bào dệt từ sợi tơ quỷ, gia tăng sinh lực và thể phách tột bậc.",
    lore: "Trang phục của thủ lĩnh dạ xoa từng trấn áp biên cương vạn năm.",
    price: 600,
  },
  {
    id: "item-iron-helm",
    name: "Mũ Sắt Chiến Binh",
    category: "equipment",
    type: "helmet",
    rarity: "common",
    equipped: true,
    icon: "🪖",
    enhanceLevel: 0,
    requiredLevel: 3,
    atkBoost: 4,
    defBoost: 10,
    hpBoost: 25,
    spdBoost: 0,
    critBoost: 0,
    description: "Mũ bảo hộ tiêu chuẩn dành cho tân binh gia nhập quân đoàn.",
    lore: "Bền bỉ và đáng tin cậy trong mọi phong ba bão táp.",
    price: 60,
  },
  {
    id: "item-god-gloves",
    name: "Găng Tay Hộ Thần",
    category: "equipment",
    type: "gloves",
    rarity: "rare",
    equipped: true,
    icon: "🧤",
    enhanceLevel: 1,
    requiredLevel: 6,
    atkBoost: 10,
    defBoost: 12,
    hpBoost: 30,
    spdBoost: 8,
    critBoost: 4,
    description: "Bao tay bọc thép trợ lực tung đòn đánh nhanh và chính xác hơn.",
    lore: "Được khắc cổ tự ban phước bởi các giáo sĩ hoàng gia.",
    price: 210,
  },
  {
    id: "item-shadow-boots",
    name: "Giày Phong Ma",
    category: "equipment",
    type: "boots",
    rarity: "epic",
    equipped: true,
    icon: "🥾",
    enhanceLevel: 2,
    requiredLevel: 7,
    atkBoost: 8,
    defBoost: 12,
    hpBoost: 25,
    spdBoost: 20,
    critBoost: 6,
    description: "Đôi giày lướt gió giúp di chuyển nhẹ nhàng như chiếc bóng đêm.",
    lore: "Từng thuộc về sát thủ nhanh nhất lịch sử vương triều.",
    price: 320,
  },
  {
    id: "item-ice-necklace",
    name: "Dây Chuyền Băng Ngọc",
    category: "equipment",
    type: "necklace",
    rarity: "epic",
    equipped: true,
    icon: "📿",
    enhanceLevel: 1,
    requiredLevel: 6,
    atkBoost: 14,
    defBoost: 8,
    hpBoost: 45,
    spdBoost: 4,
    critBoost: 10,
    description: "Viên bảo ngọc tỏa ra luồng khí hàn băng làm dịu cơn thịnh nộ.",
    lore: "Khai thác từ đỉnh núi tuyết vĩnh cửu ngàn năm không tan.",
    price: 290,
  },
  {
    id: "item-hero-ring",
    name: "Nhẫn Thần Binh",
    category: "equipment",
    type: "ring1",
    rarity: "legendary",
    equipped: true,
    icon: "💍",
    enhanceLevel: 4,
    requiredLevel: 8,
    atkBoost: 22,
    defBoost: 12,
    hpBoost: 60,
    spdBoost: 5,
    critBoost: 14,
    description: "Nhẫn thần khảm tinh thạch hỏa long, khuếch đại uy lực chiêu thức.",
    lore: "Tín vật định ước giữa các bậc dũng sĩ vương giả.",
    price: 650,
  },

  // Bag Equipment for comparison
  {
    id: "item-thunder-hammer",
    name: "Búa Sấm Sét",
    category: "equipment",
    type: "weapon",
    rarity: "rare",
    equipped: false,
    icon: "🔨",
    enhanceLevel: 0,
    requiredLevel: 6,
    atkBoost: 24,
    defBoost: 14,
    hpBoost: 40,
    spdBoost: 4,
    critBoost: 8,
    description: "Chiến búa nung trong lò lôi đình giáng đòn choáng váng diện rộng.",
    lore: "Sấm sét vẫn còn kêu lách tách mỗi khi vung lên.",
    price: 220,
  },
  {
    id: "item-shadow-cloak",
    name: "Áo Choàng Bóng Tối",
    category: "equipment",
    type: "armor",
    rarity: "epic",
    equipped: false,
    icon: "🧥",
    enhanceLevel: 1,
    requiredLevel: 7,
    atkBoost: 12,
    defBoost: 28,
    hpBoost: 95,
    spdBoost: 12,
    critBoost: 8,
    description: "Áo choàng tàng hình giảm khả năng bị quái phát hiện.",
    lore: "Dệt từ bóng đêm nguyên bản của vực thẳm vô tận.",
    price: 420,
  },
  {
    id: "item-titan-belt",
    name: "Thắt Lưng Titan",
    category: "equipment",
    type: "belt",
    rarity: "common",
    equipped: false,
    icon: "🎗️",
    enhanceLevel: 0,
    requiredLevel: 4,
    atkBoost: 2,
    defBoost: 10,
    hpBoost: 30,
    spdBoost: 0,
    critBoost: 0,
    description: "Dây đai chắc chắn bằng da thú gia cố bản kim loại.",
    lore: "Trang bị thường thấy của lính tuần tra phương bắc.",
    price: 80,
  },

  // Consumables (Tiêu hao)
  {
    id: "item-holy-hp-potion",
    name: "Bình Máu Thánh (L)",
    category: "consumable",
    type: "potion_hp",
    rarity: "rare",
    equipped: false,
    icon: "🧪",
    quantity: 8,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 250,
    spdBoost: 0,
    description: "Hồi phục ngay lập tức 250 điểm Sinh Lực (HP).",
    lore: "Nước thánh cô đặc chưng cất bởi đền thờ Ánh Sáng.",
    price: 40,
  },
  {
    id: "item-magic-mp-potion",
    name: "Bình Năng Lượng (L)",
    category: "consumable",
    type: "potion_mp",
    rarity: "rare",
    equipped: false,
    icon: "⚗️",
    quantity: 12,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Hồi phục ngay lập tức 100 điểm Nội Lực (MP / PP).",
    lore: "Dung dịch tinh khiết ngưng tụ từ suối nguồn ma thuật.",
    price: 35,
  },
  {
    id: "item-atk-scroll",
    name: "Cuộn Sách Tăng Công",
    category: "consumable",
    type: "scroll",
    rarity: "epic",
    equipped: false,
    icon: "📜",
    quantity: 5,
    enhanceLevel: 0,
    requiredLevel: 5,
    atkBoost: 30,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Tăng 25% Sát Thương toàn diện trong 60 giây.",
    lore: "Ấn chú thượng cổ kích hoạt bản năng chiến đấu cuồng nộ.",
    price: 90,
  },
  {
    id: "item-roasted-dragon-meat",
    name: "Thịt Rồng Nướng",
    category: "consumable",
    type: "food",
    rarity: "rare",
    equipped: false,
    icon: "🍖",
    quantity: 4,
    enhanceLevel: 0,
    requiredLevel: 3,
    atkBoost: 5,
    defBoost: 10,
    hpBoost: 500,
    spdBoost: 0,
    description: "Món ăn cao lương mỹ vị hồi 500 HP và tăng phòng thủ trong 3 phút.",
    lore: "Nướng trên ngọn lửa thiêng cùng thảo mộc quý hiếm.",
    price: 75,
  },

  // Materials (Nguyên liệu)
  {
    id: "item-dark-enhance-stone",
    name: "Đá Cường Hóa Hắc Kim",
    category: "material",
    type: "material",
    rarity: "epic",
    equipped: false,
    icon: "💎",
    quantity: 15,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Đá quý chứa ma lực dùng để đập đồ nâng cấp trang bị lên mốc cao.",
    lore: "Khai quật từ lòng đất sâu nơi long mạch hội tụ.",
    price: 150,
  },
  {
    id: "item-dragon-scale",
    name: "Vảy Hỏa Long",
    category: "material",
    type: "material",
    rarity: "legendary",
    equipped: false,
    icon: "🛡️",
    quantity: 4,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Nguyên liệu chế tạo thần binh và áo giáp tối thượng của Long Tộc.",
    lore: "Rơi ra khi đánh bại Boss Hỏa Long ngàn năm.",
    price: 500,
  },
  {
    id: "item-magic-crystal",
    name: "Tinh Thể Ma Lực",
    category: "material",
    type: "material",
    rarity: "rare",
    equipped: false,
    icon: "🔮",
    quantity: 22,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Khoáng thạch xanh ngọc lấp lánh dùng trong mọi công thức tinh luyện.",
    lore: "Lắng đọng từ tinh hoa nhật nguyệt nơi thung lũng sương mù.",
    price: 60,
  },

  // Quest items (Nhiệm vụ)
  {
    id: "item-royal-letter",
    name: "Thư Mật Hoàng Gia",
    category: "quest",
    type: "quest",
    rarity: "rare",
    equipped: false,
    icon: "✉️",
    quantity: 1,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Bức mật thư phong ấn bằng sáp đỏ của Quốc Vương gửi Đại Tướng Quân.",
    lore: "Chỉ người có ấn tín vương giả mới được phép mở ra.",
    price: 0,
  },
  {
    id: "item-dungeon-key",
    name: "Chìa Khóa Hầm Ngục",
    category: "quest",
    type: "quest",
    rarity: "epic",
    equipped: false,
    icon: "🗝️",
    quantity: 1,
    enhanceLevel: 0,
    requiredLevel: 7,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Chìa khóa cổ dùng để mở cổng tiến vào Hầm Ngục Rồng Cổ Đại.",
    lore: "Đúc từ hợp kim không thể bị phá hủy bởi thời gian.",
    price: 0,
  },
  {
    id: "item-dragon-badge",
    name: "Huy Hiệu Long Tộc",
    category: "quest",
    type: "quest",
    rarity: "legendary",
    equipped: false,
    icon: "🏅",
    quantity: 1,
    enhanceLevel: 0,
    requiredLevel: 1,
    atkBoost: 0,
    defBoost: 0,
    hpBoost: 0,
    spdBoost: 0,
    description: "Huy hiệu vinh dự minh chứng dũng sĩ đã vượt qua thử thách Long Môn.",
    lore: "Trao cho những bậc anh hùng kiệt xuất nhất nhân gian.",
    price: 0,
  },
];

// ── Rarity Color Scheme ───────────────────────────────────────────────────────
function getRarityColor(rarity: ItemRarity) {
  switch (rarity) {
    case "mythic":
      return {
        border: "border-rose-500",
        bg: "bg-[#2a171d]",
        glow: "shadow-[0_0_15px_rgba(244,63,94,0.5)]",
        text: "text-rose-400",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    case "legendary":
      return {
        border: "border-amber-400",
        bg: "bg-[#261f18]",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.45)]",
        text: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    case "epic":
      return {
        border: "border-purple-400",
        bg: "bg-[#20182e]",
        glow: "shadow-[0_0_12px_rgba(168,85,247,0.4)]",
        text: "text-purple-400",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      };
    case "rare":
      return {
        border: "border-cyan-400",
        bg: "bg-[#17202f]",
        glow: "shadow-[0_0_12px_rgba(40,195,225,0.4)]",
        text: "text-cyan-400",
        badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      };
    default:
      return {
        border: "border-slate-700",
        bg: "bg-[#161c28]",
        glow: "",
        text: "text-slate-300",
        badge: "bg-slate-700/30 text-slate-400 border-slate-600/40",
      };
  }
}

function getRarityLabel(rarity: ItemRarity): string {
  switch (rarity) {
    case "mythic":
      return "Thần Khí";
    case "legendary":
      return "Thần Thoại";
    case "epic":
      return "Sử Thi";
    case "rare":
      return "Hiếm";
    default:
      return "Phổ Biến";
  }
}

function getEquipmentSlotName(slotType: string): string {
  const t = (slotType || "").toLowerCase();
  if (t.includes("weapon") || t.includes("sword") || t.includes("dagger") || t.includes("bow") || t.includes("hammer") || t.includes("blaster")) return "Vũ Khí Chính";
  if (t.includes("helm") || t.includes("cap") || t.includes("crown")) return "Mũ Chiến";
  if (t.includes("armor") || t.includes("chest") || t.includes("robe") || t.includes("plate")) return "Áo Giáp";
  if (t.includes("gloves") || t.includes("gauntlet") || t.includes("bracer")) return "Găng Tay";
  if (t.includes("pants") || t.includes("legs") || t.includes("greaves")) return "Quần Giáp";
  if (t.includes("boots") || t.includes("shoes")) return "Giày Bốt";
  if (t.includes("shield") || t.includes("offhand")) return "Vũ Khí Phụ / Khiên";
  if (t.includes("necklace") || t.includes("amulet") || t.includes("pendant")) return "Dây Chuyền";
  if (t.includes("earring")) return "Hoa Tai";
  if (t.includes("ring")) return "Nhẫn Giới Chỉ";
  if (t.includes("belt") || t.includes("sash")) return "Thắt Lưng";
  if (t.includes("ticket")) return "Phiếu Mở Rộng";
  if (t.includes("potion")) return "Dược Phẩm";
  if (t.includes("food")) return "Thực Phẩm";
  if (t.includes("material") || t.includes("stone")) return "Nguyên Liệu";
  return "Vật Phẩm";
}

function mapBackendItemToUnified(it: any): UnifiedItem {
  return {
    id: String(it.ownershipId || it.id),
    name: it.name || "Vật phẩm",
    category: it.category || (it.type === "weapon" || it.type === "armor" || it.type === "accessory" ? "equipment" : "consumable"),
    type: it.type || (it.equipSlot ? it.equipSlot : "weapon"),
    rarity: (it.rarity as ItemRarity) || "common",
    equipped: Boolean(it.equipped),
    icon: it.icon || (it.category === "consumable" ? "🧪" : "⚔️"),
    quantity: it.quantity || 1,
    enhanceLevel: it.enhanceLevel || 0,
    requiredLevel: it.requiredLevel || 1,
    atkBoost: it.atkBoost || 0,
    defBoost: it.defBoost || 0,
    hpBoost: it.hpBoost || 0,
    spdBoost: it.spdBoost || 0,
    critBoost: it.critRateBoost || 0,
    description: it.description || "",
    lore: it.lore || it.description || "",
    price: it.price || 50,
  };
}

export function getStarterItemsForClass(classId: string = "fighter"): UnifiedItem[] {
  const cid = (classId || "fighter").toLowerCase();
  
  let weaponName = "Quyền Giáp Hỏa Long (Tân Thủ)";
  let weaponType = "weapon";
  let weaponIcon = "🥊";
  let weaponAtk = 14;
  let weaponSpd = 2;
  let weaponCrit = 4;

  if (cid.includes("tank") || cid.includes("ho_ve")) {
    weaponName = "Trọng Búa Thánh Quang (Tân Thủ)";
    weaponIcon = "🔨";
    weaponAtk = 10;
    weaponSpd = 0;
    weaponCrit = 2;
  } else if (cid.includes("assassin") || cid.includes("sat_thu")) {
    weaponName = "Song Đao Bóng Tối (Tân Thủ)";
    weaponIcon = "🗡️";
    weaponAtk = 16;
    weaponSpd = 4;
    weaponCrit = 8;
  } else if (cid.includes("gunner") || cid.includes("xa_thu")) {
    weaponName = "Súng Plasma Mk-I (Tân Thủ)";
    weaponIcon = "🔫";
    weaponAtk = 15;
    weaponSpd = 3;
    weaponCrit = 6;
  }

  return [
    // 1. Vũ Khí Chính (Đang Mặc)
    {
      id: `starter-${cid}-weapon`,
      name: weaponName,
      category: "equipment",
      type: weaponType,
      rarity: "common",
      equipped: true,
      icon: weaponIcon,
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: weaponAtk,
      defBoost: 2,
      hpBoost: 20,
      spdBoost: weaponSpd,
      critBoost: weaponCrit,
      description: "Vũ khí nhập môn tiêu chuẩn được rèn từ quặng thép Làng Long Tộc.",
      lore: "Bảo khí sơ cấp cho anh hùng bắt đầu hành trình trừ gian diệt bạo.",
      price: 50,
    },
    // 2. Mũ Chiến Binh (Đang Mặc)
    {
      id: `starter-${cid}-helm`,
      name: "Mũ Sắt Tân Thủ",
      category: "equipment",
      type: "helmet",
      rarity: "common",
      equipped: true,
      icon: "🪖",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 0,
      defBoost: 5,
      hpBoost: 25,
      spdBoost: 0,
      critBoost: 0,
      description: "Mũ bảo hộ tiêu chuẩn giúp che chắn khỏi những đòn chí mạng ban đầu.",
      lore: "Đúc bằng đồng thau dày dặn nơi xưởng rèn Long Vương Điện.",
      price: 40,
    },
    // 3. Áo Giáp (Đang Mặc)
    {
      id: `starter-${cid}-armor`,
      name: "Chiến Giáp Tân Thủ",
      category: "equipment",
      type: "armor",
      rarity: "common",
      equipped: true,
      icon: "🥋",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 2,
      defBoost: 8,
      hpBoost: 40,
      spdBoost: 0,
      critBoost: 0,
      description: "Áo giáp sơ cấp làm từ da thú bọc vảy sắt kiên cố.",
      lore: "Trang bị nhập môn của mọi tân binh quân đoàn Long Tộc.",
      price: 50,
    },
    // 4. Găng Tay (Đang Mặc)
    {
      id: `starter-${cid}-gloves`,
      name: "Găng Tay Tân Binh",
      category: "equipment",
      type: "gloves",
      rarity: "common",
      equipped: true,
      icon: "🧤",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 4,
      defBoost: 3,
      hpBoost: 15,
      spdBoost: 1,
      critBoost: 2,
      description: "Găng tay da đệm thép tăng độ bám và lực vung vũ khí.",
      lore: "Đường chỉ may tỉ mỉ của các bậc thầy da thủ.",
      price: 35,
    },
    // 5. Quần Giáp (Đang Mặc)
    {
      id: `starter-${cid}-pants`,
      name: "Quần Giáp Tân Thủ",
      category: "equipment",
      type: "pants",
      rarity: "common",
      equipped: true,
      icon: "👖",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 0,
      defBoost: 6,
      hpBoost: 25,
      spdBoost: 0,
      critBoost: 0,
      description: "Quần giáp vải thô bọc đệm gối sắt bảo vệ chân khi chiến đấu.",
      lore: "Nhẹ nhàng và linh hoạt cho mọi bước di chuyển trên địa hình gồ ghề.",
      price: 40,
    },
    // 6. Giày Bốt (Đang Mặc)
    {
      id: `starter-${cid}-boots`,
      name: "Giày Chiến Tân Thủ",
      category: "equipment",
      type: "boots",
      rarity: "common",
      equipped: true,
      icon: "🥾",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 0,
      defBoost: 3,
      hpBoost: 15,
      spdBoost: 3,
      critBoost: 1,
      description: "Đôi giày đế da dày giúp tăng tốc độ di chuyển trên thảo nguyên.",
      lore: "Thích hợp cho những chặng đường hành quân dài ngày.",
      price: 35,
    },
    // 7. Vũ Khí Phụ / Khiên (Đang Mặc)
    {
      id: `starter-${cid}-shield`,
      name: "Khiên Gỗ Tân Thủ",
      category: "equipment",
      type: "shield",
      rarity: "common",
      equipped: true,
      icon: "🛡️",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 1,
      defBoost: 6,
      hpBoost: 25,
      spdBoost: 0,
      critBoost: 0,
      description: "Tấm khiên gỗ sồi gia cố đinh đồng giảm sát thương cận chiến.",
      lore: "Vật bất ly thân của các dũng sĩ phòng ngự.",
      price: 40,
    },
    // 8. Dây Chuyền (Đang Mặc)
    {
      id: `starter-${cid}-necklace`,
      name: "Dây Chuyền Hộ Mệnh",
      category: "equipment",
      type: "necklace",
      rarity: "common",
      equipped: true,
      icon: "📿",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 2,
      defBoost: 2,
      hpBoost: 30,
      spdBoost: 1,
      critBoost: 2,
      description: "Chuỗi hạt khắc thần chú cầu phúc bình an từ Trưởng Làng.",
      lore: "Tỏa ra hơi ấm nhè nhẹ xua tan tà khí ban đêm.",
      price: 40,
    },
    // 9. Nhẫn Thần Binh 1 (Đang Mặc)
    {
      id: `starter-${cid}-ring1`,
      name: "Nhẫn Đồng Cổ",
      category: "equipment",
      type: "ring1",
      rarity: "common",
      equipped: true,
      icon: "💍",
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 3,
      defBoost: 2,
      hpBoost: 15,
      spdBoost: 0,
      critBoost: 3,
      description: "Chiếc nhẫn đồng rèn thô gia tăng nội công cho người đeo.",
      lore: "Nhặt được từ phế tích ven dòng sông Hắc Long.",
      price: 35,
    },
    // 10. Phiếu Tăng Hành Trang x2 (Trong túi, dùng được)
    {
      id: "starter-ticket-expand",
      name: "Phiếu Tăng Hành Trang",
      category: "consumable",
      type: "inventory_ticket",
      rarity: "rare",
      equipped: false,
      icon: "🎫",
      quantity: 2,
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 0,
      defBoost: 0,
      hpBoost: 0,
      spdBoost: 0,
      critBoost: 0,
      description: "Vật phẩm thương hội quý giá. Bấm 'Sử Dụng' để mở rộng thêm +5 ô chứa hành trang (tối đa 30 ô).",
      lore: "Thẻ bài có khắc ấn hoa văn Long Tộc, biểu trưng cho sự thăng tiến sức chứa.",
      price: 200,
    },
    // 11. Bình Máu Tân Thủ x5 (Trong túi)
    {
      id: "starter-potion-hp",
      name: "Bình Máu Tân Thủ",
      category: "consumable",
      type: "potion_hp",
      rarity: "common",
      equipped: false,
      icon: "🧪",
      quantity: 5,
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 0,
      defBoost: 0,
      hpBoost: 150,
      spdBoost: 0,
      critBoost: 0,
      description: "Hồi phục 150 HP ngay lập tức khi sử dụng.",
      lore: "Dược phương sơ cấp được điều chế từ thảo dược thần thánh quanh Làng Long Tộc.",
      price: 20,
    },
    // 12. Bình Mana Tân Thủ x5 (Trong túi)
    {
      id: "starter-potion-mp",
      name: "Bình Mana Tân Thủ",
      category: "consumable",
      type: "potion_mp",
      rarity: "common",
      equipped: false,
      icon: "💧",
      quantity: 5,
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 0,
      defBoost: 0,
      hpBoost: 0,
      spdBoost: 0,
      critBoost: 0,
      description: "Hồi phục năng lượng và nội lực tức thì.",
      lore: "Nước tăng lực ma pháp tinh khiết chắt lọc từ suối nguồn thần.",
      price: 25,
    },
    // 13. Thịt Nướng Long Tộc x3 (Trong túi)
    {
      id: "starter-food-grill",
      name: "Thịt Nướng Long Tộc",
      category: "consumable",
      type: "food",
      rarity: "common",
      equipped: false,
      icon: "🍖",
      quantity: 3,
      enhanceLevel: 0,
      requiredLevel: 1,
      atkBoost: 10,
      defBoost: 0,
      hpBoost: 200,
      spdBoost: 0,
      critBoost: 0,
      description: "Thịt nướng thơm lừng tăng sinh lực và tăng thêm 10 ATK trong 5 phút.",
      lore: "Món ăn yêu thích của các chiến binh sau mỗi trận thắng dã ngoại.",
      price: 30,
    },
  ];
}

// ── Unified Bag Grid Engine: Synchronized 30 Slots across ALL 5 Tabs ────────
export function buildSynchronizedInventoryGrid(
  items: UnifiedItem[],
  activeTab: TabType,
  unlockedSlots: number,
  totalCapacity: number = 30
): { item: UnifiedItem | null; isLocked: boolean; slotIndex: number }[] {
  // Only unequipped items exist in the bag grid!
  const bagItems = items.filter((it) => !it.equipped);
  const cells: { item: UnifiedItem | null; isLocked: boolean; slotIndex: number }[] = [];

  if (activeTab === "all") {
    // Tab "Tất Cả": Show items by slotIndex if valid, or fill in order
    const slotMap = new Map<number, UnifiedItem>();
    const unindexed: UnifiedItem[] = [];

    for (const it of bagItems) {
      const idx = (it as any).slotIndex;
      if (typeof idx === "number" && idx >= 0 && idx < unlockedSlots && !slotMap.has(idx)) {
        slotMap.set(idx, it);
      } else {
        unindexed.push(it);
      }
    }

    let fillPtr = 0;
    for (const it of unindexed) {
      while (fillPtr < unlockedSlots && slotMap.has(fillPtr)) fillPtr++;
      if (fillPtr < unlockedSlots) {
        slotMap.set(fillPtr, it);
      }
    }

    for (let i = 0; i < totalCapacity; i++) {
      if (i >= unlockedSlots) {
        cells.push({ item: null, isLocked: true, slotIndex: i });
      } else {
        cells.push({ item: slotMap.get(i) || null, isLocked: false, slotIndex: i });
      }
    }
  } else {
    // Filtered tab (Trang Bị, Tiêu Hao, Nguyên Liệu, Nhiệm Vụ)
    const filtered = bagItems.filter((it) => it.category === activeTab);
    for (let i = 0; i < totalCapacity; i++) {
      if (i >= unlockedSlots) {
        // Vùng 2: Locked slots identical across ALL 5 tabs
        cells.push({ item: null, isLocked: true, slotIndex: i });
      } else {
        cells.push({ item: filtered[i] || null, isLocked: false, slotIndex: i });
      }
    }
  }

  return cells;
}

// ── Master Component ──────────────────────────────────────────────────────────
export const CharacterInventoryModal = memo(function CharacterInventoryModal({
  character: propChar,
  inventory: propInv,
  onEquip: propOnEquip,
  onClose: propOnClose,
}: CharacterInventoryModalProps) {
  // Store bindings
  const closeWorldModal = useGameWorldStore((s) => s.closeActiveModal);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassName = useGameWorldStore((s) => s.playerClassName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const playerGender = useGameWorldStore((s) => s.playerGender);
  const addGold = useGameWorldStore((s) => s.addGold);
  const healPlayer = useGameWorldStore((s) => s.healPlayer);
  const playerStoreGold = useGameStore((s) => s.player?.gold);

  // Effective character and storage keys
  const effectiveCharId = propChar?.id || (useGameWorldStore.getState().activeCharacterId) || playerName || "hero_default";
  const storageKey = `clb_inventory_${effectiveCharId}`;
  const slotsKey = `clb_unlocked_slots_${effectiveCharId}`;

  // Fallbacks
  const effectiveName = propChar?.name || playerName || "DạXoa_70";
  const effectiveLevel = propChar?.level || playerLevel || 1;
  const effectiveGold = playerGold || playerStoreGold || 0;
  const effectiveClassId = propChar?.classId || playerClassId || "sat_thu";

  // Dynamic class title badge
  const classTitle = useMemo(() => {
    const id = effectiveClassId.toLowerCase();
    if (id.includes("sat_thu") || id.includes("assassin")) return "★ Ảnh Vũ Đoạt Hồn ★";
    if (id.includes("ho_ve") || id.includes("tank")) return "★ Thượng Cấp Đỡ Đòn ★";
    if (id.includes("xa_thu") || id.includes("gunner")) return "★ Thần Xạ Cơ Giới ★";
    return "★ Hậu Duệ Long Thần ★";
  }, [effectiveClassId]);

  // Max Unlocked Slots: starts at 15, max 30, expanded with tickets or 500 gold
  const [maxUnlockedSlots, setMaxUnlockedSlots] = useState<number>(() => {
    const charUnlocked = (propChar as any)?.unlockedSlots;
    if (charUnlocked && charUnlocked >= 15 && charUnlocked <= 30) {
      return charUnlocked;
    }
    const worldSlots = useGameWorldStore.getState().unlockedSlots;
    if (worldSlots && worldSlots >= 15 && worldSlots <= 30) return worldSlots;
    try {
      const saved = localStorage.getItem(slotsKey);
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 15 && num <= 30) return num;
      }
    } catch (e) {}
    return 15; // Mặc định 15 ô chuẩn yêu cầu
  });

  const [isSidePanel, setIsSidePanel] = useState(false);

  // Items State (100% empty starter inventory when new character has 0 items)
  const [items, setItems] = useState<UnifiedItem[]>(() => {
    if (propInv) {
      return propInv.map(mapBackendItemToUnified);
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  // Sync when propInv or character changes from backend
  useEffect(() => {
    if (propInv) {
      setItems(propInv.map(mapBackendItemToUnified));
    }
  }, [propInv]);

  useEffect(() => {
    const charUnlocked = (propChar as any)?.unlockedSlots;
    if (charUnlocked) {
      setMaxUnlockedSlots(charUnlocked);
    }
  }, [(propChar as any)?.unlockedSlots]);

  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(() => items[0] || null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [leftViewMode, setLeftViewMode] = useState<"character" | "stats">("character");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [enhanceSparkle, setEnhanceSparkle] = useState<boolean>(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);

  // Sync items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {}
  }, [items, storageKey]);

  // Sync unlocked slots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(slotsKey, String(maxUnlockedSlots));
    } catch (e) {}
  }, [maxUnlockedSlots, slotsKey]);

  // Toast trigger helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // Close handler
  const handleClose = () => {
    if (propOnClose) propOnClose();
    else closeWorldModal();
  };

  // Count available expansion tickets
  const expansionTicketCount = useMemo(() => {
    return items
      .filter((it) => it.type === "inventory_ticket" || it.id.includes("ticket") || it.name.includes("Phiếu Tăng Hành Trang"))
      .reduce((sum, it) => sum + (it.quantity || 1), 0);
  }, [items]);

  // 12 Slots Equipped Map (Null if nothing equipped)
  const slotEquippedMap = useMemo(() => {
    const map: Record<string, UnifiedItem | null> = {};
    EQUIPMENT_SLOTS.forEach((slot) => {
      const found = items.find(
        (it) => it.equipped && slot.matchedTypes.some((t) => it.type.toLowerCase().includes(t))
      );
      map[slot.key] = found || null;
    });
    return map;
  }, [items]);

  // Calculate Equipment Gear Rating (Lực chiến trang bị, 0 if nothing equipped)
  const equipmentRating = useMemo(() => {
    return items
      .filter((it) => it.equipped)
      .reduce((acc, it) => {
        const enhanceMul = 1 + (it.enhanceLevel || 0) * 0.1;
        const atkVal = (it.atkBoost || 0) * enhanceMul * 2.2;
        const defVal = (it.defBoost || 0) * enhanceMul * 1.8;
        const hpVal = (it.hpBoost || 0) * enhanceMul * 0.4;
        const spdVal = (it.spdBoost || 0) * 1.5;
        const critVal = (it.critBoost || 0) * 2.5;
        return acc + atkVal + defVal + hpVal + spdVal + critVal;
      }, 0);
  }, [items]);

  // Calculate Aggregated Core Stats
  const aggregatedStats = useMemo(() => {
    let atk = 72;
    let def = 14;
    let hp = playerHealth > 0 ? playerHealth : 2330;
    let spd = 1480;

    items.filter((it) => it.equipped).forEach((it) => {
      const enhanceMul = 1 + (it.enhanceLevel || 0) * 0.1;
      atk += Math.round((it.atkBoost || 0) * enhanceMul);
      def += Math.round((it.defBoost || 0) * enhanceMul);
      hp += Math.round((it.hpBoost || 0) * enhanceMul);
      spd += Math.round((it.spdBoost || 0) * 10);
    });

    return {
      atk,
      def,
      hp,
      spd,
    };
  }, [items, playerHealth]);

  // Total Bag Items count (only unequipped items)
  const bagItems = useMemo(() => items.filter((it) => !it.equipped), [items]);
  const bagItemsCount = bagItems.length;

  // Unified Bag Grid Engine: Synchronized 30 Cells
  const gridCells = useMemo(() => {
    return buildSynchronizedInventoryGrid(items, activeTab, maxUnlockedSlots, 30);
  }, [items, activeTab, maxUnlockedSlots]);

  // Equip / Unequip Toggle
  const handleToggleEquip = async (target: UnifiedItem) => {
    if (target.category !== "equipment") return;
    playCombatSFX("holy_bell", 0.4);

    const isEquipping = !target.equipped;

    if (!isEquipping) {
      // Unequipping: Check bag capacity first
      const currentBagItems = items.filter((it) => !it.equipped);
      if (currentBagItems.length >= maxUnlockedSlots) {
        playCombatSFX("laser_pew", 0.3);
        showToast("Túi hành trang đã đầy, vui lòng dọn bớt hoặc mở khóa thêm ô!");
        return;
      }

      // Find lowest free slotIndex in 0..maxUnlockedSlots - 1
      const takenSlots = new Set(
        currentBagItems
          .map((it) => (it as any).slotIndex)
          .filter((s) => typeof s === "number" && s >= 0 && s < maxUnlockedSlots)
      );
      let freeSlot = 0;
      while (freeSlot < maxUnlockedSlots && takenSlots.has(freeSlot)) {
        freeSlot++;
      }
      if (freeSlot >= maxUnlockedSlots) freeSlot = 0;

      setItems((prev) => {
        const next = prev.map((it) => {
          if (it.id === target.id) {
            return { ...it, equipped: false, slotIndex: freeSlot };
          }
          return it;
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setSelectedItem((prev) => (prev && prev.id === target.id ? { ...prev, equipped: false, slotIndex: freeSlot } : prev));
      showToast(`Đã tháo ${target.name}!`);

      // Backend sync
      try {
        const charId = propChar?.id || useGameWorldStore.getState().activeCharacterId;
        if (charId) {
          await fetch(`/api/characters/${charId}/inventory/${target.id}/unequip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.warn("Backend unequip sync:", err);
      }
      triggerGlobalAutoSave("unequip");
    } else {
      // Equipping
      setItems((prev) => {
        const next = prev.map((it) => {
          if (it.id === target.id) {
            return { ...it, equipped: true, slotIndex: -1 };
          }
          // If equipping, unequip conflicting item in same slot type into bag
          if (it.type === target.type && it.equipped) {
            return { ...it, equipped: false, slotIndex: (target as any).slotIndex >= 0 ? (target as any).slotIndex : 0 };
          }
          return it;
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setSelectedItem((prev) => (prev && prev.id === target.id ? { ...prev, equipped: true, slotIndex: -1 } : prev));
      showToast(`Đã trang bị ${target.name}!`);

      // Backend sync
      try {
        const charId = propChar?.id || useGameWorldStore.getState().activeCharacterId;
        if (charId) {
          await fetch(`/api/characters/${charId}/inventory/${target.id}/equip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slot: target.type }),
          });
        }
      } catch (err) {
        console.warn("Backend equip sync:", err);
      }
      triggerGlobalAutoSave("equip");
    }

    // Propagate callback if provided
    if (propOnEquip) {
      propOnEquip(target as any);
    }
  };

  // Expand Inventory Slots (+1 slot up to 30)
  const handleExpandInventory = async (useTicket: boolean) => {
    if (maxUnlockedSlots >= 30) {
      showToast("Hành trang đã mở rộng tối đa (30 ô)!");
      return;
    }

    const charId = propChar?.id || useGameWorldStore.getState().activeCharacterId;

    if (useTicket) {
      const ticketIdx = items.findIndex(
        (it) => it.type === "inventory_ticket" || it.id.includes("ticket") || it.name.includes("Phiếu Tăng Hành Trang")
      );
      if (ticketIdx === -1) {
        showToast("Bạn không có Phiếu Tăng Hành Trang!");
        return;
      }

      setItems((prev) => {
        const next = prev
          .map((it, idx) => {
            if (idx === ticketIdx) {
              const nextQty = (it.quantity || 1) - 1;
              return { ...it, quantity: nextQty };
            }
            return it;
          })
          .filter((it) => it.quantity === undefined || it.quantity > 0);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      const nextSlots = Math.min(30, maxUnlockedSlots + 1);
      setMaxUnlockedSlots(nextSlots);
      useGameWorldStore.getState().setUnlockedSlots(nextSlots);
      playCombatSFX("holy_bell", 0.5);
      showToast(`🎉 Dùng phiếu thành công! Mở thêm +1 ô hành trang (${nextSlots}/30 ô)!`);
      setUnlockModalOpen(false);
      triggerGlobalAutoSave("expand_ticket");
    } else {
      const cost = 500;
      if (effectiveGold < cost) {
        playCombatSFX("laser_pew", 0.3);
        showToast(`Không đủ Vàng! Cần ${cost} Vàng để mở thêm 1 ô hành trang.`);
        return;
      }

      addGold(-cost);
      const nextSlots = Math.min(30, maxUnlockedSlots + 1);
      setMaxUnlockedSlots(nextSlots);
      useGameWorldStore.getState().setUnlockedSlots(nextSlots);
      playCombatSFX("holy_bell", 0.5);
      showToast(`🎉 Mở khóa thành công +1 ô bằng ${cost} Vàng (${nextSlots}/30 ô)!`);
      setUnlockModalOpen(false);

      if (charId) {
        try {
          await fetch(`/api/characters/${charId}/inventory/unlock-slot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.warn("Backend unlock-slot sync:", err);
        }
      }
      triggerGlobalAutoSave("expand_gold");
    }
  };

  // Consume / Use Potion, Food or Expansion Ticket
  const handleUseItem = (target: UnifiedItem) => {
    playCombatSFX("holy_bell", 0.5);

    if (target.type === "inventory_ticket" || target.id.includes("ticket") || target.name.includes("Phiếu Tăng Hành Trang")) {
      handleExpandInventory(true);
      return;
    }

    if (target.type === "potion_hp" || target.type === "food") {
      healPlayer(target.hpBoost || 150);
      showToast(`Hồi phục +${target.hpBoost || 150} HP từ ${target.name}!`);
    } else if (target.type === "potion_mp") {
      showToast(`Hồi phục năng lượng từ ${target.name}!`);
    } else {
      showToast(`Đã sử dụng ${target.name}!`);
    }

    // Decrement quantity or remove if empty
    setItems((prev) => {
      const next = prev
        .map((it) => {
          if (it.id === target.id) {
            const nextQty = (it.quantity || 1) - 1;
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter((it) => it.quantity === undefined || it.quantity > 0);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setSelectedItem((prev) => {
      if (!prev || prev.id !== target.id) return prev;
      const nextQty = (prev.quantity || 1) - 1;
      return nextQty > 0 ? { ...prev, quantity: nextQty } : null;
    });
  };

  // Enhance Item (+1 level, +10% base stats, costs gold)
  const handleEnhance = (target: UnifiedItem) => {
    const currentEnhance = target.enhanceLevel || 0;
    if (currentEnhance >= 15) {
      showToast("Trang bị đã đạt cấp cường hóa tối đa (+15)!");
      return;
    }

    const cost = 100 * (currentEnhance + 1);
    if (effectiveGold < cost) {
      playCombatSFX("laser_pew", 0.3);
      showToast(`Không đủ Vàng! Cần ${cost.toLocaleString()} Vàng để cường hóa.`);
      return;
    }

    // Deduct gold & play sound
    addGold(-cost);
    playCombatSFX("holy_bell", 0.5);
    setEnhanceSparkle(true);
    setTimeout(() => setEnhanceSparkle(false), 1200);

    setItems((prev) => {
      const next = prev.map((it) => {
        if (it.id === target.id) {
          const nextLvl = currentEnhance + 1;
          return {
            ...it,
            enhanceLevel: nextLvl,
            atkBoost: Math.round(it.atkBoost * 1.1) || it.atkBoost + 2,
            defBoost: Math.round(it.defBoost * 1.1) || it.defBoost + 2,
            hpBoost: Math.round(it.hpBoost * 1.1) || it.hpBoost + 10,
          };
        }
        return it;
      });
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setSelectedItem((prev) =>
      prev && prev.id === target.id
        ? {
            ...prev,
            enhanceLevel: currentEnhance + 1,
            atkBoost: Math.round(prev.atkBoost * 1.1) || prev.atkBoost + 2,
            defBoost: Math.round(prev.defBoost * 1.1) || prev.defBoost + 2,
            hpBoost: Math.round(prev.hpBoost * 1.1) || prev.hpBoost + 10,
          }
        : prev
    );

    showToast(`✨ Cường hóa thành công! ${target.name} đạt +${currentEnhance + 1}`);
  };

  // Quick Sell Item for Gold (Permanently persists removal and adds gold)
  const handleQuickSell = async (target: UnifiedItem) => {
    if (target.equipped) {
      showToast("Hãy tháo trang bị ra trước khi bán!");
      return;
    }
    const sellPrice = target.price || 50;
    addGold(sellPrice);
    playCombatSFX("coin_chime", 0.4);

    setItems((prev) => {
      const next = prev.filter((it) => it.id !== target.id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setSelectedItem(null);
    showToast(`💰 Đã bán ${target.name} thu về +${sellPrice} Vàng!`);

    // Sync deletion with backend API if characterId exists
    try {
      const charId = propChar?.id;
      if (charId) {
        await fetch(`/api/characters/${charId}/inventory/${target.id}/sell`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      console.warn("Backend sell sync notice:", err);
    }
  };

  // Sort Inventory Items (Equipped first, then rarity weight, then enhanceLevel, stack consumables)
  const handleSortInventory = async () => {
    playCombatSFX("coin_chime", 0.3);
    const rarityWeight: Record<ItemRarity, number> = {
      mythic: 5,
      legendary: 4,
      epic: 3,
      rare: 2,
      common: 1,
    };

    // 1. Separate equipped and unequipped
    const equipped = items.filter((it) => it.equipped);
    const unequipped = items.filter((it) => !it.equipped);

    // 2. Stack stackable unequipped items (consumables / materials with same name or type)
    const stackedList: UnifiedItem[] = [];
    for (const it of unequipped) {
      if (it.category === "consumable" || it.category === "material") {
        const existing = stackedList.find(
          (s) => s.category === it.category && (s.name === it.name || s.type === it.type)
        );
        if (existing) {
          existing.quantity = (existing.quantity || 1) + (it.quantity || 1);
          continue;
        }
      }
      stackedList.push({ ...it, quantity: it.quantity || 1 });
    }

    // 3. Sort: Rarity desc -> Category -> enhanceLevel desc -> Name
    stackedList.sort((a, b) => {
      const diffRarity = (rarityWeight[b.rarity] || 0) - (rarityWeight[a.rarity] || 0);
      if (diffRarity !== 0) return diffRarity;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      const diffEnhance = (b.enhanceLevel || 0) - (a.enhanceLevel || 0);
      if (diffEnhance !== 0) return diffEnhance;
      return a.name.localeCompare(b.name);
    });

    // 4. Assign sequential slotIndex 0, 1, 2...
    stackedList.forEach((it, idx) => {
      (it as any).slotIndex = idx;
    });

    const nextAll = [...equipped, ...stackedList];
    setItems(nextAll);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextAll));
    } catch (e) {}

    showToast("Đã gom cụm & sắp xếp hành trang ngăn nắp!");

    // Backend sort call
    const charId = propChar?.id || useGameWorldStore.getState().activeCharacterId;
    if (charId) {
      try {
        await fetch(`/api/characters/${charId}/inventory/sort`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.warn("Backend inventory sort sync:", err);
      }
    }
    triggerGlobalAutoSave("sort");
  };

  // Live Power Comparison for Selected Item vs Equipped Item in Slot
  const comparisonDiff = useMemo(() => {
    if (!selectedItem || selectedItem.category !== "equipment") return null;
    const sameSlotEquipped = items.find((it) => it.equipped && it.type === selectedItem.type);

    const calcPower = (it: UnifiedItem) => {
      const mul = 1 + (it.enhanceLevel || 0) * 0.1;
      return Math.round((it.atkBoost || 0) * mul * 2.2 + (it.defBoost || 0) * mul * 1.8 + (it.hpBoost || 0) * mul * 0.4 + (it.critBoost || 0) * 2.5);
    };

    const targetPower = calcPower(selectedItem);
    const currentPower = sameSlotEquipped ? calcPower(sameSlotEquipped) : 0;
    const diff = targetPower - currentPower;

    return {
      diff,
      equippedItemName: sameSlotEquipped ? sameSlotEquipped.name : "Chưa có đồ",
      isSameItem: sameSlotEquipped?.id === selectedItem.id,
    };
  }, [selectedItem, items]);

  const leftSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "left");
  const rightSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "right");

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-all duration-200 select-none font-sans ${
        isSidePanel
          ? "items-center justify-end p-2 sm:p-4 pointer-events-none"
          : "items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md pointer-events-auto"
      }`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── MODAL WINDOW CONTAINER ── */}
      <div
        className={`relative rounded-[30px] bg-[#0f131c] border border-[#232a3b] shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_40px_rgba(40,195,225,0.15)] p-4 sm:p-5 text-slate-100 flex flex-col gap-3.5 backdrop-blur-2xl pointer-events-auto transition-all duration-300 ${
          isSidePanel ? "w-full max-w-[560px] max-h-[94vh] overflow-y-auto" : "w-full max-w-[980px]"
        }`}
      >
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-[#182338]/95 border border-cyan-400 text-cyan-300 text-xs font-black shadow-[0_0_20px_rgba(40,195,225,0.5)] animate-in fade-in slide-in-from-top-2 duration-150">
            {toastMessage}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            1. TOP BAR: 4 Core Stat Badges, Gold Badge & Close Button
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between border-b border-[#1f2638] pb-3 px-1 gap-2 flex-wrap sm:flex-nowrap">
          
          {/* 4 Core Summary Stat Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* 1. Sinh Lực (HP) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#151a26] border border-[#232a3b]">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
              </div>
              <div>
                <p className="text-sm font-black leading-none text-white tracking-tight font-mono">
                  {aggregatedStats.hp}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Sinh lực</p>
              </div>
            </div>

            {/* 2. Sát Thương (ATK) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#151a26] border border-[#232a3b]">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Swords className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-black leading-none text-white tracking-tight font-mono">
                  {aggregatedStats.atk}.0
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Sát thương</p>
              </div>
            </div>

            {/* 3. Phòng Thủ (DEF) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#151a26] border border-[#232a3b]">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-black leading-none text-white tracking-tight font-mono">
                  {aggregatedStats.def}.0%
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Phòng thủ</p>
              </div>
            </div>

            {/* 4. Tốc Độ Đánh (SPD) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#151a26] border border-[#232a3b]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black leading-none text-white tracking-tight font-mono">
                  {aggregatedStats.spd}.0
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Tốc độ đánh</p>
              </div>
            </div>
          </div>

          {/* Right: Gold Badge + Close Button */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1e1913] border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-black text-amber-300 font-mono tracking-wide">
                {effectiveGold.toLocaleString()} Vàng
              </span>
            </div>

            <button
              onClick={() => setIsSidePanel(!isSidePanel)}
              className="w-8 h-8 rounded-full bg-[#171c28] hover:bg-slate-700 text-slate-400 hover:text-white border border-[#2b3548] flex items-center justify-center transition cursor-pointer"
              title={isSidePanel ? "Mở rộng toàn màn hình" : "Thu gọn sang một bên (Vừa xem đồ vừa thấy 3D)"}
            >
              {isSidePanel ? <Maximize2 className="w-4 h-4 text-cyan-400" /> : <Minimize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-[#171c28] hover:bg-rose-950/70 hover:text-rose-300 border border-[#2b3548] text-slate-400 hover:border-rose-500/60 flex items-center justify-center transition cursor-pointer"
              title="Đóng Hành Trang (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            2. MAIN BODY: 2 Columns (Left: 5 cols, Right: 7 cols)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-[470px]">
          
          {/* ─────────────────────────────────────────────────────────────────
              LEFT COLUMN (5 cols): 12 Slots, 2.5D Pixel Character & Stats Switcher
             ───────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 bg-[#141824] rounded-[24px] border border-[#1e2536] p-3.5 flex flex-col justify-between relative overflow-hidden">
            
            {/* Top Row: Lực chiến trang bị + Switcher Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1d2434] px-1">
              <div>
                <span className="text-xs font-semibold text-slate-300">
                  Lực chiến trang bị:{" "}
                  <span className="text-cyan-400 font-black text-sm drop-shadow-[0_0_8px_rgba(40,195,225,0.7)] font-mono">
                    {Math.round(equipmentRating) || 85}
                  </span>
                </span>
              </div>

              {/* View Switcher Button */}
              <button
                onClick={() => setLeftViewMode((prev) => (prev === "character" ? "stats" : "character"))}
                className="px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#222c3e] border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-[10px] font-black transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(40,195,225,0.2)]"
                title="Bật/Tắt xem bảng chỉ số chi tiết"
              >
                {leftViewMode === "character" ? (
                  <>
                    <BarChart3 className="w-3 h-3 text-cyan-400" /> Xem Bảng Chỉ Số
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-cyan-400" /> Xem Nhân Vật 2.5D
                  </>
                )}
              </button>
            </div>

            {/* Left Center Stage: Either Character with 12 Slots OR Detailed Stats Table */}
            {leftViewMode === "character" ? (
              <div className="relative flex items-center justify-between px-1 py-2 my-auto">
                
                {/* 6 Left Equipment Slots */}
                <div className="flex flex-col gap-2 z-10">
                  {leftSlots.map((slot) => {
                    const item = slotEquippedMap[slot.key];
                    const IconSvg = slot.icon;
                    const isSelected = selectedItem?.id === item?.id && item !== null;
                    const rarityInfo = item ? getRarityColor(item.rarity) : null;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          if (item) {
                            setSelectedItem(item);
                            playCombatSFX("coin_chime", 0.25);
                          }
                        }}
                        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
                          item
                            ? isSelected
                              ? "bg-[#1d2536] border-2 border-cyan-400 shadow-[0_0_15px_rgba(40,195,225,0.7)] scale-105"
                              : `${rarityInfo?.border} ${rarityInfo?.bg} ${rarityInfo?.glow} hover:border-cyan-300`
                            : "bg-[#151a26] border-slate-800/80 hover:border-slate-600"
                        }`}
                        title={`${slot.name}${item ? `: ${item.name} (+${item.enhanceLevel || 0})` : " (Chưa trang bị)"}`}
                      >
                        {item ? (
                          <div className="relative flex items-center justify-center">
                            <span className="text-white text-xl font-bold select-none">{item.icon}</span>
                            {/* Cyan Dot on top-right */}
                            <span className="absolute -top-2.5 -right-2.5 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#28c3e1]" />
                            {/* Enhance level badge */}
                            {item.enhanceLevel ? (
                              <span className="absolute -bottom-2 -left-1 px-1 rounded bg-black/90 font-mono text-[8px] font-black text-amber-300 border border-amber-500/50">
                                +{item.enhanceLevel}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <IconSvg />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Center: Character Showcase on Glowing Rune Pedestal */}
                <div className="relative flex-1 flex flex-col items-center justify-end h-full min-h-[260px]">
                  
                  {/* Glowing Ellipse Pedestal (Đài Sen Ánh Sáng) */}
                  <div className="absolute bottom-4 w-40 h-14 rounded-[100%] bg-gradient-to-t from-cyan-950/70 via-cyan-900/30 to-transparent border-t border-cyan-400/40 shadow-[0_0_30px_rgba(40,195,225,0.3)] flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-8 rounded-[100%] border border-cyan-400/25 animate-pulse" />
                  </div>

                  {/* Character 2.5D Animated Pixel Art Sprite */}
                  <div className="relative z-10 w-40 h-52 flex items-end justify-center pb-2">
                    <ClassSprite
                      classId={effectiveClassId}
                      gender={playerGender || "male"}
                      className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                    />
                  </div>

                  {/* Character Name, Level Plate & Title */}
                  <div className="z-10 px-3.5 py-1 rounded-full bg-[#10141f] border border-[#2b354b] text-center shadow-lg flex flex-col items-center">
                    <p className="text-xs font-black text-white tracking-wider">
                      {effectiveName} <span className="text-cyan-400 text-[10px] font-mono font-bold">Lv.{effectiveLevel}</span>
                    </p>
                    <span className="text-[9px] text-amber-300 font-bold tracking-widest mt-0.5">
                      {classTitle}
                    </span>
                  </div>
                </div>

                {/* 6 Right Equipment Slots */}
                <div className="flex flex-col gap-2 z-10">
                  {rightSlots.map((slot) => {
                    const item = slotEquippedMap[slot.key];
                    const IconSvg = slot.icon;
                    const isSelected = selectedItem?.id === item?.id && item !== null;
                    const rarityInfo = item ? getRarityColor(item.rarity) : null;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          if (item) {
                            setSelectedItem(item);
                            playCombatSFX("coin_chime", 0.25);
                          }
                        }}
                        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
                          item
                            ? isSelected
                              ? "bg-[#1d2536] border-2 border-cyan-400 shadow-[0_0_15px_rgba(40,195,225,0.7)] scale-105"
                              : `${rarityInfo?.border} ${rarityInfo?.bg} ${rarityInfo?.glow} hover:border-cyan-300`
                            : "bg-[#151a26] border-slate-800/80 hover:border-slate-600"
                        }`}
                        title={`${slot.name}${item ? `: ${item.name} (+${item.enhanceLevel || 0})` : " (Chưa trang bị)"}`}
                      >
                        {item ? (
                          <div className="relative flex items-center justify-center">
                            <span className="text-white text-xl font-bold select-none">{item.icon}</span>
                            <span className="absolute -top-2.5 -right-2.5 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#28c3e1]" />
                            {item.enhanceLevel ? (
                              <span className="absolute -bottom-2 -left-1 px-1 rounded bg-black/90 font-mono text-[8px] font-black text-amber-300 border border-amber-500/50">
                                +{item.enhanceLevel}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <IconSvg />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Detailed Stats View (Bảng Chỉ Số Chi Tiết) */
              <div className="flex-1 flex flex-col justify-between py-2 gap-2 text-xs">
                {/* 1. CHỈ SỐ CƠ BẢN */}
                <div className="rounded-xl bg-[#10141f] border border-[#222c3e] p-2.5">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[11px] mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> CHỈ SỐ CƠ BẢN
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">STR (Sức mạnh)</span>
                      <span className="font-mono font-bold text-cyan-300">85 + 24</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">DEX (Khéo léo)</span>
                      <span className="font-mono font-bold text-cyan-300">64 + 18</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">INT (Trí tuệ)</span>
                      <span className="font-mono font-bold text-cyan-300">35 + 8</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">LUK (May mắn)</span>
                      <span className="font-mono font-bold text-cyan-300">28 + 12</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28] col-span-2">
                      <span className="text-slate-400">VIT (Thể lực)</span>
                      <span className="font-mono font-bold text-cyan-300">92 + 35</span>
                    </div>
                  </div>
                </div>

                {/* 2. CHỈ SỐ CHIẾN ĐẤU */}
                <div className="rounded-xl bg-[#10141f] border border-[#222c3e] p-2.5">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px] mb-2">
                    <Swords className="w-3.5 h-3.5" /> CHỈ SỐ CHIẾN ĐẤU
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Công vật lý (ATK)</span>
                      <span className="font-mono font-bold text-amber-300">{aggregatedStats.atk}.0</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Công phép (MATK)</span>
                      <span className="font-mono font-bold text-purple-300">76.0</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Thủ vật lý (DEF)</span>
                      <span className="font-mono font-bold text-sky-300">{aggregatedStats.def}.0%</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Kháng phép (MDEF)</span>
                      <span className="font-mono font-bold text-blue-300">32.5%</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Bạo kích (Crit)</span>
                      <span className="font-mono font-bold text-rose-400">28.5%</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Chính xác (ACC)</span>
                      <span className="font-mono font-bold text-emerald-300">98.2%</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Né tránh (EVA)</span>
                      <span className="font-mono font-bold text-yellow-300">18.0%</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded bg-[#161c28]">
                      <span className="text-slate-400">Tốc chạy (SPD)</span>
                      <span className="font-mono font-bold text-cyan-300">{aggregatedStats.spd}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button
                    onClick={() => setLeftViewMode("character")}
                    className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-semibold transition cursor-pointer"
                  >
                    ← Quay lại xem hoạt họa nhân vật
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Hint */}
            <div className="text-center text-[10px] text-slate-500 pt-1 border-t border-[#1d2434]">
              Bấm vào ô trang bị để xem chi tiết, cường hóa hoặc tháo đồ
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT COLUMN (7 cols): 5 Tabs, 30 Slots, Inspector Card & 8 Buttons
             ───────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 bg-[#141824] rounded-[24px] border border-[#1e2536] p-3.5 flex flex-col justify-between gap-2.5">
            
            {/* Header: Title + Expansion Button + 5 Filter Tabs + Utility Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-cyan-400" /> Túi Hành Trang ({bagItemsCount}/{maxUnlockedSlots} ô)
                  </span>
                  {maxUnlockedSlots < 30 && (
                    <button
                      onClick={() => setUnlockModalOpen(true)}
                      className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-400/50 hover:border-amber-300 text-amber-300 hover:text-white text-[10px] font-black transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.25)] animate-pulse"
                      title="Mở thêm ô hành trang bằng 500 Vàng hoặc Phiếu Tăng Hành Trang"
                    >
                      <Ticket className="w-3 h-3 text-amber-400" /> + Mở Rộng
                    </button>
                  )}
                </div>
                
                {/* 2 Utility Buttons: Sắp Xếp & Thùng Rác */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSortInventory}
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#2b3548] text-slate-300 hover:text-cyan-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Sắp xếp đồ theo phẩm chất và cấp độ"
                  >
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" /> Sắp Xếp
                  </button>

                  <button
                    onClick={() => {
                      if (selectedItem) {
                        handleQuickSell(selectedItem);
                      } else {
                        showToast("Vui lòng chọn 1 món đồ trong túi để bán!");
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1e1518] hover:bg-rose-950/70 border border-rose-900/50 hover:border-rose-500/60 text-rose-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Bán nhanh món đồ đang chọn lấy Vàng"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" /> Thùng Rác
                  </button>
                </div>
              </div>

              {/* 5 Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#10141f] p-1 rounded-xl border border-[#1d2536]">
                {INVENTORY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        playCombatSFX("coin_chime", 0.2);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(40,195,225,0.25)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#181f2d]"
                      }`}
                    >
                      <span className="text-xs">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 30 Item Grid (6 columns x 5 rows: Active 15 slots initially, locked slots require Ticket or Gold) */}
            <div className="grid grid-cols-6 gap-2 my-0.5 max-h-[220px] overflow-y-auto custom-scrollbar p-1">
              {gridCells.map((cell, idx) => {
                // 1. Locked Slot (Requires Ticket or 500 Gold to expand)
                if (cell.isLocked) {
                  return (
                    <button
                      key={`locked-${idx}`}
                      onClick={() => {
                        playCombatSFX("holy_bell", 0.3);
                        setUnlockModalOpen(true);
                      }}
                      className="w-full aspect-square rounded-2xl bg-[#0e121b]/90 border border-dashed border-[#283244] hover:border-amber-400/80 hover:bg-[#161c28] flex flex-col items-center justify-center text-slate-500 hover:text-amber-300 transition-all cursor-pointer group shadow-inner"
                      title={`Ô khóa #${idx + 1} - Bấm để mở khóa với 500 Vàng`}
                    >
                      <Lock className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black mt-0.5 tracking-wider uppercase text-slate-500 group-hover:text-amber-300">
                        #{idx + 1} 🔒
                      </span>
                    </button>
                  );
                }

                // 2. Unlocked but Empty Slot
                if (!cell.item) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="w-full aspect-square rounded-2xl bg-[#151a26]/70 border border-slate-800/80 flex items-center justify-center text-slate-600 select-none shadow-inner"
                      title={`Ô trống #${idx + 1}`}
                    >
                      <Plus className="w-3.5 h-3.5 opacity-40 text-slate-500" />
                    </div>
                  );
                }

                // 3. Unlocked Slot with Item
                const item = cell.item;
                const isSelected = selectedItem?.id === item.id;
                const isEquipped = item.equipped;
                const rarityInfo = getRarityColor(item.rarity);

                return (
                  <button
                    key={item.id || idx}
                    onClick={() => {
                      setSelectedItem(item);
                      playCombatSFX("coin_chime", 0.2);
                    }}
                    className={`relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#1f283b] border-2 border-cyan-400 shadow-[0_0_18px_rgba(40,195,225,0.6)] scale-105 z-10"
                        : `${rarityInfo.border} ${rarityInfo.bg} ${rarityInfo.glow} hover:scale-102`
                    }`}
                    title={`${item.name} (${item.rarity.toUpperCase()})`}
                  >
                    <span className="text-white text-xl font-bold select-none drop-shadow">
                      {item.icon}
                    </span>

                    {/* Cyan Equipped Checkmark */}
                    {isEquipped && (
                      <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#28c3e1] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                      </div>
                    )}

                    {/* Enhance Level Tag */}
                    {item.enhanceLevel ? (
                      <div className="absolute top-1 left-1 px-1 rounded bg-black/90 font-mono text-[8px] font-black text-amber-300 border border-amber-500/50">
                        +{item.enhanceLevel}
                      </div>
                    ) : null}

                    {/* Stack quantity */}
                    {item.quantity && item.quantity > 1 ? (
                      <div className="absolute bottom-1 right-1 px-1 rounded bg-black/90 font-mono text-[9px] font-bold text-white border border-slate-700">
                        x{item.quantity}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Standard Dark Fantasy Selected Item Inspector Card */}
            {selectedItem ? (
              <div
                className={`p-3 rounded-2xl bg-[#18151b] border border-[#48373f] flex flex-col gap-2.5 relative transition-all shadow-[0_8px_30px_rgba(0,0,0,0.7)] ${
                  enhanceSparkle ? "ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]" : ""
                }`}
              >
                {/* Upper Row: Icon, Slot Tag, Name, Rarity, Comparison Diff */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-2xl shrink-0 shadow-lg ${
                        getRarityColor(selectedItem.rarity).border
                      } ${getRarityColor(selectedItem.rarity).bg} ${getRarityColor(selectedItem.rarity).glow}`}
                    >
                      {selectedItem.icon}
                    </div>

                    <div className="min-w-0">
                      {/* Slot badge & Rarity badge */}
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#251d24] border border-[#5d464f] text-cyan-300 tracking-wider">
                          {getEquipmentSlotName(selectedItem.type)}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-md font-black border tracking-wider ${
                            getRarityColor(selectedItem.rarity).badge
                          }`}
                        >
                          {getRarityLabel(selectedItem.rarity)}
                        </span>
                        {selectedItem.requiredLevel ? (
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                            Cấp {selectedItem.requiredLevel}
                          </span>
                        ) : null}
                      </div>

                      {/* Item Name */}
                      <p className="text-sm font-black truncate text-white flex items-center gap-1.5">
                        {selectedItem.name}
                        {selectedItem.enhanceLevel ? (
                          <span className="text-amber-300 font-mono font-black drop-shadow">
                            +{selectedItem.enhanceLevel}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {/* Live Comparison Delta */}
                  {comparisonDiff && !comparisonDiff.isSameItem && (
                    <div className="text-right shrink-0">
                      {comparisonDiff.diff > 0 ? (
                        <span className="text-[10px] font-black font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                          ▲ +{comparisonDiff.diff} Lực chiến
                        </span>
                      ) : comparisonDiff.diff < 0 ? (
                        <span className="text-[10px] font-black font-mono text-rose-300 bg-rose-950/70 border border-rose-500/50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                          ▼ {comparisonDiff.diff} Lực chiến
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold font-mono text-slate-300 bg-slate-800/70 px-2 py-0.5 rounded-lg border border-slate-700">
                          ― Lực chiến ngang bằng
                        </span>
                      )}
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[125px]">
                        so với {comparisonDiff.equippedItemName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stat boost pills */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap bg-[#120f13] p-1.5 rounded-xl border border-[#35272b]">
                  {selectedItem.atkBoost > 0 && (
                    <span className="text-amber-300 font-black px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
                      +{selectedItem.atkBoost} ATK
                    </span>
                  )}
                  {selectedItem.defBoost > 0 && (
                    <span className="text-sky-300 font-black px-2 py-0.5 rounded bg-sky-950/40 border border-sky-500/30">
                      +{selectedItem.defBoost} DEF
                    </span>
                  )}
                  {selectedItem.hpBoost > 0 && (
                    <span className="text-rose-300 font-black px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30">
                      +{selectedItem.hpBoost} HP
                    </span>
                  )}
                  {selectedItem.spdBoost > 0 && (
                    <span className="text-emerald-300 font-black px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                      +{selectedItem.spdBoost} SPD
                    </span>
                  )}
                  {selectedItem.critBoost ? (
                    <span className="text-yellow-300 font-black px-2 py-0.5 rounded bg-yellow-950/40 border border-yellow-500/30">
                      +{selectedItem.critBoost}% Crit
                    </span>
                  ) : null}
                  {selectedItem.quantity && selectedItem.quantity > 1 ? (
                    <span className="text-purple-300 font-black px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 ml-auto">
                      Số lượng: x{selectedItem.quantity}
                    </span>
                  ) : null}
                </div>

                {/* Lore / Description in Dark Fantasy frame */}
                <div className="bg-[#120f13] border border-[#2f2227] rounded-xl p-2 text-[10.5px] text-slate-300 italic leading-relaxed">
                  <p className="text-slate-200 not-italic font-medium mb-0.5">{selectedItem.description}</p>
                  {selectedItem.lore && (
                    <p className="text-amber-200/70 text-[10px]">"{selectedItem.lore}"</p>
                  )}
                </div>

                {/* Action Buttons: Equip/Use, Enhance, Quick Sell */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="text-[11px] font-mono text-amber-300 font-black flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#20181b] border border-amber-500/30">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedItem.price || 50} 🪙</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 1. Quick Sell */}
                    <button
                      onClick={() => handleQuickSell(selectedItem)}
                      className="px-3 py-1.5 rounded-xl bg-[#28151c] hover:bg-[#3d1825] border border-rose-800/80 text-rose-300 text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                      title="Bán ngay món đồ này lấy Vàng"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" /> Bán Nhanh
                    </button>

                    {/* 2. Enhance (+10% Stats) */}
                    {selectedItem.category === "equipment" && (
                      <button
                        onClick={() => handleEnhance(selectedItem)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2e2112] to-[#422e17] hover:from-[#3e2c18] hover:to-[#573d1f] border border-[#d97706] text-amber-300 text-[10px] font-black transition flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
                        title={`Cường hóa trang bị (Tốn ${100 * ((selectedItem.enhanceLevel || 0) + 1)} Vàng)`}
                      >
                        <ChevronsUp className="w-3.5 h-3.5 text-amber-400" /> Cường Hóa (+
                        {(selectedItem.enhanceLevel || 0) + 1})
                      </button>
                    )}

                    {/* 3. Equip / Unequip / Use / Expand */}
                    {selectedItem.category === "equipment" ? (
                      <button
                        onClick={() => handleToggleEquip(selectedItem)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                          selectedItem.equipped
                            ? "bg-[#18202e] hover:bg-rose-950/80 border border-[#2c374d] text-slate-300 hover:text-rose-300"
                            : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(40,195,225,0.5)]"
                        }`}
                      >
                        {selectedItem.equipped ? "Tháo Ra" : "Trang Bị"}
                      </button>
                    ) : selectedItem.type === "inventory_ticket" || selectedItem.id.includes("ticket") || selectedItem.name.includes("Phiếu Tăng Hành Trang") ? (
                      <button
                        onClick={() => handleUseItem(selectedItem)}
                        className="px-4 py-1.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition cursor-pointer flex items-center gap-1"
                      >
                        <Ticket className="w-3.5 h-3.5" /> Dùng Vé (+5 Ô)
                      </button>
                    ) : selectedItem.category === "consumable" ? (
                      <button
                        onClick={() => handleUseItem(selectedItem)}
                        className="px-4 py-1.5 rounded-xl text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.45)] transition cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 fill-slate-950" /> Sử Dụng
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#18151b] border border-[#3d2f34] text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                <span className="text-xl">⚔️</span>
                <span>Chọn một món đồ trong túi để xem chi tiết thông số, cường hóa hoặc trang bị</span>
              </div>
            )}

            {/* 8 Fast System Utility Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5 border-t border-[#1e2536]">
              {/* 1. Nhân vật (Chỉ số & Tiềm năng) */}
              <button
                onClick={() => {
                  playCombatSFX("holy_bell", 0.3);
                  useGameWorldStore.getState().setActiveModal("attributes");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-cyan-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <User className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Nhân vật</span>
              </button>

              {/* 2. Phụ bản (Hang Động & Cấm Địa) */}
              <button
                onClick={() => {
                  playCombatSFX("dragon_roar", 0.3);
                  useGameWorldStore.getState().openDungeonModal();
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-rose-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Phụ bản</span>
              </button>

              {/* 3. Nhiệm vụ (Chính Tuyến & Chỉ Đường) */}
              <button
                onClick={() => {
                  playCombatSFX("holy_bell", 0.3);
                  useGameWorldStore.getState().setActiveModal("quests");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-amber-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <ScrollText className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Nhiệm vụ</span>
              </button>

              {/* 4. Ưu đãi (Cửa Hàng Bảo Vật) */}
              <button
                onClick={() => {
                  playCombatSFX("coin_chime", 0.3);
                  useGameWorldStore.getState().setActiveModal("shop");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-amber-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Ưu đãi</span>
              </button>

              {/* 5. Cường hóa (+15 Thần Binh) */}
              <button
                onClick={() => {
                  playCombatSFX("holy_bell", 0.3);
                  useGameWorldStore.getState().setBlacksmithTab("enhance");
                  useGameWorldStore.getState().setActiveModal("blacksmith");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-cyan-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <ChevronsUp className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Cường hóa</span>
              </button>

              {/* 6. Chế tạo (Lò Rèn Công Thức) */}
              <button
                onClick={() => {
                  playCombatSFX("holy_bell", 0.3);
                  useGameWorldStore.getState().setBlacksmithTab("craft");
                  useGameWorldStore.getState().setActiveModal("blacksmith");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-purple-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Chế tạo</span>
              </button>

              {/* 7. Cộng đồng (Bảng Xếp Hạng & Tổ Đội) */}
              <button
                onClick={() => {
                  playCombatSFX("holy_bell", 0.3);
                  useGameWorldStore.getState().setActiveModal("leaderboard");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-sky-400/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <Users className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Cộng đồng</span>
              </button>

              {/* 8. Cài đặt (Hệ Thống & Âm Thanh) */}
              <button
                onClick={() => {
                  playCombatSFX("holy_bell", 0.3);
                  useGameWorldStore.getState().setActiveModal("settings");
                }}
                className="py-1.5 px-1 rounded-xl bg-[#161c28] hover:bg-[#1e2638] border border-[#232b3d] hover:border-slate-400 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition text-[10px] font-semibold cursor-pointer group"
              >
                <Settings className="w-3.5 h-3.5 text-slate-300 group-hover:scale-110 transition-transform" />
                <span>Cài đặt</span>
              </button>
            </div>

          </div>

        </div>

        {/* ── EXPANSION UNLOCK MODAL DIALOG ── */}
        {unlockModalOpen && (
          <div
            className="absolute inset-0 z-50 rounded-[30px] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setUnlockModalOpen(false);
            }}
          >
            <div className="w-full max-w-[420px] rounded-3xl bg-[#1b151b] border-2 border-[#5c464e] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.25)] flex flex-col gap-4 text-center">
              
              <div className="flex items-center justify-between border-b border-[#3b2b32] pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>MỞ KHÓA Ô HÀNH TRANG</span>
                </div>
                <button
                  onClick={() => setUnlockModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#291e23] hover:bg-[#3b2830] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-1">
                  🎒
                </div>
                <p className="text-sm font-bold text-white">
                  Mở khóa thêm <span className="text-cyan-300 font-black">1 Ô Hành Trang</span> với giá <span className="text-amber-400 font-black">500 Vàng</span>?
                </p>
                <p className="text-xs text-slate-400">
                  Sức chứa hiện tại: <span className="font-mono font-bold text-amber-300">{maxUnlockedSlots}/30 ô</span>.
                  Sau khi mở sẽ đạt <span className="font-mono font-bold text-emerald-300">{Math.min(30, maxUnlockedSlots + 1)}/30 ô</span>.
                </p>
              </div>

              {/* 2 Options */}
              <div className="flex flex-col gap-2.5">
                {/* Option 1: Buy with 500 Gold */}
                <button
                  onClick={() => handleExpandInventory(false)}
                  className="w-full py-2.5 px-4 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition flex items-center justify-between cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <span>Mở Thêm 1 Ô (500 Vàng)</span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-slate-900 font-bold">
                    Ví: {effectiveGold.toLocaleString()} 🪙
                  </span>
                </button>

                {/* Option 2: Use Ticket if available */}
                {expansionTicketCount > 0 && (
                  <button
                    onClick={() => handleExpandInventory(true)}
                    className="w-full py-2.5 px-4 rounded-2xl font-black text-xs bg-[#241a22] hover:bg-[#342430] border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white transition flex items-center justify-between cursor-pointer shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <span>Dùng Phiếu Tăng Hành Trang (+1 Ô)</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      Đang có: {expansionTicketCount} vé
                    </span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setUnlockModalOpen(false)}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-medium cursor-pointer"
              >
                Hủy bỏ
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
});
