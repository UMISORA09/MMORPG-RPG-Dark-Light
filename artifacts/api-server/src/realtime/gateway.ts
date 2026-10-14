/**
 * WebSocket Realtime Gateway (Path: /api/realtime)
 * Xử lý kết nối socket, xác thực Session cookie, và điều phối fixed tick 20 Hz (50ms).
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import { sessionMiddleware } from "../app";
import { EncounterService } from "../encounters/encounterService";
import type { PlayerInputPacket } from "../encounters/encounterTypes";
import { logger } from "../lib/logger";

interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  characterId?: number;
  encounterId?: string;
  isAlive?: boolean;
}

export function setupRealtimeGateway(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // ── Xử lý HTTP Upgrade với Session Cookie Middleware ──
  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);

    if (url.pathname !== "/api/realtime") {
      return; // Để cho các upgrade handler khác (như Vite HMR) xử lý
    }

    // Chạy sessionMiddleware trên upgrade request để bóc tách session
    const resMock: any = {
      writeHead() {},
      end() {},
      setHeader() {},
      getHeader() {},
    };

    sessionMiddleware(req as any, resMock, () => {
      const session = (req as any).session;
      if (!session || !session.userId) {
        logger.warn("Từ chối kết nối WebSocket: Chưa đăng nhập");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        const authWs = ws as AuthenticatedSocket;
        authWs.userId = session.userId;
        wss.emit("connection", authWs, req);
      });
    });
  });

  // Bản đồ quản lý các socket đang kết nối theo encounterId
  const encounterSockets = new Map<string, AuthenticatedSocket>();
  const disconnectTimers = new Map<string, NodeJS.Timeout>();

  wss.on("connection", (ws: AuthenticatedSocket) => {
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (data: Buffer | string) => {
      try {
        const raw = typeof data === "string" ? data : data.toString();
        const msg = JSON.parse(raw);

        // 1. Tham gia vào Encounter
        if (msg.type === "join" && msg.encounterId) {
          const encounterId = msg.encounterId;
          const engine = EncounterService.getActiveEngine(encounterId);

          if (!engine) {
            ws.send(
              JSON.stringify({
                type: "error",
                code: 4404,
                message: "Trận đấu không tồn tại hoặc đã kết thúc",
              })
            );
            return;
          }

          if (engine.userId !== ws.userId) {
            ws.send(
              JSON.stringify({
                type: "error",
                code: 4403,
                message: "Không có quyền tham gia trận đấu này",
              })
            );
            ws.close(4403, "Forbidden");
            return;
          }

          ws.encounterId = encounterId;
          ws.characterId = engine.characterId;
          encounterSockets.set(encounterId, ws);

          // Nếu có timer đếm ngược rớt mạng đang chạy, hủy bỏ ngay vì người chơi đã reconnect thành công
          if (disconnectTimers.has(encounterId)) {
            clearTimeout(disconnectTimers.get(encounterId)!);
            disconnectTimers.delete(encounterId);
            logger.info({ encounterId }, "Người chơi đã reconnect thành công trong Grace Window");
          }

          // Gửi ngay snapshot ban đầu
          ws.send(JSON.stringify(engine.getSnapshot()));
          return;
        }

        // 2. Nhận gói tin Input Intent từ Client
        if (msg.type === "input" && msg.encounterId) {
          const engine = EncounterService.getActiveEngine(msg.encounterId);
          if (engine && engine.userId === ws.userId) {
            engine.enqueueInput(msg as PlayerInputPacket);
          }
          return;
        }
      } catch (err) {
        logger.error({ err }, "Lỗi giải mã gói tin WebSocket");
      }
    });

    ws.on("close", () => {
      if (ws.encounterId) {
        const encId = ws.encounterId;
        encounterSockets.delete(encId);

        // Kích hoạt Grace Window 20s chờ reconnect
        const timer = setTimeout(async () => {
          disconnectTimers.delete(encId);
          logger.warn({ encounterId: encId }, "Hết hạn Grace Window 20s: Hủy bỏ encounter");
          try {
            await EncounterService.finalizeEncounter(encId, "aborted");
          } catch (e) {
            // Ignore if already finalized
          }
        }, 20 * 1000);

        disconnectTimers.set(encId, timer);
      }
    });
  });

  // ── Fixed Tick Simulation Loop (20 Hz = mỗi 50ms) ──
  setInterval(async () => {
    for (const [encounterId, ws] of encounterSockets.entries()) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      const engine = EncounterService.getActiveEngine(encounterId);
      if (!engine) continue;

      const { snapshot, events, isTerminal, outcome } = engine.tick();

      // Gửi snapshot authoritative
      ws.send(JSON.stringify(snapshot));

      // Gửi các sự kiện chiến đấu nếu có
      for (const evt of events) {
        ws.send(JSON.stringify(evt));
      }

      // Xử lý khi trận đấu kết thúc
      if (isTerminal && outcome) {
        try {
          const terminalResult = await EncounterService.finalizeEncounter(
            encounterId,
            outcome
          );
          ws.send(JSON.stringify(terminalResult));
          encounterSockets.delete(encounterId);
          setTimeout(() => ws.close(1000, "Encounter completed"), 1000);
        } catch (err) {
          logger.error({ err, encounterId }, "Lỗi khi finalize encounter");
        }
      }
    }
  }, 50);

  // Heartbeat ping/pong kiểm tra kết nối sống định kỳ 15s
  setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AuthenticatedSocket;
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 15000);

  logger.info("WebSocket Realtime Gateway mounted at path /api/realtime (Fixed Tick: 20 Hz)");
}
