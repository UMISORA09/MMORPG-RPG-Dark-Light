import { and, eq } from "drizzle-orm";
import {
  db,
  initDatabase,
  isPostgres,
  usersTable,
  charactersTable,
  itemsTable,
  characterItemsTable,
  forumPostsTable,
  serversTable,
  monstersTable,
  questsTable,
  characterQuestsTable,
} from "./index";
import { SEED_ALL_ITEMS, SEED_SERVERS, SEED_WORLD_MONSTERS } from "./game-seed";
import { SEED_QUESTS } from "./quests-seed";

const DEMO_USERNAME = "demo_longtoc";
const DEMO_PASSWORD_HASH = "$2b$10$R49232IfwrCojVqgxw73zee/K4nzGsLnTQY00Xa/acy0Xc/2GYgiG";

async function upsertById(table: any, idColumn: any, row: Record<string, unknown>) {
  const id = row.id;
  const { id: _id, ...updates } = row;
  if (isPostgres) {
    await db.insert(table).values(row).onConflictDoUpdate({ target: idColumn, set: updates });
    return;
  }

  const [existing] = await db.select().from(table).where(eq(idColumn, id)).limit(1);
  if (existing) {
    await db.update(table).set(updates).where(eq(idColumn, id));
  } else {
    await db.insert(table).values(row);
  }
}

export async function seedDatabase() {
  await initDatabase();

  for (const server of SEED_SERVERS) {
    await upsertById(serversTable, serversTable.id, server);
  }

  for (const item of SEED_ALL_ITEMS) {
    await upsertById(itemsTable, itemsTable.id, item as Record<string, unknown>);
  }

  for (const monster of SEED_WORLD_MONSTERS) {
    const { sortOrder: _sortOrder, ...row } = monster;
    await upsertById(monstersTable, monstersTable.id, row as Record<string, unknown>);
  }

  for (const quest of SEED_QUESTS) {
    await upsertById(questsTable, questsTable.id, quest as Record<string, unknown>);
  }

  let [demoUser] = await db.select().from(usersTable).where(eq(usersTable.username, DEMO_USERNAME)).limit(1);
  if (!demoUser) {
    const [inserted] = await db.insert(usersTable).values({
      username: DEMO_USERNAME,
      passwordHash: DEMO_PASSWORD_HASH,
      forumTitle: "Chiến Thần Đại Lục",
      selectedRegion: "VN",
      selectedServerId: "s1_long_vuong",
    }).returning();
    demoUser = inserted;
  }

  let [demoCharacter] = await db.select().from(charactersTable)
    .where(and(eq(charactersTable.userId, demoUser.id), eq(charactersTable.name, "LongThuVe")))
    .limit(1);

  if (!demoCharacter) {
    const [inserted] = await db.insert(charactersTable).values({
      userId: demoUser.id,
      serverId: "s1_long_vuong",
      name: "LongThuVe",
      gender: "male",
      classId: "tank",
      className: "Hộ Vệ",
      title: "Tân Thủ Long Tộc",
      zoneId: "SAFE_VILLAGE",
      level: 11,
      experience: 650,
      hp: 850,
      maxHp: 850,
      mp: 250,
      maxMp: 250,
      str: 24,
      dex: 15,
      intel: 12,
      luk: 10,
      vit: 28,
      atk: 75,
      matk: 20,
      def: 55,
      mdef: 30,
      spd: 15,
      critRate: 13,
      critDmg: 150,
      accuracy: 95,
      evasion: 8,
      combatPower: 850,
      gold: 500,
      kills: 42,
      deaths: 3,
    }).returning();
    demoCharacter = inserted;
  }

  const demoInventory = [
    { itemId: "gear_tank_main_weapon_rare", equipped: true, equippedSlot: "main_weapon", slotIndex: 0, quantity: 1, enhanceLevel: 3, bonusCombatPower: 300 },
    { itemId: "gear_tank_off_weapon_rare", equipped: true, equippedSlot: "off_weapon", slotIndex: 1, quantity: 1, enhanceLevel: 2, bonusCombatPower: 200 },
    { itemId: "gear_tank_armor_rare", equipped: true, equippedSlot: "armor", slotIndex: 2, quantity: 1, enhanceLevel: 2, bonusCombatPower: 200 },
    { itemId: "gear_tank_helm_rare", equipped: true, equippedSlot: "helm", slotIndex: 3, quantity: 1, enhanceLevel: 1, bonusCombatPower: 100 },
    { itemId: "potion_hp_greater", equipped: false, equippedSlot: null, slotIndex: 4, quantity: 25 },
    { itemId: "potion_mp_super", equipped: false, equippedSlot: null, slotIndex: 5, quantity: 20 },
    { itemId: "material_enhance_stone", equipped: false, equippedSlot: null, slotIndex: 6, quantity: 30 },
    { itemId: "material_dragon_crystal", equipped: false, equippedSlot: null, slotIndex: 7, quantity: 5 },
    { itemId: "food_dragon_grill", equipped: false, equippedSlot: null, slotIndex: 8, quantity: 12 },
    { itemId: "food_herbal_soup", equipped: false, equippedSlot: null, slotIndex: 9, quantity: 12 },
    { itemId: "scroll_return", equipped: false, equippedSlot: null, slotIndex: 10, quantity: 5 },
    { itemId: "gear_fighter_main_weapon_epic", equipped: false, equippedSlot: null, slotIndex: 11, quantity: 1, enhanceLevel: 0, bonusCombatPower: 0 },
    { itemId: "gear_tank_relic_epic", equipped: false, equippedSlot: null, slotIndex: 12, quantity: 1, enhanceLevel: 0, bonusCombatPower: 0 },
  ];

  for (const owned of demoInventory) {
    const [existing] = await db.select().from(characterItemsTable).where(and(
      eq(characterItemsTable.characterId, demoCharacter.id),
      eq(characterItemsTable.itemId, owned.itemId),
    )).limit(1);
    if (!existing) {
      await db.insert(characterItemsTable).values({ characterId: demoCharacter.id, ...owned });
    }
  }

  const demoPostTitle = "Cẩm nang Hộ Vệ: Khiên Pháo Đài và nhịp né Boss Cấm Địa";
  const [existingPost] = await db.select().from(forumPostsTable).where(and(
    eq(forumPostsTable.userId, demoUser.id),
    eq(forumPostsTable.title, demoPostTitle),
  )).limit(1);
  if (!existingPost) {
    await db.insert(forumPostsTable).values({
      userId: demoUser.id,
      characterId: demoCharacter.id,
      serverId: "s1_long_vuong",
      title: demoPostTitle,
      category: "build",
      body: "Giữ Khiên Pháo Đài cho nhịp Boss tụ lực; né cú quét đầu tiên, sau đó dùng khống chế để mở cửa sổ phản công.",
      likes: [],
    });
  }

  console.log(`[DB:SEED] Upserted ${SEED_SERVERS.length} servers, ${SEED_ALL_ITEMS.length} items, ${SEED_WORLD_MONSTERS.length} monsters and demo community data.`);
}

if (process.argv[1] && /seed\.(ts|js|mjs)$/.test(process.argv[1])) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("[DB:SEED] Fatal error:", error);
      process.exit(1);
    });
}
