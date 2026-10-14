# Chiến Long Bí Sử (Chiến Long Bá) — 2.5D Real-Time Action MMORPG

Web game 2.5D Action MMORPG thời gian thực với 4 chức nghiệp: Xạ Thủ, Sát Thủ, Đấu Sĩ, Đỡ Đòn. Người chơi điều khiển nhân vật trong không gian 3D mở liên thông (Làng Long Tộc, Đấu Trường Hoang Dã, Cấm Địa Boss), chiến đấu combo thời gian thực (chém kiếm, né đòn, nộ chiêu), đồng bộ nhiều người chơi qua WebSocket và lưu trữ tiến trình bền vững trên PostgreSQL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mmorpg-game run dev` — run the frontend (port 25029)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Three.js / React Three Fiber, 2.5D Billboard Sprites (optional 3D RPG Model), wouter routing, Tailwind CSS, TanStack Query, Zustand
- API & Realtime: Express 5 + WebSocket (`ws`) + express-session + connect-pg-simple
- Auth: bcryptjs password hashing, PostgreSQL session store
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `docs/PRODUCT_BRIEF.md` — Product Brief & Kiến trúc chuẩn hóa MMORPG
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/` — Drizzle schema: users, characters, battle_logs, items
- `artifacts/api-server/src/routes/` — auth, classes, characters, battle, leaderboard
- `artifacts/api-server/src/data/classes.ts` — static data: character classes, monsters, stat formulas
- `artifacts/mmorpg-game/src/` — React Three Fiber 2.5D frontend

## Architecture decisions

- Sessions stored in PostgreSQL via connect-pg-simple (table: user_sessions, created automatically)
- All integer fields in OpenAPI spec use `type: number` (not `type: integer`) because Orval v8 generates `zod.int()` which doesn't exist in Zod v3 — `zod.number()` is the correct call
- Combat is 100% Real-Time Action in 3D scene (hitbox, combo timing, telegraph dodging, boss raid mechanics)
- Server validates combat victories, level ups, loot generation and stores battle history authoritatively
- Realtime Multiplayer: WebSocket netcode synchronizes remote player coordinates, animation states, and combat events in 20Hz ticks
- EXP formula: `floor(100 * 1.5^(level-1))` per level
- Character stats scale linearly: `baseStats * (1 + (level-1) * 0.1)`

## Product

- Register/login with username + password (supports 1-click Quick Play)
- Choose 1 of 4 character classes (Xạ Thủ, Sát Thủ, Đấu Sĩ, Đỡ Đòn) — each with unique anatomy, stats, and 3-hit combo + 3 active skills
- Fight monsters (Slime, Wolf, Goblin, Orc, Skeleton, Ancient Dragon Boss) in real-time for EXP, Gold, and 3D Loot drops
- Level up to gain stronger stats automatically
- View battle history, character equipment inventory, store purchases, and global leaderboard

## User preferences

_Populate as you build._

## Gotchas

- Use `zod.number()` not `zod.int()` in OpenAPI spec integer fields (Orval + Zod v3 compatibility)
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching the frontend
- bcrypt (native) is blocked by pnpm build approval — use bcryptjs instead
- Session cookie `secure: false` in dev; set to `true` in production behind HTTPS
