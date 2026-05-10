# Hitster

A real-time multiplayer music timeline game. Players listen to song previews and race to place them in the correct chronological order on their timeline. Each round, the active player places a song; other players can steal a correct placement. First to fill their timeline wins.

## Tech Stack

| Layer | Technology |
|---|---|
| Client | React 19, Vite, Tailwind CSS 4, Zustand, dnd-kit |
| Server | Node.js, Express 5, Socket.IO 4 |
| Database | PostgreSQL (Kysely query builder) |
| Cache / Sessions | Redis (ioredis) |
| Shared Types | TypeScript monorepo package (`@hitster/shared`) |
| Package Manager | pnpm workspaces |

## Project Structure

```
hitster/
├── client/          # React SPA
├── server/          # Express + Socket.IO API
├── shared/          # Shared TypeScript types and enums
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for Postgres and Redis)

## Getting Started

**1. Start infrastructure**

```bash
docker compose up -d
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment**

Copy and fill in the env files:

```bash
# Server
cp server/.env.example server/.env   # set DATABASE_URL, REDIS_URL, CLIENT_URL

# Client
cp client/.env.example client/.env   # set VITE_R2_BASE_URL
```

**4. Run database migrations**

```bash
pnpm --filter @hitster/server migrate
```

**5. (Optional) Seed the database**

```bash
pnpm --filter @hitster/server seed
```

**6. Start development servers**

```bash
pnpm dev
```

This starts all three packages concurrently:
- Client: http://localhost:5173
- Server: http://localhost:3000

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all packages in dev/watch mode |
| `pnpm --filter @hitster/server migrate` | Run pending DB migrations |
| `pnpm --filter @hitster/server migrate:down` | Roll back last migration |
| `pnpm --filter @hitster/server seed` | Seed the database with songs |
| `pnpm --filter @hitster/server build` | Compile server to `dist/` |
| `pnpm --filter @hitster/client build` | Build client for production |

## Game Flow

1. A player creates a room and shares the room code.
2. Others join using the code and pick an avatar.
3. The host starts the game.
4. Each round: the active player listens to a song preview and drags it onto their timeline in the correct position.
5. After placement, other players have a short **steal window** to claim the card if the active player placed incorrectly.
6. The round ends with a **reveal** showing the correct year.
7. The first player to reach the target number of songs on their timeline wins.

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `CLIENT_URL` | Allowed CORS origin (default: `http://localhost:5173`) |
| `PORT` | Server port (default: `3000`) |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_R2_BASE_URL` | Cloudflare R2 base URL for audio previews |
