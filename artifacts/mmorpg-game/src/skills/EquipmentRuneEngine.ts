// ==============================================================================
// Equipment Rune System Engine (Chiến Long Bá MMORPG)
// 3 to 4 Rune Lines, Class Affinity, Stat Penalty (50%), Combat Power & Visual Shimmer
// ==============================================================================

export type RuneType =
  | "vampiric"
  | "venomous"
  | "dark_curse"
  | "thunderstrike"
  | "frostbite"
  | "armor_pierce"
  | "inferno"
  | "regeneration"
  | "thorns"
  | "guardian_shield"
  | "phantom_step";

export type RuneRank = "I" | "II" | "III" | "IV" | "V";

export interface ItemRune {
  id: string;
  type: RuneType;
  name: string;
  icon: string;
  rank: RuneRank;
  value: number; // e.g. 5% lifesteal or 60 poison dmg
  description: string;
  isWeaponCompatible: boolean;
  isArmorCompatible: boolean;
  color: string;
  combatPower: number;
}

export const RUNE_DEFINITIONS: Record<
  RuneType,
  {
    name: string;
    icon: string;
    isWeaponCompatible: boolean;
    isArmorCompatible: boolean;
    color: string;
    rankValues: Record<RuneRank, { value: number; desc: string; cp: number }>;
  }
> = {
  vampiric: {
    name: "Phù Văn Hút Máu",
    icon: "🩸",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#ef4444",
    rankValues: {
      I: { value: 3.0, desc: "Hút 3.0% sát thương gây ra chuyển thành HP", cp: 120 },
      II: { value: 4.5, desc: "Hút 4.5% sát thương gây ra chuyển thành HP", cp: 220 },
      III: { value: 6.0, desc: "Hút 6.0% sát thương gây ra chuyển thành HP", cp: 350 },
      IV: { value: 7.2, desc: "Hút 7.2% sát thương gây ra chuyển thành HP", cp: 500 },
      V: { value: 8.5, desc: "Hút 8.5% sát thương gây ra chuyển thành HP", cp: 750 },
    },
  },
  venomous: {
    name: "Phù Văn Độc Tố",
    icon: "☠️",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#10b981",
    rankValues: {
      I: { value: 25, desc: "Độc tố rút 25 HP/giây trong 4s và giảm 20% hồi máu", cp: 120 },
      II: { value: 50, desc: "Độc tố rút 50 HP/giây trong 4s và giảm 20% hồi máu", cp: 220 },
      III: { value: 80, desc: "Độc tố rút 80 HP/giây trong 4s và giảm 20% hồi máu", cp: 350 },
      IV: { value: 110, desc: "Độc tố rút 110 HP/giây trong 4s và giảm 20% hồi máu", cp: 500 },
      V: { value: 150, desc: "Độc tố rút 150 HP/giây trong 4s và giảm 25% hồi máu", cp: 750 },
    },
  },
  dark_curse: {
    name: "Phù Văn Hắc Văn",
    icon: "🌑",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#a855f7",
    rankValues: {
      I: { value: 20, desc: "20% tỉ lệ nổ Hắc Văn Chú: +150% Dark DMG & -15% ATK mục tiêu", cp: 150 },
      II: { value: 24, desc: "24% tỉ lệ nổ Hắc Văn Chú: +160% Dark DMG & -18% ATK mục tiêu", cp: 250 },
      III: { value: 28, desc: "28% tỉ lệ nổ Hắc Văn Chú: +175% Dark DMG & -20% ATK mục tiêu", cp: 390 },
      IV: { value: 32, desc: "32% tỉ lệ nổ Hắc Văn Chú: +190% Dark DMG & -22% ATK mục tiêu", cp: 540 },
      V: { value: 38, desc: "38% tỉ lệ nổ Hắc Văn Chú: +220% Dark DMG & -25% ATK mục tiêu", cp: 800 },
    },
  },
  thunderstrike: {
    name: "Phù Văn Lôi Phạt",
    icon: "⚡",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#facc15",
    rankValues: {
      I: { value: 18, desc: "18% tỉ lệ phóng sét dây chuyền sang 3 mục tiêu xung quanh", cp: 120 },
      II: { value: 22, desc: "22% tỉ lệ phóng sét dây chuyền sang 3 mục tiêu xung quanh", cp: 220 },
      III: { value: 26, desc: "26% tỉ lệ phóng sét dây chuyền sang 4 mục tiêu xung quanh", cp: 350 },
      IV: { value: 30, desc: "30% tỉ lệ phóng sét dây chuyền sang 4 mục tiêu xung quanh", cp: 500 },
      V: { value: 35, desc: "35% tỉ lệ phóng sét dây chuyền sang 5 mục tiêu xung quanh", cp: 750 },
    },
  },
  frostbite: {
    name: "Phù Văn Hàn Băng",
    icon: "❄️",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#38bdf8",
    rankValues: {
      I: { value: 30, desc: "Làm chậm 30% tốc chạy & tốc đánh kẻ địch trong 2.5s", cp: 110 },
      II: { value: 35, desc: "Làm chậm 35% tốc chạy & tốc đánh kẻ địch trong 2.5s", cp: 210 },
      III: { value: 40, desc: "Làm chậm 40% tốc chạy & tốc đánh kẻ địch trong 3.0s", cp: 330 },
      IV: { value: 45, desc: "Làm chậm 45% tốc chạy & tốc đánh kẻ địch trong 3.0s", cp: 480 },
      V: { value: 50, desc: "Làm chậm 50% tốc chạy & tốc đánh kẻ địch trong 3.5s", cp: 720 },
    },
  },
  armor_pierce: {
    name: "Phù Văn Phá Giáp",
    icon: "🗡️",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#fb923c",
    rankValues: {
      I: { value: 12, desc: "Bỏ qua 12% Phòng thủ (DEF) của mục tiêu", cp: 130 },
      II: { value: 16, desc: "Bỏ qua 16% Phòng thủ (DEF) của mục tiêu", cp: 230 },
      III: { value: 20, desc: "Bỏ qua 20% Phòng thủ (DEF) của mục tiêu", cp: 360 },
      IV: { value: 25, desc: "Bỏ qua 25% Phòng thủ (DEF) của mục tiêu", cp: 510 },
      V: { value: 30, desc: "Bỏ qua 30% Phòng thủ (DEF) của mục tiêu", cp: 770 },
    },
  },
  inferno: {
    name: "Phù Văn Thiêu Đốt",
    icon: "🔥",
    isWeaponCompatible: true,
    isArmorCompatible: false,
    color: "#f97316",
    rankValues: {
      I: { value: 2.0, desc: "Thiêu đốt mục tiêu 2.0% Máu tối đa mỗi giây trong 3s", cp: 120 },
      II: { value: 2.5, desc: "Thiêu đốt mục tiêu 2.5% Máu tối đa mỗi giây trong 3s", cp: 220 },
      III: { value: 3.0, desc: "Thiêu đốt mục tiêu 3.0% Máu tối đa mỗi giây trong 3s", cp: 350 },
      IV: { value: 3.8, desc: "Thiêu đốt mục tiêu 3.8% Máu tối đa mỗi giây trong 4s", cp: 500 },
      V: { value: 4.5, desc: "Thiêu đốt mục tiêu 4.5% Máu tối đa mỗi giây trong 4s", cp: 750 },
    },
  },
  regeneration: {
    name: "Phù Văn Hồi Máu",
    icon: "💚",
    isWeaponCompatible: false,
    isArmorCompatible: true,
    color: "#22c55e",
    rankValues: {
      I: { value: 1.5, desc: "Tự động hồi 1.5% Max HP + 25 HP mỗi 2 giây", cp: 130 },
      II: { value: 2.2, desc: "Tự động hồi 2.2% Max HP + 50 HP mỗi 2 giây", cp: 230 },
      III: { value: 3.0, desc: "Tự động hồi 3.0% Max HP + 85 HP mỗi 2 giây", cp: 360 },
      IV: { value: 3.8, desc: "Tự động hồi 3.8% Max HP + 120 HP mỗi 2 giây", cp: 520 },
      V: { value: 4.8, desc: "Tự động hồi 4.8% Max HP + 180 HP mỗi 2 giây", cp: 780 },
    },
  },
  thorns: {
    name: "Phù Văn Phản Đòn",
    icon: "🛡️",
    isWeaponCompatible: false,
    isArmorCompatible: true,
    color: "#94a3b8",
    rankValues: {
      I: { value: 15, desc: "Phản lại 15% sát thương cận chiến nhận vào trả kẻ tấn công", cp: 110 },
      II: { value: 20, desc: "Phản lại 20% sát thương cận chiến nhận vào trả kẻ tấn công", cp: 210 },
      III: { value: 25, desc: "Phản lại 25% sát thương cận chiến nhận vào trả kẻ tấn công", cp: 340 },
      IV: { value: 30, desc: "Phản lại 30% sát thương cận chiến nhận vào trả kẻ tấn công", cp: 490 },
      V: { value: 36, desc: "Phản lại 36% sát thương cận chiến nhận vào trả kẻ tấn công", cp: 730 },
    },
  },
  guardian_shield: {
    name: "Phù Văn Hộ Mệnh",
    icon: "✨",
    isWeaponCompatible: false,
    isArmorCompatible: true,
    color: "#38bdf8",
    rankValues: {
      I: { value: 20, desc: "Khi HP < 30%, tạo khiên chắn 20% Max HP (hồi chiêu 30s)", cp: 140 },
      II: { value: 25, desc: "Khi HP < 30%, tạo khiên chắn 25% Max HP (hồi chiêu 28s)", cp: 240 },
      III: { value: 30, desc: "Khi HP < 30%, tạo khiên chắn 30% Max HP (hồi chiêu 25s)", cp: 380 },
      IV: { value: 35, desc: "Khi HP < 35%, tạo khiên chắn 35% Max HP (hồi chiêu 22s)", cp: 530 },
      V: { value: 42, desc: "Khi HP < 35%, tạo khiên chắn 42% Max HP (hồi chiêu 20s)", cp: 790 },
    },
  },
  phantom_step: {
    name: "Phù Văn Ảnh Bộ",
    icon: "🌀",
    isWeaponCompatible: false,
    isArmorCompatible: true,
    color: "#c084fc",
    rankValues: {
      I: { value: 10, desc: "+10% Né tránh & +20% Tốc chạy trong 2s sau khi lướt", cp: 120 },
      II: { value: 13, desc: "+13% Né tránh & +22% Tốc chạy trong 2s sau khi lướt", cp: 220 },
      III: { value: 16, desc: "+16% Né tránh & +25% Tốc chạy trong 2s sau khi lướt", cp: 350 },
      IV: { value: 20, desc: "+20% Né tránh & +28% Tốc chạy trong 2.5s sau khi lướt", cp: 500 },
      V: { value: 25, desc: "+25% Né tránh & +32% Tốc chạy trong 2.5s sau khi lướt", cp: 750 },
    },
  },
};

export const CLASS_NAMES: Record<string, string> = {
  assassin: "Sát Thủ (Ảnh Vũ)",
  fighter: "Chiến Binh (Cuồng Long)",
  tank: "Hộ Vệ (Đỡ Đòn)",
  gunner: "Xạ Thủ (Pháo Thủ)",
  all: "Tất Cả Hệ Phái",
};

/**
 * Kiểm tra xem trang bị có phù hợp chức nghiệp nhân vật hay không
 */
export function isItemClassMatched(itemClassId?: string, playerClassId?: string): boolean {
  if (!itemClassId || itemClassId === "all") return true;
  if (!playerClassId) return true;
  const iClass = itemClassId.toLowerCase();
  const pClass = playerClassId.toLowerCase();
  if (iClass === pClass) return true;
  if (iClass.includes("assassin") && pClass.includes("sat_thu")) return true;
  if (iClass.includes("sat_thu") && pClass.includes("assassin")) return true;
  if (iClass.includes("fighter") && (pClass.includes("chien_binh") || pClass.includes("cuong_long"))) return true;
  if (iClass.includes("tank") && (pClass.includes("ho_ve") || pClass.includes("do_don"))) return true;
  if (iClass.includes("gunner") && (pClass.includes("xa_thu") || pClass.includes("phao_thu"))) return true;
  return false;
}

export function getClassName(classId?: string): string {
  if (!classId || classId === "all") return "Tất Cả Hệ Phái";
  const id = classId.toLowerCase();
  if (id.includes("assassin") || id.includes("sat_thu")) return "Sát Thủ";
  if (id.includes("fighter") || id.includes("chien_binh")) return "Chiến Binh";
  if (id.includes("tank") || id.includes("ho_ve")) return "Hộ Vệ";
  if (id.includes("gunner") || id.includes("xa_thu")) return "Xạ Thủ";
  return CLASS_NAMES[classId] || classId;
}

/**
 * Sinh danh sách 3 đến 4 dòng Phù Văn ngẫu nhiên cho một trang bị
 */
export function generateRunesForItem(
  slotOrType: string = "weapon",
  rarity: string = "common",
  itemLevel: number = 1
): ItemRune[] {
  const r = (rarity || "common").toLowerCase();
  const t = (slotOrType || "weapon").toLowerCase();
  const isWeapon =
    t.includes("weapon") ||
    t.includes("sword") ||
    t.includes("dagger") ||
    t.includes("bow") ||
    t.includes("hammer") ||
    t.includes("ring");

  // Số lượng dòng phù văn theo phẩm chất:
  // - Common: 0
  // - Rare: 1 đến 2 dòng
  // - Epic: đúng 3 dòng
  // - Legendary: 3 đến 4 dòng
  // - Miracle: đúng 4 dòng Phù Văn tối thượng!
  let numRunes = 0;
  if (r === "miracle") numRunes = 4;
  else if (r === "legendary") numRunes = Math.random() < 0.6 ? 4 : 3;
  else if (r === "epic") numRunes = 3;
  else if (r === "rare") numRunes = Math.random() < 0.5 ? 2 : 1;
  else return [];

  // Lọc danh sách Phù Văn tương thích
  const compatibleTypes = (Object.keys(RUNE_DEFINITIONS) as RuneType[]).filter((key) => {
    const def = RUNE_DEFINITIONS[key];
    return isWeapon ? def.isWeaponCompatible : def.isArmorCompatible;
  });

  // Roll bậc Phù Văn (Rank I -> Rank V) theo itemLevel & rarity
  const pickRank = (): RuneRank => {
    if (r === "miracle") {
      return itemLevel >= 80 ? "V" : "IV";
    }
    if (r === "legendary") {
      const roll = Math.random();
      if (itemLevel >= 100 && roll < 0.3) return "V";
      if (itemLevel >= 50 && roll < 0.7) return "IV";
      return "III";
    }
    if (r === "epic") {
      return itemLevel >= 40 ? "III" : "II";
    }
    return itemLevel >= 20 ? "II" : "I";
  };

  // Chọn ngẫu nhiên không trùng lặp các loại phù văn
  const shuffled = [...compatibleTypes].sort(() => Math.random() - 0.5);
  const selectedTypes = shuffled.slice(0, numRunes);

  // Đối với Miracle Weapon, ưu tiên luôn có Hắc Văn (dark_curse) hoặc Hút Máu (vampiric)
  if (r === "miracle" && isWeapon && !selectedTypes.includes("dark_curse")) {
    selectedTypes[0] = "dark_curse";
  }

  return selectedTypes.map((type, idx) => {
    const def = RUNE_DEFINITIONS[type];
    const rank = pickRank();
    const rankData = def.rankValues[rank];

    return {
      id: `rune-${type}-${idx}-${Date.now()}`,
      type,
      name: `${def.name} [Bậc ${rank}]`,
      icon: def.icon,
      rank,
      value: rankData.value,
      description: rankData.desc,
      isWeaponCompatible: def.isWeaponCompatible,
      isArmorCompatible: def.isArmorCompatible,
      color: def.color,
      combatPower: rankData.cp,
    };
  });
}

/**
 * Công thức tính Lực Chiến riêng cho từng món Trang Bị (Item Combat Power)
 * itemCP = BaseStatsCP * EnhanceMultiplier * RarityMultiplier + TotalRunesCP
 * Nếu trái chức nghiệp: itemCP bị chia đôi (x 0.5)
 */
export function calculateItemCombatPower(
  item: {
    atkBoost?: number;
    defBoost?: number;
    hpBoost?: number;
    spdBoost?: number;
    critBoost?: number;
    critRateBoost?: number;
    enhanceLevel?: number;
    rarity?: string;
    runesJson?: any[] | string;
    classId?: string;
  },
  isClassMatch: boolean = true
): number {
  const atk = Number(item.atkBoost || 0);
  const def = Number(item.defBoost || 0);
  const hp = Number(item.hpBoost || 0);
  const spd = Number(item.spdBoost || 0);
  const crit = Number(item.critBoost || item.critRateBoost || 0);

  const baseStatsCP = atk * 2.2 + def * 1.8 + hp * 0.4 + spd * 1.5 + crit * 2.5;
  const enhanceLevel = Number(item.enhanceLevel || 0);
  const enhanceMul = 1 + enhanceLevel * 0.1;

  const rarity = (item.rarity || "common").toLowerCase();
  const rarityMul =
    rarity === "miracle" ? 3.5 : rarity === "legendary" ? 2.2 : rarity === "epic" ? 1.6 : rarity === "rare" ? 1.25 : 1.0;

  // Tính Combat Power của các dòng Phù Văn (chỉ cộng nếu đúng hệ phái)
  let runesCP = 0;
  if (isClassMatch && item.runesJson) {
    const runes: ItemRune[] = Array.isArray(item.runesJson)
      ? item.runesJson
      : typeof item.runesJson === "string"
      ? (() => {
          try {
            return JSON.parse(item.runesJson);
          } catch {
            return [];
          }
        })()
      : [];

    for (const r of runes) {
      if (r && r.combatPower) {
        runesCP += Number(r.combatPower);
      }
    }
  }

  const rawCP = Math.round(baseStatsCP * enhanceMul * rarityMul + runesCP);
  const finalCP = isClassMatch ? rawCP : Math.floor(rawCP * 0.5);
  return Math.max(10, finalCP);
}

/**
 * Tổng hợp toàn bộ hiệu ứng Phù Văn đang kích hoạt từ các trang bị đang mặc đúng chức nghiệp
 */
export function getActiveRuneEffects(
  equippedItems: any[],
  playerClassId: string = "assassin"
) {
  const effects = {
    totalLifestealPercent: 0,
    totalPoisonDmgPerSec: 0,
    totalDarkCurseChance: 0,
    totalThunderstrikeChance: 0,
    hasFrostbiteSlow: false,
    frostbiteSlowPercent: 0,
    totalArmorPiercePercent: 0,
    totalInfernoBurnPercent: 0,
    totalHpRegenPercent: 0,
    totalHpRegenFlat: 0,
    totalThornsPercent: 0,
    guardianShieldPercent: 0,
    hasGuardianShield: false,
    phantomStepEvasionPercent: 0,
    activeRunesCount: 0,
    deactivatedRunesCount: 0,
  };

  for (const item of equippedItems) {
    if (!item || !item.equipped) continue;
    const isMatched = isItemClassMatched(item.classId, playerClassId);

    const runes: ItemRune[] = Array.isArray(item.runesJson)
      ? item.runesJson
      : typeof item.runesJson === "string"
      ? (() => {
          try {
            return JSON.parse(item.runesJson);
          } catch {
            return [];
          }
        })()
      : [];

    for (const rune of runes) {
      if (!isMatched) {
        effects.deactivatedRunesCount++;
        continue;
      }

      effects.activeRunesCount++;
      switch (rune.type) {
        case "vampiric":
          effects.totalLifestealPercent += rune.value;
          break;
        case "venomous":
          effects.totalPoisonDmgPerSec += rune.value;
          break;
        case "dark_curse":
          effects.totalDarkCurseChance = Math.min(60, effects.totalDarkCurseChance + rune.value);
          break;
        case "thunderstrike":
          effects.totalThunderstrikeChance = Math.min(50, effects.totalThunderstrikeChance + rune.value);
          break;
        case "frostbite":
          effects.hasFrostbiteSlow = true;
          effects.frostbiteSlowPercent = Math.max(effects.frostbiteSlowPercent, rune.value);
          break;
        case "armor_pierce":
          effects.totalArmorPiercePercent = Math.min(50, effects.totalArmorPiercePercent + rune.value);
          break;
        case "inferno":
          effects.totalInfernoBurnPercent += rune.value;
          break;
        case "regeneration":
          effects.totalHpRegenPercent += rune.value;
          effects.totalHpRegenFlat += Math.round(rune.value * 25);
          break;
        case "thorns":
          effects.totalThornsPercent += rune.value;
          break;
        case "guardian_shield":
          effects.hasGuardianShield = true;
          effects.guardianShieldPercent = Math.max(effects.guardianShieldPercent, rune.value);
          break;
        case "phantom_step":
          effects.phantomStepEvasionPercent += rune.value;
          break;
      }
    }
  }

  return effects;
}

/**
 * Lấy theme màu viền và hiệu ứng hào quang theo loại Phù Văn chủ đạo
 */
export function getDominantRuneTheme(runes: ItemRune[]): {
  theme: "dark_curse" | "vampiric" | "venomous" | "thunderstrike" | "miracle" | "normal";
  borderColor: string;
  shimmerClass: string;
  glyphIcon: string;
} {
  if (!runes || runes.length === 0) {
    return { theme: "normal", borderColor: "", shimmerClass: "", glyphIcon: "" };
  }

  const types = runes.map((r) => r.type);
  if (runes.length >= 4) {
    return {
      theme: "miracle",
      borderColor: "border-pink-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]",
      shimmerClass: "animate-pulse ring-1 ring-pink-400/80",
      glyphIcon: "✨",
    };
  }
  if (types.includes("dark_curse")) {
    return {
      theme: "dark_curse",
      borderColor: "border-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]",
      shimmerClass: "ring-1 ring-purple-400/60 shadow-[0_0_10px_rgba(126,34,206,0.4)]",
      glyphIcon: "🌑",
    };
  }
  if (types.includes("vampiric")) {
    return {
      theme: "vampiric",
      borderColor: "border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.5)]",
      shimmerClass: "ring-1 ring-rose-400/60 shadow-[0_0_10px_rgba(225,29,72,0.4)]",
      glyphIcon: "🩸",
    };
  }
  if (types.includes("venomous")) {
    return {
      theme: "venomous",
      borderColor: "border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.5)]",
      shimmerClass: "ring-1 ring-emerald-400/60 shadow-[0_0_10px_rgba(5,150,105,0.4)]",
      glyphIcon: "☠️",
    };
  }
  if (types.includes("thunderstrike")) {
    return {
      theme: "thunderstrike",
      borderColor: "border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]",
      shimmerClass: "ring-1 ring-yellow-400/60",
      glyphIcon: "⚡",
    };
  }

  return {
    theme: "normal",
    borderColor: "border-cyan-500/60",
    shimmerClass: "",
    glyphIcon: "🔮",
  };
}
