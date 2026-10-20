import app from "./app";
import { initDatabase, seedDatabase } from "@workspace/db";

let isDbInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDb() {
  if (isDbInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initDatabase();
        isDbInitialized = true;
        // Run seed catalogs in background so serverless responses are fast
        seedDatabase().catch((e) => console.warn("[Vercel] Catalog seed deferred warning:", e));
      } catch (err) {
        console.error("[Vercel Serverless] Database init warning:", err);
      }
    })();
  }
  return initPromise;
}

export default async function handler(req: any, res: any) {
  await ensureDb();
  return (app as any)(req, res);
}


