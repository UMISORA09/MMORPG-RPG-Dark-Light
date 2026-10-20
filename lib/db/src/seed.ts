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

  console.log(`[DB:SEED] Successfully initialized game catalogs: ${SEED_SERVERS.length} servers, ${SEED_ALL_ITEMS.length} items, ${SEED_WORLD_MONSTERS.length} monsters, ${SEED_QUESTS.length} quests.`);
}

if (process.argv[1] && /seed\.(ts|js|mjs)$/.test(process.argv[1])) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("[DB:SEED] Fatal error:", error);
      process.exit(1);
    });
}
