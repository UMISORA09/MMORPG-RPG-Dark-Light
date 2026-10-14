/**
 * Reference skeleton — server-authoritative encounter runtime.
 *
 * Integration notes for this repository:
 * 1) Add `ws` and `@types/ws` to artifacts/api-server.
 * 2) Export/reuse the exact express-session middleware instance from app.ts.
 * 3) In index.ts use createServer(app), attach session-aware upgrade handling,
 *    then server.listen(). Never trust reward/damage/position fields from client.
 * 4) Implement EncounterEngine with server-owned combat state and PostgreSQL
 *    transaction finalization. This is a sample, not a drop-in implementation.
 */
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { performance } from "node:perf_hooks";
import { WebSocket, WebSocketServer } from "ws";

const TICK_MS = 50; // 20 authoritative simulation ticks/second
const MAX_CATCH_UP_TICKS = 5;
const INPUTS_PER_SECOND = 30;
const MAX_MESSAGE_BYTES = 2_048;
const SNAPSHOT_EVERY_TICKS = 1;
const REALTIME_PATH = "/api/realtime";

export type Principal = { userId: number; characterId: number; encounterId: string };
type Buttons = {
  forward: boolean; back: boolean; left: boolean; right: boolean; jump: boolean;
  attack: boolean; skill1: boolean; skill2: boolean; skill3: boolean; interact: boolean;
};
type InputMessage = {
  type: "input"; encounterId: string; seq: number; buttons: Buttons; aim?: { yaw: number };
};
type RuntimeEvent = { name: string; data: Record<string, unknown> };
type RuntimeState = { encounterId: string; tick: number; ended: boolean };

/** All methods operate on server-owned state. Never implement these using client claims. */
export interface EncounterEngine {
  /** Must return only this principal's active encounter, or null. */
  getActive(principal: Principal): RuntimeState | null;
  /** Internal server-only lookup; includes terminal state until finalization. */
  getRuntime(encounterId: string): RuntimeState | null;
  /** Advance exactly one fixed step; dt always comes from this server loop. */
  step(encounterId: string, dtSeconds: number): RuntimeEvent[];
  applyInput(encounterId: string, input: InputMessage): void;
  snapshot(encounterId: string): Record<string, unknown>;
  /** Transactional + idempotent; computes rewards from server terminal state. */
  finalize(encounterId: string): Promise<Record<string, unknown>>;
}

/** Must verify session cookie, allowlisted Origin, ownership and active encounter. */
export type ResolvePrincipal = (req: IncomingMessage) => Promise<Principal | null>;

type ClientState = {
  ws: WebSocket; principal: Principal; lastSeq: number;
  tokens: number; tokenUpdatedAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseInput(raw: unknown): InputMessage | null {
  if (!isRecord(raw) || raw.type !== "input") return null;
  if (typeof raw.encounterId !== "string" || raw.encounterId.length > 80) return null;
  if (!Number.isSafeInteger(raw.seq) || (raw.seq as number) < 1) return null;
  if (!isRecord(raw.buttons)) return null;
  const names: (keyof Buttons)[] = [
    "forward", "back", "left", "right", "jump", "attack", "skill1", "skill2", "skill3", "interact",
  ];
  const buttons = {} as Buttons;
  for (const name of names) {
    if (typeof raw.buttons[name] !== "boolean") return null;
    buttons[name] = raw.buttons[name] as boolean;
  }
  let aim: InputMessage["aim"];
  if (raw.aim !== undefined) {
    if (!isRecord(raw.aim) || typeof raw.aim.yaw !== "number" || !Number.isFinite(raw.aim.yaw)) return null;
    aim = { yaw: Math.atan2(Math.sin(raw.aim.yaw), Math.cos(raw.aim.yaw)) };
  }
  // Deliberately select only allowlisted fields; damage, position, reward and victory are discarded.
  return { type: "input", encounterId: raw.encounterId, seq: raw.seq as number, buttons, ...(aim ? { aim } : {}) };
}

function consumeRateToken(client: ClientState, now: number): boolean {
  const elapsed = Math.max(0, (now - client.tokenUpdatedAt) / 1_000);
  client.tokens = Math.min(INPUTS_PER_SECOND, client.tokens + elapsed * INPUTS_PER_SECOND);
  client.tokenUpdatedAt = now;
  if (client.tokens < 1) return false;
  client.tokens -= 1;
  return true;
}

function safeSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  if (ws.bufferedAmount > 256 * 1024) { ws.close(4408, "client too slow"); return; }
  ws.send(JSON.stringify(payload));
}

export function attachAuthoritativeEncounterSocket(
  httpServer: HttpServer,
  resolvePrincipal: ResolvePrincipal,
  engine: EncounterEngine,
) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  const clients = new Map<WebSocket, ClientState>();
  const finalizing = new Set<string>();
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;
  let previous = performance.now();
  let accumulator = 0;

  const acceptConnection = (ws: WebSocket, principal: Principal) => {
    const now = performance.now();
    const client: ClientState = { ws, principal, lastSeq: 0, tokens: INPUTS_PER_SECOND, tokenUpdatedAt: now };
    clients.set(ws, client);
    const runtime = engine.getActive(principal);
    if (runtime) safeSend(ws, { type: "snapshot", encounterId: runtime.encounterId, serverTick: runtime.tick, state: engine.snapshot(runtime.encounterId) });

    ws.on("message", (data, isBinary) => {
      if (isBinary || data.byteLength > MAX_MESSAGE_BYTES) { ws.close(4400, "invalid message"); return; }
      if (!consumeRateToken(client, performance.now())) { ws.close(4429, "rate limited"); return; }
      let decoded: unknown;
      try { decoded = JSON.parse(data.toString()); } catch { ws.close(4400, "invalid JSON"); return; }
      const input = parseInput(decoded);
      if (!input || input.encounterId !== principal.encounterId || input.seq <= client.lastSeq) {
        ws.close(4400, "invalid or replayed input"); return;
      }
      client.lastSeq = input.seq;
      try { engine.applyInput(principal.encounterId, input); }
      catch { ws.close(4400, "input rejected"); }
    });
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  };

  const onUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    let pathname: string;
    try { pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname; }
    catch { socket.destroy(); return; }
    if (pathname !== REALTIME_PATH) { socket.destroy(); return; } // this sample owns the HTTP upgrade listener

    void (async () => {
      try {
        // Resolver must execute the same session middleware/store as Express HTTP,
        // verify Origin against an allowlist, and derive character/encounter from DB.
        // Do not accept userId, characterId or encounterId from query parameters.
        const principal = await resolvePrincipal(req);
        if (!principal || !engine.getActive(principal)) {
          socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
          socket.destroy(); return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => acceptConnection(ws, principal));
      } catch { socket.destroy(); }
    })();
  };

  const runLoop = () => {
    if (stopped) return;
    const now = performance.now();
    accumulator += Math.max(0, now - previous);
    previous = now;
    let steps = 0;

    while (accumulator >= TICK_MS && steps < MAX_CATCH_UP_TICKS) {
      accumulator -= TICK_MS;
      steps += 1;
      const encounterIds = new Set([...clients.values()].map((c) => c.principal.encounterId));
      for (const encounterId of encounterIds) {
        const client = [...clients.values()].find((c) => c.principal.encounterId === encounterId);
        if (!client || finalizing.has(encounterId)) continue;
        const before = engine.getActive(client.principal);
        if (!before) continue;

        let events: RuntimeEvent[];
        try { events = engine.step(encounterId, TICK_MS / 1_000); }
        catch {
          // Log correlation ID in production. Fail closed: never grant on simulation error.
          for (const c of clients.values()) if (c.principal.encounterId === encounterId) c.ws.close(4500, "simulation error");
          continue;
        }

        const after = engine.getRuntime(encounterId);
        const tick = after?.tick ?? before.tick + 1;
        for (const c of clients.values()) {
          if (c.principal.encounterId !== encounterId) continue;
          for (const event of events) safeSend(c.ws, { type: "event", encounterId, serverTick: tick, name: event.name, data: event.data });
          if (tick % SNAPSHOT_EVERY_TICKS === 0) safeSend(c.ws, { type: "snapshot", encounterId, serverTick: tick, state: engine.snapshot(encounterId) });
        }

        if (after?.ended) {
          finalizing.add(encounterId); // prevents one finalize call per tick
          void engine.finalize(encounterId).then((result) => {
            for (const c of clients.values()) if (c.principal.encounterId === encounterId) {
              safeSend(c.ws, { type: "encounter.result", encounterId, result });
            }
          }).catch(() => {
            // Client can GET encounter status; DB finalize must be retryable/idempotent.
            for (const c of clients.values()) if (c.principal.encounterId === encounterId) c.ws.close(4500, "result pending; query status");
          });
        }
      }
    }

    // Keep accumulated time: do not silently drop authoritative simulation ticks.
    const delay = accumulator >= TICK_MS ? 0 : Math.max(1, TICK_MS - accumulator);
    timer = setTimeout(runLoop, delay);
  };

  httpServer.on("upgrade", onUpgrade);
  timer = setTimeout(runLoop, TICK_MS);
  return {
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      httpServer.off("upgrade", onUpgrade);
      for (const ws of clients.keys()) ws.close(1001, "server shutting down");
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    },
  };
}
