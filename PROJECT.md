# Project: Deep End-to-End Functional Verification & Codebase Audit — Chiến Long Bí Sử

## Architecture
- **Client**: React 19, `@react-three/fiber` 9.6, `@react-three/drei` 10.7, Three.js 0.184, Zustand 5, Tailwind CSS, Vite 7.
- **Server**: Node.js ESM Express 5 (`artifacts/api-server`), TypeScript, PGBouncer/Supabase PostgreSQL with SSL support & In-Memory disk fallback (`.clb_memory_db.json`).
- **Serverless Adapter**: Vercel Serverless Function (`api/index.mjs`) built via `artifacts/api-server/build.mjs` with externalized native C++ modules and ESM banners.
- **Data Flow & Concurrency**:
  - Client state stores (`useGameWorldStore`, `useGameStore`) sync via REST endpoints (`/api/characters/*`, `/api/multiplayer/sync`) and WebSocket 20Hz (`/api/realtime`).
  - Optimistic Concurrency Control (OCC) enforces `revision` check on `/api/characters/:id/full-sync`, throwing 409 Conflict upon version desync.
  - Financial operations (Market 2% listing fee, 5% sales tax, inventory expansion) use atomic `db.transaction()`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Attribute Points Allocation | STR->ATK, VIT->HP/DEF, DEX->SPD/Crit, INT->MP/Magic with ownership check & immediate recalculation | M5 (Verified) | ORIGINAL_REQUEST R1.1 |
| 2 | Skill Points & Cooldown/MP | Skill allocation up to 5/5, radial cooldown indicator, MP consumption (15/25/50 MP) & MP gain on hit (+4 MP) | M5 (Verified) | ORIGINAL_REQUEST R1.1 |
| 3 | Equip/Unequip & Combat Power | Immediate recalculation of Combat Power upon gear change, class penalty (50%), gem sockets, miracle tier | M5 (Verified) | ORIGINAL_REQUEST R1.1 |
| 4 | Combo Attacks & Hitboxes | 9-row spritesheet, ground combo 1-4 with hit-stop & screenshake, air attack hitbox | M5 (Verified) | ORIGINAL_REQUEST R1.2 |
| 5 | Monster AI & Leash Range | 8-state AI machine (patrol, chase, attack, hurt, dead), leash return >30m with 100% HP reset | M5 (Verified) | ORIGINAL_REQUEST R1.2 |
| 6 | 3-Phase Boss & Berserk Enrage | Phase 1 normal, Phase 2 (HP<=70% adds + AoE donut), Phase 3 (HP<=30% +35% ATK), Berserk Enrage after 3 mins | M5 (Verified) | ORIGINAL_REQUEST R1.2 |
| 7 | 1v1 PvP Arena & Burst Dampening | Circular arena, 90s timer, 40% burst damage dampening (0.6x factor) in client arena | M2 (DONE) | ORIGINAL_REQUEST R1.3 |
| 8 | PvP ELO Calculation & Ranking | Standard ELO formula with loss penalty, honor points and PvP rank persistence | M2 (DONE) | ORIGINAL_REQUEST R1.3 |
| 9 | 3-Room Dungeon Instance Lifecycle | Isolated server instance, room 1-3 progression, portal unlock upon clear, rewards & speedrun leaderboard | M3 (DONE) | ORIGINAL_REQUEST R1.3 |
| 10 | Dungeon Client-Server Integration | DungeonSelectModal integration with backend instance lifecycle and portal transitions | M3 (DONE) | ORIGINAL_REQUEST R1.3 |
| 11 | Blacksmith Enhancement (+1..+15) | Progressive rates, drop level penalty >=+10, protection charm, gem socketing & fusion | M5 (Verified) | ORIGINAL_REQUEST R1.4 |
| 12 | Auction House (2% fee, 5% tax) | 2% listing fee, 5% sales tax, atomic transfer in db.transaction, slot & balance checks | M5 (Verified) | ORIGINAL_REQUEST R1.4 |
| 13 | Inventory Expansion & Anti-Negative | 500 gold per slot, max 30 slots, strict negative balance prevention (400 Bad Request) | M5 (Verified) | ORIGINAL_REQUEST R1.4 |
| 14 | Spatial AOI Synchronization (<=50m) | Position and appearance sync filtered by AOI radius <= 50m and serverId/zoneId | M5 (Verified) | ORIGINAL_REQUEST R1.5 |
| 15 | Party System & Bot Companions | Party creation up to 4 members, recruitment of Tank/Healer bots | M4 (DONE) | ORIGINAL_REQUEST R1.5 |
| 16 | Party +15% EXP Buff Integration | Client Party UI modal & HUD buff badge, backend expReward * 1.15 multiplier when in party | M4 (DONE) | ORIGINAL_REQUEST R1.5 |
| 17 | Autonomous Bug Fixing & DB OCC | 4xx/5xx prevention, Supabase SSL pooler compatibility, OCC revision conflict 409 handling | M5 (Verified) | ORIGINAL_REQUEST R2 |
| 18 | Strict Git & Deployment Rules | Branch DangNguyen/Update preserved, vercel.json intact, api/index.mjs build sync | M5 (Verified) | ORIGINAL_REQUEST R3 |
| 19 | Integrated Test Suites Automation | Full execution of Security, Database OCC, Combat, Multiplayer, Dungeon, Economy suites | M1 (DONE) | Acceptance Criteria |
| 20 | Comprehensive Verification Matrix | Feature Verification Matrix report with concrete verification evidence | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Security & Test Automation Runner | Consolidate security test suite, add root test runner script (`test:all`), update `test-e2e.mjs` endpoint | none | DONE (be7ab185) |
| M2 | PvP Arena Burst Dampening & ELO Ranking | Apply 40% burst reduction (0.6x) in `PvPCombatArena.tsx`, update ELO calculation with loss penalty in `endgame.ts` | none | DONE (15a0aa90) |
| M3 | Dungeon Instance Client-Server Lifecycle | Connect `DungeonSelectModal.tsx` with backend `/api/dungeon/*` instance lifecycle and portal triggers | none | DONE (1d5ce011) |
| M4 | Party System UI & +15% EXP Buff Linkage | Implement `PartyModal.tsx`, HUD buff badge, and backend `playerPartyMap` EXP multiplier (1.15x) | none | DONE (6520efdc) |
| M5 | Final Full-Stack Verification & Audit | 100% Typecheck, clean bundle builds, all test suites pass, Forensic Audit CLEAN, Verification Matrix export | M1, M2, M3, M4 | DONE |

## Interface Contracts
### PvP Arena ↔ Backend Endgame
- `POST /api/endgame/pvp/match`:
  - Request: `{ characterId: string, opponentId: string, victory: boolean, durationSeconds: number }`
  - Response: `{ success: true, honorAwarded: number, oldRating: number, newRating: number, rankTitle: string }`
  - Client Damage calculation in arena: `finalDamage = Math.max(1, Math.round(rawDamage * 0.60))`

### Dungeon UI ↔ Backend Dungeon Service
- `POST /api/dungeon/enter`:
  - Request: `{ characterId: string, difficulty: "normal" | "hard" | "nightmare" }`
  - Response: `{ instanceId: string, currentRoom: 1, monsters: Array<Monster>, startTime: number }`
- `POST /api/dungeon/:instanceId/clear-room`:
  - Request: `{ characterId: string, roomNumber: number }`
  - Response: `{ nextRoom: number | null, cleared: boolean, rewards?: { exp: number, gold: number, items: Array<any> } }`

### Party UI ↔ Backend Multiplayer Service
- `POST /api/party/create`: `{ characterId: string }` -> `{ partyId: string, members: Array<PartyMember>, expBonus: 0.15 }`
- `POST /api/party/invite-bot`: `{ partyId: string, botType: "tank" | "healer" }` -> `{ success: true, bot: PartyMember }`
- `POST /api/party/leave`: `{ characterId: string }` -> `{ success: true }`
- `Combat / Encounter EXP Settlement`: If `playerPartyMap.has(characterId)`, apply `expGained = Math.round(baseExp * 1.15)`.

## Code Layout
- `artifacts/api-server/src/`:
  - `routes/`: Express endpoints (`endgame.ts`, `dungeon.ts`, `multiplayer.ts`, `characters.ts`, `inventory.ts`, `blacksmith.ts`, `market.ts`)
  - `services/`: Business logic (`CharacterPersistenceService.ts`, `CharacterInventoryService.ts`, `encounterService.ts`, `CombatService.ts`)
  - `rules/`: Shared formulas (`combatRules.ts`)
  - `realtime/`: WebSocket gateway (`gateway.ts`)
- `artifacts/mmorpg-game/src/`:
  - `canvas/`: 2.5D/3D R3F components (`world/PvPCombatArena.tsx`, `entities/MonsterManager25D.tsx`, `sprites/SpriteBillboard25D.tsx`)
  - `ui/`: React UI components (`modals/PartyModal.tsx`, `modals/DungeonSelectModal.tsx`, `hud/UnifiedGameHUD.tsx`, `modals/UnifiedOverlayModals.tsx`)
  - `stores/`: Zustand stores (`useGameWorldStore.ts`, `useGameStore.ts`)
- `lib/db/`: Supabase PostgreSQL schema, migrations, connection pooler & in-memory disk fallback
- `api/`: Vercel Serverless Function adapter (`api/index.mjs`)
- `scripts/` & `scratch/`: Verification test suites and scripts
