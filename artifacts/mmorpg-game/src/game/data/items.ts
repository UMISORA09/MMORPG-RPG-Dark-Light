export interface ItemStats {
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  magic?: number;
}

export type ItemSlot = "weapon" | "armor" | "helmet" | "accessory";
export type ItemTier = 1 | 2 | 3;

export interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  icon: string;
  price: number;
  stats: ItemStats;
  description: string;
  tier: ItemTier;
  color: string;
}

export const ITEMS: Item[] = [
  // ── Weapons ────────────────────────────────────────────────────────────────
  {
    id: "iron_sword",     name: "Kiếm Sắt",
    slot: "weapon",       icon: "⚔️",   tier: 1,
    price: 50,            color: "#95a5a6",
    stats: { atk: 10 },
    description: "Thanh kiếm sắt cơ bản. +10 ATK",
  },
  {
    id: "steel_sword",    name: "Kiếm Thép",
    slot: "weapon",       icon: "🗡️",   tier: 2,
    price: 180,           color: "#3498db",
    stats: { atk: 22, spd: 0.3 },
    description: "Lưỡi thép sắc bén. +22 ATK +0.3 SPD",
  },
  {
    id: "dragon_blade",   name: "Long Kiếm",
    slot: "weapon",       icon: "🔥",   tier: 3,
    price: 450,           color: "#e74c3c",
    stats: { atk: 40, magic: 15 },
    description: "Kiếm của long vương. +40 ATK +15 MAG",
  },

  // ── Armor ──────────────────────────────────────────────────────────────────
  {
    id: "leather_armor",  name: "Giáp Da",
    slot: "armor",        icon: "🥋",   tier: 1,
    price: 40,            color: "#95a5a6",
    stats: { hp: 20, def: 5 },
    description: "Giáp da thuộc. +20 HP +5 DEF",
  },
  {
    id: "chain_mail",     name: "Giáp Xích",
    slot: "armor",        icon: "🛡️",   tier: 2,
    price: 150,           color: "#3498db",
    stats: { hp: 45, def: 14 },
    description: "Giáp xích vững chắc. +45 HP +14 DEF",
  },
  {
    id: "dragon_scale",   name: "Giáp Long Vảy",
    slot: "armor",        icon: "🐉",   tier: 3,
    price: 400,           color: "#9b59b6",
    stats: { hp: 80, def: 28, magic: 10 },
    description: "Vảy rồng thần. +80 HP +28 DEF +10 MAG",
  },

  // ── Helmets ────────────────────────────────────────────────────────────────
  {
    id: "iron_helm",      name: "Mũ Sắt",
    slot: "helmet",       icon: "⛑️",   tier: 1,
    price: 35,            color: "#95a5a6",
    stats: { hp: 15, def: 4 },
    description: "Mũ sắt bảo vệ đầu. +15 HP +4 DEF",
  },
  {
    id: "steel_helm",     name: "Mũ Thép",
    slot: "helmet",       icon: "🪖",   tier: 2,
    price: 120,           color: "#3498db",
    stats: { hp: 30, def: 10 },
    description: "Mũ thép chiến sĩ. +30 HP +10 DEF",
  },
  {
    id: "dragon_crown",   name: "Long Vương Miện",
    slot: "helmet",       icon: "👑",   tier: 3,
    price: 350,           color: "#9b59b6",
    stats: { hp: 55, def: 18, magic: 12 },
    description: "Vương miện rồng. +55 HP +18 DEF +12 MAG",
  },

  // ── Accessories ────────────────────────────────────────────────────────────
  {
    id: "speed_ring",     name: "Nhẫn Tốc Độ",
    slot: "accessory",    icon: "💍",   tier: 1,
    price: 30,            color: "#95a5a6",
    stats: { spd: 0.6 },
    description: "Nhẫn gió. +0.6 SPD",
  },
  {
    id: "power_amulet",   name: "Bùa Sức Mạnh",
    slot: "accessory",    icon: "📿",   tier: 2,
    price: 110,           color: "#3498db",
    stats: { atk: 12, magic: 8 },
    description: "Bùa phép năng lượng. +12 ATK +8 MAG",
  },
  {
    id: "dragon_heart",   name: "Trái Tim Rồng",
    slot: "accessory",    icon: "💎",   tier: 3,
    price: 320,           color: "#9b59b6",
    stats: { atk: 18, magic: 18, spd: 0.5, hp: 20 },
    description: "Tinh thể linh hồn rồng. +18 ATK +18 MAG +0.5 SPD +20 HP",
  },
];

export const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const TIER_COLOR: Record<ItemTier, string> = {
  1: "#7f8c8d",
  2: "#3498db",
  3: "#9b59b6",
};

export const TIER_NAME: Record<ItemTier, string> = {
  1: "Bình Thường",
  2: "Hiếm",
  3: "Huyền Thoại",
};
