// ==============================================================================
// Dynamic Respawing Treasure Chest Spawner Engine & Level-Scaled Loot Generator
// Chiến Long Bá MMORPG - Real-Time Procedural World Systems
// ==============================================================================

import type { DroppedItem, LootRarity, LootType } from "../loot/loot.types";
import * as THREE from "three";

export type ChestTier = "WOODEN" | "SILVER" | "GOLDEN" | "MIRACLE_CHEST";

export interface ActiveTreasureChest {
  id: string;
  tier: ChestTier;
  tierName: string;
  position: [number, number, number];
  spawnTime: number;
  isOpened: boolean;
  openProgress: number; // 0.0 to 1.0 (lid rotation)
  color: string;
  beamColor: string;
  beamHeight: number;
  glowIntensity: number;
  itemCount: number;
}

export interface ChestTierConfig {
  tier: ChestTier;
  tierName: string;
  weight: number; // cumulative or relative weight
  minItems: number;
  maxItems: number;
  color: string;
  beamColor: string;
  beamHeight: number;
  glowIntensity: number;
  goldMultiplier: number;
}

export const CHEST_TIER_CONFIGS: Record<ChestTier, ChestTierConfig> = {
  WOODEN: {
    tier: "WOODEN",
    tierName: "Rương Gỗ Cổ",
    weight: 55,
    minItems: 5,
    maxItems: 6,
    color: "#a16207",
    beamColor: "#fef08a",
    beamHeight: 3.0,
    glowIntensity: 0.6,
    goldMultiplier: 1.0,
  },
  SILVER: {
    tier: "SILVER",
    tierName: "Rương Bạc Tinh Xảo",
    weight: 30,
    minItems: 6,
    maxItems: 8,
    color: "#cbd5e1",
    beamColor: "#38bdf8",
    beamHeight: 5.5,
    glowIntensity: 1.1,
    goldMultiplier: 1.8,
  },
  GOLDEN: {
    tier: "GOLDEN",
    tierName: "Rương Hoàng Kim Long Tộc",
    weight: 13,
    minItems: 8,
    maxItems: 9,
    color: "#fbbf24",
    beamColor: "#f59e0b",
    beamHeight: 9.0,
    glowIntensity: 1.9,
    goldMultiplier: 3.2,
  },
  MIRACLE_CHEST: {
    tier: "MIRACLE_CHEST",
    tierName: "Rương Thần Tích Hư Không",
    weight: 2,
    minItems: 10,
    maxItems: 10,
    color: "#ff2d75",
    beamColor: "#ff007f",
    beamHeight: 22.0,
    glowIntensity: 3.0,
    goldMultiplier: 6.5,
  },
};

/**
 * Ngẫu nhiên chọn Cấp Bậc Rương theo tỉ lệ:
 * - 55% WOODEN
 * - 30% SILVER
 * - 13% GOLDEN
 * - 2% MIRACLE_CHEST
 */
export function rollChestTier(): ChestTier {
  const roll = Math.random() * 100;
  if (roll < 2) return "MIRACLE_CHEST";
  if (roll < 2 + 13) return "GOLDEN";
  if (roll < 2 + 13 + 30) return "SILVER";
  return "WOODEN";
}

/**
 * Sinh tọa độ an toàn không kẹt vào vật thể tĩnh hoặc trung tâm làng,
 * đảm bảo cách các rương khác tối thiểu 12m và cách vị trí vừa mở tối thiểu 22m.
 */
export function generateSafeChestPosition(
  existingChests: ActiveTreasureChest[],
  minDistanceFromPos?: [number, number, number],
  mapRadius: number = 38
): [number, number, number] {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    attempts++;
    // Tọa độ ngẫu nhiên trong bán kính bản đồ
    const angle = Math.random() * Math.PI * 2;
    const r = 9.0 + Math.random() * (mapRadius - 9.0);
    const x = Math.round(Math.cos(angle) * r * 10) / 10;
    const z = Math.round(Math.sin(angle) * r * 10) / 10;

    // Tránh trung tâm làng quá gần (quảng trường 8m)
    if (Math.abs(x) < 8.0 && Math.abs(z) < 8.0) continue;

    // Kiểm tra khoảng cách với vị trí rương vừa mở (nếu có, yêu cầu >= 22m)
    if (minDistanceFromPos) {
      const distToOld = Math.hypot(x - minDistanceFromPos[0], z - minDistanceFromPos[2]);
      if (distToOld < 22.0) continue;
    }

    // Kiểm tra khoảng cách với tất cả rương hiện có (tối thiểu 12m)
    let tooClose = false;
    for (const chest of existingChests) {
      if (chest.isOpened) continue;
      const d = Math.hypot(x - chest.position[0], z - chest.position[2]);
      if (d < 12.0) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    return [x, 0.2, z];
  }

  // Dự phòng nếu quá nhiều lượt thử
  const fallbackAngle = Math.random() * Math.PI * 2;
  return [
    Math.round(Math.cos(fallbackAngle) * 25),
    0.2,
    Math.round(Math.sin(fallbackAngle) * 25),
  ];
}

/**
 * Tạo một thực thể Rương Báu mới
 */
export function createTreasureChestInstance(
  tier: ChestTier,
  position: [number, number, number]
): ActiveTreasureChest {
  const cfg = CHEST_TIER_CONFIGS[tier];
  const itemCount =
    cfg.minItems === cfg.maxItems
      ? cfg.minItems
      : cfg.minItems + Math.floor(Math.random() * (cfg.maxItems - cfg.minItems + 1));

  return {
    id: `chest-${tier.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    tier,
    tierName: cfg.tierName,
    position,
    spawnTime: Date.now(),
    isOpened: false,
    openProgress: 0,
    color: cfg.color,
    beamColor: cfg.beamColor,
    beamHeight: cfg.beamHeight,
    glowIntensity: cfg.glowIntensity,
    itemCount,
  };
}

/**
 * Khởi tạo danh sách 5 rương báu đang hoạt động cùng lúc trên bản đồ
 */
export function initializeActiveMapChests(count: number = 5): ActiveTreasureChest[] {
  const chests: ActiveTreasureChest[] = [];
  for (let i = 0; i < count; i++) {
    // Đảm bảo có ít nhất 1 rương Hoàng Kim hoặc Thần Tích khi bắt đầu
    let tier: ChestTier;
    if (i === 0) tier = "GOLDEN";
    else if (i === 1 && Math.random() < 0.25) tier = "MIRACLE_CHEST";
    else tier = rollChestTier();

    const pos = generateSafeChestPosition(chests);
    chests.push(createTreasureChestInstance(tier, pos));
  }
  return chests;
}

// ── Item Catalog Templates for Dynamic Scaling ──────────────────────────────
const BASE_WEAPONS = [
  { itemId: "gear_starter_sword", name: "Long Hồn Trảm Kiếm", type: "weapon" as LootType, icon: "⚔️", baseStat: 14, statKey: "ATK" },
  { itemId: "gear_rare_blade", name: "Hắc Băng Đoản Đao", type: "weapon" as LootType, icon: "🗡️", baseStat: 22, statKey: "ATK" },
  { itemId: "gear_epic_greatsword", name: "Long Nha Cự Kiếm", type: "weapon" as LootType, icon: "⚔️", baseStat: 38, statKey: "ATK" },
  { itemId: "gear_legendary_dragon_blade", name: "Chí Tôn Long Thần Kiếm", type: "weapon" as LootType, icon: "🔥", baseStat: 65, statKey: "ATK" },
  { itemId: "gear_fighter_main_weapon_miracle", name: "Kì Tích: Long Thần Bất Diệt Quyền", type: "weapon" as LootType, icon: "💖", baseStat: 120, statKey: "ATK" },
];

const BASE_ARMORS = [
  { itemId: "gear_starter_armor", name: "Long Giáp Chiến Binh", type: "armor" as LootType, icon: "🥋", baseStat: 12, statKey: "DEF" },
  { itemId: "gear_rare_plate", name: "Bạch Ngân Chiến Giáp", type: "armor" as LootType, icon: "🛡️", baseStat: 18, statKey: "DEF" },
  { itemId: "gear_epic_armor", name: "Hắc Long Thiết Giáp", type: "armor" as LootType, icon: "🥋", baseStat: 32, statKey: "DEF" },
  { itemId: "gear_legendary_dragon_armor", name: "Thiên Mệnh Long Hoàng Giáp", type: "armor" as LootType, icon: "🛡️", baseStat: 55, statKey: "DEF" },
];

const BASE_ACCESSORIES = [
  { itemId: "gear_starter_ring", name: "Cổ Ngọc Linh Nhẫn", type: "accessory" as LootType, icon: "💍", baseStat: 8, statKey: "ATK/DEF" },
  { itemId: "gear_rare_necklace", name: "Dây Chuyền Lam Tinh", type: "accessory" as LootType, icon: "📿", baseStat: 14, statKey: "ALL_STAT" },
  { itemId: "gear_epic_ring", name: "Nhẫn U Hồn Ma Thần", type: "accessory" as LootType, icon: "💍", baseStat: 26, statKey: "ALL_STAT" },
  { itemId: "gear_legendary_dragon_relic", name: "Thánh Vật Long Vương", type: "accessory" as LootType, icon: "👑", baseStat: 48, statKey: "ALL_STAT" },
  { itemId: "material_miracle_core", name: "Lõi Tinh Thể Kì Tích", type: "accessory" as LootType, icon: "✨", baseStat: 95, statKey: "ALL_STAT" },
];

/**
 * Thuật toán sinh 5 đến 10 món đồ rơi tự động theo đúng cấp độ nhân vật (Lv.1 -> Lv.999).
 * Mỗi món đồ có vận tốc vọt lên parabolic 360 độ rồi tiếp đất trong bán kính 1.5m - 2.8m.
 */
export function generateChestLootBurst(
  chest: ActiveTreasureChest,
  playerLevel: number,
  _playerClass: string = "fighter"
): DroppedItem[] {
  const drops: DroppedItem[] = [];
  const totalItems = chest.itemCount; // 5 to 10 items
  const now = Date.now();
  const cfg = CHEST_TIER_CONFIGS[chest.tier];

  // 1. Phân bổ tỉ lệ các nhóm món đồ trong số 5-10 món:
  // - 1 đến 2 Túi Vàng theo cấp
  // - 2 đến 4 Trang bị (Vũ khí / Giáp / Phụ kiện) với chỉ số nhân theo Level
  // - 1 đến 2 Bình thuốc hồi phục theo cấp
  // - 1 đến 3 Nguyên liệu / Đá Cường Hóa / Bảo Thạch theo cấp
  const numGold = chest.tier === "MIRACLE_CHEST" ? 2 : 1;
  const numPotions = Math.max(1, Math.min(2, Math.floor(totalItems * 0.25)));
  const numMats = Math.max(1, Math.min(3, Math.floor(totalItems * 0.3)));
  const numGear = totalItems - numGold - numPotions - numMats;

  let itemIdx = 0;

  // Helper sinh vận tốc vòm cầu 360 độ (Parabolic Fountain)
  const getFountainVelocity = (idx: number): [number, number, number] => {
    const angle = (idx / totalItems) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const speed = 2.4 + Math.random() * 2.2; // tiếp đất 1.5m - 2.8m
    return [
      Math.cos(angle) * speed,
      5.6 + Math.random() * 2.8, // bay vọt lên trời
      Math.sin(angle) * speed,
    ];
  };

  // Helper tính rarity theo tier rương
  const rollRarity = (): LootRarity => {
    const r = Math.random() * 100;
    if (chest.tier === "MIRACLE_CHEST") {
      if (r < 25) return "miracle";
      if (r < 70) return "legendary";
      return "epic";
    }
    if (chest.tier === "GOLDEN") {
      if (r < 2.5) return "miracle";
      if (r < 32) return "legendary";
      if (r < 80) return "epic";
      return "rare";
    }
    if (chest.tier === "SILVER") {
      if (r < 0.5) return "legendary";
      if (r < 25) return "epic";
      if (r < 75) return "rare";
      return "common";
    }
    // WOODEN
    if (r < 5) return "epic";
    if (r < 30) return "rare";
    return "common";
  };

  const getRarityMultiplier = (rarity: LootRarity): number => {
    switch (rarity) {
      case "miracle": return 3.5;
      case "legendary": return 2.2;
      case "epic": return 1.6;
      case "rare": return 1.25;
      default: return 1.0;
    }
  };

  const getRarityColor = (rarity: LootRarity): string => {
    switch (rarity) {
      case "miracle": return "#ff2d75";
      case "legendary": return "#fbbf24";
      case "epic": return "#c084fc";
      case "rare": return "#00f2ff";
      default: return "#ffffff";
    }
  };

  // ── A. TÚI VÀNG THEO CẤP NHÂN VẬT ──────────────────────────────────────────
  for (let i = 0; i < numGold; i++) {
    const baseGoldRate = 28 + Math.floor(Math.random() * 35);
    const goldAmount = Math.max(
      50,
      Math.round(baseGoldRate * playerLevel * cfg.goldMultiplier)
    );

    drops.push({
      id: `chest-loot-gold-${now}-${itemIdx}`,
      itemId: "gold",
      name: `Túi Vàng Hoàng Kim (+${goldAmount.toLocaleString()} Vàng)`,
      type: "gold",
      rarity: chest.tier === "MIRACLE_CHEST" ? "legendary" : "rare",
      position: [chest.position[0], 0.6, chest.position[2]],
      velocity: getFountainVelocity(itemIdx),
      value: goldAmount,
      quantity: goldAmount,
      icon: "🪙",
      color: "#fbbf24",
      statText: `+${goldAmount.toLocaleString()} Vàng`,
      bounceCount: 0,
      isGrounded: false,
      lifetime: 120,
    });
    itemIdx++;
  }

  // ── B. TRANG BỊ CÂN CHỈNH ĐỘNG THEO CẤP NHÂN VẬT (LV.1 -> LV.999) ─────────
  for (let i = 0; i < numGear; i++) {
    const rarity = rollRarity();
    const itemLevel = Math.max(1, Math.min(999, playerLevel + Math.floor(Math.random() * 4) - 1));
    const rarityMul = getRarityMultiplier(rarity);

    // Roll giữa Vũ Khí, Giáp, và Phụ Kiện
    const gearCategoryRoll = Math.random();
    let template: { itemId: string; name: string; type: LootType; icon: string; baseStat: number; statKey: string };

    if (rarity === "miracle" && Math.random() < 0.6) {
      template = BASE_WEAPONS[BASE_WEAPONS.length - 1]; // Long Thần Bất Diệt Quyền
    } else if (gearCategoryRoll < 0.45) {
      template = BASE_WEAPONS[Math.floor(Math.random() * BASE_WEAPONS.length)];
    } else if (gearCategoryRoll < 0.75) {
      template = BASE_ARMORS[Math.floor(Math.random() * BASE_ARMORS.length)];
    } else {
      template = BASE_ACCESSORIES[Math.floor(Math.random() * BASE_ACCESSORIES.length)];
    }

    // Công thức tính chỉ số scaled theo cấp nhân vật:
    // scaledStat = round(baseStat * (1 + (itemLevel - 1) * 0.15) * rarityMultiplier)
    const scaledStat = Math.round(template.baseStat * (1 + (itemLevel - 1) * 0.15) * rarityMul);
    const itemName = `[Lv.${itemLevel}] ${template.name}`;
    const statText = `${template.statKey} +${scaledStat}`;

    drops.push({
      id: `chest-loot-gear-${now}-${itemIdx}`,
      itemId: template.itemId,
      name: itemName,
      type: template.type,
      rarity,
      position: [chest.position[0], 0.6, chest.position[2]],
      velocity: getFountainVelocity(itemIdx),
      value: scaledStat,
      quantity: 1,
      icon: template.icon,
      color: getRarityColor(rarity),
      statText,
      bounceCount: 0,
      isGrounded: false,
      lifetime: 180,
    });
    itemIdx++;
  }

  // ── C. BÌNH HỒI PHỤC & ĐAN DƯỢC THEO BẬC CẤP ĐỘ ───────────────────────────
  for (let i = 0; i < numPotions; i++) {
    let potId: string;
    let potName: string;
    let potIcon: string;
    let potStat: string;

    if (playerLevel <= 20) {
      potId = i % 2 === 0 ? "potion_hp_minor" : "potion_mp_minor";
      potName = i % 2 === 0 ? "Bình Máu Tân Thủ" : "Bình Mana Tân Thủ";
      potIcon = i % 2 === 0 ? "🧪" : "💧";
      potStat = "Hồi 20% HP/MP";
    } else if (playerLevel <= 100) {
      potId = i % 2 === 0 ? "potion_hp_greater" : "potion_mp_super";
      potName = i % 2 === 0 ? "Bình Máu Đại Dược" : "Bình Mana Siêu Cấp";
      potIcon = i % 2 === 0 ? "🧪" : "💧";
      potStat = "Hồi 35% HP/MP";
    } else {
      potId = "potion_hp_greater";
      potName = "Thần Dược Cửu Chuyển Hoàn Đan";
      potIcon = "✨";
      potStat = "Hồi Đầy 100% Sinh Lực & Nội Lực";
    }

    const qty = 2 + Math.floor(Math.random() * 4);

    drops.push({
      id: `chest-loot-pot-${now}-${itemIdx}`,
      itemId: potId,
      name: `${potName} (x${qty})`,
      type: "potion",
      rarity: playerLevel > 100 ? "epic" : "common",
      position: [chest.position[0], 0.6, chest.position[2]],
      velocity: getFountainVelocity(itemIdx),
      value: qty,
      quantity: qty,
      icon: potIcon,
      color: "#22c55e",
      statText: potStat,
      bounceCount: 0,
      isGrounded: false,
      lifetime: 90,
    });
    itemIdx++;
  }

  // ── D. NGUYÊN LIỆU NÂNG CẤP & BẢO THẠCH KHẢM NẠM ──────────────────────────
  for (let i = 0; i < numMats; i++) {
    // Nếu là Miracle Chest, luôn dành 1 slot cho Lõi Kì Tích
    if (chest.tier === "MIRACLE_CHEST" && i === 0) {
      drops.push({
        id: `chest-loot-miracle-core-${now}-${itemIdx}`,
        itemId: "material_miracle_core",
        name: "Lõi Tinh Thể Kì Tích",
        type: "accessory",
        rarity: "miracle",
        position: [chest.position[0], 0.6, chest.position[2]],
        velocity: getFountainVelocity(itemIdx),
        value: 10000,
        quantity: 1,
        icon: "💖",
        color: "#ff2d75",
        statText: "Bảo vật Kì Tích hào quang hồng tím tối thượng",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 300,
      });
      itemIdx++;
      continue;
    }

    // Chọn bậc ngọc theo cấp độ nhân vật (1 đến 5)
    const gemRank = Math.min(
      5,
      Math.max(
        1,
        playerLevel <= 50 ? 1 : playerLevel <= 150 ? 2 : playerLevel <= 350 ? 3 : playerLevel <= 700 ? 4 : 5
      )
    );

    const matPool = [
      { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", icon: "💎", rarity: "rare" as LootRarity, text: "Dùng để rèn đúc +1 -> +15" },
      { itemId: "material_reforge_stone", name: "Đá Tẩy Luyện Thần Bí", icon: "🔮", rarity: "rare" as LootRarity, text: "Tẩy luyện thuộc tính ẩn (C -> SS)" },
      { itemId: `gem_ruby_${gemRank}`, name: `Hồng Ngọc Cấp ${gemRank}`, icon: "🔴", rarity: gemRank >= 4 ? "legendary" : ("rare" as LootRarity), text: `Khảm ngọc: Tăng Công Bạo Bậc ${gemRank}` },
      { itemId: `gem_sapphire_${gemRank}`, name: `Lam Ngọc Cấp ${gemRank}`, icon: "🔵", rarity: gemRank >= 4 ? "legendary" : ("rare" as LootRarity), text: `Khảm ngọc: Tăng Giáp & Kháng Phép Bậc ${gemRank}` },
      { itemId: `gem_topaz_${gemRank}`, name: `Hoàng Ngọc Cấp ${gemRank}`, icon: "🟡", rarity: gemRank >= 4 ? "legendary" : ("rare" as LootRarity), text: `Khảm ngọc: Tăng Tỉ Lệ Chí Mạng Bậc ${gemRank}` },
    ];

    const chosenMat = matPool[Math.floor(Math.random() * matPool.length)];
    const qty = 1 + Math.floor(Math.random() * 3);

    drops.push({
      id: `chest-loot-mat-${now}-${itemIdx}`,
      itemId: chosenMat.itemId,
      name: `${chosenMat.name} (x${qty})`,
      type: "accessory",
      rarity: chosenMat.rarity,
      position: [chest.position[0], 0.6, chest.position[2]],
      velocity: getFountainVelocity(itemIdx),
      value: qty,
      quantity: qty,
      icon: chosenMat.icon,
      color: getRarityColor(chosenMat.rarity),
      statText: chosenMat.text,
      bounceCount: 0,
      isGrounded: false,
      lifetime: 120,
    });
    itemIdx++;
  }

  return drops;
}
