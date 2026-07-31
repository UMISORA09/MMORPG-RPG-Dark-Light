# Chiến Trường — Dark Fantasy MMORPG

Web game MMORPG 2D mobile với 4 chức nghiệp: Xạ Thủ, Sát Thủ, Đấu Sĩ, Đỡ Đòn. Người chơi đăng ký tài khoản, chọn chức nghiệp, chiến đấu với quái vật, lên level và cạnh tranh trên bảng xếp hạng.

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
- Frontend: React + Vite, wouter routing, Tailwind CSS, TanStack Query, Framer Motion
- API: Express 5 + express-session + connect-pg-simple
- Auth: bcryptjs password hashing, PostgreSQL session store
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/` — Drizzle schema: users, characters, battle_logs
- `artifacts/api-server/src/routes/` — auth, classes, characters, battle, leaderboard
- `artifacts/api-server/src/data/classes.ts` — static data: character classes, monsters, stat formulas
- `artifacts/mmorpg-game/src/` — React frontend

## Architecture decisions

- Sessions stored in PostgreSQL via connect-pg-simple (table: user_sessions, created automatically)
- All integer fields in OpenAPI spec use `type: number` (not `type: integer`) because Orval v8 generates `zod.int()` which doesn't exist in Zod v3 — `zod.number()` is the correct call
- Battle system is turn-based simulation: player attacks first if SPD >= monsterAtk/2, ±15% damage variance, 15% crit rate at 1.8x
- EXP formula: `floor(100 * 1.5^(level-1))` per level
- Character stats scale linearly: `baseStats * (1 + (level-1) * 0.1)`

## Product

- Register/login with username + password
- Choose 1 of 4 character classes (Xạ Thủ, Sát Thủ, Đấu Sĩ, Đỡ Đòn) — each with unique stats and skills
- Fight monsters of increasing difficulty for EXP and gold
- Level up to gain stronger stats automatically
- View battle history, character stats, and global leaderboard

## User preferences

_Populate as you build._

## Gotchas

- Use `zod.number()` not `zod.int()` in OpenAPI spec integer fields (Orval + Zod v3 compatibility)
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching the frontend
- bcrypt (native) is blocked by pnpm build approval — use bcryptjs instead
- Session cookie `secure: false` in dev; set to `true` in production behind HTTPS
