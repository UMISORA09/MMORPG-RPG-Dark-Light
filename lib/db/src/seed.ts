import { db, initDatabase, isPostgres } from "./index";
import { itemsTable } from "./schema";
import { SEED_ITEMS, SEED_CLASSES, SEED_MONSTERS } from "./seed-data";

export async function seedDatabase() {
  console.log("🌱 [DB:SEED] Starting database seeding...");
  await initDatabase();

  if (isPostgres && db) {
    try {
      console.log(`📦 [DB:SEED] Seeding ${SEED_ITEMS.length} equipment items into PostgreSQL...`);
      for (const item of SEED_ITEMS) {
        await db
          .insert(itemsTable)
          .values(item)
          .onConflictDoNothing({ target: itemsTable.id });
      }
      console.log("✅ [DB:SEED] PostgreSQL items successfully seeded!");
    } catch (err) {
      console.error("❌ [DB:SEED] Error seeding PostgreSQL:", err);
      throw err;
    }
  } else {
    console.log(`✅ [DB:SEED] In-memory mode active: ${SEED_CLASSES.length} classes, ${SEED_MONSTERS.length} monsters, ${SEED_ITEMS.length} items ready.`);
  }

  console.log("🎉 [DB:SEED] Database seeding complete!");
}

// Standalone execution check
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal seed error:", err);
      process.exit(1);
    });
}
