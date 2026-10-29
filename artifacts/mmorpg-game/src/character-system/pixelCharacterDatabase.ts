import type {
  PixelCharacterClassId,
  PixelCharacterGender,
  PixelCharacterDefinition,
} from "./types";

export const PIXEL_CHARACTERS: Record<string, PixelCharacterDefinition> = {
  // ── 1. CHIẾN BINH (FIGHTER) ────────────────────────────────────────────────
  fighter_male: {
    classId: "fighter",
    gender: "male",
    id: "fighter_male",
    className: "Chiến Binh",
    title: "Cuồng Long Kiếm Sĩ",
    role: "Cận Chiến Bộc Phát",
    lore: "Nam đam mỹ 6 múi cuộn sóng, ngực trần khoác áo choàng đỏ rực lửa rồng. Mang trên vai Thanh Long Đại Đao chém sắt như chém bùn.",
    passiveName: "Cuồng Long Nộ Huyết",
    passiveDesc: "Đòn đánh liên hoàn thứ 3 tạo chấn động lửa rồng diện rộng, tăng 25% tốc độ tấn công.",
    weaponName: "Thanh Long Đại Kiếm",
    weaponType: "greatsword",
    stats: {
      baseHp: 280,
      baseAtk: 24,
      baseDef: 12,
      baseSpd: 11,
      baseCrit: 18,
    },
    theme: {
      primaryColor: "#ef4444",
      accentColor: "#f59e0b",
      glowColor: "rgba(239, 68, 68, 0.45)",
      runeColor: "#ea580c",
      vfxSlashColor: "#ef4444",
    },
    assets: {
      standeeHD: "/assets/characters/fighter_male.png",
      combatSpritesheet: "/assets/sprites/fighter_male_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/fighter_male",
    },
  },

  fighter_female: {
    classId: "fighter",
    gender: "female",
    id: "fighter_female",
    className: "Chiến Binh",
    title: "Hỏa Phụng Nữ Hiệp",
    role: "Cận Chiến Linh Hoạt",
    lore: "Nữ kiếm sĩ quyến rũ sexy với đường cong eo thon chữ S, áo giáp đỏ rực rỡ và đuôi tóc ngựa tung bay. Sử dụng song đao lửa bốc lửa.",
    passiveName: "Hỏa Phụng Niết Bàn",
    passiveDesc: "Mỗi đòn chém tích tụ 1 tầng nhiệt năng; đạt 5 tầng phát nổ thiêu đốt toàn bộ kẻ địch xung quanh.",
    weaponName: "Hỏa Phụng Song Đao",
    weaponType: "twin_blades",
    stats: {
      baseHp: 250,
      baseAtk: 26,
      baseDef: 10,
      baseSpd: 13,
      baseCrit: 22,
    },
    theme: {
      primaryColor: "#f97316",
      accentColor: "#ef4444",
      glowColor: "rgba(249, 115, 22, 0.45)",
      runeColor: "#dc2626",
      vfxSlashColor: "#f97316",
    },
    assets: {
      standeeHD: "/assets/characters/fighter_female.png",
      combatSpritesheet: "/assets/sprites/fighter_female_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/fighter_female",
    },
  },

  // ── 2. HỘ VỆ (TANK) ────────────────────────────────────────────────────────
  tank_male: {
    classId: "tank",
    gender: "male",
    id: "tank_male",
    className: "Hộ Vệ",
    title: "Thần Thuẫn Bất Tử",
    role: "Đỡ Đòn & Phản Kích",
    lore: "Nam hiệp sĩ hoàng kim cơ bắp kiên cố như bàn thạch, trang bị giáp trụ vương giả vàng ròng và chiếc Khiên Tháp Hắc Kim bất khả xâm phạm.",
    passiveName: "Thần Thánh Phản Chiếu",
    passiveDesc: "Giảm 30% sát thương nhận vào; phản hồi 40% sát thương dưới dạng sóng ánh sáng hoàng kim khi bị đánh trúng.",
    weaponName: "Hoàng Kim Thần Thuẫn & Trọng Kiếm",
    weaponType: "sword_shield",
    stats: {
      baseHp: 350,
      baseAtk: 16,
      baseDef: 20,
      baseSpd: 9,
      baseCrit: 8,
    },
    theme: {
      primaryColor: "#f59e0b",
      accentColor: "#ffd700",
      glowColor: "rgba(245, 158, 11, 0.45)",
      runeColor: "#b45309",
      vfxSlashColor: "#facc15",
    },
    assets: {
      standeeHD: "/assets/characters/tank_male.png",
      combatSpritesheet: "/assets/sprites/tank_male_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/tank_male",
    },
  },

  tank_female: {
    classId: "tank",
    gender: "female",
    id: "tank_female",
    className: "Hộ Vệ",
    title: "Nữ Thánh Hộ Vệ (Valkyrie)",
    role: "Bảo Vệ & Cứu Rỗi",
    lore: "Nữ kỵ sĩ xinh đẹp quyến rũ với mái tóc vàng bạch kim, giáp ngực vàng kim xẻ sâu kiêu hãnh. Chiếc khiên thánh chở che mọi đồng đội.",
    passiveName: "Hào Quang Thánh Vực",
    passiveDesc: "Tạo vầng hào quang ban phước hồi máu liên tục và tạo lá chắn hấp thụ sát thương cho toàn đội.",
    weaponName: "Valkyrie Thuẫn & Thánh Kiếm",
    weaponType: "sword_shield",
    stats: {
      baseHp: 320,
      baseAtk: 18,
      baseDef: 18,
      baseSpd: 10,
      baseCrit: 10,
    },
    theme: {
      primaryColor: "#fbbf24",
      accentColor: "#fef08a",
      glowColor: "rgba(251, 191, 36, 0.45)",
      runeColor: "#d97706",
      vfxSlashColor: "#fde047",
    },
    assets: {
      standeeHD: "/assets/characters/tank_female.png",
      combatSpritesheet: "/assets/sprites/tank_female_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/tank_female",
    },
  },

  // ── 3. SÁT THỦ (ASSASSIN) ──────────────────────────────────────────────────
  assassin_male: {
    classId: "assassin",
    gender: "male",
    id: "assassin_male",
    className: "Sát Thủ",
    title: "Bóng Ma Đoạt Mệnh",
    role: "Chí Mạng & Biến Ảo",
    lore: "Nam thần đam mỹ bí ẩn với trang phục bó sát hắc ám và khăn che mặt tím huyền bí. Di chuyển không để lại tiếng động, đoạt mạng trong tích tắc.",
    passiveName: "Ám Vũ Đoạt Hồn",
    passiveDesc: "Tăng 45% tỉ lệ chí mạng và gây thêm 60% sát thương khi tung đòn từ sau lưng đối thủ.",
    weaponName: "U Minh Song Đoản Đao",
    weaponType: "dual_daggers",
    stats: {
      baseHp: 210,
      baseAtk: 28,
      baseDef: 8,
      baseSpd: 15,
      baseCrit: 30,
    },
    theme: {
      primaryColor: "#a855f7",
      accentColor: "#7c3aed",
      glowColor: "rgba(168, 85, 247, 0.45)",
      runeColor: "#6d28d9",
      vfxSlashColor: "#c084fc",
    },
    assets: {
      standeeHD: "/assets/characters/assassin_male.png",
      combatSpritesheet: "/assets/sprites/assassin_male_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/assassin_male",
    },
  },

  assassin_female: {
    classId: "assassin",
    gender: "female",
    id: "assassin_female",
    className: "Sát Thủ",
    title: "Ảnh Vũ Quyến Rũ",
    role: "Ám Sát & Tốc Biến",
    lore: "Nữ ninja sexy với đường cong bốc lửa, tà áo xẻ cao quyến rũ và ánh mắt sắc lẹm. Vũ điệu tử thần gieo rắc kinh hoàng cho kẻ thù.",
    passiveName: "Dạ Điệp Mê Tung",
    passiveDesc: "Khi né tránh đòn đánh thành công, để lại một ảnh phân thân bùng nổ khói độc làm mù kẻ địch.",
    weaponName: "Bóng Đêm Song Liêm",
    weaponType: "dual_daggers",
    stats: {
      baseHp: 195,
      baseAtk: 30,
      baseDef: 7,
      baseSpd: 16,
      baseCrit: 32,
    },
    theme: {
      primaryColor: "#ec4899",
      accentColor: "#a855f7",
      glowColor: "rgba(236, 72, 153, 0.45)",
      runeColor: "#be185d",
      vfxSlashColor: "#f472b6",
    },
    assets: {
      standeeHD: "/assets/characters/assassin_female.png",
      combatSpritesheet: "/assets/sprites/assassin_female_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/assassin_female",
    },
  },

  // ── 4. XẠ THỦ (GUNNER) ─────────────────────────────────────────────────────
  gunner_male: {
    classId: "gunner",
    gender: "male",
    id: "gunner_male",
    className: "Xạ Thủ",
    title: "Lượng Tử Thiện Xạ",
    role: "Hỏa Lực Tầm Xa",
    lore: "Nam lãng tử 6 múi hiện đại với áo măng tô công nghệ cao màu hắc kim - cyan. Cầm trên tay khẩu súng trường plasma lượng tử bắn phá cực cự ly.",
    passiveName: "Tập Trung Cao Độ",
    passiveDesc: "Càng đứng xa mục tiêu, sát thương tăng tối đa lên đến 40% và đường đạn luôn xuyên thấu qua mục tiêu đầu tiên.",
    weaponName: "Lượng Tử Plasma Rifle",
    weaponType: "rifle",
    stats: {
      baseHp: 220,
      baseAtk: 26,
      baseDef: 9,
      baseSpd: 12,
      baseCrit: 20,
    },
    theme: {
      primaryColor: "#00f2ff",
      accentColor: "#38bdf8",
      glowColor: "rgba(0, 242, 255, 0.45)",
      runeColor: "#0284c7",
      vfxSlashColor: "#38bdf8",
    },
    assets: {
      standeeHD: "/assets/characters/gunner_male.png",
      combatSpritesheet: "/assets/sprites/gunner_male_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/gunner_male",
    },
  },

  gunner_female: {
    classId: "gunner",
    gender: "female",
    id: "gunner_female",
    className: "Xạ Thủ",
    title: "Quang Tử Xạ Thủ",
    role: "Bão Đạn Liên Thanh",
    lore: "Nữ xạ thủ sexy công nghệ cao với áo croptop khoe trọn vòng eo thon và đôi bốt cao gót cơ giới. Sử dụng cặp súng lục plasma bắn liên thanh bão lửa.",
    passiveName: "Bão Đạn Siêu Âm",
    passiveDesc: "Bắn liên tục không ngắt quãng làm tăng dần tốc độ bắn lên đến 60% và xả loạt đạn tỏa đa hướng.",
    weaponName: "Quang Tử Song Súng Laser",
    weaponType: "dual_blasters",
    stats: {
      baseHp: 205,
      baseAtk: 27,
      baseDef: 8,
      baseSpd: 13,
      baseCrit: 22,
    },
    theme: {
      primaryColor: "#06b6d4",
      accentColor: "#00f2ff",
      glowColor: "rgba(6, 182, 212, 0.45)",
      runeColor: "#0891b2",
      vfxSlashColor: "#67e8f9",
    },
    assets: {
      standeeHD: "/assets/characters/gunner_female.png",
      combatSpritesheet: "/assets/sprites/gunner_female_combat_sheet.png",
      modularPartsDir: "/assets/character-environment/modular-parts/gunner_female",
    },
  },
};

/**
 * Lấy định nghĩa nhân vật pixel theo class và gender
 */
export function getPixelCharacter(
  classId: PixelCharacterClassId = "fighter",
  gender: PixelCharacterGender = "male"
): PixelCharacterDefinition {
  const key = `${classId}_${gender}`;
  return PIXEL_CHARACTERS[key] || PIXEL_CHARACTERS.fighter_male;
}

/**
 * Danh sách toàn bộ 8 nhân vật chuẩn của Chiến Long Bá
 */
export function getAllPixelCharacters(): PixelCharacterDefinition[] {
  return Object.values(PIXEL_CHARACTERS);
}

