export const CHARACTER_CLASSES = [
  {
    id: "tank",
    name: "Hộ Vệ",
    description: "Tường thành bất khả xâm phạm, hấp thụ mọi đòn tấn công và phản công bằng sức mạnh tuyệt đối.",
    role: "Phòng Thủ - Hấp Thụ Sát Thương",
    baseHp: 150,
    baseMp: 60,
    baseAtk: 8,
    baseDef: 6,
    baseSpd: 9,
    baseStr: 8,
    baseDex: 5,
    baseInt: 5,
    baseLuk: 5,
    baseVit: 10,
    critRate: 5,
    evasion: 5,
    skills: [
      { name: "Khiên Thần Thánh", description: "Chặn đòn tấn công tiếp theo hoàn toàn", damage: 50, cooldown: 1 },
      { name: "Đập Đất", description: "Đập mặt đất gây chấn động", damage: 130, cooldown: 3 },
      { name: "Pháo Đài Bất Bại", description: "Kích hoạt giáp tối thượng, miễn sát thương 2 lượt", damage: 180, cooldown: 7 },
    ],
    color: "#f39c12",
    emoji: "🛡️",
  },
  {
    id: "fighter",
    name: "Chiến Binh",
    description: "Chiến binh cận chiến mạnh mẽ, cân bằng giữa tấn công và phòng thủ, đánh giáp lá cà không ngừng nghỉ.",
    role: "Cận Chiến Cân Bằng",
    baseHp: 120,
    baseMp: 65,
    baseAtk: 10,
    baseDef: 4,
    baseSpd: 10,
    baseStr: 10,
    baseDex: 7,
    baseInt: 5,
    baseLuk: 5,
    baseVit: 8,
    critRate: 8,
    evasion: 6,
    skills: [
      { name: "Đấm Sấm Sét", description: "Đấm mạnh vào mặt kẻ thù", damage: 110, cooldown: 1 },
      { name: "Cơn Bão Quyền", description: "Tung 3 cú đấm liên tiếp", damage: 75, cooldown: 2 },
      { name: "Đỉnh Cao Hùng Lực", description: "Kích hoạt trạng thái berserk, tăng sức mạnh x2", damage: 300, cooldown: 6 },
    ],
    color: "#e74c3c",
    emoji: "⚔️",
  },
  {
    id: "assassin",
    name: "Sát Thủ",
    description: "Ẩn trong bóng tối, tấn công chí mạng và biến mất trước khi kẻ thù kịp phản ứng.",
    role: "Sát Thương Cao - Cú Chí Mạng",
    baseHp: 95,
    baseMp: 70,
    baseAtk: 12,
    baseDef: 2,
    baseSpd: 11,
    baseStr: 7,
    baseDex: 11,
    baseInt: 5,
    baseLuk: 8,
    baseVit: 5,
    critRate: 14,
    evasion: 12,
    skills: [
      { name: "Đâm Từ Bóng Tối", description: "Tấn công bất ngờ, tỷ lệ chí mạng 50%", damage: 150, cooldown: 1 },
      { name: "Độc Tố", description: "Tiêm chất độc gây sát thương theo thời gian", damage: 90, cooldown: 2 },
      { name: "Lưỡi Tử Thần", description: "Tấn công toàn lực, sát thương x3 nếu là đòn đầu", damage: 250, cooldown: 5 },
    ],
    color: "#9b59b6",
    emoji: "🗡️",
  },
  {
    id: "gunner",
    name: "Xạ Thủ",
    description: "Chiến binh tầm xa, sử dụng súng và công nghệ tiên tiến để tiêu diệt kẻ thù từ khoảng cách an toàn.",
    role: "DPS Tầm Xa",
    baseHp: 100,
    baseMp: 75,
    baseAtk: 11,
    baseDef: 3,
    baseSpd: 10,
    baseStr: 6,
    baseDex: 10,
    baseInt: 7,
    baseLuk: 7,
    baseVit: 6,
    critRate: 10,
    evasion: 8,
    skills: [
      { name: "Đạn Xuyên Giáp", description: "Bắn đạn xuyên qua hàng phòng thủ", damage: 120, cooldown: 1 },
      { name: "Nổ Súng Liên Hoàn", description: "Nhả 5 viên đạn liên tiếp", damage: 80, cooldown: 2 },
      { name: "Tên Lửa Hủy Diệt", description: "Phóng tên lửa gây sát thương vùng", damage: 200, cooldown: 4 },
    ],
    color: "#00b4ff",
    emoji: "🔫",
  },
];

export const MONSTERS = [
  {
    id: "slime",
    name: "Slime Đầm Lầy",
    level: 1,
    hp: 85,
    atk: 12,
    def: 3,
    expReward: 25,
    goldReward: 10,
    emoji: "🟢",
    description: "Sinh vật nhầy nhụa sống theo bầy đàn. Cần 8-12 đòn để tiêu diệt.",
  },
  {
    id: "slime_red",
    name: "Slime Đỏ Bãi Cỏ",
    level: 2,
    hp: 130,
    atk: 16,
    def: 3,
    expReward: 35,
    goldReward: 14,
    emoji: "🔴",
    description: "Slime đỏ hung hãn hơn, di chuyển bầy đàn quanh đồng cỏ.",
  },
  {
    id: "wolf",
    name: "Sói Hoang Hoang Dã",
    level: 5,
    hp: 480,
    atk: 42,
    def: 18,
    expReward: 70,
    goldReward: 30,
    emoji: "🐺",
    description: "Bầy sói hoang săn mồi tốc độ cao, có khả năng áp chế người chơi cấp thấp.",
  },
  {
    id: "goblin",
    name: "Yêu Tinh Đao Phủ",
    level: 5,
    hp: 480,
    atk: 42,
    def: 18,
    expReward: 80,
    goldReward: 35,
    emoji: "👹",
    description: "Bầy yêu tinh đao phủ tàn bạo, sát thương cực cao vượt cấp.",
  },
  {
    id: "orc",
    name: "Chiến Binh Orc Cổ",
    level: 8,
    hp: 420,
    atk: 38,
    def: 18,
    expReward: 160,
    goldReward: 55,
    emoji: "🗿",
    description: "Cơ bắp cuồn cuộn, có khả năng lao bổ húc ngã đối thủ.",
  },
  {
    id: "skeleton",
    name: "Kỵ Sĩ Hắc Ám (Tinh Anh)",
    level: 9,
    hp: 950,
    atk: 55,
    def: 32,
    expReward: 280,
    goldReward: 90,
    emoji: "💀",
    description: "Quái Đơn Thể Tinh Anh cực mạnh. Biết bật giáp và cuồng nộ.",
  },
  {
    id: "void_mage",
    name: "Pháp Sư Hư Không",
    level: 12,
    hp: 820,
    atk: 68,
    def: 24,
    expReward: 380,
    goldReward: 120,
    emoji: "🧙",
    description: "Pháp sư tinh anh tầm xa, biết dịch chuyển lùi và bắn cầu hư không.",
  },
  {
    id: "dragon",
    name: "Rồng Lửa Cổ Đại (Boss Cấm Địa)",
    level: 20,
    hp: 8500,
    atk: 140,
    def: 90,
    expReward: 1500,
    goldReward: 500,
    emoji: "🐉",
    description: "Boss Cấm Địa 2 Phase. Sở hữu đòn quét diện rộng và mưa thiên thạch.",
  },
];

export const MAX_LEVEL = 999;

export function getExpForLevel(level: number): number {
  if (level < 1) return 100;
  if (level >= MAX_LEVEL) return Number.MAX_SAFE_INTEGER;

  if (level === 1) return 100;
  if (level === 2) return 150;
  if (level === 3) return 225;

  if (level <= 50) {
    const offset = level - 3;
    return Math.floor(225 + offset * 120 + Math.pow(offset, 1.8) * 45);
  }

  const base50 = Math.floor(225 + 47 * 120 + Math.pow(47, 1.8) * 45);
  if (level <= 300) {
    const offset = level - 50;
    return Math.floor(base50 + offset * 1500 + Math.pow(offset, 1.95) * 450);
  }

  const base300 = Math.floor(base50 + 250 * 1500 + Math.pow(250, 1.95) * 450);
  const offset = level - 300;
  return Math.floor(base300 + offset * 12000 + Math.pow(offset, 2.15) * 1800);
}

export const getExpRequiredForLevel = getExpForLevel;

export function getStatsForLevel(
  classId: string,
  level: number
): { hp: number; mp: number; atk: number; def: number; spd: number; critRate: number; evasion: number } {
  const base = CHARACTER_CLASSES.find((c) => c.id === classId) || CHARACTER_CLASSES[0];
  const lvlOffset = Math.max(0, level - 1);
  return {
    hp: base.baseHp + lvlOffset * 35,
    mp: base.baseMp + lvlOffset * 15,
    atk: base.baseAtk + lvlOffset * 4,
    def: base.baseDef + lvlOffset * 2,
    spd: base.baseSpd + Math.floor(lvlOffset * 0.5),
    critRate: base.critRate + Math.floor(lvlOffset * 0.5),
    evasion: base.evasion + Math.floor(lvlOffset * 0.3),
  };
}
