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
