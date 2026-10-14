import app from "../artifacts/api-server/src/app";
import { initDatabase } from "@workspace/db";

let isDbInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error("[Vercel Serverless] Database init warning:", err);
    }
  }

  return app(req, res);
}
