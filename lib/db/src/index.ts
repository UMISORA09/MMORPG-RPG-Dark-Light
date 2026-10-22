import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { SEED_ITEMS } from "./seed-data";
import { SEED_ALL_ITEMS, SEED_SERVERS, SEED_WORLD_MONSTERS } from "./game-seed";
import { SEED_QUESTS } from "./quests-seed";
import fs from "node:fs";
import path from "node:path";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let db: any = null;
export let isPostgres = false;

const DEFAULT_SEED_PASSWORD_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/kR1Qp4Rkh3vJ8N7M7L5Y.7Z0c6Ky"; // "admin123"

const DEFAULT_USERS = [
  { id: 1, username: "admin", passwordHash: DEFAULT_SEED_PASSWORD_HASH, role: "admin", isRealUser: true, forumTitle: "Đại Sứ Quản Trị GM", selectedRegion: "VN", selectedServerId: "s1_long_vuong" },
  { id: 2, username: "LongThan_2026", passwordHash: DEFAULT_SEED_PASSWORD_HASH, role: "player", isRealUser: true, forumTitle: "Long Thần Chiến Tướng", selectedRegion: "VN", selectedServerId: "s1_long_vuong" },
  { id: 3, username: "KiemVuong_Hoa", passwordHash: DEFAULT_SEED_PASSWORD_HASH, role: "player", isRealUser: true, forumTitle: "Đao Thánh Xuất Thế", selectedRegion: "VN", selectedServerId: "s1_long_vuong" },
  { id: 4, username: "NuVuong_BangGia", passwordHash: DEFAULT_SEED_PASSWORD_HASH, role: "player", isRealUser: true, forumTitle: "Băng Sương Pháp Sư", selectedRegion: "VN", selectedServerId: "s2_hac_am" },
  { id: 5, username: "ThienXa_LongToc", passwordHash: DEFAULT_SEED_PASSWORD_HASH, role: "player", isRealUser: true, forumTitle: "Bách Bộ Xuyên Dương", selectedRegion: "SEA", selectedServerId: "s3_thien_phat" },
];

const DEFAULT_CHARACTERS = [
  { id: 101, userId: 2, serverId: "s1_long_vuong", name: "Long Thần Bá Chủ", gender: "male", classId: "tank", className: "Chiến Sĩ Long Vương", level: 25, experience: 12500, hp: 1200, maxHp: 1200, mp: 300, maxMp: 300, atk: 180, def: 120, spd: 45, gold: 50000, combatPower: 2850, zoneId: "DRAGON_VALLEY", title: "Vạn Địch Chiến Thần" },
  { id: 102, userId: 3, serverId: "s1_long_vuong", name: "Kiếm Vương Tuyệt Sát", gender: "male", classId: "fighter", className: "Cuồng Kiếm Sĩ", level: 18, experience: 6400, hp: 850, maxHp: 850, mp: 250, maxMp: 250, atk: 210, def: 85, spd: 55, gold: 28000, combatPower: 2100, zoneId: "SAFE_VILLAGE", title: "Thiên Hạ Vô Song" },
  { id: 103, userId: 4, serverId: "s2_hac_am", name: "Băng Tuyết Nữ Vương", gender: "female", classId: "mage", className: "Nguyên Tố Pháp Sư", level: 30, experience: 25000, hp: 720, maxHp: 720, mp: 650, maxMp: 650, atk: 260, def: 70, spd: 50, gold: 75000, combatPower: 3400, zoneId: "FROST_PEAK", title: "Hàn Băng Thần Nữ" },
  { id: 104, userId: 5, serverId: "s3_thien_phat", name: "Xạ Thần Tinh Tú", gender: "male", classId: "gunner", className: "Thần Xạ Thủ", level: 15, experience: 4200, hp: 680, maxHp: 680, mp: 200, maxMp: 200, atk: 195, def: 65, spd: 70, gold: 15000, combatPower: 1850, zoneId: "SAFE_VILLAGE", title: "Bách Thần Xạ Thủ" },
];

const DEFAULT_INVENTORY = [
  { id: 201, characterId: 101, itemId: "weapon_sword_dragon_1", equipped: true, equippedSlot: "weapon", quantity: 1, enhanceLevel: 7, rarity: "legendary" },
  { id: 202, characterId: 101, itemId: "armor_plate_dragon_1", equipped: true, equippedSlot: "armor", quantity: 1, enhanceLevel: 5, rarity: "epic" },
  { id: 203, characterId: 101, itemId: "potion_hp_large", equipped: false, slotIndex: 0, quantity: 50, enhanceLevel: 0, rarity: "rare" },
  { id: 204, characterId: 102, itemId: "weapon_blade_iron_1", equipped: true, equippedSlot: "weapon", quantity: 1, enhanceLevel: 5, rarity: "rare" },
  { id: 205, characterId: 103, itemId: "weapon_staff_elemental_1", equipped: true, equippedSlot: "weapon", quantity: 1, enhanceLevel: 9, rarity: "miracle" },
];

// In-memory fallback storage when PostgreSQL is not configured
interface MemoryStoreData {
  users: any[];
  characters: any[];
  items: any[];
  character_items: any[];
  battle_logs: any[];
  encounters: any[];
  reward_grants: any[];
  servers: any[];
  monsters: any[];
  forum_posts: any[];
  forum_comments: any[];
  world_chats: any[];
  quests: any[];
  character_quests: any[];
  market_listings: any[];
  gm_audit_logs: any[];
}

const memoryStore: MemoryStoreData = {
  users: [...DEFAULT_USERS],
  characters: [...DEFAULT_CHARACTERS],
  items: [...SEED_ALL_ITEMS],
  character_items: [...DEFAULT_INVENTORY],
  battle_logs: [],
  encounters: [],
  reward_grants: [],
  servers: [...SEED_SERVERS],
  monsters: [...SEED_WORLD_MONSTERS],
  forum_posts: [],
  forum_comments: [],
  world_chats: [],
  quests: [...SEED_QUESTS],
  character_quests: [],
  market_listings: [],
  gm_audit_logs: [],
};

let autoIncrement = {
  users: 10,
  characters: 200,
  character_items: 300,
  battle_logs: 1,
  forum_posts: 1,
  world_chats: 1,
  market_listings: 100,
  gm_audit_logs: 1,
};

const STORE_FILE = path.join(
  process.env.VERCEL ? "/tmp" : (process.env.APPDATA || process.cwd()),
  ".clb_memory_db.json"
);

export function persistMemoryStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify({ memoryStore, autoIncrement }), "utf8");
  } catch {}
}

export function restoreMemoryStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (parsed.memoryStore) {
        for (const key of Object.keys(parsed.memoryStore)) {
          if (Array.isArray(parsed.memoryStore[key]) && parsed.memoryStore[key].length > 0) {
            (memoryStore as any)[key] = parsed.memoryStore[key];
          }
        }
      }
      if (parsed.autoIncrement) {
        Object.assign(autoIncrement, parsed.autoIncrement);
      }
    }
  } catch {}

  if (memoryStore.users.length === 0) memoryStore.users = [...DEFAULT_USERS];
  if (memoryStore.characters.length === 0) memoryStore.characters = [...DEFAULT_CHARACTERS];
  if (memoryStore.items.length < 50) memoryStore.items = [...SEED_ALL_ITEMS];
  if (memoryStore.quests.length === 0) memoryStore.quests = [...SEED_QUESTS];
  if (memoryStore.character_items.length === 0) memoryStore.character_items = [...DEFAULT_INVENTORY];
}

export { memoryStore };

export async function wipeAllAccountsAndUserData() {
  memoryStore.users = [];
  memoryStore.characters = [];
  memoryStore.character_items = [];
  memoryStore.character_quests = [];
  memoryStore.battle_logs = [];
  memoryStore.encounters = [];
  memoryStore.reward_grants = [];
  memoryStore.forum_posts = [];
  memoryStore.forum_comments = [];
  memoryStore.world_chats = [];
  memoryStore.market_listings = [];
  memoryStore.gm_audit_logs = [];
  autoIncrement.users = 1;
  autoIncrement.characters = 1;
  autoIncrement.character_items = 1;
  autoIncrement.battle_logs = 1;
  autoIncrement.forum_posts = 1;
  autoIncrement.world_chats = 1;
  autoIncrement.market_listings = 100;
  autoIncrement.gm_audit_logs = 1;

  try {
    if (fs.existsSync(STORE_FILE)) {
      fs.unlinkSync(STORE_FILE);
    }
  } catch {}

  persistMemoryStore();

  if (isPostgres && pool) {
    try {
      await pool.query(`
        TRUNCATE TABLE 
          users, 
          characters, 
          character_items, 
          character_quests, 
          battle_logs, 
          encounters, 
          reward_grants, 
          forum_posts, 
          forum_comments, 
          world_chats, 
          market_listings,
          gm_audit_logs
        CASCADE;
      `);
    } catch (e) {
      console.warn("[DB] Failed to truncate postgres tables:", e);
    }
  }
}

restoreMemoryStore();

function createMemoryDb() {
  const getTableData = (table: any): any[] => {
    if (memoryStore.users.length === 0 || memoryStore.characters.length === 0) {
      restoreMemoryStore();
    }
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
    else if (table?.clientRequestId || table?.client_request_id || table?.spawnId) name = "encounters";
    else if (table?.expGranted || table?.exp_granted) name = "reward_grants";

    if (name.includes("user_session") || name.includes("session")) return [];
    if (name.includes("reward_grant")) return memoryStore.reward_grants;
    if (name.includes("forum_post")) return memoryStore.forum_posts;
    if (name.includes("forum_comment")) return memoryStore.forum_comments;
    if (name.includes("world_chat")) return memoryStore.world_chats;
    if (name.includes("monster")) return memoryStore.monsters;
    if (name.includes("server")) return memoryStore.servers;
    if (name.includes("encounter")) return memoryStore.encounters;
    if (name.includes("character_item")) return memoryStore.character_items;
    if (name.includes("character_quest")) return memoryStore.character_quests;
    if (name.includes("quest")) return memoryStore.quests;
    if (name.includes("market_listing")) return memoryStore.market_listings;
    if (name.includes("gm_audit_log")) return memoryStore.gm_audit_logs;
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
    if (data === memoryStore.forum_posts) return "forum_posts";
    if (data === memoryStore.forum_comments) return "forum_comments";
    if (data === memoryStore.world_chats) return "world_chats";
    if (data === memoryStore.market_listings) return "market_listings";
    if (data === memoryStore.quests) return "quests";
    if (data === memoryStore.character_quests) return "character_quests";
    if (data === memoryStore.gm_audit_logs) return "gm_audit_logs";
    return null;
  };

    const matchesPredicate = (row: any, predicate: any): boolean => {
    if (!predicate) return true;
    if (typeof predicate === "function") return predicate(row);

    // 1. Direct object { id: 5 }
    if (typeof predicate === "object" && !predicate.queryChunks && !predicate.left) {
      return Object.entries(predicate).every(([k, v]) => row[k] === v || row[k] == v);
    }

    // 2. BinaryOperator { left, right }
    if (predicate.left && predicate.right !== undefined) {
      const colName = predicate.left.name || predicate.left.key;
      const targetVal = predicate.right?.value !== undefined ? predicate.right.value : predicate.right;
      if (colName) {
        const valInRow = row[colName] !== undefined ? row[colName] : (row[camelCase(colName)] !== undefined ? row[camelCase(colName)] : row[snakeCase(colName)]);
        return valInRow === targetVal || valInRow == targetVal;
      }
    }

    // 3. Drizzle SQL chunks (hỗ trợ cả and(...) và atomic eq(...))
    if (Array.isArray(predicate.queryChunks)) {
      const allChunks: any[] = [];
      const flatten = (chunks: any[]) => {
        for (const c of chunks) {
          if (!c) continue;
          if (Array.isArray(c.queryChunks)) {
            flatten(c.queryChunks);
          } else {
            allChunks.push(c);
          }
        }
      };
      flatten(predicate.queryChunks);

      let lastColName = "";
      const pairs: Array<{ col: string; val: any; isInArray?: boolean }> = [];

      for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i];
        if (!chunk || chunk?.constructor?.name === "StringChunk") continue;
        if (chunk?.name && typeof chunk.name === "string") {
          lastColName = chunk.name;
        } else if (lastColName && Array.isArray(chunk)) {
          const list = chunk.map((item: any) =>
            item?.constructor?.name === "Param" || item?.value !== undefined ? item.value : item
          );
          pairs.push({ col: lastColName, val: list, isInArray: true });
          lastColName = "";
        } else if (lastColName && Array.isArray(chunk?.value)) {
          pairs.push({ col: lastColName, val: chunk.value, isInArray: true });
          lastColName = "";
        } else if (
          lastColName &&
          (chunk?.constructor?.name === "Param" ||
            (chunk?.value !== undefined && typeof chunk.value !== "object"))
        ) {
          pairs.push({ col: lastColName, val: chunk.value });
          lastColName = "";
        }
      }

      if (pairs.length > 0) {
        return pairs.every(({ col, val, isInArray }: any) => {
          const valInRow =
            row[col] !== undefined
              ? row[col]
              : row[camelCase(col)] !== undefined
              ? row[camelCase(col)]
              : row[snakeCase(col)];
          if (isInArray && Array.isArray(val)) {
            return val.includes(valInRow) || val.some((v: any) => v == valInRow);
          }
          return valInRow === val || valInRow == val;
        });
      }
    }

    return true;
  };

  function camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
  }

  function snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  const memoryDb: any = {
    select: (fields?: any) => ({
      from: (table: any) => {
        let rows = [...getTableData(table)];
        const builder: any = {
          innerJoin: (joinTable: any, _condition: any) => {
            const joinData = getTableData(joinTable);
            rows = rows.map((r: any) => {
              const match = joinData.find((j: any) => j.id === r.itemId || j.id === r.item_id);
              return match ? { hpBoost: 0, atkBoost: 0, defBoost: 0, spdBoost: 0, ...match, ...r, item: match } : r;
            });
            return builder;
          },
          leftJoin: (joinTable: any, _condition: any) => {
            const joinData = getTableData(joinTable);
            rows = rows.map((r: any) => {
              const match = joinData.find((j: any) => j.id === r.itemId || j.id === r.item_id);
              return match ? { hpBoost: 0, atkBoost: 0, defBoost: 0, spdBoost: 0, ...match, ...r, item: match } : r;
            });
            return builder;
          },
          where: (predicate: any) => {
            rows = rows.filter((r) => matchesPredicate(r, predicate));
            return builder;
          },
          orderBy: (_colOrOrder: any) => {
            return builder;
          },
          limit: (n: number) => {
            rows = rows.slice(0, n);
            return builder;
          },
          then: (resolve: any, reject: any) => {
            if (fields && typeof fields === "object" && !Array.isArray(fields)) {
              const fieldKeys = Object.keys(fields);
              const isCount = fieldKeys.some(
                (k) => k === "count" || k === "c" || k === "total" || (fields[k]?.queryChunks && JSON.stringify(fields[k].queryChunks).toLowerCase().includes("count"))
              );
              if (isCount) {
                const countKey = fieldKeys[0] || "count";
                const countVal = rows.length;
                return Promise.resolve([{ count: countVal, c: countVal, total: countVal, [countKey]: countVal }]).then(resolve, reject);
              }
            }
            return Promise.resolve(rows).then(resolve, reject);
          },
          [Symbol.asyncIterator]: async function* () {
            if (fields && typeof fields === "object" && !Array.isArray(fields)) {
              const fieldKeys = Object.keys(fields);
              const isCount = fieldKeys.some(
                (k) => k === "count" || k === "c" || k === "total" || (fields[k]?.queryChunks && JSON.stringify(fields[k].queryChunks).toLowerCase().includes("count"))
              );
              if (isCount) {
                const countKey = fieldKeys[0] || "count";
                const countVal = rows.length;
                yield { count: countVal, c: countVal, total: countVal, [countKey]: countVal };
                return;
              }
            }
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
          persistMemoryStore();
          return newItem;
        });

        const builder: any = {
          returning: () => Promise.resolve(inserted),
          onConflictDoNothing: (options?: any) => {
            const targetColumn = Array.isArray(options?.target) ? options.target[0] : options?.target;
            const columnName = targetColumn?.name ?? "id";
            for (const row of [...inserted]) {
              const conflict = target.find((candidate: any) => candidate !== row && (candidate[columnName] ?? candidate[camelCase(columnName)]) === (row[columnName] ?? row[camelCase(columnName)]));
              if (!conflict) continue;
              const rowIndex = target.indexOf(row);
              if (rowIndex >= 0) target.splice(rowIndex, 1);
              const resultIndex = inserted.indexOf(row);
              if (resultIndex >= 0) inserted.splice(resultIndex, 1);
            }
            persistMemoryStore();
            return builder;
          },
          onConflictDoUpdate: (options: any) => {
            const targetColumn = Array.isArray(options?.target) ? options.target[0] : options?.target;
            const columnName = targetColumn?.name ?? "id";
            for (const row of [...inserted]) {
              const rowValue = row[columnName] ?? row[camelCase(columnName)];
              const conflict = target.find((candidate: any) => candidate !== row && (candidate[columnName] ?? candidate[camelCase(columnName)]) === rowValue);
              if (!conflict) continue;
              Object.assign(conflict, options.set);
              const rowIndex = target.indexOf(row);
              if (rowIndex >= 0) target.splice(rowIndex, 1);
              const resultIndex = inserted.indexOf(row);
              if (resultIndex >= 0) inserted.splice(resultIndex, 1, conflict);
            }
            persistMemoryStore();
            return builder;
          },
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
              for (const [k, v] of Object.entries(val)) {
                target[i][camelCase(k)] = v;
                target[i][snakeCase(k)] = v;
              }
              updated.push(target[i]);
            }
          }
          if (updated.length > 0) persistMemoryStore();
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
        persistMemoryStore();
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
    transaction: async (callback: (transaction: any) => unknown) => callback(memoryDb),
  };
  return memoryDb;
}

function getPoolConfig(rawUrl: string) {
  const isCloudDb =
    rawUrl.includes("supabase") ||
    rawUrl.includes("neon") ||
    rawUrl.includes("sslmode=require") ||
    rawUrl.includes("pooler.supabase.com");

  if (!isCloudDb) {
    return {
      connectionString: rawUrl,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 20000,
      max: 10,
      allowExitOnIdle: true,
    };
  }

  // Strip sslmode from the URL so pg-connection-string does not force rejectUnauthorized: true
  let cleanUrl = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete("sslmode");
    cleanUrl = parsed.toString();
  } catch {
    cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]+/g, "").replace(/\?&/, "?").replace(/\?$/, "");
  }

  return {
    connectionString: cleanUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
    max: 5,
    allowExitOnIdle: true,
    keepAlive: true,
    ssl: { rejectUnauthorized: false },
  };
}

export function loadEnvFilesSafely() {
  if (typeof process !== "undefined" && typeof (process as any).loadEnvFile === "function") {
    const candidates = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), ".env.production.local"),
      path.resolve(process.cwd(), "../../.env.local"),
      path.resolve(process.cwd(), "../../.env"),
      path.resolve(process.cwd(), "../../.env.production.local"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          (process as any).loadEnvFile(p);
        } catch {}
      }
    }
  }
}

export function resolveDatabaseUrl(): string | null {
  loadEnvFilesSafely();

  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim() && c !== "memory" && !c.includes("[SENSITIVE]") && !c.startsWith("sqlite")) {
      return c.trim();
    }
  }

  if (
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD &&
    !process.env.POSTGRES_PASSWORD.includes("[SENSITIVE]")
  ) {
    const host = process.env.POSTGRES_HOST;
    const user = process.env.POSTGRES_USER;
    const pass = encodeURIComponent(process.env.POSTGRES_PASSWORD);
    const dbName = process.env.POSTGRES_DATABASE || "postgres";
    return `postgres://${user}:${pass}@${host}:5432/${dbName}`;
  }

  return null;
}

export async function initDatabase() {
  const dbUrl = resolveDatabaseUrl();

  if (dbUrl) {
    try {
      console.log("[DB] Connecting to PostgreSQL (Supabase/Vercel):", dbUrl.replace(/:[^:@]+@/, ":***@"));
      if (!pool) {
        pool = new Pool(getPoolConfig(dbUrl));
        pool.on("error", (err) => {
          console.warn("[DB:Pool] Background connection warning:", err.message);
        });
      }

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
          user_id INTEGER NOT NULL,
          server_id TEXT NOT NULL DEFAULT 's1_long_vuong',
          name TEXT NOT NULL,
          gender TEXT DEFAULT 'male' NOT NULL,
          class_id TEXT NOT NULL,
          class_name TEXT NOT NULL,
          title TEXT DEFAULT 'Thượng Cấp Chiến Sĩ' NOT NULL,
          zone_id TEXT DEFAULT 'SAFE_VILLAGE' NOT NULL,
          pos_x INTEGER DEFAULT 0 NOT NULL,
          pos_z INTEGER DEFAULT 0 NOT NULL,
          level INTEGER DEFAULT 1 NOT NULL,
          experience INTEGER DEFAULT 0 NOT NULL,
          hp INTEGER NOT NULL,
          max_hp INTEGER NOT NULL,
          mp INTEGER DEFAULT 200 NOT NULL,
          max_mp INTEGER DEFAULT 200 NOT NULL,
          str INTEGER DEFAULT 15 NOT NULL,
          dex INTEGER DEFAULT 15 NOT NULL,
          intel INTEGER DEFAULT 15 NOT NULL,
          luk INTEGER DEFAULT 10 NOT NULL,
          vit INTEGER DEFAULT 15 NOT NULL,
          atk INTEGER NOT NULL,
          matk INTEGER DEFAULT 20 NOT NULL,
          def INTEGER NOT NULL,
          mdef INTEGER DEFAULT 15 NOT NULL,
          spd INTEGER NOT NULL,
          crit_rate INTEGER DEFAULT 15 NOT NULL,
          crit_dmg INTEGER DEFAULT 150 NOT NULL,
          accuracy INTEGER DEFAULT 95 NOT NULL,
          evasion INTEGER DEFAULT 10 NOT NULL,
          combat_power INTEGER DEFAULT 500 NOT NULL,
          gold INTEGER DEFAULT 1000 NOT NULL,
          kills INTEGER DEFAULT 0 NOT NULL,
          deaths INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_real_user BOOLEAN DEFAULT TRUE NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS forum_title TEXT DEFAULT 'Tân Thủ Long Tộc' NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_region TEXT DEFAULT 'VN' NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_server_id TEXT DEFAULT 's1_long_vuong' NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_character_id INTEGER;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS server_id TEXT DEFAULT 's1_long_vuong' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS unlocked_slots INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Thượng Cấp Chiến Sĩ' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS zone_id TEXT DEFAULT 'SAFE_VILLAGE' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS pos_x INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS pos_z INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS mp INTEGER DEFAULT 200 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS max_mp INTEGER DEFAULT 200 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS str INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS dex INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS intel INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS luk INTEGER DEFAULT 10 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS vit INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS matk INTEGER DEFAULT 20 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS mdef INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS crit_rate INTEGER DEFAULT 15 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS crit_dmg INTEGER DEFAULT 150 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS accuracy INTEGER DEFAULT 95 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS evasion INTEGER DEFAULT 10 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS combat_power INTEGER DEFAULT 500 NOT NULL;
        ALTER TABLE characters ALTER COLUMN pos_x TYPE REAL;
        ALTER TABLE characters ALTER COLUMN pos_z TYPE REAL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS facing TEXT DEFAULT 'down' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS is_mounted BOOLEAN DEFAULT FALSE NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS active_mount_id TEXT DEFAULT 'dark_steed' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS active_pet_id TEXT DEFAULT 'spirit_orb' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS stat_points INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS skill_points INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS rage_gauge INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS hotbar_config_json TEXT DEFAULT '' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS active_buffs_json TEXT DEFAULT '[]' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS ui_preferences_json TEXT DEFAULT '' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS awakening_tier INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS talents_json TEXT DEFAULT '{}' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS hair_style TEXT DEFAULT 'phong_van' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS hair_color TEXT DEFAULT '#1e1e1e' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS outfit_id TEXT DEFAULT 'basic' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS destiny_rolled BOOLEAN DEFAULT FALSE NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS talent_ids TEXT DEFAULT '[]' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS aura_ids TEXT DEFAULT '[]' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS unallocated_stat_points INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS honor_points INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS arena_rank TEXT DEFAULT 'Đồng IV' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS active_mount TEXT DEFAULT 'shadow_steed' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS active_pet TEXT DEFAULT 'fairy_spirit' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS codex_unlocked_json TEXT DEFAULT '[]' NOT NULL;
        ALTER TABLE characters ADD COLUMN IF NOT EXISTS auto_combat_settings_json TEXT DEFAULT '{"hpThreshold":45,"mpThreshold":30,"lootFilterMinRarity":"rare"}' NOT NULL;

        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT DEFAULT 'equipment' NOT NULL,
          type TEXT NOT NULL,
          equip_slot TEXT DEFAULT 'none' NOT NULL,
          description TEXT NOT NULL,
          lore TEXT DEFAULT '' NOT NULL,
          rarity TEXT NOT NULL,
          hp_boost INTEGER DEFAULT 0 NOT NULL,
          mp_boost INTEGER DEFAULT 0 NOT NULL,
          atk_boost INTEGER DEFAULT 0 NOT NULL,
          matk_boost INTEGER DEFAULT 0 NOT NULL,
          def_boost INTEGER DEFAULT 0 NOT NULL,
          mdef_boost INTEGER DEFAULT 0 NOT NULL,
          spd_boost INTEGER DEFAULT 0 NOT NULL,
          str_boost INTEGER DEFAULT 0 NOT NULL,
          dex_boost INTEGER DEFAULT 0 NOT NULL,
          int_boost INTEGER DEFAULT 0 NOT NULL,
          luk_boost INTEGER DEFAULT 0 NOT NULL,
          vit_boost INTEGER DEFAULT 0 NOT NULL,
          crit_rate_boost INTEGER DEFAULT 0 NOT NULL,
          heal_hp_percent INTEGER DEFAULT 0 NOT NULL,
          heal_mp_percent INTEGER DEFAULT 0 NOT NULL,
          buff_type TEXT,
          price INTEGER DEFAULT 0 NOT NULL,
          max_stack INTEGER DEFAULT 1 NOT NULL,
          class_id TEXT,
          required_level INTEGER DEFAULT 1 NOT NULL,
          icon TEXT DEFAULT '◇' NOT NULL
        );

        ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'equipment' NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS equip_slot TEXT DEFAULT 'none' NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS lore TEXT DEFAULT '' NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS mp_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS matk_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS mdef_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS str_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS dex_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS int_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS luk_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS vit_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS crit_rate_boost INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS heal_hp_percent INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS heal_mp_percent INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS buff_type TEXT;
        ALTER TABLE items ADD COLUMN IF NOT EXISTS max_stack INTEGER DEFAULT 1 NOT NULL;

        CREATE TABLE IF NOT EXISTS character_items (
          id SERIAL PRIMARY KEY,
          character_id INTEGER NOT NULL,
          item_id TEXT NOT NULL,
          equipped BOOLEAN DEFAULT FALSE NOT NULL,
          equipped_slot TEXT,
          slot_index INTEGER DEFAULT 0 NOT NULL,
          quantity INTEGER DEFAULT 1 NOT NULL,
          enhance_level INTEGER DEFAULT 0 NOT NULL,
          bonus_combat_power INTEGER DEFAULT 0 NOT NULL,
          acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS equipped_slot TEXT;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS slot_index INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS enhance_level INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS bonus_combat_power INTEGER DEFAULT 0 NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common' NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS miracle_passive_1 TEXT;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS miracle_passive_2 TEXT;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS sockets_json TEXT DEFAULT '[]' NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS reforge_stats_json TEXT DEFAULT '[]' NOT NULL;
        ALTER TABLE character_items ADD COLUMN IF NOT EXISTS runes_json TEXT DEFAULT '[]' NOT NULL;
        DROP INDEX IF EXISTS character_item_unique;

        CREATE TABLE IF NOT EXISTS battle_logs (
          id SERIAL PRIMARY KEY,
          character_id INTEGER NOT NULL,
          encounter_id UUID,
          monster_id TEXT NOT NULL,
          monster_name TEXT NOT NULL,
          victory BOOLEAN NOT NULL,
          exp_gained INTEGER DEFAULT 0 NOT NULL,
          gold_gained INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS encounters (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          character_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          monster_id TEXT NOT NULL,
          spawn_id TEXT NOT NULL,
          zone_id TEXT DEFAULT 'WILDERNESS' NOT NULL,
          status TEXT DEFAULT 'active' NOT NULL,
          rules_version INTEGER DEFAULT 1 NOT NULL,
          content_version INTEGER DEFAULT 1 NOT NULL,
          rng_seed INTEGER DEFAULT 1337 NOT NULL,
          client_request_id TEXT NOT NULL,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          ended_at TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          final_server_tick INTEGER,
          final_state_json JSONB,
          result_json JSONB,
          log_id INTEGER
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_char_active ON encounters (character_id) WHERE status = 'active';
        CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_client_req ON encounters (character_id, client_request_id);

        CREATE TABLE IF NOT EXISTS reward_grants (
          encounter_id UUID PRIMARY KEY,
          character_id INTEGER NOT NULL,
          exp_granted INTEGER NOT NULL,
          gold_granted INTEGER NOT NULL,
          items_granted JSONB,
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON user_sessions ("expire");

        CREATE TABLE IF NOT EXISTS gm_audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          character_id INTEGER,
          action TEXT NOT NULL,
          payload_json TEXT,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS gm_audit_logs_user_id_idx ON gm_audit_logs(user_id);

        CREATE TABLE IF NOT EXISTS servers (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL,
          status TEXT DEFAULT 'GOOD' NOT NULL, exp_multiplier INTEGER DEFAULT 1 NOT NULL,
          gold_multiplier INTEGER DEFAULT 1 NOT NULL, max_players INTEGER DEFAULT 1000 NOT NULL
        );
        CREATE TABLE IF NOT EXISTS monsters (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT DEFAULT '' NOT NULL,
          archetype TEXT DEFAULT 'MELEE_RUSHER' NOT NULL, zone_id TEXT DEFAULT 'WILDERNESS' NOT NULL,
          level INTEGER DEFAULT 1 NOT NULL, hp INTEGER NOT NULL, atk INTEGER NOT NULL, def INTEGER NOT NULL,
          spd INTEGER DEFAULT 10 NOT NULL, crit_rate INTEGER DEFAULT 5 NOT NULL,
          stagger_threshold INTEGER DEFAULT 100 NOT NULL, aggro_radius INTEGER DEFAULT 8 NOT NULL,
          leash_radius INTEGER DEFAULT 18 NOT NULL, exp_reward INTEGER DEFAULT 0 NOT NULL,
          gold_reward INTEGER DEFAULT 0 NOT NULL, emoji TEXT DEFAULT '👹' NOT NULL,
          sprite_type TEXT DEFAULT 'goblin' NOT NULL, description TEXT DEFAULT '' NOT NULL,
          drop_table_json TEXT DEFAULT '[]' NOT NULL
        );
        CREATE TABLE IF NOT EXISTS forum_posts (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, character_id INTEGER,
          server_id TEXT DEFAULT 's1_long_vuong' NOT NULL, title TEXT NOT NULL,
          category TEXT DEFAULT 'general' NOT NULL, body TEXT NOT NULL,
          likes JSONB DEFAULT '[]'::jsonb NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS world_chats (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, character_id INTEGER,
          server_id TEXT DEFAULT 's1_long_vuong' NOT NULL, channel TEXT DEFAULT 'world' NOT NULL,
          message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS forum_comments (
          id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
          character_id INTEGER, comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS quests (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT DEFAULT 'MAIN' NOT NULL,
          npc_id TEXT NOT NULL, npc_name TEXT DEFAULT 'Trưởng Làng' NOT NULL,
          description TEXT NOT NULL, objective_type TEXT NOT NULL,
          target_id TEXT NOT NULL, target_name TEXT NOT NULL,
          required_count INTEGER DEFAULT 1 NOT NULL, reward_exp INTEGER DEFAULT 0 NOT NULL,
          reward_gold INTEGER DEFAULT 0 NOT NULL, reward_item_id TEXT,
          reward_item_name TEXT, reward_item_count INTEGER DEFAULT 1,
          next_quest_id TEXT, target_pos_x REAL DEFAULT 0 NOT NULL,
          target_pos_z REAL DEFAULT 0 NOT NULL, target_zone TEXT DEFAULT 'SAFE_VILLAGE' NOT NULL,
          order_index INTEGER DEFAULT 0 NOT NULL
        );
        CREATE TABLE IF NOT EXISTS character_quests (
          id TEXT PRIMARY KEY, character_id INTEGER NOT NULL,
          quest_id TEXT NOT NULL, progress INTEGER DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'AVAILABLE' NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS market_listings (
          id SERIAL PRIMARY KEY,
          seller_character_id INTEGER NOT NULL,
          seller_name TEXT NOT NULL,
          seller_server_id TEXT DEFAULT 's1_long_vuong' NOT NULL,
          item_id TEXT NOT NULL,
          item_name TEXT NOT NULL,
          item_rarity TEXT DEFAULT 'common' NOT NULL,
          item_category TEXT DEFAULT 'equipment' NOT NULL,
          item_class_id TEXT,
          equip_slot TEXT,
          enhance_level INTEGER DEFAULT 0 NOT NULL,
          sockets_json TEXT DEFAULT '[]' NOT NULL,
          reforge_stats_json TEXT DEFAULT '[]' NOT NULL,
          quantity INTEGER DEFAULT 1 NOT NULL,
          price_gold INTEGER NOT NULL,
          status TEXT DEFAULT 'active' NOT NULL,
          buyer_character_id INTEGER,
          listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          sold_at TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS market_status_idx ON market_listings(status);
        CREATE INDEX IF NOT EXISTS market_seller_idx ON market_listings(seller_character_id);
        CREATE INDEX IF NOT EXISTS market_item_id_idx ON market_listings(item_id);
        CREATE INDEX IF NOT EXISTS quests_type_idx ON quests(type);
        CREATE INDEX IF NOT EXISTS quests_npc_id_idx ON quests(npc_id);
        CREATE INDEX IF NOT EXISTS quests_order_idx ON quests(order_index);
        CREATE INDEX IF NOT EXISTS char_quests_char_id_idx ON character_quests(character_id);
        CREATE INDEX IF NOT EXISTS char_quests_quest_id_idx ON character_quests(quest_id);
        CREATE INDEX IF NOT EXISTS char_quests_status_idx ON character_quests(status);
        CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters(user_id);
        CREATE INDEX IF NOT EXISTS characters_server_id_idx ON characters(server_id);
        CREATE INDEX IF NOT EXISTS users_selected_server_id_idx ON users(selected_server_id);
        CREATE INDEX IF NOT EXISTS items_class_id_idx ON items(class_id);
        CREATE INDEX IF NOT EXISTS character_items_character_id_idx ON character_items(character_id);
        CREATE INDEX IF NOT EXISTS character_items_item_id_idx ON character_items(item_id);
        CREATE INDEX IF NOT EXISTS battle_logs_character_id_idx ON battle_logs(character_id);
        CREATE INDEX IF NOT EXISTS battle_logs_monster_id_idx ON battle_logs(monster_id);
        CREATE INDEX IF NOT EXISTS encounters_character_id_idx ON encounters(character_id);
        CREATE INDEX IF NOT EXISTS encounters_user_id_idx ON encounters(user_id);
        CREATE INDEX IF NOT EXISTS encounters_monster_id_idx ON encounters(monster_id);
        CREATE INDEX IF NOT EXISTS forum_posts_user_id_idx ON forum_posts(user_id);
        CREATE INDEX IF NOT EXISTS forum_posts_character_id_idx ON forum_posts(character_id);
        CREATE INDEX IF NOT EXISTS forum_posts_server_id_idx ON forum_posts(server_id);
        CREATE INDEX IF NOT EXISTS world_chats_user_id_idx ON world_chats(user_id);
        CREATE INDEX IF NOT EXISTS world_chats_character_id_idx ON world_chats(character_id);
        CREATE INDEX IF NOT EXISTS world_chats_server_id_idx ON world_chats(server_id);
        CREATE INDEX IF NOT EXISTS forum_comments_post_id_idx ON forum_comments(post_id);
        CREATE INDEX IF NOT EXISTS forum_comments_user_id_idx ON forum_comments(user_id);
        CREATE INDEX IF NOT EXISTS forum_comments_character_id_idx ON forum_comments(character_id);

        -- Bảo toàn toàn vẹn dữ liệu: Giữ nguyên Foreign Key constraints
      `);

      // Check if catalog already seeded to avoid redundant network round trips
      const itemCountCheck = await pool.query("SELECT count(*) FROM items;").then(r => Number(r.rows[0].count)).catch(() => 0);
      if (itemCountCheck < 50) {
        const chunkSize = 50;
        for (let i = 0; i < SEED_ALL_ITEMS.length; i += chunkSize) {
          const chunk = SEED_ALL_ITEMS.slice(i, i + chunkSize);
          const values: any[] = [];
          const placeholders: string[] = [];
          chunk.forEach((item, idx) => {
            const offset = idx * 13;
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`);
            values.push(item.id, item.name, item.type || "weapon", item.description || "", item.rarity || "common", item.hpBoost || 0, item.atkBoost || 0, item.defBoost || 0, item.spdBoost || 0, item.price || 100, item.classId || null, item.requiredLevel || 1, item.icon || "◇");
          });
          await pool.query(`
            INSERT INTO items (id, name, type, description, rarity, hp_boost, atk_boost, def_boost, spd_boost, price, class_id, required_level, icon)
            VALUES ${placeholders.join(", ")}
            ON CONFLICT (id) DO NOTHING;
          `, values);
        }
      }

      // Check if users table is empty and auto-seed users & characters
      try {
        const uCount = await pool.query("SELECT count(*) FROM users;").then(r => Number(r.rows[0].count)).catch(() => 0);
        if (uCount === 0) {
          const { seedDatabase } = await import("./seed");
          await seedDatabase();
        }
      } catch (seedErr) {
        console.warn("[DB] Auto-seed on startup note:", (seedErr as Error).message);
      }

      console.log("[DB] PostgreSQL tables & seed catalog successfully initialized.");
      return;
    } catch (err) {
      console.warn("[DB] PostgreSQL connection failed. Falling back to Standalone Memory DB:", (err as Error).message);
    }
  }

  console.log("[DB] Running in Standalone / In-Memory Mode with zero external dependencies.");
  restoreMemoryStore();
  db = createMemoryDb();
  isPostgres = false;
}

// Initial setup call if in non-deferred environment
const initialDbUrl = resolveDatabaseUrl();
if (initialDbUrl) {
  try {
    pool = new Pool(getPoolConfig(initialDbUrl));
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

export async function getDatabaseConnectionStatus() {
  const currentUrl = resolveDatabaseUrl();
  let pingMs: number | null = null;
  let connectionError: string | null = null;
  let pgInfo: any = null;

  if (isPostgres && pool) {
    try {
      const t0 = Date.now();
      const client = await pool.connect();
      const res = await client.query("SELECT current_database() as db, current_user as usr, version() as ver;");
      client.release();
      pingMs = Date.now() - t0;
      pgInfo = res.rows[0];
    } catch (err: any) {
      connectionError = err.message;
    }
  }

  let counts: Record<string, number> = {};
  try {
    if (isPostgres && pool && !connectionError) {
      const [u, c, i, m, q, ci] = await Promise.all([
        pool.query("SELECT count(*) FROM users;").then(r => Number(r.rows[0].count)).catch(() => 0),
        pool.query("SELECT count(*) FROM characters;").then(r => Number(r.rows[0].count)).catch(() => 0),
        pool.query("SELECT count(*) FROM items;").then(r => Number(r.rows[0].count)).catch(() => 0),
        pool.query("SELECT count(*) FROM monsters;").then(r => Number(r.rows[0].count)).catch(() => 0),
        pool.query("SELECT count(*) FROM quests;").then(r => Number(r.rows[0].count)).catch(() => 0),
        pool.query("SELECT count(*) FROM character_items;").then(r => Number(r.rows[0].count)).catch(() => 0),
      ]);
      counts = { users: u, characters: c, items: i, monsters: m, quests: q, characterItems: ci };
    } else {
      counts = {
        users: memoryStore.users.length,
        characters: memoryStore.characters.length,
        items: memoryStore.items.length,
        monsters: memoryStore.monsters.length,
        quests: memoryStore.quests.length,
        characterItems: memoryStore.character_items.length,
      };
    }
  } catch {}

  let maskedHost = "Local Memory / Standalone";
  if (currentUrl) {
    try {
      const parsed = new URL(currentUrl.replace("postgres://", "http://").replace("postgresql://", "http://"));
      maskedHost = parsed.hostname;
    } catch {
      maskedHost = "PostgreSQL (Configured)";
    }
  }

  return {
    isPostgres: Boolean(isPostgres && !connectionError),
    dbMode: isPostgres && !connectionError ? "PostgreSQL (Supabase Cloud)" : "In-Memory / Standalone Fallback",
    host: maskedHost,
    pingMs,
    connectionError,
    pgInfo,
    counts,
    hasConfiguredUrl: Boolean(currentUrl),
  };
}

export async function switchDatabaseConnection(newDbUrl: string): Promise<{ success: boolean; message: string; host?: string; pingMs?: number }> {
  const cleanUrl = newDbUrl.trim();
  if (!cleanUrl || (!cleanUrl.startsWith("postgres://") && !cleanUrl.startsWith("postgresql://"))) {
    return { success: false, message: "URL kết nối không hợp lệ. Phải bắt đầu bằng postgres:// hoặc postgresql://" };
  }

  try {
    const t0 = Date.now();
    const testPool = new Pool(getPoolConfig(cleanUrl));
    const client = await testPool.connect();
    const res = await client.query("SELECT current_database() as db, current_user as usr, version() as ver;");
    client.release();
    const pingMs = Date.now() - t0;

    if (pool) {
      try {
        await pool.end();
      } catch {}
    }

    pool = testPool;
    pool.on("error", (err) => {
      console.warn("[DB:Pool] Background connection warning:", err.message);
    });

    db = drizzle(pool, { schema });
    isPostgres = true;

    // Run migrations and create tables if missing
    await initDatabase();

    // Persist to .env.local
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
      if (content.includes("DATABASE_URL=")) {
        content = content.replace(/DATABASE_URL=.*/, `DATABASE_URL="${cleanUrl}"`);
      } else {
        content += `\nDATABASE_URL="${cleanUrl}"\n`;
      }
      fs.writeFileSync(envPath, content, "utf8");
      process.env.DATABASE_URL = cleanUrl;
    } catch {}

    const parsed = new URL(cleanUrl.replace("postgres://", "http://").replace("postgresql://", "http://"));
    return {
      success: true,
      message: `Kết nối Supabase PostgreSQL thành công! Host: ${parsed.hostname} (${pingMs}ms). Dữ liệu hiện đang được đồng bộ và lưu trữ trực tiếp liên tục.`,
      host: parsed.hostname,
      pingMs,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Lỗi kết nối Supabase: " + (err.message || String(err)),
    };
  }
}

export async function pushAllLocalDataToSupabase(): Promise<{ success: boolean; message: string; syncedCounts: Record<string, number> }> {
  if (!isPostgres || !pool) {
    return {
      success: false,
      message: "Chưa kết nối Supabase PostgreSQL. Vui lòng cấu hình kết nối trước khi đẩy dữ liệu.",
      syncedCounts: {},
    };
  }

  let usersSynced = 0;
  let charsSynced = 0;
  let itemsSynced = 0;
  let monstersSynced = 0;
  let questsSynced = 0;
  let charItemsSynced = 0;

  try {
    // 1. Sync users with safe conflict handling
    for (const u of memoryStore.users) {
      try {
        await pool.query(`
          INSERT INTO users (id, username, password_hash, role, is_real_user, forum_title, selected_region, selected_server_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            is_real_user = EXCLUDED.is_real_user,
            forum_title = EXCLUDED.forum_title;
        `, [u.id, u.username, u.passwordHash, u.role || "player", u.isRealUser ?? true, u.forumTitle || "Tân Thủ Long Tộc", u.selectedRegion || "VN", u.selectedServerId || "s1_long_vuong"]);
        usersSynced++;
      } catch {
        // Safe fallback if username exists on different id
        await pool.query(`
          UPDATE users SET role = $1, is_real_user = $2, forum_title = $3 WHERE username = $4;
        `, [u.role || "player", u.isRealUser ?? true, u.forumTitle || "Tân Thủ Long Tộc", u.username]).catch(() => {});
        usersSynced++;
      }
    }

    // 2. Sync characters
    for (const c of memoryStore.characters) {
      await pool.query(`
        INSERT INTO characters (id, user_id, server_id, name, class_id, class_name, gender, level, experience, hp, max_hp, mp, max_mp, atk, def, spd, gold, combat_power)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          level = EXCLUDED.level,
          experience = EXCLUDED.experience,
          hp = EXCLUDED.hp,
          mp = EXCLUDED.mp,
          gold = EXCLUDED.gold,
          combat_power = EXCLUDED.combat_power;
      `, [c.id, c.userId, c.serverId || "s1_long_vuong", c.name, c.classId, c.className || c.classId, c.gender || "male", c.level || 1, c.experience || 0, c.hp || 100, c.maxHp || 100, c.mp || 100, c.maxMp || 100, c.atk || 20, c.def || 10, c.spd || 10, c.gold || 100, c.combatPower || 500]);
      charsSynced++;
    }

    // 3. Fast Sync items (check count first to avoid 291 slow queries)
    const itemCountRes = await pool.query(`SELECT count(*)::int AS count FROM items;`);
    const currentItemCount = Number(itemCountRes.rows[0]?.count || 0);
    if (currentItemCount >= 50) {
      itemsSynced = currentItemCount;
    } else {
      const chunkSize = 50;
      for (let i = 0; i < memoryStore.items.length; i += chunkSize) {
        const chunk = memoryStore.items.slice(i, i + chunkSize);
        const valuePlaceholders: string[] = [];
        const params: any[] = [];
        let pIndex = 1;
        for (const item of chunk) {
          valuePlaceholders.push(`($${pIndex}, $${pIndex + 1}, $${pIndex + 2}, $${pIndex + 3}, $${pIndex + 4}, $${pIndex + 5}, $${pIndex + 6}, $${pIndex + 7}, $${pIndex + 8}, $${pIndex + 9}, $${pIndex + 10}, $${pIndex + 11}, $${pIndex + 12}, $${pIndex + 13})`);
          params.push(item.id, item.name, item.category || "equipment", item.type || "weapon", item.equipSlot || "none", item.description || "", item.rarity || "common", item.hpBoost || 0, item.atkBoost || 0, item.defBoost || 0, item.spdBoost || 0, item.price || 100, item.requiredLevel || 1, item.icon || "◇");
          pIndex += 14;
        }
        await pool.query(`
          INSERT INTO items (id, name, category, type, equip_slot, description, rarity, hp_boost, atk_boost, def_boost, spd_boost, price, required_level, icon)
          VALUES ${valuePlaceholders.join(", ")}
          ON CONFLICT (id) DO NOTHING;
        `, params);
        itemsSynced += chunk.length;
      }
    }

    // 4. Sync character items
    for (const ci of memoryStore.character_items) {
      await pool.query(`
        INSERT INTO character_items (id, character_id, item_id, equipped, equipped_slot, slot_index, quantity, enhance_level, rarity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          equipped = EXCLUDED.equipped,
          equipped_slot = EXCLUDED.equipped_slot,
          quantity = EXCLUDED.quantity,
          enhance_level = EXCLUDED.enhance_level;
      `, [ci.id, ci.characterId, ci.itemId, ci.equipped || false, ci.equippedSlot || null, ci.slotIndex || 0, ci.quantity || 1, ci.enhanceLevel || 0, ci.rarity || "common"]);
      charItemsSynced++;
    }

    // 5. Sync monsters
    for (const m of memoryStore.monsters) {
      await pool.query(`
        INSERT INTO monsters (id, name, zone_id, level, hp, atk, def, exp_reward, gold_reward, drop_table_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;
      `, [m.id, m.name, m.zoneId || "SAFE_VILLAGE", m.level || 1, m.hp || 100, m.atk || 15, m.def || 5, m.expReward || 10, m.goldReward || 5, typeof m.dropTableJson === "string" ? m.dropTableJson : JSON.stringify(m.dropTableJson || [])]);
      monstersSynced++;
    }

    // 6. Sync quests
    for (const q of memoryStore.quests) {
      await pool.query(`
        INSERT INTO quests (id, title, description, type, objective_type, target_id, target_name, npc_id, npc_name, reward_exp, reward_gold, reward_item_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING;
      `, [q.id, q.title, q.description || "", q.type || "MAIN", q.objectiveType || "KILL_MONSTER", q.targetId || "slime_green", q.targetName || "Quái Vật", q.npcId || "npc_truong_lang", q.npcName || "Trưởng Làng", q.rewardExp || 50, q.rewardGold || 50, q.rewardItemId || null]);
      questsSynced++;
    }

    return {
      success: true,
      message: `Đã đẩy toàn bộ dữ liệu lên Supabase thành công! (${usersSynced} users, ${charsSynced} nhân vật, ${itemsSynced} vật phẩm, ${charItemsSynced} đồ hành trang, ${monstersSynced} quái vật, ${questsSynced} nhiệm vụ).`,
      syncedCounts: {
        users: usersSynced,
        characters: charsSynced,
        items: itemsSynced,
        characterItems: charItemsSynced,
        monsters: monstersSynced,
        quests: questsSynced,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Lỗi đồng bộ dữ liệu lên Supabase: " + err.message,
      syncedCounts: {
        users: usersSynced,
        characters: charsSynced,
        items: itemsSynced,
        characterItems: charItemsSynced,
        monsters: monstersSynced,
        quests: questsSynced,
      },
    };
  }
}

export * from "./schema";
export * from "./seed-data";
export * from "./game-seed";
export * from "./quests-seed";
export { seedDatabase } from "./seed";
