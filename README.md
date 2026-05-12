# Hitster

A real-time multiplayer music-timeline game. Players hear a 30-second song preview and race to drop the card onto their personal timeline in the correct chronological slot. Place wrong and anyone with a token can attempt a steal. First player to fill their timeline wins the round.

Built as a learning ground for production-grade real-time architecture: typed end-to-end, multi-instance-ready, observable, and restart-durable.

---

## Highlights

- **Real-time multiplayer over Socket.IO** with horizontal scaling via the Redis adapter
- **Restart-durable game state** — steal/reveal timers live in BullMQ on Redis, not in-process `setTimeout`. Kill the server mid-turn and the next instance to come up resumes the game.
- **Typed contracts end-to-end** — every client→server payload is a Zod schema in `@hitster/shared`, inferred to TypeScript and validated at the socket edge.
- **Drag-and-drop placement** with `dnd-kit` and timeline reveal animations.
- **Conductor role** (host) controls — start game, reset, kick players from the lobby.
- **Production observability** — structured JSON logging (`pino`), Prometheus metrics behind a bearer token, distinct `/health` probe.
- **Atomic round transitions** — the steal-window resolution lock is a single Redis `SET NX EX`, so exactly one path (timer expiry, steal attempt, or extended steal) resolves each placement.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Client** | React 19, Vite 6, Tailwind CSS 4, Zustand, React Router 7, dnd-kit |
| **Server** | Node 22, Express 5, Socket.IO 4 |
| **Shared** | TypeScript + Zod — single source of truth for event payloads |
| **Database** | PostgreSQL 16 via Kysely (songs catalog only) |
| **Realtime state** | Redis 7 — rooms, players, timelines, game cache |
| **Job queue** | BullMQ — delayed steal-window and card-reveal jobs |
| **Logging** | pino (JSON) |
| **Metrics** | Prometheus exposition behind Bearer auth |
| **Auth** | localStorage-backed session id (signed/auth model TBD) |
| **Tests** | Jest (ESM, server) + `ioredis-mock` for Redis isolation |
| **Package manager** | pnpm workspaces |
| **CI** | GitHub Actions — type-check, lint, test, audit, Docker build |

---

## Quick Start

```bash
# 1. Install deps
pnpm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Configure env (defaults point at the docker compose services)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Run migrations + seed the songs catalog
pnpm --filter @hitster/server migrate
pnpm --filter @hitster/server seed

# 5. Run everything in watch mode
pnpm dev
```

Open `http://localhost:5173`, create a room, share the code with a friend (or a second browser profile — see [Troubleshooting](#troubleshooting)).

**Requirements:** Node 22+, pnpm 10+, Docker.

---

## Architecture

```
┌──────────────┐      WSS      ┌──────────────────┐
│  React SPA   │ ◀───────────▶ │  Express + SIO   │ ── reads/writes ─▶ ┌──────────────┐
│  (Vite)      │   socket.io   │  (any instance)  │                    │   Postgres   │
│              │               │                  │                    │  (songs cat.)│
└──────────────┘               │                  │                    └──────────────┘
       │                       │                  │
       │                       │                  │ ── room/player ───▶ ┌──────────────┐
       └─── audio previews ─▶  │                  │    state + cache    │    Redis     │
           (Cloudflare R2)     │                  │ ◀── BullMQ jobs ──▶ │              │
                               │                  │ ◀── adapter pubsub ▶│              │
                               └──────────────────┘                     └──────────────┘
```

### Three data stores with different lifetimes

Getting this distinction wrong is the source of the gnarliest bugs. From `CLAUDE.md`:

1. **Postgres** — durable. Songs catalog only. Schema in `server/src/db/types.ts`, migrations under `server/src/db/migrations/`.
2. **Redis sessions** (`server/src/lib/session.ts`) — 24h TTL. Source of truth for *who* is in the game: rooms, players, the socket→player mapping, and per-player timelines (Redis sorted sets keyed by `timeline:<playerId>`, scored by song year).
3. **Redis game cache** (`server/src/lib/gameCache.ts`) — 2h TTL. Source of truth for *what's happening right now*: `currentPlayerId`, `currentSongId`, `phase`, `phaseStartedAt`. Deleted on game reset.

If `getGameState` returns null but the room exists, the room is in lobby/finished status or was reset.

### Turn timing lives in BullMQ, not setTimeout

The steal window (5s, or 10s if extended) and the card reveal (3s) are scheduled as **delayed jobs** on a BullMQ queue named `room-jobs` (`server/src/lib/jobs.ts`). The worker processes two job types:

- `steal:fire` — emits `placement:result`, checks the win condition, schedules the reveal.
- `card-reveal` — runs the deferred win check (steal path) and advances the turn.

This design is what makes the server restart-safe and horizontally scalable:

- Multiple server instances can run behind the Socket.IO Redis adapter. Each spawns a Worker against the same queue; BullMQ guarantees exactly one Worker processes each job.
- A `tryClaimResolution(roomCode)` Redis `SET NX EX` lock ensures that even if multiple paths race (timer expiry **and** a steal attempt, on the same or different instances), exactly one resolves the placement; the other bails.
- Kill the server during the 5s steal window — when any instance comes back up, the job is still in Redis. The Worker picks it up and the round continues.

### Adding a new socket event

1. Define the Zod schema in `shared/src/schemas.ts`.
2. Add the typed signature to `ClientToServerEvents` / `ServerToClientEvents` in `shared/src/events.ts` (derive the type with `z.infer`).
3. Register the handler in `server/src/socket/roomHandlers.ts` or `gameHandlers.ts`. Validate the payload at the boundary with `parsePayload(SomeSchema, payload)`.
4. Wire the client listener in `client/src/hooks/useSocket.ts` — the **only** place that registers server→client handlers. All `navigate(...)` calls triggered by server events live there.

---

## Project Structure

```
hitster/
├── client/                  React SPA (Vite)
│   └── src/
│       ├── pages/           LobbyPage, WaitingRoomPage, GamePage, GameOverPage
│       ├── components/      game/, lobby/, ui/
│       ├── hooks/useSocket  Single source of socket event handlers
│       └── store/           Zustand store (no React Context)
│
├── server/                  Express + Socket.IO
│   └── src/
│       ├── index.ts         Boot, Redis adapter, BullMQ worker start, shutdown
│       ├── socket/          roomHandlers, gameHandlers, disconnectHandler
│       ├── services/        gameService, placementService, guessService, roomService, songService
│       ├── lib/
│       │   ├── jobs.ts        BullMQ queue + worker + scheduleStealFire / scheduleCardReveal
│       │   ├── roomTimeouts.ts Redis-backed pending payload + resolution lock
│       │   ├── session.ts     Rooms, players, timelines (Redis)
│       │   ├── gameCache.ts   Current-round state (Redis)
│       │   ├── authz.ts       requireConductor() — host-only gate
│       │   ├── validate.ts    parsePayload(schema, payload)
│       │   ├── logger.ts      pino instance
│       │   ├── metrics.ts     Prometheus collectors
│       │   ├── safeJson.ts    JSON.parse with logged fallback
│       │   ├── rateLimit.ts   Per-socket bucket limiters
│       │   └── redis.ts       Main client + pub/sub clients for the adapter
│       └── db/
│           ├── migrations/    Kysely migrations
│           ├── seed.ts        Songs catalog seed
│           └── update-songs.ts Refresh Deezer metadata
│
├── shared/                  @hitster/shared — types, enums, Zod schemas, event signatures
│   └── src/
│       ├── schemas.ts       Zod schemas (one per client→server payload)
│       ├── events.ts        ClientToServerEvents / ServerToClientEvents + inferred types
│       ├── types.ts         Song, Player, GameState, …
│       └── enums.ts         GamePhase, Decade, RoomStatus
│
├── docker-compose.yml       Local Postgres + Redis
├── pnpm-workspace.yaml
└── .github/workflows/ci.yml
```

---

## Scripts

Everything runs through pnpm workspaces from the repo root.

| Task | Command |
|---|---|
| Start all packages in dev/watch mode | `pnpm dev` |
| Run server only | `pnpm --filter @hitster/server dev` |
| Run client only | `pnpm --filter @hitster/client dev` |
| Type-check + build server | `pnpm --filter @hitster/server build` |
| Type-check + build client | `pnpm --filter @hitster/client build` |
| Lint client | `pnpm --filter @hitster/client exec eslint src` |
| Run server tests | `pnpm --filter @hitster/server test` |
| Watch server tests | `pnpm --filter @hitster/server test:watch` |
| Run a single test file | `pnpm --filter @hitster/server test -- src/services/__tests__/gameService.test.ts` |
| Run tests matching a name | `pnpm --filter @hitster/server test -- -t "validatePlacement"` |
| Apply DB migrations | `pnpm --filter @hitster/server migrate` |
| Roll back last migration | `pnpm --filter @hitster/server migrate:down` |
| Seed songs | `pnpm --filter @hitster/server seed` |
| Refresh song metadata from Deezer | `pnpm --filter @hitster/server update-songs` |

The client has no tests yet. Only the server has a Jest suite (ESM mode via `NODE_OPTIONS=--experimental-vm-modules`).

---

## Configuration

### Server (`server/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://hitster:hitster@localhost:5432/hitster` | Postgres connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis (sessions + game cache + BullMQ + adapter) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `PORT` | `3001` | HTTP port |
| `METRICS_TOKEN` | *(unset = disabled)* | Bearer token required to scrape `/metrics`. Fail-closed: if unset, `/metrics` returns 503. |
| `LOG_LEVEL` | `info` | pino level: `trace` / `debug` / `info` / `warn` / `error` |

### Client (`client/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_R2_BASE_URL` | *(required)* | Cloudflare R2 origin serving the cached audio previews |
| `VITE_SERVER_URL` | *(empty = Vite proxy in dev)* | Server origin in production, e.g. `https://api.example.com` |

---

## Game Flow

1. A player creates a room with `songsPerPlayer` and an optional decade filter, then shares the 6-char room code.
2. Others join with the code, pick a name, and an avatar.
3. The **Conductor** (host) starts the game once at least two players are present.
4. **Song phase** — the active player hears the preview.
5. **Placement** — they drag the card onto their timeline.
6. **Steal window (5s)** — any other player can spend a token to attempt a steal. If anyone clicks "steal", the window extends to 10s. Stealing only succeeds if the active player placed *incorrectly* and the stealer's claimed slot is correct.
7. **Reveal (3s)** — the card flips, showing artist + title + year.
8. Turn advances. First player to reach `songsPerPlayer` correct placements wins (`game:over`).

---

## Observability

### `/health`
Liveness + dependency check. Returns `{ ok: true }` when the server can reach Postgres and Redis.

### `/metrics`
Prometheus exposition. **Fail-closed**: returns `503` if `METRICS_TOKEN` is unset, `401` without the matching Bearer token. Typical metrics:

- `bullmq_jobs_total{name, status}` (counter) — job completion outcomes
- `bullmq_job_duration_seconds{name}` (histogram) — processing time
- `bullmq_queue_depth{state}` (gauge) — `delayed` / `active` / `waiting` / `failed`
- `socket_connections` (gauge) — live sockets on this instance
- `active_rooms` (gauge) — derived from `io.sockets.adapter.rooms`, filtered to real rooms (sum across instances in Grafana)

**Label hygiene:** never label by `roomCode` or `playerId` — they're unbounded. Stick to `name`, `status`, `state`.

### Logging
JSON to stdout via pino. Ship to Loki / Better Stack / Datadog / CloudWatch — whatever your host provides. The `LOG_LEVEL` env var controls verbosity.

---

## Testing

```bash
pnpm --filter @hitster/server test
```

Tests live in `__tests__/` directories adjacent to source (`server/src/services/__tests__/`, `server/src/socket/__tests__/`, `server/src/lib/__tests__/`). Redis is mocked via `ioredis-mock`, injected globally through Jest module mapping — so `server/src/lib/redis.ts` returns the mock automatically. Integration tests (`roomHandlers.integration.test.ts`) spin up a real Socket.IO server against the mocked Redis.

When writing tests that touch Redis, import from the same modules production uses; the mock substitution is transparent.

---

## Production / Hosting

The single-host happy path: **Caddy in front of a containerized server + managed Redis + managed Postgres + Cloudflare R2 for audio.** What matters:

1. **TLS + WebSocket-aware proxy.** Caddy auto-provisions Let's Encrypt and forwards WS upgrades with zero config. nginx works but needs explicit `proxy_set_header Upgrade $http_upgrade` + `Connection "upgrade"` + a high `proxy_read_timeout`.
2. **Managed Redis with persistence enabled.** BullMQ jobs and session state must survive restarts; pick a tier that supports AOF or RDB+AOF (Upstash, Redis Cloud, ElastiCache with the right config). The dev `docker-compose.yml` uses `redis-server --appendonly yes` as the template.
3. **Sticky sessions on the LB** if you run >1 instance — Socket.IO's polling-to-WebSocket upgrade requires multiple HTTP requests landing on the same backend.
4. **Run migrations as a pre-deploy step**, not in app boot. `pnpm --filter @hitster/server migrate` is idempotent.
5. **Health probes.** Hook `/health` into liveness *and* readiness for now; split into `/livez` and `/readyz` once you're large enough that DB blips would cascade.
6. **Secrets from your platform**, not committed `.env` files. `METRICS_TOKEN`, `DATABASE_URL`, `REDIS_URL` all need to come from your secret store (Fly secrets, K8s secrets, Doppler, Vault).
7. **Edge rate limiting and DDoS** via Cloudflare. The in-process per-socket limiter doesn't survive horizontal scale.

A minimal Caddyfile:

```
yourdomain.com {
  encode gzip
  reverse_proxy localhost:3001
}
```

Out of the box, **Fly.io** and **Railway** handle TLS, WS upgrade, and sticky sessions for you — usually the lowest-friction path to a hosted Socket.IO game.

---

## Troubleshooting

### "player_not_found" after a rejoin on the same machine

The socket→player mapping is one-to-one: `socket:<socketId>` in Redis points to exactly one `playerId`. `updatePlayerSocketId` **deletes the old mapping before writing the new one**. So if two browser tabs share `localStorage.hitster_session` (same playerId), whichever tab rejoins *last* owns the mapping; the other tab becomes orphaned and every action returns `player_not_found`.

**Fix:** for local multi-player testing, use different browsers, profiles, or incognito windows.

### Migrations fail with "relation does not exist"

You started the server before running `pnpm --filter @hitster/server migrate`. Run migrations, then restart `pnpm dev`.

### `bull:room-jobs:*` keys are not being created

BullMQ requires its connection to set `maxRetriesPerRequest: null`. `server/src/lib/jobs.ts` does this via a dedicated ioredis connection — if you've forked that file, make sure the override is preserved.

### Mixed-content errors in the browser console

The page must be served over HTTPS (or all-HTTP in dev). If you serve HTML over HTTPS, Socket.IO must connect via WSS, and any audio URLs must also be HTTPS. Either go fully HTTPS via a reverse proxy or fully HTTP in dev — never mix.

### Server tests don't pick up Redis changes

`ioredis-mock` is injected globally. If you've imported `ioredis` directly in a test instead of through `server/src/lib/redis.ts`, the mock won't apply.

---

## Contributing

### Conventions

- **Arrow functions only.** Never `function` declarations — applies to top-level functions, exported helpers, React components, and callbacks. The codebase is consistent on this.
- **Validate every client→server payload at the socket boundary** via `parsePayload(SomeSchema, payload)`. No ad-hoc `typeof` checks.
- **Use `safeJsonParse`** for any `JSON.parse` on Redis-sourced data — corrupt blobs should be logged and dropped, never crash the worker.
- **Don't reach for in-process locks or `setTimeout`** for game state. Use BullMQ jobs and the `tryClaimResolution` atomic claim.

### Commits

Conventional Commits style (`feat:`, `fix:`, `feat(tests):`, `chore:`). See git log for examples.

### Workflow

1. Branch from `main`.
2. Add Zod schema, types, handler, listener — in that order.
3. Add or update tests (`server/src/.../__tests__/`).
4. `pnpm --filter @hitster/server test && pnpm --filter @hitster/client build`.
5. Open a PR. CI runs type-check + lint + audit + Docker build (test step coming).

See [`CLAUDE.md`](./CLAUDE.md) for AI-assistant-oriented notes on the codebase.

---

## License

TBD — add a `LICENSE` file before any public distribution.
