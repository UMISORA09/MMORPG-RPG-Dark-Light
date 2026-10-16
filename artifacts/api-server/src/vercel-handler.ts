import app from "./app";
import { initDatabase, seedDatabase } from "@workspace/db";

let isDbInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      await seedDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error("[Vercel Serverless] Database init warning:", err);
    }
  }

  return (app as any)(req, res);
}

