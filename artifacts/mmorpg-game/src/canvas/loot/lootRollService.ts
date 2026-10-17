// ==============================================================================
// Authoritative Loot Drop Calculation Engine (Chiến Long Bá MMORPG)
// Rigorous Drop Rates: Swarm vs Lone Elite vs World Boss
// ==============================================================================

import type { DroppedItem, LootRarity, LootType } from "./loot.types";

export interface MonsterDropContext {
  id: number;
  monsterId: string;
  name: string;
  level: number;
  isBoss: boolean;
  aiArchetype?: "SWARM_PACK" | "LONE_PREDATOR" | "WORLD_BOSS";
  position: { x: number; y: number; z: number };
}

export interface RollLootResult {
  drops: DroppedItem[];
  hasRareDrop: boolean;
  highestRarity: LootRarity | null;
  rareItemName: string | null;
}

// Gear Templates Pool for drops
const COMMON_GEARS = [
  { itemId: "gear_starter_sword", name: "Đao Thép Tân Thủ", type: "weapon" as LootType, icon: "⚔️", color: "#ffffff", statText: "ATK +5" },
  { itemId: "gear_starter_armor", name: "Áo Giáp Tân Thủ", type: "armor" as LootType, icon: "🥋", color: "#ffffff", statText: "DEF +4, HP +25" },
  { itemId: "gear_starter_boots", name: "Giày Thép Tân Thủ", type: "armor" as LootType, icon: "🥾", color: "#ffffff", statText: "DEF +3, SPD +1" },
  { itemId: "gear_starter_ring", name: "Nhẫn Đồng Cổ", type: "accessory" as LootType, icon: "💍", color: "#ffffff", statText: "ATK +3, DEF +2" },
];

const RARE_GEARS = [
  { itemId: "gear_rare_blade", name: "Hắc Băng Đoản Kiếm", type: "weapon" as LootType, icon: "🗡️", color: "#00f2ff", statText: "ATK +18, Crit +3%" },
  { itemId: "gear_rare_shield", name: "Khiên Pháo Đài Băng", type: "weapon" as LootType, icon: "🛡️", color: "#00f2ff", statText: "DEF +16, HP +120" },
  { itemId: "gear_rare_plate", name: "Bạch Ngân Chiến Giáp", type: "armor" as LootType, icon: "🥋", color: "#00f2ff", statText: "DEF +15, HP +110" },
  { itemId: "gear_rare_necklace", name: "Dây Chuyền Lam Ngọc", type: "accessory" as LootType, icon: "📿", color: "#00f2ff", statText: "ATK +10, DEF +8, Crit +3%" },
];

const EPIC_GEARS = [
  { itemId: "gear_epic_greatsword", name: "Long Nha Cự Kiếm", type: "weapon" as LootType, icon: "⚔️", color: "#c084fc", statText: "ATK +42, Crit +6%, SPD +5%" },
  { itemId: "gear_epic_armor", name: "Hắc Long Thiết Giáp", type: "armor" as LootType, icon: "🥋", color: "#c084fc", statText: "DEF +38, HP +250, Crit +6%" },
  { itemId: "gear_epic_boots", name: "Phong Thần Chiến Ngoa", type: "armor" as LootType, icon: "🥾", color: "#c084fc", statText: "DEF +28, SPD +12, Crit +4%" },
  { itemId: "gear_epic_ring", name: "Nhẫn U Hồn Ma Thần", type: "accessory" as LootType, icon: "💍", color: "#c084fc", statText: "ATK +24, DEF +20, Crit +6%" },
];

const LEGENDARY_GEARS = [
  { itemId: "gear_legendary_dragon_blade", name: "Chí Tôn Long Thần Kiếm", type: "weapon" as LootType, icon: "🔥", color: "#fbbf24", statText: "ATK +105, Crit +12%, Hút Máu 5%" },
  { itemId: "gear_legendary_dragon_armor", name: "Thiên Mệnh Long Hoàng Giáp", type: "armor" as LootType, icon: "🛡️", color: "#fbbf24", statText: "DEF +85, HP +500, Giảm ST 15%" },
  { itemId: "gear_legendary_dragon_relic", name: "Thánh Vật Long Vương", type: "accessory" as LootType, icon: "👑", color: "#fbbf24", statText: "Toàn Chỉ Số +35, Crit +12%" },
];

const MIRACLE_GEARS = [
  { itemId: "gear_fighter_main_weapon_miracle", name: "Kì Tích: Long Thần Bất Diệt Quyền", type: "weapon" as LootType, icon: "💖", color: "#ff2d75", statText: "ATK +260, Crit +25%, Hút Máu 5%, Hồi Sinh Thần Kỳ" },
  { itemId: "gear_tank_main_weapon_miracle", name: "Kì Tích: Thánh Quang Hộ Thế Búa", type: "weapon" as LootType, icon: "🛡️", color: "#ff2d75", statText: "DEF +220, HP +1800, Giảm ST 35%, Hồi Sinh Thần Kỳ" },
  { itemId: "gear_assassin_main_weapon_miracle", name: "Kì Tích: U Hồn Huyết Nguyệt Đao", type: "weapon" as LootType, icon: "🗡️", color: "#ff2d75", statText: "ATK +280, Crit +30%, Hút Máu 5%, Tốc Độ +18" },
  { itemId: "gear_gunner_main_weapon_miracle", name: "Kì Tích: Thần Phạt Tinh Vân Pháo", type: "weapon" as LootType, icon: "⚡", color: "#ff2d75", statText: "ATK +290, MATK +150, Hút Máu 5%, Crit +25%" },
  { itemId: "material_miracle_core", name: "Lõi Tinh Thể Kì Tích", type: "accessory" as LootType, icon: "✨", color: "#ff2d75", statText: "Bảo vật Kì Tích hào quang hồng tím tối thượng" },
];

const POTIONS = [
  { itemId: "potion_hp_medium", name: "Bình Huyết Dược", type: "potion" as LootType, icon: "🧪", color: "#22c55e", statText: "Hồi 35% HP" },
  { itemId: "potion_mp_medium", name: "Bình Lam Tinh Thể", type: "potion" as LootType, icon: "💧", color: "#38bdf8", statText: "Hồi 40% MP" },
  { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", type: "accessory" as LootType, icon: "💎", color: "#00f2ff", statText: "Dùng để nâng cấp đồ" },
  { itemId: "charm_protection", name: "Bùa Bảo Hộ Cường Hóa", type: "accessory" as LootType, icon: "🧿", color: "#c084fc", statText: "Bảo hộ chống rớt cấp +10" },
];

function createDropVelocity(): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2.0 + Math.random() * 3.0;
  return [
    Math.cos(angle) * speed,
    5.0 + Math.random() * 3.0,
    Math.sin(angle) * speed,
  ];
}

/**
 * Tính toán rơi đồ chính xác theo độ khắc nghiệt MMORPG:
 * - Swarm: Vàng lẻ 65%, Potion/Mat 20%, Common 7%, Rare 1.2%, Epic 0.18%, Legendary 0.02%, Miracle 0.001%
 * - Lone Elite: Vàng 100%, Potion/Mat 40%, Common 18%, Rare 6.0%, Epic 0.9%, Legendary 0.15%, Miracle 0.001%
 * - World Boss: Vàng 100%, Rare 35%, Epic 8.0%, Legendary 1.5%, Miracle 0.05%, Rare Mats 75%
 */
export function rollMonsterLootDrops(ctx: MonsterDropContext): RollLootResult {
  const drops: DroppedItem[] = [];
  const basePos = ctx.position;
  const now = Date.now();
  let hasRareDrop = false;
  let highestRarity: LootRarity | null = null;
  let rareItemName: string | null = null;

  const markRarity = (rarity: LootRarity, name: string) => {
    if (rarity === "miracle") {
      hasRareDrop = true;
      highestRarity = "miracle";
      rareItemName = name;
    } else if (rarity === "legendary" && highestRarity !== "miracle") {
      hasRareDrop = true;
      highestRarity = "legendary";
      rareItemName = name;
    } else if (rarity === "epic" && highestRarity !== "legendary" && highestRarity !== "miracle") {
      hasRareDrop = true;
      highestRarity = "epic";
      rareItemName = name;
    }
  };

  const isBoss = ctx.isBoss || ctx.aiArchetype === "WORLD_BOSS";
  const isLoneElite = !isBoss && ctx.aiArchetype === "LONE_PREDATOR";

  if (isBoss) {
    // ── 1. WORLD BOSS (Rồng Lửa Cổ Đại) ─────────────────────────────────────
    // 3 - 5 rương vàng
    const goldChests = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < goldChests; i++) {
      drops.push({
        id: `drop-${now}-gold-boss-${i}`,
        itemId: "gold_chest",
        name: "Rương Vàng Long Vương",
        type: "gold",
        rarity: "rare",
        position: [basePos.x + (Math.random() - 0.5) * 2.5, 0.5, basePos.z + (Math.random() - 0.5) * 2.5],
        velocity: createDropVelocity(),
        value: 150 + Math.floor(Math.random() * 120),
        icon: "🪙",
        color: "#fbbf24",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 90,
      });
    }

    // Rare Mats (75%)
    if (Math.random() <= 0.75) {
      drops.push({
        id: `drop-${now}-crystal-boss`,
        itemId: "material_dragon_crystal",
        name: "Tinh Thể Rồng Cổ Đại",
        type: "accessory",
        rarity: "epic",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 200,
        icon: "🔷",
        color: "#c084fc",
        statText: "Nguyên liệu Chế tác Thần Binh",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 120,
      });
      markRarity("epic", "Tinh Thể Rồng Cổ Đại");
    }

    // Miracle Tier Gear (Boss: 0.05% = 0.0005)
    if (Math.random() <= 0.0005) {
      const mir = MIRACLE_GEARS[Math.floor(Math.random() * MIRACLE_GEARS.length)];
      drops.push({
        id: `drop-${now}-miracle-boss`,
        itemId: mir.itemId,
        name: mir.name,
        type: mir.type,
        rarity: "miracle",
        position: [basePos.x, 0.75, basePos.z],
        velocity: createDropVelocity(),
        value: 260,
        icon: mir.icon,
        color: mir.color,
        statText: mir.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 300,
      });
      markRarity("miracle", mir.name);
    }

    // Legendary Gear: 1.5%
    if (Math.random() <= 0.015) {
      const leg = LEGENDARY_GEARS[Math.floor(Math.random() * LEGENDARY_GEARS.length)];
      drops.push({
        id: `drop-${now}-leg-boss`,
        itemId: leg.itemId,
        name: leg.name,
        type: leg.type,
        rarity: "legendary",
        position: [basePos.x, 0.7, basePos.z],
        velocity: createDropVelocity(),
        value: 105,
        icon: leg.icon,
        color: leg.color,
        statText: leg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 180,
      });
      markRarity("legendary", leg.name);
    }

    // Epic Gear: 8.0%
    if (Math.random() <= 0.08) {
      const ep = EPIC_GEARS[Math.floor(Math.random() * EPIC_GEARS.length)];
      drops.push({
        id: `drop-${now}-epic-boss`,
        itemId: ep.itemId,
        name: ep.name,
        type: ep.type,
        rarity: "epic",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 45,
        icon: ep.icon,
        color: ep.color,
        statText: ep.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 120,
      });
      markRarity("epic", ep.name);
    }

    // Rare Gear: 35%
    if (Math.random() <= 0.35) {
      const rg = RARE_GEARS[Math.floor(Math.random() * RARE_GEARS.length)];
      drops.push({
        id: `drop-${now}-rare-boss`,
        itemId: rg.itemId,
        name: rg.name,
        type: rg.type,
        rarity: "rare",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 20,
        icon: rg.icon,
        color: rg.color,
        statText: rg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 90,
      });
    }

    // Divine Potions (Guaranteed 2)
    for (let i = 0; i < 2; i++) {
      const pot = POTIONS[i % POTIONS.length];
      drops.push({
        id: `drop-${now}-pot-boss-${i}`,
        itemId: pot.itemId,
        name: pot.name,
        type: pot.type,
        rarity: "rare",
        position: [basePos.x + (i - 0.5) * 1.5, 0.5, basePos.z],
        velocity: createDropVelocity(),
        value: 80,
        icon: pot.icon,
        color: pot.color,
        statText: pot.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 60,
      });
    }
  } else if (isLoneElite) {
    // ── 2. LONE PREDATOR / ELITE (Kỵ Sĩ Hắc Ám, Pháp Sư Hư Không) ───────────
    // Vàng 100% (30 - 80 Vàng)
    drops.push({
      id: `drop-${now}-gold-elite`,
      itemId: "gold_bag",
      name: "Túi Vàng Tinh Anh",
      type: "gold",
      rarity: "common",
      position: [basePos.x, 0.5, basePos.z],
      velocity: createDropVelocity(),
      value: 30 + Math.floor(Math.random() * 50),
      icon: "🪙",
      color: "#fbbf24",
      bounceCount: 0,
      isGrounded: false,
      lifetime: 60,
    });

    // Potion / Mat: 40%
    if (Math.random() <= 0.40) {
      const pot = POTIONS[Math.floor(Math.random() * POTIONS.length)];
      drops.push({
        id: `drop-${now}-pot-elite`,
        itemId: pot.itemId,
        name: pot.name,
        type: pot.type,
        rarity: "rare",
        position: [basePos.x, 0.5, basePos.z],
        velocity: createDropVelocity(),
        value: 50,
        icon: pot.icon,
        color: pot.color,
        statText: pot.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 60,
      });
    }

    // Roll Equipment (Chỉ 1 món đồ nếu trúng)
    const roll = Math.random();
    if (roll < 0.00001) {
      // Miracle: 0.001% (Cực hiếm từ Tinh Anh)
      const mir = MIRACLE_GEARS[Math.floor(Math.random() * MIRACLE_GEARS.length)];
      drops.push({
        id: `drop-${now}-miracle-elite`,
        itemId: mir.itemId,
        name: mir.name,
        type: mir.type,
        rarity: "miracle",
        position: [basePos.x, 0.7, basePos.z],
        velocity: createDropVelocity(),
        value: 260,
        icon: mir.icon,
        color: mir.color,
        statText: mir.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 300,
      });
      markRarity("miracle", mir.name);
    } else if (roll < 0.00001 + 0.0015) {
      // Legendary: 0.15%
      const leg = LEGENDARY_GEARS[Math.floor(Math.random() * LEGENDARY_GEARS.length)];
      drops.push({
        id: `drop-${now}-leg-elite`,
        itemId: leg.itemId,
        name: leg.name,
        type: leg.type,
        rarity: "legendary",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 85,
        icon: leg.icon,
        color: leg.color,
        statText: leg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 150,
      });
      markRarity("legendary", leg.name);
    } else if (roll < 0.00001 + 0.0015 + 0.009) {
      // Epic: 0.9%
      const ep = EPIC_GEARS[Math.floor(Math.random() * EPIC_GEARS.length)];
      drops.push({
        id: `drop-${now}-epic-elite`,
        itemId: ep.itemId,
        name: ep.name,
        type: ep.type,
        rarity: "epic",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 38,
        icon: ep.icon,
        color: ep.color,
        statText: ep.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 90,
      });
      markRarity("epic", ep.name);
    } else if (roll < 0.00001 + 0.0015 + 0.009 + 0.06) {
      // Rare: 6.0%
      const rg = RARE_GEARS[Math.floor(Math.random() * RARE_GEARS.length)];
      drops.push({
        id: `drop-${now}-rare-elite`,
        itemId: rg.itemId,
        name: rg.name,
        type: rg.type,
        rarity: "rare",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 18,
        icon: rg.icon,
        color: rg.color,
        statText: rg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 75,
      });
    } else if (roll < 0.00001 + 0.0015 + 0.009 + 0.06 + 0.18) {
      // Common: 18%
      const cg = COMMON_GEARS[Math.floor(Math.random() * COMMON_GEARS.length)];
      drops.push({
        id: `drop-${now}-com-elite`,
        itemId: cg.itemId,
        name: cg.name,
        type: cg.type,
        rarity: "common",
        position: [basePos.x, 0.5, basePos.z],
        velocity: createDropVelocity(),
        value: 5,
        icon: cg.icon,
        color: cg.color,
        statText: cg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 45,
      });
    }
  } else {
    // ── 3. SWARM PACK (Slime Đầm Lầy, Sói Hoang, Yêu Tinh) ────────────────────
    // Vàng lẻ: 65% (5 - 15 Gold)
    if (Math.random() <= 0.65) {
      drops.push({
        id: `drop-${now}-gold-swarm`,
        itemId: "gold_coin",
        name: "Đồng Vàng",
        type: "gold",
        rarity: "common",
        position: [basePos.x, 0.45, basePos.z],
        velocity: createDropVelocity(),
        value: 5 + Math.floor(Math.random() * 11),
        icon: "🪙",
        color: "#fbbf24",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 40,
      });
    }

    // Potion / Nguyên liệu: 20%
    if (Math.random() <= 0.20) {
      const pot = POTIONS[Math.floor(Math.random() * POTIONS.length)];
      drops.push({
        id: `drop-${now}-pot-swarm`,
        itemId: pot.itemId,
        name: pot.name,
        type: pot.type,
        rarity: "common",
        position: [basePos.x, 0.45, basePos.z],
        velocity: createDropVelocity(),
        value: 20,
        icon: pot.icon,
        color: pot.color,
        statText: pot.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 45,
      });
    }

    // Siết chặt rơi trang bị quái thường:
    const roll = Math.random();
    if (roll < 0.00001) {
      // Miracle: 0.001% (Cực kỳ hiếm từ quái thường)
      const mir = MIRACLE_GEARS[Math.floor(Math.random() * MIRACLE_GEARS.length)];
      drops.push({
        id: `drop-${now}-miracle-swarm`,
        itemId: mir.itemId,
        name: mir.name,
        type: mir.type,
        rarity: "miracle",
        position: [basePos.x, 0.65, basePos.z],
        velocity: createDropVelocity(),
        value: 260,
        icon: mir.icon,
        color: mir.color,
        statText: mir.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 300,
      });
      markRarity("miracle", mir.name);
    } else if (roll < 0.00001 + 0.0002) {
      // Legendary: 0.02% (Cực kỳ thấp)
      const leg = LEGENDARY_GEARS[Math.floor(Math.random() * LEGENDARY_GEARS.length)];
      drops.push({
        id: `drop-${now}-leg-swarm`,
        itemId: leg.itemId,
        name: leg.name,
        type: leg.type,
        rarity: "legendary",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 85,
        icon: leg.icon,
        color: leg.color,
        statText: leg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 180,
      });
      markRarity("legendary", leg.name);
    } else if (roll < 0.0002 + 0.0018) {
      // Epic: 0.18% (Rất thấp)
      const ep = EPIC_GEARS[Math.floor(Math.random() * EPIC_GEARS.length)];
      drops.push({
        id: `drop-${now}-epic-swarm`,
        itemId: ep.itemId,
        name: ep.name,
        type: ep.type,
        rarity: "epic",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 35,
        icon: ep.icon,
        color: ep.color,
        statText: ep.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 90,
      });
      markRarity("epic", ep.name);
    } else if (roll < 0.0002 + 0.0018 + 0.012) {
      // Rare: 1.2% (Thấp)
      const rg = RARE_GEARS[Math.floor(Math.random() * RARE_GEARS.length)];
      drops.push({
        id: `drop-${now}-rare-swarm`,
        itemId: rg.itemId,
        name: rg.name,
        type: rg.type,
        rarity: "rare",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 15,
        icon: rg.icon,
        color: rg.color,
        statText: rg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 60,
      });
    } else if (roll < 0.0002 + 0.0018 + 0.012 + 0.07) {
      // Common: 7.0%
      const cg = COMMON_GEARS[Math.floor(Math.random() * COMMON_GEARS.length)];
      drops.push({
        id: `drop-${now}-com-swarm`,
        itemId: cg.itemId,
        name: cg.name,
        type: cg.type,
        rarity: "common",
        position: [basePos.x, 0.45, basePos.z],
        velocity: createDropVelocity(),
        value: 4,
        icon: cg.icon,
        color: cg.color,
        statText: cg.statText,
        bounceCount: 0,
        isGrounded: false,
        lifetime: 40,
      });
    }
  }

  return {
    drops,
    hasRareDrop,
    highestRarity,
    rareItemName,
  };
}

