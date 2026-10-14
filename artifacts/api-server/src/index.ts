import http from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { initDatabase } from "@workspace/db";
import { setupRealtimeGateway } from "./realtime/gateway";

const port = Number(process.env["PORT"] || "3001");

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    logger.error({ err }, "Database initialization error");
  }

  const server = http.createServer(app);
  setupRealtimeGateway(server);

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "MMORPG 2.5D Beta Server & WebSocket Gateway listening on http://0.0.0.0:" + port);
  });
}

startServer().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
