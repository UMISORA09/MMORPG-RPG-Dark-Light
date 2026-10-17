import { SEED_ITEMS } from "./seed-data";

export const SEED_SERVERS = [
  { id: "s1_long_vuong", name: "S1 - Long Vương Điện", region: "VN", status: "HOT", expMultiplier: 1, goldMultiplier: 1, maxPlayers: 1000 },
  { id: "s2_hac_am", name: "S2 - Hắc Ám Thâm Uyên", region: "VN", status: "GOOD", expMultiplier: 1, goldMultiplier: 1, maxPlayers: 1200 },
  { id: "s3_thien_phat", name: "S3 - Thiên Phạt Chi Địa", region: "SEA", status: "NEW", expMultiplier: 2, goldMultiplier: 2, maxPlayers: 1600 },
  { id: "s4_huyet_nguyet", name: "S4 - Huyết Nguyệt Đấu Trường", region: "TEST", status: "GOOD", expMultiplier: 1, goldMultiplier: 1, maxPlayers: 500 },
] as const;

const classNames = {
  gunner: "Xạ Thủ",
  assassin: "Sát Thủ",
  fighter: "Chiến Binh",
  tank: "Hộ Vệ",
} as const;

const slots = [
  { id: "helm", name: "Mũ Giáp Chiến Long", type: "armor" },
  { id: "armor", name: "Áo Giáp Hắc Thiết", type: "armor" },
  { id: "greaves", name: "Quần Giáp Kỷ Nguyên", type: "armor" },
  { id: "boots", name: "Giày Phản Lực", type: "armor" },
  { id: "pauldrons", name: "Giáp Vai Hộ Vệ", type: "armor" },
  { id: "gauntlets", name: "Găng Tay Sát Thần", type: "armor" },
  { id: "main_weapon", name: "Vũ Khí Long Tộc", type: "weapon" },
  { id: "off_weapon", name: "Hộ Khí Phụ", type: "weapon" },
  { id: "earring", name: "Bông Tai Lục Bảo", type: "accessory" },
  { id: "amulet", name: "Dây Chuyền Hộ Mệnh", type: "accessory" },
  { id: "ring", name: "Nhẫn Cuồng Nộ", type: "accessory" },
  { id: "relic", name: "Cổ Vật Rồng Thiêng", type: "accessory" },
] as const;

const classes = Object.keys(classNames) as (keyof typeof classNames)[];
const rarities = [
  { id: "common", level: 1, price: 60, minStat: 3, maxStat: 6, minHp: 20, maxHp: 40, crit: 0, spd: 0 },
  { id: "rare", level: 5, price: 350, minStat: 12, maxStat: 22, minHp: 80, maxHp: 150, crit: 3, spd: 1 },
  { id: "epic", level: 8, price: 1200, minStat: 30, maxStat: 50, minHp: 250, maxHp: 250, crit: 6, spd: 5 },
  { id: "legendary", level: 12, price: 4000, minStat: 75, maxStat: 120, minHp: 500, maxHp: 500, crit: 12, spd: 8 },
] as const;

const professionWeapons: Record<keyof typeof classNames, string> = {
  gunner: "Súng Điện Từ Kép",
  assassin: "Song Đao Huyết Nguyệt",
  fighter: "Quyền Giáp Hỏa Long",
  tank: "Trọng Búa Thánh Quang",
};

const equipmentSeeds = classes.flatMap((classId) => slots.flatMap((slot, slotIndex) => rarities.map((rarity, rarityIndex) => {
  const name = slot.id === "main_weapon" ? professionWeapons[classId] : slot.name;
  const isWeapon = slot.type === "weapon";
  const isArmor = slot.type === "armor";
  const statVal = Math.round(rarity.minStat + ((rarity.maxStat - rarity.minStat) * ((slotIndex % 4) / 3)));
  const hpVal = Math.round(rarity.minHp + ((rarity.maxHp - rarity.minHp) * ((slotIndex % 4) / 3)));

  return {
    id: `gear_${classId}_${slot.id}_${rarity.id}`,
    name: `${name} ${rarityIndex ? `+${rarityIndex}` : "Tân Thủ"}`,
    category: "equipment",
    type: slot.type,
    equipSlot: slot.id,
    description: `${rarity.id.toUpperCase()} ${slot.name.toLowerCase()} dành cho ${classNames[classId]}.`,
    lore: `Rèn tại Long Thành, truyền thừa qua các thế hệ ${classNames[classId]}.`,
    rarity: rarity.id,
    hpBoost: isArmor ? hpVal : slot.id === "relic" ? Math.round(hpVal * 0.4) : 0,
    mpBoost: slot.type === "accessory" ? (rarityIndex + 1) * 20 : 0,
    atkBoost: isWeapon ? statVal : slot.type === "accessory" ? Math.round(statVal * 0.35) : 0,
    matkBoost: isWeapon && classId === "gunner" ? Math.round(statVal * 0.5) : 0,
    defBoost: isArmor ? statVal : slot.type === "accessory" ? Math.round(statVal * 0.3) : 0,
    mdefBoost: isArmor || slot.type === "accessory" ? Math.round(statVal * 0.4) : 0,
    spdBoost: slot.id === "boots" || slot.id === "main_weapon" ? rarity.spd : 0,
    strBoost: classId === "fighter" || classId === "tank" ? rarityIndex + 1 : 0,
    dexBoost: classId === "assassin" || classId === "gunner" ? rarityIndex + 1 : 0,
    intBoost: classId === "gunner" ? rarityIndex + 1 : 0,
    lukBoost: slot.id === "ring" || slot.id === "relic" ? rarityIndex + 1 : 0,
    vitBoost: isArmor ? rarityIndex + 1 : 0,
    critRateBoost: isWeapon || slot.id === "ring" ? rarity.crit : 0,
    healHpPercent: 0,
    healMpPercent: 0,
    buffType: null,
    price: rarity.price + slotIndex * 15,
    maxStack: 1,
    classId,
    requiredLevel: rarity.level,
    icon: slot.type === "weapon" ? "⚔" : slot.type === "accessory" ? "◇" : "🛡",
  };
})));

const utilitySeeds = [
  { id: "ticket_inventory_expand", name: "Phiếu Tăng Hành Trang", category: "consumable", type: "scroll", equipSlot: "none", rarity: "rare", price: 200, maxStack: 99, icon: "🎫", description: "Vật phẩm thương hội quý giá. Mở rộng vĩnh viễn thêm +5 ô chứa hành trang (tối đa 30 ô).", lore: "Thẻ bài có khắc ấn hoa văn Long Tộc, biểu trưng cho sự thăng tiến sức chứa." },
  { id: "potion_hp_minor", name: "Bình Máu Tân Thủ", category: "consumable", type: "potion", equipSlot: "none", rarity: "common", healHpPercent: 20, healMpPercent: 0, buffType: null, price: 20, maxStack: 99, icon: "🧪", description: "Hồi 20% HP tối đa.", lore: "Dược phương sơ cấp cho tân binh." },
  { id: "potion_mp_minor", name: "Bình Mana Tân Thủ", category: "consumable", type: "potion", equipSlot: "none", rarity: "common", healHpPercent: 0, healMpPercent: 25, buffType: null, price: 25, maxStack: 99, icon: "💧", description: "Hồi 25% MP tối đa.", lore: "Nước tăng lực ma pháp cơ bản." },
  { id: "potion_hp_greater", name: "Bình Máu Đại", category: "consumable", type: "potion", equipSlot: "none", rarity: "common", healHpPercent: 35, healMpPercent: 0, buffType: null, price: 80, maxStack: 99, icon: "🧪", description: "Hồi 35% HP tối đa.", lore: "Dược phương của y sư Long Tộc." },
  { id: "potion_mp_super", name: "Bình Mana Siêu Cấp", category: "consumable", type: "potion", equipSlot: "none", rarity: "rare", healHpPercent: 0, healMpPercent: 40, buffType: null, price: 90, maxStack: 99, icon: "💧", description: "Hồi 40% MP tối đa.", lore: "Tinh chất lam thạch được chưng luyện." },
  { id: "food_dragon_grill", name: "Thịt Nướng Long Tộc", category: "consumable", type: "food", equipSlot: "none", rarity: "common", healHpPercent: 0, healMpPercent: 0, buffType: "atk", atkBoost: 15, price: 60, maxStack: 99, icon: "🍖", description: "Tăng ATK trong thời gian ngắn.", lore: "Món ăn truyền thống của chiến binh." },
  { id: "food_herbal_soup", name: "Súp Hầm Thảo Dược", category: "consumable", type: "food", equipSlot: "none", rarity: "common", healHpPercent: 0, healMpPercent: 0, buffType: "def", defBoost: 12, price: 60, maxStack: 99, icon: "🥣", description: "Tăng DEF trong thời gian ngắn.", lore: "Nấu từ thảo dược vùng SAFE_VILLAGE." },
  { id: "scroll_return", name: "Cuộn Dịch Chuyển Về Làng", category: "consumable", type: "scroll", equipSlot: "none", rarity: "common", buffType: "return", price: 25, maxStack: 30, icon: "📜", description: "Trở về làng an toàn.", lore: "Ấn chú dịch chuyển cơ bản." },
  { id: "scroll_skill_ancient", name: "Sách Kỹ Năng Cổ", category: "consumable", type: "scroll", equipSlot: "none", rarity: "epic", buffType: "skill", price: 900, maxStack: 10, icon: "📕", description: "Nguyên liệu mở kỹ năng cổ.", lore: "Ghi chép từ thư khố Long Môn." },
  { id: "material_enhance_stone", name: "Đá Cường Hóa Tinh Khiết", category: "material", type: "stone", equipSlot: "none", rarity: "rare", price: 150, maxStack: 99, icon: "💎", description: "Đá tinh khiết dùng để cường hóa.", lore: "Tỏa sáng khi chạm vào trang bị." },
  { id: "material_dragon_crystal", name: "Tinh Thể Rồng", category: "material", type: "stone", equipSlot: "none", rarity: "epic", price: 500, maxStack: 99, icon: "🔷", description: "Tinh thể chứa long khí.", lore: "Kết tinh trong hang ổ Cổ Long." },
  { id: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", category: "material", type: "stone", equipSlot: "none", rarity: "common", price: 45, maxStack: 99, icon: "◈", description: "Mảnh khoáng thạch từ Thâm Uyên.", lore: "Vẫn còn lưu lại tàn ảnh bóng tối." },
  { id: "material_steel_ore", name: "Quặng Huyền Thiết", category: "material", type: "stone", equipSlot: "none", rarity: "common", price: 35, maxStack: 99, icon: "⬢", description: "Quặng dùng để rèn trang bị.", lore: "Khai thác tại mỏ phía bắc." },
  { id: "quest_gold_chest", name: "Rương Báu Hoàng Kim", category: "quest", type: "chest", equipSlot: "none", rarity: "legendary", price: 0, maxStack: 10, icon: "🧰", description: "Rương chứa phần thưởng nhiệm vụ.", lore: "Chỉ mở được bởi người mang ấn Long Vương." },
  { id: "quest_dragon_seal", name: "Ấn Chương Long Vương", category: "quest", type: "chest", equipSlot: "none", rarity: "epic", price: 0, maxStack: 20, icon: "🐉", description: "Ấn chương nhiệm vụ Long Vương.", lore: "Biểu tượng của giao ước cổ." },
  { id: "quest_spy_letter", name: "Thư Mật Thám", category: "quest", type: "scroll", equipSlot: "none", rarity: "common", price: 0, maxStack: 20, icon: "✉", description: "Thư mật thu thập từ Hắc Ám Thâm Uyên.", lore: "Niêm phong bằng sáp đỏ." },
].map((item) => ({
  hpBoost: 0, mpBoost: 0, atkBoost: 0, matkBoost: 0, defBoost: 0, mdefBoost: 0, spdBoost: 0,
  strBoost: 0, dexBoost: 0, intBoost: 0, lukBoost: 0, vitBoost: 0, critRateBoost: 0,
  requiredLevel: 1, classId: null, ...item,
}));

const legacySeeds = SEED_ITEMS.map((item) => ({
  category: "equipment",
  equipSlot: item.id.includes("armor") ? "armor" : "main_weapon",
  lore: item.description,
  mpBoost: 0, matkBoost: 0, mdefBoost: 0, strBoost: 0, dexBoost: 0, intBoost: 0,
  lukBoost: 0, vitBoost: 0, critRateBoost: 0, healHpPercent: 0, healMpPercent: 0,
  buffType: null, maxStack: 1,
  ...item,
}));

export const SEED_ALL_ITEMS = [...legacySeeds, ...equipmentSeeds, ...utilitySeeds];

const monsterDefinitions = [
  { id: "slime", name: "Slime Đầm Lầy", level: 1, hp: 85, atk: 12, def: 3, archetype: "SWARM_PACK", spriteType: "slime" },
  { id: "slime_red", name: "Slime Đỏ Bãi Cỏ", level: 2, hp: 130, atk: 16, def: 3, archetype: "SWARM_PACK", spriteType: "slime" },
  { id: "wolf", name: "Sói Hoang Hoang Dã", level: 5, hp: 480, atk: 42, def: 18, archetype: "SWARM_PACK", spriteType: "goblin" },
  { id: "goblin", name: "Yêu Tinh Thảo Nguyên", level: 5, hp: 480, atk: 42, def: 18, archetype: "SWARM_PACK", spriteType: "goblin" },
  { id: "goblin_executioner", name: "Yêu Tinh Đao Phủ", level: 6, hp: 560, atk: 50, def: 22, archetype: "SWARM_PACK", spriteType: "goblin" },
  { id: "skeleton", name: "Chiến Binh Xương Khô", level: 7, hp: 550, atk: 55, def: 25, archetype: "LONE_PREDATOR", spriteType: "skeleton" },
  { id: "orc", name: "Chiến Binh Orc Cổ (Kẻ Cướp Orc)", level: 8, hp: 720, atk: 68, def: 34, archetype: "LONE_PREDATOR", spriteType: "orc" },
  { id: "dark_knight_elite", name: "Kỵ Sĩ Hắc Ám (Tinh Anh)", level: 9, hp: 1200, atk: 88, def: 50, archetype: "LONE_PREDATOR", spriteType: "skeleton" },
  { id: "vampire", name: "Dơi Huyết Nguyệt", level: 10, hp: 850, atk: 95, def: 42, archetype: "LONE_PREDATOR", spriteType: "goblin" },
  { id: "void_mage", name: "Pháp Sư Hư Không", level: 12, hp: 980, atk: 110, def: 45, archetype: "LONE_PREDATOR", spriteType: "goblin" },
  { id: "abyss_guardian", name: "Hộ Vệ Thâm Uyên", level: 13, hp: 1800, atk: 135, def: 70, archetype: "LONE_PREDATOR", spriteType: "skeleton" },
  { id: "black_dragon_king", name: "Hắc Long Vương Bạo Chúa", level: 15, hp: 25000, atk: 380, def: 220, archetype: "WORLD_BOSS", spriteType: "dark_dragon_boss" },
  { id: "dragon", name: "Rồng Lửa Cổ Đại (Boss Cấm Địa)", level: 20, hp: 35000, atk: 450, def: 260, archetype: "WORLD_BOSS", spriteType: "dark_dragon_boss" },
] as const;

export const SEED_WORLD_MONSTERS = monsterDefinitions.map((m, index) => {
  const isBoss = m.archetype === "WORLD_BOSS";
  const isElite = m.archetype === "LONE_PREDATOR";

  let dropTable = [
    { itemId: "potion_hp_greater", chancePercent: 20 },
    { itemId: "material_steel_ore", chancePercent: 25 },
    { itemId: "gear_tank_helm_common", chancePercent: 7 },
    { itemId: "material_enhance_stone", chancePercent: 3 },
  ];

  if (isBoss) {
    dropTable = [
      { itemId: "material_enhance_stone", chancePercent: 85 },
      { itemId: "material_dragon_crystal", chancePercent: 60 },
      { itemId: "gear_tank_main_weapon_legendary", chancePercent: 2.5 },
      { itemId: "gear_fighter_main_weapon_legendary", chancePercent: 2.5 },
      { itemId: "gear_assassin_main_weapon_legendary", chancePercent: 2.5 },
      { itemId: "gear_gunner_main_weapon_legendary", chancePercent: 2.5 },
      { itemId: "quest_gold_chest", chancePercent: 50 },
    ];
  } else if (isElite) {
    dropTable = [
      { itemId: "material_enhance_stone", chancePercent: 25 },
      { itemId: "gear_tank_off_weapon_rare", chancePercent: 8 },
      { itemId: "gear_fighter_main_weapon_rare", chancePercent: 8 },
      { itemId: "potion_hp_greater", chancePercent: 40 },
      { itemId: "material_dark_shard", chancePercent: 35 },
    ];
  }

  return {
    id: m.id,
    name: `Lv.${m.level} ${m.name}`,
    title: isBoss ? "Boss Cấm Địa" : isElite ? "Tinh Anh Đơn Thể" : "Quái Bầy Đàn",
    archetype: m.archetype,
    zoneId: isBoss ? "BOSS_ALTAR" : "WILDERNESS",
    level: m.level,
    hp: m.hp,
    atk: m.atk,
    def: m.def,
    spd: isBoss ? 10 : isElite ? 8 : 6,
    critRate: isBoss ? 15 : isElite ? 10 : 4,
    staggerThreshold: isBoss ? 1500 : isElite ? 500 : 120,
    aggroRadius: isBoss ? 22 : isElite ? 12 : 8,
    leashRadius: isBoss ? 45 : isElite ? 22 : 16,
    expReward: m.level * (isBoss ? 150 : isElite ? 40 : 18),
    goldReward: m.level * (isBoss ? 80 : isElite ? 20 : 7),
    emoji: isBoss ? "🐉" : isElite ? "💀" : "👹",
    spriteType: m.spriteType,
    description: `${m.name} xuất hiện và trấn giữ khu vực ${isBoss ? "BOSS_ALTAR" : "WILDERNESS"}.`,
    dropTableJson: JSON.stringify(dropTable),
    sortOrder: index,
  };
});