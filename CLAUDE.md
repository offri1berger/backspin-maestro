# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Everything runs through pnpm workspaces from the repo root.

| Task | Command |
|---|---|
| Start all packages in dev/watch mode | `pnpm dev` |
| Run server only | `pnpm --filter @backspin-maestro/server dev` |
| Run client only | `pnpm --filter @backspin-maestro/client dev` |
| Type-check + build server | `pnpm --filter @backspin-maestro/server build` |
| Type-check + build client | `pnpm --filter @backspin-maestro/client build` |
| Lint client | `pnpm --filter @backspin-maestro/client exec eslint src` |
| Run server tests | `pnpm --filter @backspin-maestro/server test` |
| Watch server tests | `pnpm --filter @backspin-maestro/server test:watch` |
| Run a single test file | `pnpm --filter @backspin-maestro/server test -- src/services/__tests__/gameService.test.ts` |
| Run tests matching a name | `pnpm --filter @backspin-maestro/server test -- -t "validatePlacement"` |
| Apply DB migrations | `pnpm --filter @backspin-maestro/server migrate` |
| Roll back last migration | `pnpm --filter @backspin-maestro/server migrate:down` |
| Seed songs | `pnpm --filter @backspin-maestro/server seed` |
| Refresh song metadata | `pnpm --filter @backspin-maestro/server update-songs` |

Infrastructure (Postgres + Redis) is brought up with `docker compose up -d`. Both env files must exist before `pnpm dev` (`server/.env`, `client/.env`).

The client has no tests. Only the server has a Jest suite (ESM mode via `NODE_OPTIONS=--experimental-vm-modules`, config in `server/jest.config.js`). There is no top-level `lint` or `test` script — invoke per package.

## Code style

**Always use arrow functions, never `function` declarations.** This applies to top-level functions, exported helpers, React components, and callbacks. The codebase is consistent on this — match it.

**No `style={{ ... }}` on JSX elements — use Tailwind exclusively.** The project is Tailwind v4. Every static CSS value must be expressed as a `className`. The only permitted exception is a value that is genuinely computed at runtime and cannot be expressed as a static string — e.g. `style={{ width: \`${progress}%\` }}` or `style={{ animationDelay: \`${i * 70}ms\` }}`. If it's a static string, it is not an exception; convert it.

**Tailwind v4 utility reference for this project:**
- Theme colors defined in `index.css @theme` are available as direct utilities: `text-accent`, `text-hot`, `text-cyan`, `text-good`, `text-bad`, `text-cream`, `text-orange`, `text-accent-ink`, `bg-accent`, `bg-surface`, `border-hot`, etc. Use `text-[var(--color-muted)]` for `--color-muted` and `--color-muted-2` (hyphenated names conflict with Tailwind's scale).
- Theme fonts: `font-display`, `font-mono`, `font-code`, `font-marker`, `font-body` (defined in `@theme`).
- Arbitrary values for complex static styles: `bg-[#0a0a0a]`, `text-[11px]`, `tracking-[.05em]`, `[box-shadow:0_4px_12px_rgba(0,0,0,.4)]` (underscores replace spaces inside arbitrary values).
- Reusable CSS utility classes are defined in `client/src/index.css`: `.brushed`, `.brushed-dark`, `.brushed-darker`, `.panel-hardware`, `.screw`, `.led`, `.led-yellow/cyan/hot/red/green`, `.sticker`, `.sticker-sm`, `.plastic-btn`, `.plastic-btn-pink/green/dark`, `.knob-btn`, `.boombox-bg`, `.boombox-bg-soft`, `.polaroid`, `.polaroid-active`, `.boombox-title`, `.boombox-title-yellow`. Prefer these over re-specifying the same properties inline. Add new utility classes to `index.css` for patterns used in 3+ places.

## Architecture

### Workspace shape

Three packages, all TypeScript:

- `shared/` — `@backspin-maestro/shared`. Types, enums, Socket.IO event signatures, and **Zod schemas** for every client→server payload. Both client and server import from here. Built to `dist/` and consumed via `workspace:*`.
- `server/` — Express + Socket.IO. Imports from `@backspin-maestro/shared`. ESM (`"type": "module"` is implicit via tsx watch; emitted JS uses `.js` import specifiers — see `moduleNameMapper` in `jest.config.js`).
- `client/` — React 19 SPA. Vite + Tailwind v4 + Zustand + React Router 7 + dnd-kit.

### Data + state layers (server)

The server has **three distinct stores** with different lifetimes — getting this wrong causes the bugs that are hardest to track down:

1. **Postgres** (`server/src/db/`, Kysely) — durable. Songs catalog only. Migrations under `db/migrations/`, schema type in `db/types.ts`.
2. **Redis sessions** (`server/src/lib/session.ts`) — 24h TTL. Source of truth for *who* is in the game: rooms, players, the socket→player mapping, and per-player timelines (stored as Redis sorted sets keyed by `timeline:<playerId>`, scored by song year).
3. **Redis game cache** (`server/src/lib/gameCache.ts`) — 2h TTL. Source of truth for *what's happening right now*: `currentPlayerId`, `currentSongId`, `phase`, `phaseStartedAt`. Deleted on game reset.

If `gameState` returns null but the room still exists, the room is in lobby/finished status (or was reset).

### Socket→player mapping (the rejoin trap)

Each socket connection maps to exactly one `playerId` via Redis key `socket:<socketId>`. **`updatePlayerSocketId` deletes the old mapping before writing the new one** (`server/src/lib/session.ts`). This means: if two browser tabs share `localStorage.backspin_maestro_session` (same playerId), whichever tab rejoins *last* owns the mapping; the other tab's socket becomes orphaned and every action returns `player_not_found`. For local multi-player testing, use different browsers/profiles or incognito.

The client persists `{ roomCode, playerId }` in `localStorage.backspin_maestro_session` and the `connect` handler in `client/src/hooks/useSocket.ts` always emits `room:rejoin` on (re)connection. The rejoin callback guards against stale state by checking `store.roomCode !== saved.roomCode` before applying — needed because a stale rejoin response can otherwise clobber a freshly-created room (race between `room:create` and an in-flight `room:rejoin`).

### Turn timing: BullMQ, not setTimeout

Steal windows and card reveals are scheduled via **BullMQ delayed jobs**, not in-process `setTimeout`. See `server/src/lib/jobs.ts`:

- `scheduleStealFire(...)` after placement opens the steal window.
- A steal attempt cancels the fire and triggers immediate resolution.
- `scheduleCardReveal(...)` runs after the steal window resolves; it advances the turn.
- `tryClaimResolution(roomCode)` is a Redis `SET ... NX` lock that ensures exactly one path (timer expiry OR steal attempt) resolves a placement. Any worker that picks up a job after another already claimed resolution must bail.

This design exists so multiple server instances behind the **Socket.IO Redis adapter** (`@socket.io/redis-adapter`, configured in `server/src/index.ts`) can coordinate — only one instance fires each job, but events still fan out via pub/sub to all clients regardless of which instance they're connected to. The BullMQ worker uses a **separate** ioredis connection with `maxRetriesPerRequest: null` (required for blocking ops).

### Socket layer (server)

`server/src/index.ts` wires:
- `registerRoomHandlers(io, socket)` — create/join/rejoin/leave/reset, plus `game:start`.
- `registerGameHandlers(io, socket)` — `card:place`, `steal:attempt`, `steal:initiated`, `song:skip`, `song:guess`, `audio:play/pause`, `drag:move`.
- `handleDisconnect(io, socket)` — 30-second reconnect grace window before the player is finalised as left. If the active player disconnects mid-turn, `nextTurnService` advances the turn.

Every client→server payload is parsed with `parsePayload(SomeSchema, payload)` (Zod) — see `server/src/lib/validate.ts`. Per-socket rate limiting via `server/src/lib/rateLimit.ts`.

### Client state + routing

A single Zustand store (`client/src/store/gameStore.ts`) holds room + game state. There is **no React Context** — components subscribe directly via `useGameStore`.

Routing (`client/src/App.tsx`):
- `/` → `LobbyPage` (create/join form). Has an auto-navigate `useEffect` that pushes the user to `/lobby`, `/game`, or `/over` based on `roomCode` + `phase`.
- `/lobby` → `WaitingRoomPage`.
- `/game` → `GamePage`.
- `/over` → `GameOverPage`.

The `useSocket()` hook (mounted once in `App.tsx`) is the **only** place that registers server→client event handlers. All `navigate(...)` calls triggered by server events live there. When adding a new server event, wire it in `useSocket.ts`, not in a page component.

### Shared event contract

`shared/src/events.ts` declares `ClientToServerEvents` and `ServerToClientEvents`. Both client and server import these so Socket.IO types are end-to-end safe. `shared/src/schemas.ts` holds the Zod schemas; payload TypeScript types in `events.ts` are derived via `z.infer<...>`. Add a new event by: (1) defining the Zod schema in `schemas.ts`, (2) adding the typed signature to one of the event interfaces in `events.ts`, (3) registering the handler in the appropriate `server/src/socket/*Handlers.ts`, (4) wiring the client listener in `useSocket.ts`.

### Observability

**Logger** — `server/src/lib/logger.ts` exports a configured `pino` instance. Use it everywhere on the server (`logger.error({ err, roomCode }, 'message')`). JSON in prod, `pino-pretty` in dev. `LOG_LEVEL` env var overrides the default (`info` in prod, `debug` otherwise). Don't use `console.*` in runtime code — only the CLI scripts (`db/migrate.ts`, `db/seed.ts`) still do, intentionally.

**Metrics** — Prometheus exposition at `GET /metrics`, gated behind `Authorization: Bearer ${METRICS_TOKEN}`. Unset token → route returns 503 (fail-closed). Counters/histograms in `server/src/lib/metrics.ts`:

- `backspin_maestro_jobs_completed_total{job_name}`, `backspin_maestro_jobs_failed_total{job_name}`, `backspin_maestro_jobs_stalled_total`
- `backspin_maestro_job_duration_seconds{job_name}` (histogram, default buckets 10ms–10s)
- `backspin_maestro_deezer_fetch_total{result="ok|fail"}`
- Gauges refreshed on each scrape from live sources: `backspin_maestro_queue_{waiting,active,delayed,failed,paused}` (BullMQ), `backspin_maestro_sockets_connected` (socket.io), `backspin_maestro_rooms_active` (rooms with a connected socket on this instance — `[A-Z0-9]{6}` regex filters out socket-id pseudo-rooms), `backspin_maestro_disconnect_grace_timers` (in-flight reconnect timers).

When wiring a new background job or external call, increment the appropriate counter at the event site — gauges are computed-on-read, counters/histograms are recorded by the code path.

### Deployment

The project is deployed in production. See `DEPLOYMENT.md` at the repo root for the full runbook (URLs, secrets, deploy commands, rollback, custom domains). High-level layout: server on Fly (`backspin-maestro-snowy-starlight-1230.fly.dev`), client on Cloudflare Pages (`backspin-maestro.pages.dev`), Postgres on Supabase, Redis on Upstash, avatar images on Cloudflare R2.

Three deploy-related files that look unrelated but aren't:

- **`server/src/index.ts` starts with `import 'dotenv/config'` (side-effect import), not `import dotenv` + `dotenv.config()`.** This is load-bearing: in ESM, all imports are hoisted, so `database.ts` and other modules that read `process.env` at import time would run *before* a deferred `dotenv.config()` call. The Pool would then be initialized with the hardcoded fallback DSN. Don't "clean this up" by switching back to the deferred form.
- **`client/.env.production`** holds the production `VITE_SERVER_URL` and `VITE_R2_BASE_URL`. Vite reads it only during `vite build`, leaving `vite dev` to use `client/.env`. Build-time env vars get baked into the bundle — changing them requires a rebuild + `wrangler pages deploy`, not just a Fly restart.
- **`client/public/_redirects`** (`/*  /index.html  200`) is the SPA fallback for Cloudflare Pages. Without it, React Router routes 404 on hard reload.

Production env vars live as Fly secrets (`fly secrets set ...`), not in any committed file. `server/.env` is local-only.

### Tests

Jest with ts-jest in ESM mode. Tests live in `__tests__/` directories next to source. Redis is mocked via `ioredis-mock`. Integration tests (e.g. `roomHandlers.integration.test.ts`) spin up a real socket.io server against the mocked Redis.

When writing tests that touch Redis, import from the same modules the production code uses — `ioredis-mock` is injected globally via Jest module mapping, so `server/src/lib/redis.ts` returns the mock automatically in tests.
