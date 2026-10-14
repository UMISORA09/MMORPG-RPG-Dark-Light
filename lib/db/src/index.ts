import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let db: any = null;
export let isPostgres = false;

// In-memory fallback storage when PostgreSQL is not configured
interface MemoryStoreData {
  users: any[];
  characters: any[];
  items: any[];
  character_items: any[];
  battle_logs: any[];
}

const memoryStore: MemoryStoreData = {
  users: [],
  characters: [],
  items: [],
  character_items: [],
  battle_logs: [],
};

let autoIncrement = {
  users: 1,
  characters: 1,
  character_items: 1,
  battle_logs: 1,
};

function createMemoryDb() {
  const getTableData = (table: any): any[] => {
    let name = "";
    if (typeof table === "string") name = table;
    else if (table?._?.name) name = table._.name;
    else if (table?.[Symbol.for("drizzle:Name")]) name = table[Symbol.for("drizzle:Name")];
    else if (table?.[Symbol.for("drizzle:OriginalName")]) name = table[Symbol.for("drizzle:OriginalName")];
    else if (table?.name) name = table.name;
    else if (table?.passwordHash || table?.password_hash) name = "users";
    else if (table?.classId || table?.class_id || table?.maxHp) name = "characters";
    else if (table?.hpBoost || table?.hp_boost || table?.rarity) name = "items";
    else if (table?.itemId || table?.item_id) name = "character_items";
    else if (table?.monsterId || table?.monster_name) name = "battle_logs";

    if (name.includes("user_session") || name.includes("session")) return [];
    if (name.includes("character_item")) return memoryStore.character_items;
    if (name.includes("character")) return memoryStore.characters;
    if (name.includes("user")) return memoryStore.users;
    if (name.includes("item")) return memoryStore.items;
    if (name.includes("battle_log")) return memoryStore.battle_logs;
    return memoryStore.users;
  };

  const getAutoInc = (table: any) => {
    const data = getTableData(table);
    if (data === memoryStore.users) return "users";
    if (data === memoryStore.character_items) return "character_items";
    if (data === memoryStore.characters) return "characters";
    if (data === memoryStore.battle_logs) return "battle_logs";
    return null;
  };

  const matchesPredicate = (row: any, predicate: any): boolean => {
    if (!predicate) return true;
    if (typeof predicate === "function") return predicate(row);
    console.log("[MATCH]", { rowId: row.id, pKeys: Object.keys(predicate), left: predicate.left?.name, right: predicate.right?.value !== undefined ? predicate.right.value : predicate.right, chunks: predicate.queryChunks });

    // Drizzle BinaryOperator / SQL condition
    if (predicate.left && predicate.right !== undefined) {
      const colName = predicate.left.name || predicate.left.key;
      const targetVal = predicate.right?.value !== undefined ? predicate.right.value : predicate.right;
      if (colName) {
        const valInRow = row[colName] !== undefined ? row[colName] : (row[camelCase(colName)] !== undefined ? row[camelCase(colName)] : row[snakeCase(colName)]);
        return valInRow === targetVal || valInRow == targetVal;
      }
    }

    if (Array.isArray(predicate.queryChunks)) {
      let colName = "";
      let targetVal: any = undefined;
      for (const chunk of predicate.queryChunks) {
        if (chunk?.name && typeof chunk.name === "string") {
          colName = chunk.name;
        } else if (chunk?.constructor?.name === "Param" || (chunk?.value !== undefined && !Array.isArray(chunk.value) && typeof chunk.value !== "object")) {
          targetVal = chunk.value;
        }
      }
      if (colName && targetVal !== undefined) {
        const valInRow = row[colName] !== undefined ? row[colName] : (row[camelCase(colName)] !== undefined ? row[camelCase(colName)] : row[snakeCase(colName)]);
        return valInRow === targetVal || valInRow == targetVal;
      }
    }

    if (typeof predicate === "object") {
      return Object.entries(predicate).every(([k, v]) => row[k] === v || row[k] == v);
    }
    return true;
  };

  function camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
  }

  function snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  return {
    select: () => ({
      from: (table: any) => {
        let rows = [...getTableData(table)];
        const builder: any = {
          innerJoin: (joinTable: any, _condition: any) => {
            const joinData = getTableData(joinTable);
            rows = rows.map((r: any) => {
              const match = joinData.find((j: any) => j.id === r.itemId || j.id === r.item_id);
              return match ? { hpBoost: 0, atkBoost: 0, defBoost: 0, spdBoost: 0, ...match, ...r } : r;
            });
            return builder;
          },
          leftJoin: (joinTable: any, _condition: any) => {
            const joinData = getTableData(joinTable);
            rows = rows.map((r: any) => {
              const match = joinData.find((j: any) => j.id === r.itemId || j.id === r.item_id);
              return match ? { hpBoost: 0, atkBoost: 0, defBoost: 0, spdBoost: 0, ...match, ...r } : r;
            });
            return builder;
          },
          where: (predicate: any) => {
            rows = rows.filter((r) => matchesPredicate(r, predicate));
            return builder;
          },
          orderBy: (colOrOrder: any) => {
            return builder;
          },
          limit: (n: number) => {
            rows = rows.slice(0, n);
            return builder;
          },
          then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject),
          [Symbol.asyncIterator]: async function* () {
            for (const r of rows) yield r;
          },
        };
        return builder;
      },
    }),
    insert: (table: any) => ({
      values: (val: any) => {
        const target = getTableData(table);
        const autoKey = getAutoInc(table);
        const itemsToInsert = Array.isArray(val) ? val : [val];
        const inserted = itemsToInsert.map((item: any) => {
          const autoId = autoKey ? (autoIncrement as any)[autoKey]++ : Math.floor(Math.random() * 100000);
          const newItem = {
            id: item.id || autoId,
            ...item,
            createdAt: new Date(),
          };
          // Mirror camelCase and snake_case
          if (newItem.userId !== undefined && newItem.user_id === undefined) newItem.user_id = newItem.userId;
          if (newItem.user_id !== undefined && newItem.userId === undefined) newItem.userId = newItem.user_id;
          if (newItem.classId !== undefined && newItem.class_id === undefined) newItem.class_id = newItem.classId;
          if (newItem.maxHp !== undefined && newItem.max_hp === undefined) newItem.max_hp = newItem.maxHp;
          if (newItem.passwordHash !== undefined && newItem.password_hash === undefined) newItem.password_hash = newItem.passwordHash;

          target.push(newItem);
          return newItem;
        });

        const builder: any = {
          returning: () => Promise.resolve(inserted),
          onConflictDoNothing: () => builder,
          onConflictDoUpdate: () => builder,
          then: (resolve: any, reject: any) => Promise.resolve(inserted).then(resolve, reject),
        };
        return builder;
      },
    }),
    update: (table: any) => ({
      set: (val: any) => ({
        where: (predicate: any) => {
          const target = getTableData(table);
          const updated: any[] = [];
          for (let i = 0; i < target.length; i++) {
            if (matchesPredicate(target[i], predicate)) {
              target[i] = { ...target[i], ...val };
              if (val.userId !== undefined) target[i].user_id = val.userId;
              if (val.classId !== undefined) target[i].class_id = val.classId;
              if (val.maxHp !== undefined) target[i].max_hp = val.maxHp;
              updated.push(target[i]);
            }
          }
          const builder: any = {
            returning: () => Promise.resolve(updated),
            then: (resolve: any, reject: any) => Promise.resolve(updated).then(resolve, reject),
          };
          return builder;
        },
      }),
    }),
    delete: (table: any) => ({
      where: (predicate: any) => {
        const target = getTableData(table);
        const remaining = target.filter((item) => !matchesPredicate(item, predicate));
        target.length = 0;
        target.push(...remaining);
        return Promise.resolve();
      },
    }),
    query: {
      users: {
        findFirst: async (options?: any) => memoryStore.users[0] || null,
        findMany: async () => memoryStore.users,
      },
      characters: {
        findFirst: async () => memoryStore.characters[0] || null,
        findMany: async () => memoryStore.characters,
      },
    },
  };
}

export async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl !== "memory" && !dbUrl.startsWith("sqlite")) {
    try {
      console.log("[DB] Connecting to PostgreSQL:", dbUrl.replace(/:[^:@]+@/, ":***@"));
      pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 10,
      });

      // Quick test
      const client = await pool.connect();
      client.release();

      db = drizzle(pool, { schema });
      isPostgres = true;

      // Auto-create all required tables if they don't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS characters (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          class_id TEXT NOT NULL,
          class_name TEXT NOT NULL,
          level INTEGER DEFAULT 1 NOT NULL,
          experience INTEGER DEFAULT 0 NOT NULL,
          hp INTEGER NOT NULL,
          max_hp INTEGER NOT NULL,
          atk INTEGER NOT NULL,
          def INTEGER NOT NULL,
          spd INTEGER NOT NULL,
          gold INTEGER DEFAULT 0 NOT NULL,
          kills INTEGER DEFAULT 0 NOT NULL,
          deaths INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT NOT NULL,
          rarity TEXT NOT NULL,
          hp_boost INTEGER DEFAULT 0 NOT NULL,
          atk_boost INTEGER DEFAULT 0 NOT NULL,
          def_boost INTEGER DEFAULT 0 NOT NULL,
          spd_boost INTEGER DEFAULT 0 NOT NULL,
          price INTEGER DEFAULT 0 NOT NULL,
          class_id TEXT,
          required_level INTEGER DEFAULT 1 NOT NULL,
          icon TEXT DEFAULT '◇' NOT NULL
        );

        CREATE TABLE IF NOT EXISTS character_items (
          id SERIAL PRIMARY KEY,
          character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
          item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          equipped BOOLEAN DEFAULT FALSE NOT NULL,
          acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS battle_logs (
          id SERIAL PRIMARY KEY,
          character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
          monster_id TEXT NOT NULL,
          monster_name TEXT NOT NULL,
          victory BOOLEAN NOT NULL,
          exp_gained INTEGER DEFAULT 0 NOT NULL,
          gold_gained INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON user_sessions ("expire");
      `);

      console.log("[DB] PostgreSQL tables successfully verified and initialized.");
      return;
    } catch (err) {
      console.warn("[DB] PostgreSQL connection failed. Falling back to Standalone Memory DB:", (err as Error).message);
    }
  }

  console.log("[DB] Running in Standalone / In-Memory Mode with zero external dependencies.");
  db = createMemoryDb();
  isPostgres = false;
}

// Initial setup call if in non-deferred environment
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== "memory") {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });
    db = drizzle(pool, { schema });
    isPostgres = true;
  } catch {
    db = createMemoryDb();
    isPostgres = false;
  }
} else {
  db = createMemoryDb();
  isPostgres = false;
}

export * from "./schema";
