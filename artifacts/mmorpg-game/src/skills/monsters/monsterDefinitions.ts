// ==============================================================================
// Chiến Long Bá — Quy Chuẩn Định Nghĩa Quái Vật & Boss (Monster Definition System)
// Kế thừa Bonfire Game Engine Architecture:
// - Thông số: Tên, Cấp độ, Máu (HP), Công kích (ATK), Tốc độ di chuyển (SPD)
// - Kiểu tấn công: Cận chiến (MELEE) hoặc Tầm xa (RANGED - bắn đạn)
// - Hành vi AI: Tuần tra (PATROL), Đuổi khi vào tầm nhìn (AGGRO), Quay về khi quá xa (LEASH)
// - Phần thưởng: Kinh nghiệm tu vi (EXP), Linh thạch/Vàng (Gold), Tỉ lệ rơi đan dược/pháp bảo
// - Quái Tinh Anh / Boss: Nhân hệ số chỉ số & thưởng, Chiêu đặc biệt có báo vùng đỏ (Red Telegraph)
// ==============================================================================

import * as THREE from "three";
import type { TelegraphShape, PatternDebuff } from "./monster-ai.types";

export type MonsterAttackType = "MELEE" | "RANGED";
export type MonsterRank = "NORMAL" | "ELITE" | "BOSS";

export interface LootDropEntry {
  itemId: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "miracle";
  dropRate: number; // 0.0 -> 1.0 (ví dụ 0.3 = 30%)
  minQty: number;
  maxQty: number;
  category: "pill" | "equipment" | "material" | "chest";
}

export interface MonsterSpecialSkill {
  id: string;
  name: string;
  telegraphShape: TelegraphShape; // "CIRCLE" | "CONE" | "LINE_BOX" | "DONUT_RING"
  range: number;                 // Khoảng cách bắt đầu tung chiêu (mét)
  radiusOrWidth: number;         // Bán kính vùng tròn/quạt hoặc bề rộng vệt
  angleDeg?: number;             // Góc quạt nếu là CONE (60° - 90°)
  length?: number;               // Độ dài vệt nếu là LINE_BOX
  telegraphDurationMs: number;   // Thời gian báo vùng đỏ cảnh báo trước khi nổ (ms)
  damageMultiplier: number;      // Hệ số sát thương
  knockbackForce: number;        // Lực đẩy lùi
  color?: string;                // Màu vùng đỏ cảnh báo (#ef4444)
  debuff?: PatternDebuff;        // Hiệu ứng bất lợi (choáng, chậm, chảy máu, trúng độc)
}

export interface MonsterTypeConfig {
  id: string;
  name: string;
  level: number;
  baseHp: number;
  baseAtk: number;
  moveSpeed: number;             // Tốc độ di chuyển (m/s)
  attackType: MonsterAttackType; // "MELEE" (áp sát cào cắn) hoặc "RANGED" (bắn đạn)
  attackRange: number;           // Cự ly tấn công hiệu quả
  attackCooldown: number;        // Thời gian hồi chiêu giữa các đòn đánh thường (giây)
  projectileConfig?: {
    speed: number;               // Tốc độ đạn bay (m/s)
    color: string;               // Màu viên đạn
    size: number;                // Kích thước viên đạn
    trailColor?: string;         // Màu đuôi đạn
  };
  color: string;                 // Màu sắc nhận diện
  scale: number;                 // Tỷ lệ kích thước mô hình
  rank: MonsterRank;             // "NORMAL" | "ELITE" | "BOSS"

  // Hệ số quái Tinh Anh / Boss
  rankMultipliers: {
    hpMult: number;
    atkMult: number;
    expMult: number;
    goldMult: number;
  };

  // Hành vi AI
  behavior: {
    aggroRadius: number;         // Tầm nhìn phát hiện người chơi (mét)
    leashRadius: number;         // Cự ly tối đa từ điểm sinh trước khi quay đầu về (mét)
    patrolRadius: number;        // Bán kính đi dạo quanh tổ khi nhàn rỗi (mét)
    returnSpeedMult: number;     // Hệ số tăng tốc khi quay về tổ
  };

  // Phần thưởng khi chết
  rewards: {
    exp: number;                 // Kinh nghiệm tu vi
    gold: number;                // Linh thạch / Vàng
    dropTable: LootDropEntry[];  // Bảng tỉ lệ rơi đan dược, pháp bảo, tài nguyên
  };

  // Chiêu đặc biệt có báo vùng đỏ (Dành cho Quái Tinh Anh & Boss)
  specialSkills: MonsterSpecialSkill[];
  phase2Skills?: MonsterSpecialSkill[]; // Dành riêng cho Boss khi HP <= 50%
}

// ==============================================================================
// DANH MỤC QUÁI VẬT TOÀN THẾ GIỚI CHIẾN LONG BÁ
// ==============================================================================

export const MONSTER_DEFINITIONS: Record<string, MonsterTypeConfig> = {
  // ── 1. Slime Đầm Lầy (Quái Cận Chiến Tân Thủ) ─────────────────────────────
  slime_swamp: {
    id: "slime_swamp",
    name: "Slime Đầm Lầy",
    level: 1,
    baseHp: 95,
    baseAtk: 12,
    moveSpeed: 2.8,
    attackType: "MELEE",
    attackRange: 2.0,
    attackCooldown: 2.2,
    color: "#22c55e",
    scale: 0.95,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 7.0,
      leashRadius: 16.0,
      patrolRadius: 4.0,
      returnSpeedMult: 1.5,
    },
    rewards: {
      exp: 45,
      gold: 25,
      dropTable: [
        { itemId: "potion_hp_minor", name: "Bình Máu Tân Thủ", rarity: "common", dropRate: 0.45, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", rarity: "common", dropRate: 0.35, minQty: 1, maxQty: 1, category: "material" },
        { itemId: "food_herbal_soup", name: "Súp Hầm Thảo Dược", rarity: "common", dropRate: 0.20, minQty: 1, maxQty: 1, category: "pill" },
      ],
    },
    specialSkills: [],
  },

  // ── 2. Slime Đỏ Rừng Sâu (Quái Cận Chiến Lv.2) ────────────────────────────
  slime_red: {
    id: "slime_red",
    name: "Slime Đỏ Rừng Sâu",
    level: 2,
    baseHp: 140,
    baseAtk: 16,
    moveSpeed: 3.2,
    attackType: "MELEE",
    attackRange: 2.2,
    attackCooldown: 2.0,
    color: "#ef4444",
    scale: 1.05,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 7.5,
      leashRadius: 18.0,
      patrolRadius: 4.5,
      returnSpeedMult: 1.6,
    },
    rewards: {
      exp: 65,
      gold: 38,
      dropTable: [
        { itemId: "potion_hp_minor", name: "Bình Máu Tân Thủ", rarity: "common", dropRate: 0.50, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "potion_mp_minor", name: "Bình Mana Tân Thủ", rarity: "common", dropRate: 0.35, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "material_steel_ore", name: "Quặng Huyền Thiết", rarity: "common", dropRate: 0.30, minQty: 1, maxQty: 2, category: "material" },
      ],
    },
    specialSkills: [],
  },

  // ── 3. Sói Hoang Nanh Băng (Quái Cận Chiến Tốc Độ Cao) ─────────────────────
  wolf_wild: {
    id: "wolf_wild",
    name: "Sói Hoang Nanh Băng",
    level: 5,
    baseHp: 460,
    baseAtk: 40,
    moveSpeed: 5.2,
    attackType: "MELEE",
    attackRange: 2.4,
    attackCooldown: 1.8,
    color: "#64748b",
    scale: 1.15,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 9.0,
      leashRadius: 20.0,
      patrolRadius: 6.0,
      returnSpeedMult: 1.8,
    },
    rewards: {
      exp: 150,
      gold: 85,
      dropTable: [
        { itemId: "potion_hp_greater", name: "Bình Máu Đại", rarity: "common", dropRate: 0.40, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "food_dragon_grill", name: "Thịt Nướng Long Tộc", rarity: "common", dropRate: 0.35, minQty: 1, maxQty: 1, category: "pill" },
        { itemId: "gear_fighter_boots_rare", name: "Giày Chiến Binh Hoang Dã", rarity: "rare", dropRate: 0.12, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", rarity: "rare", dropRate: 0.08, minQty: 1, maxQty: 1, category: "material" },
      ],
    },
    specialSkills: [],
  },

  // ── 4. Yêu Tinh Cung Thủ (Quái Tầm Xa - Bắn Tên Ma Pháp) ───────────────────
  goblin_archer: {
    id: "goblin_archer",
    name: "Yêu Tinh Cung Thủ",
    level: 5,
    baseHp: 380,
    baseAtk: 38,
    moveSpeed: 3.8,
    attackType: "RANGED",
    attackRange: 7.5,
    attackCooldown: 2.4,
    projectileConfig: {
      speed: 16.0,
      color: "#84cc16",
      size: 0.28,
      trailColor: "#a3e635",
    },
    color: "#84cc16",
    scale: 1.05,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 10.0,
      leashRadius: 22.0,
      patrolRadius: 5.0,
      returnSpeedMult: 1.6,
    },
    rewards: {
      exp: 165,
      gold: 95,
      dropTable: [
        { itemId: "potion_mp_minor", name: "Bình Mana Tân Thủ", rarity: "common", dropRate: 0.50, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "gear_gunner_main_weapon_common", name: "Súng Tân Binh", rarity: "common", dropRate: 0.18, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", rarity: "common", dropRate: 0.40, minQty: 1, maxQty: 2, category: "material" },
      ],
    },
    specialSkills: [],
  },

  // ── 5. Yêu Tinh Đao Phủ (Quái Cận Chiến - Sát Thương Bạo Kích) ─────────────
  goblin_executioner: {
    id: "goblin_executioner",
    name: "Yêu Tinh Đao Phủ",
    level: 6,
    baseHp: 580,
    baseAtk: 48,
    moveSpeed: 4.2,
    attackType: "MELEE",
    attackRange: 2.5,
    attackCooldown: 2.2,
    color: "#65a30d",
    scale: 1.15,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 9.5,
      leashRadius: 20.0,
      patrolRadius: 5.5,
      returnSpeedMult: 1.7,
    },
    rewards: {
      exp: 195,
      gold: 110,
      dropTable: [
        { itemId: "potion_hp_greater", name: "Bình Máu Đại", rarity: "common", dropRate: 0.45, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "gear_assassin_main_weapon_common", name: "Song Đao Sát Thủ", rarity: "common", dropRate: 0.15, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "material_steel_ore", name: "Quặng Huyền Thiết", rarity: "common", dropRate: 0.35, minQty: 1, maxQty: 3, category: "material" },
      ],
    },
    specialSkills: [],
  },

  // ── 6. Pháp Sư Xương Hư Không (Quái Tầm Xa Bắn Cầu Ma Pháp) ────────────────
  skeleton_mage: {
    id: "skeleton_mage",
    name: "Pháp Sư Xương Hư Không",
    level: 7,
    baseHp: 520,
    baseAtk: 56,
    moveSpeed: 3.5,
    attackType: "RANGED",
    attackRange: 8.5,
    attackCooldown: 2.6,
    projectileConfig: {
      speed: 15.0,
      color: "#c084fc",
      size: 0.35,
      trailColor: "#a855f7",
    },
    color: "#a855f7",
    scale: 1.2,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 10.5,
      leashRadius: 22.0,
      patrolRadius: 5.0,
      returnSpeedMult: 1.6,
    },
    rewards: {
      exp: 240,
      gold: 135,
      dropTable: [
        { itemId: "potion_mp_super", name: "Bình Mana Siêu Cấp", rarity: "rare", dropRate: 0.35, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", rarity: "common", dropRate: 0.50, minQty: 1, maxQty: 3, category: "material" },
        { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", rarity: "rare", dropRate: 0.12, minQty: 1, maxQty: 1, category: "material" },
        { itemId: "gear_tank_amulet_rare", name: "Dây Chuyền Hộ Mệnh", rarity: "rare", dropRate: 0.08, minQty: 1, maxQty: 1, category: "equipment" },
      ],
    },
    specialSkills: [],
  },

  // ── 7. Chiến Binh Orc Cổ (Quái Cận Chiến Hạng Nặng) ───────────────────────
  orc_warrior: {
    id: "orc_warrior",
    name: "Chiến Binh Orc Cổ",
    level: 8,
    baseHp: 820,
    baseAtk: 65,
    moveSpeed: 4.0,
    attackType: "MELEE",
    attackRange: 2.8,
    attackCooldown: 2.5,
    color: "#dc2626",
    scale: 1.35,
    rank: "NORMAL",
    rankMultipliers: { hpMult: 1.0, atkMult: 1.0, expMult: 1.0, goldMult: 1.0 },
    behavior: {
      aggroRadius: 10.0,
      leashRadius: 22.0,
      patrolRadius: 6.0,
      returnSpeedMult: 1.7,
    },
    rewards: {
      exp: 290,
      gold: 160,
      dropTable: [
        { itemId: "potion_hp_greater", name: "Bình Máu Đại", rarity: "common", dropRate: 0.50, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "food_dragon_grill", name: "Thịt Nướng Long Tộc", rarity: "common", dropRate: 0.40, minQty: 1, maxQty: 2, category: "pill" },
        { itemId: "gear_fighter_armor_rare", name: "Áo Giáp Chiến Binh Cổ", rarity: "rare", dropRate: 0.14, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", rarity: "rare", dropRate: 0.15, minQty: 1, maxQty: 2, category: "material" },
      ],
    },
    specialSkills: [],
  },

  // ── 8. Kỵ Sĩ Hắc Ám (QUÁI TINH ANH - ELITE MONSTER) ───────────────────────
  dark_knight_elite: {
    id: "dark_knight_elite",
    name: "Kỵ Sĩ Hắc Ám (Tinh Anh)",
    level: 12,
    baseHp: 1250, // x3.0 = 3,750 HP
    baseAtk: 75,  // x1.8 = 135 ATK
    moveSpeed: 4.5,
    attackType: "MELEE",
    attackRange: 3.0,
    attackCooldown: 2.0,
    color: "#eab308", // Vàng hoàng kim Tinh Anh
    scale: 1.5,
    rank: "ELITE",
    rankMultipliers: {
      hpMult: 3.0,    // Máu nhân 3 lần
      atkMult: 1.8,   // Công kích nhân 1.8 lần
      expMult: 4.0,   // Kinh nghiệm nhân 4 lần
      goldMult: 5.0,  // Linh thạch nhân 5 lần
    },
    behavior: {
      aggroRadius: 12.0,
      leashRadius: 26.0,
      patrolRadius: 7.0,
      returnSpeedMult: 1.8,
    },
    rewards: {
      exp: 450,        // Sau nhân x4 = 1,800 EXP
      gold: 240,       // Sau nhân x5 = 1,200 Gold
      dropTable: [
        { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", rarity: "rare", dropRate: 0.85, minQty: 2, maxQty: 5, category: "material" },
        { itemId: "gear_tank_main_weapon_rare", name: "Trọng Búa Thánh Quang Hiếm", rarity: "rare", dropRate: 0.35, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "gear_fighter_main_weapon_epic", name: "Quyền Giáp Hỏa Long Sử Thi", rarity: "epic", dropRate: 0.15, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "material_dragon_crystal", name: "Tinh Thể Rồng", rarity: "epic", dropRate: 0.25, minQty: 1, maxQty: 2, category: "material" },
        { itemId: "potion_hp_greater", name: "Bình Máu Đại", rarity: "common", dropRate: 0.80, minQty: 3, maxQty: 5, category: "pill" },
      ],
    },
    // Chiêu đặc biệt có báo vùng đỏ (Red Telegraph) trước khi tung
    specialSkills: [
      {
        id: "elite_cone_slam",
        name: "Trảm Kích Hắc Ám (Vùng Quạt 80°)",
        telegraphShape: "CONE",
        range: 6.5,
        radiusOrWidth: 6.5,
        angleDeg: 80, // Vùng quạt 80 độ
        telegraphDurationMs: 950, // Báo vùng đỏ trong 0.95s
        damageMultiplier: 2.0,
        knockbackForce: 3.2,
        color: "#ef4444",
        debuff: {
          type: "SLOW",
          name: "Chấn Động Tê Liệt",
          icon: "🌪️",
          durationSeconds: 2.5,
          magnitude: 0.4,
        },
      },
      {
        id: "elite_charge_line",
        name: "Thiết Giáp Thiết Đột (Vệt Thẳng Đỏ)",
        telegraphShape: "LINE_BOX",
        range: 10.0,
        radiusOrWidth: 2.6,
        length: 10.0,
        telegraphDurationMs: 850, // Báo vệt thẳng đỏ trong 0.85s
        damageMultiplier: 2.2,
        knockbackForce: 4.5,
        color: "#ef4444",
        debuff: {
          type: "STUN",
          name: "Choáng Thiết Đột",
          icon: "💫",
          durationSeconds: 1.5,
        },
      },
    ],
  },

  // ── 9. Hỏa Long Ma Thần (WORLD BOSS - THỦ LĨNH THẾ GIỚI CẤP 20) ────────────
  ancient_fire_dragon: {
    id: "ancient_fire_dragon",
    name: "Hỏa Long Ma Thần (World Boss)",
    level: 20,
    baseHp: 3500, // x10.0 = 35,000 HP
    baseAtk: 130, // x3.0 = 390 ATK
    moveSpeed: 4.8,
    attackType: "MELEE",
    attackRange: 5.5,
    attackCooldown: 2.2,
    color: "#ff2d55",
    scale: 2.4,
    rank: "BOSS",
    rankMultipliers: {
      hpMult: 10.0,   // Máu nhân 10 lần (35,000 HP)
      atkMult: 3.0,   // Công kích nhân 3 lần
      expMult: 10.0,  // Kinh nghiệm nhân 10 lần
      goldMult: 15.0, // Linh thạch nhân 15 lần
    },
    behavior: {
      aggroRadius: 18.0,
      leashRadius: 42.0,
      patrolRadius: 8.0,
      returnSpeedMult: 1.8,
    },
    rewards: {
      exp: 1500,       // Sau nhân x10 = 15,000 EXP
      gold: 800,       // Sau nhân x15 = 12,000 Gold
      dropTable: [
        { itemId: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", rarity: "rare", dropRate: 1.0, minQty: 5, maxQty: 10, category: "material" },
        { itemId: "material_dragon_crystal", name: "Tinh Thể Rồng", rarity: "epic", dropRate: 0.80, minQty: 3, maxQty: 6, category: "material" },
        { itemId: "gear_tank_main_weapon_legendary", name: "Trọng Búa Thánh Quang Hoàng Kim", rarity: "legendary", dropRate: 0.25, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "gear_fighter_main_weapon_legendary", name: "Quyền Giáp Hỏa Long Hoàng Kim", rarity: "legendary", dropRate: 0.25, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "gear_assassin_main_weapon_legendary", name: "Song Đao Huyết Nguyệt Hoàng Kim", rarity: "legendary", dropRate: 0.25, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "gear_gunner_main_weapon_legendary", name: "Súng Điện Từ Hoàng Kim", rarity: "legendary", dropRate: 0.25, minQty: 1, maxQty: 1, category: "equipment" },
        { itemId: "quest_gold_chest", name: "Rương Báu Hoàng Kim", rarity: "legendary", dropRate: 0.50, minQty: 1, maxQty: 1, category: "chest" },
      ],
    },
    // Chiêu thức đặc biệt Phase 1 (Báo vùng đỏ)
    specialSkills: [
      {
        id: "boss_ground_slam",
        name: "Thiên Vực Địa Liệt (Vùng Tròn Đỏ)",
        telegraphShape: "CIRCLE",
        range: 8.0,
        radiusOrWidth: 6.5,
        telegraphDurationMs: 1100, // Vùng tròn đỏ 1.1s
        damageMultiplier: 2.5,
        knockbackForce: 4.0,
        color: "#ef4444",
        debuff: {
          type: "STUN",
          name: "Choáng Chấn Động",
          icon: "💫",
          durationSeconds: 1.8,
        },
      },
      {
        id: "boss_fire_breath",
        name: "Hỏa Diệm Long Tức (Vùng Quạt Đỏ 85°)",
        telegraphShape: "CONE",
        range: 9.0,
        radiusOrWidth: 8.5,
        angleDeg: 85, // Góc quạt 85 độ
        telegraphDurationMs: 1000, // Vùng quạt đỏ 1.0s
        damageMultiplier: 2.8,
        knockbackForce: 3.5,
        color: "#ef4444",
        debuff: {
          type: "BLEED",
          name: "Thiêu Đốt Hỏa Long",
          icon: "🔥",
          durationSeconds: 4.0,
          tickInterval: 0.5,
          tickDamage: 25,
        },
      },
      {
        id: "boss_rampage_charge",
        name: "Bạo Chúa Cuồng Xung (Vệt Thẳng Đỏ)",
        telegraphShape: "LINE_BOX",
        range: 14.0,
        radiusOrWidth: 3.5,
        length: 14.0,
        telegraphDurationMs: 950,
        damageMultiplier: 3.0,
        knockbackForce: 5.5,
        color: "#ef4444",
      },
    ],
    // Chiêu thức nâng cấp Phase 2 (Khi HP <= 50% Cuồng Bạo)
    phase2Skills: [
      {
        id: "boss_death_sanctuary",
        name: "Tử Thần Vực Giới (Vòng Khuyên Đỏ Donut)",
        telegraphShape: "DONUT_RING",
        range: 12.0,
        radiusOrWidth: 14.0,
        telegraphDurationMs: 1250,
        damageMultiplier: 3.5,
        knockbackForce: 5.0,
        color: "#ef4444",
      },
      {
        id: "boss_meteor_rain",
        name: "Thiên Ngoại Hỏa Tinh (Mưa Sao Băng Đỏ)",
        telegraphShape: "CIRCLE",
        range: 12.0,
        radiusOrWidth: 7.5,
        telegraphDurationMs: 850,
        damageMultiplier: 3.2,
        knockbackForce: 4.0,
        color: "#ef4444",
      },
    ],
  },
};

// Helper: Tra cứu thông số quái vật
export function getMonsterConfig(monsterId?: string | null): MonsterTypeConfig {
  if (!monsterId) return MONSTER_DEFINITIONS.slime_swamp;
  const key = monsterId.toLowerCase();
  if (MONSTER_DEFINITIONS[key]) return MONSTER_DEFINITIONS[key];

  // Fuzzy match
  if (key.includes("dragon") || key.includes("boss")) return MONSTER_DEFINITIONS.ancient_fire_dragon;
  if (key.includes("knight") || key.includes("elite")) return MONSTER_DEFINITIONS.dark_knight_elite;
  if (key.includes("orc")) return MONSTER_DEFINITIONS.orc_warrior;
  if (key.includes("mage") || key.includes("skeleton")) return MONSTER_DEFINITIONS.skeleton_mage;
  if (key.includes("executioner")) return MONSTER_DEFINITIONS.goblin_executioner;
  if (key.includes("archer")) return MONSTER_DEFINITIONS.goblin_archer;
  if (key.includes("wolf")) return MONSTER_DEFINITIONS.wolf_wild;
  if (key.includes("red")) return MONSTER_DEFINITIONS.slime_red;
  return MONSTER_DEFINITIONS.slime_swamp;
}

