import app from "./app";
import { logger } from "./lib/logger";
import { initDatabase } from "@workspace/db";

const port = Number(process.env["PORT"] || "8080");

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    logger.error({ err }, "Database initialization error");
  }

  app.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "MMORPG 2.5D Beta Server listening on http://0.0.0.0:" + port);
  });
}

startServer().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
