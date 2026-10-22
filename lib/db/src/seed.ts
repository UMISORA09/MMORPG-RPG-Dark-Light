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

async function batchInsertOrIgnore(table: any, idColumn: any, rows: any[], chunkSize = 50) {
  if (!rows || rows.length === 0) return;
  if (isPostgres) {
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await (db.insert(table).values(chunk) as any).onConflictDoNothing();
    }
    return;
  }

  for (const row of rows) {
    await upsertById(table, idColumn, row);
  }
}

export async function seedDatabase() {
  await initDatabase();

  await batchInsertOrIgnore(serversTable, serversTable.id, [...SEED_SERVERS]);
  await batchInsertOrIgnore(itemsTable, itemsTable.id, [...SEED_ALL_ITEMS]);

  const cleanMonsters = SEED_WORLD_MONSTERS.map((m) => {
    const { sortOrder: _sortOrder, ...row } = m;
    return row;
  });
  await batchInsertOrIgnore(monstersTable, monstersTable.id, cleanMonsters);

  await batchInsertOrIgnore(questsTable, questsTable.id, [...SEED_QUESTS]);

  // Seed Default Admin and Starter Players
  const defaultPasswordHash = "$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/kR1Qp4Rkh3vJ8N7M7L5Y.7Z0c6Ky"; // "admin123" / "player123"
  const defaultUsers = [
    {
      id: 1,
      username: "admin",
      passwordHash: defaultPasswordHash,
      role: "admin",
      isRealUser: true,
      forumTitle: "Đại Sứ Quản Trị GM",
      selectedRegion: "VN",
      selectedServerId: "s1_long_vuong",
    },
    {
      id: 2,
      username: "LongThan_2026",
      passwordHash: defaultPasswordHash,
      role: "player",
      isRealUser: true,
      forumTitle: "Long Thần Chiến Tướng",
      selectedRegion: "VN",
      selectedServerId: "s1_long_vuong",
    },
    {
      id: 3,
      username: "KiemVuong_Hoa",
      passwordHash: defaultPasswordHash,
      role: "player",
      isRealUser: true,
      forumTitle: "Đao Thánh Xuất Thế",
      selectedRegion: "VN",
      selectedServerId: "s1_long_vuong",
    },
    {
      id: 4,
      username: "NuVuong_BangGia",
      passwordHash: defaultPasswordHash,
      role: "player",
      isRealUser: true,
      forumTitle: "Băng Sương Pháp Sư",
      selectedRegion: "VN",
      selectedServerId: "s2_hac_am",
    },
    {
      id: 5,
      username: "ThienXa_LongToc",
      passwordHash: defaultPasswordHash,
      role: "player",
      isRealUser: true,
      forumTitle: "Bách Bộ Xuyên Dương",
      selectedRegion: "SEA",
      selectedServerId: "s3_thien_phat",
    },
  ];
  await batchInsertOrIgnore(usersTable, usersTable.id, defaultUsers);

  // Seed Default Characters
  const defaultCharacters = [
    {
      id: 101,
      userId: 2,
      serverId: "s1_long_vuong",
      name: "Long Thần Bá Chủ",
      gender: "male",
      classId: "tank",
      className: "Chiến Sĩ Long Vương",
      level: 25,
      experience: 12500,
      hp: 1200,
      maxHp: 1200,
      mp: 300,
      maxMp: 300,
      atk: 180,
      def: 120,
      spd: 45,
      gold: 50000,
      combatPower: 2850,
      zoneId: "DRAGON_VALLEY",
      title: "Vạn Địch Chiến Thần",
    },
    {
      id: 102,
      userId: 3,
      serverId: "s1_long_vuong",
      name: "Kiếm Vương Tuyệt Sát",
      gender: "male",
      classId: "fighter",
      className: "Cuồng Kiếm Sĩ",
      level: 18,
      experience: 6400,
      hp: 850,
      maxHp: 850,
      mp: 250,
      maxMp: 250,
      atk: 210,
      def: 85,
      spd: 55,
      gold: 28000,
      combatPower: 2100,
      zoneId: "SAFE_VILLAGE",
      title: "Thiên Hạ Vô Song",
    },
    {
      id: 103,
      userId: 4,
      serverId: "s2_hac_am",
      name: "Băng Tuyết Nữ Vương",
      gender: "female",
      classId: "mage",
      className: "Nguyên Tố Pháp Sư",
      level: 30,
      experience: 25000,
      hp: 720,
      maxHp: 720,
      mp: 650,
      maxMp: 650,
      atk: 260,
      def: 70,
      spd: 50,
      gold: 75000,
      combatPower: 3400,
      zoneId: "FROST_PEAK",
      title: "Hàn Băng Thần Nữ",
    },
    {
      id: 104,
      userId: 5,
      serverId: "s3_thien_phat",
      name: "Xạ Thần Tinh Tú",
      gender: "male",
      classId: "gunner",
      className: "Thần Xạ Thủ",
      level: 15,
      experience: 4200,
      hp: 680,
      maxHp: 680,
      mp: 200,
      maxMp: 200,
      atk: 195,
      def: 65,
      spd: 70,
      gold: 15000,
      combatPower: 1850,
      zoneId: "SAFE_VILLAGE",
      title: "Bách Thần Xạ Thủ",
    },
  ];
  await batchInsertOrIgnore(charactersTable, charactersTable.id, defaultCharacters);

  // Seed Starter Inventory Items for Characters
  const defaultInventory = [
    { id: 201, characterId: 101, itemId: "weapon_sword_dragon_1", equipped: true, equippedSlot: "weapon", quantity: 1, enhanceLevel: 7, rarity: "legendary" },
    { id: 202, characterId: 101, itemId: "armor_plate_dragon_1", equipped: true, equippedSlot: "armor", quantity: 1, enhanceLevel: 5, rarity: "epic" },
    { id: 203, characterId: 101, itemId: "potion_hp_large", equipped: false, slotIndex: 0, quantity: 50, enhanceLevel: 0, rarity: "rare" },
    { id: 204, characterId: 102, itemId: "weapon_blade_iron_1", equipped: true, equippedSlot: "weapon", quantity: 1, enhanceLevel: 5, rarity: "rare" },
    { id: 205, characterId: 103, itemId: "weapon_staff_elemental_1", equipped: true, equippedSlot: "weapon", quantity: 1, enhanceLevel: 9, rarity: "miracle" },
  ];
  await batchInsertOrIgnore(characterItemsTable, characterItemsTable.id, defaultInventory);

  console.log(`[DB:SEED] Successfully initialized game catalogs: ${SEED_SERVERS.length} servers, ${SEED_ALL_ITEMS.length} items, ${cleanMonsters.length} monsters, ${SEED_QUESTS.length} quests, ${defaultUsers.length} users, ${defaultCharacters.length} characters.`);
}

if (process.argv[1] && /seed\.(ts|js|mjs)$/.test(process.argv[1])) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("[DB:SEED] Fatal error:", error);
      process.exit(1);
    });
}
