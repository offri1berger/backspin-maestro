# Deployment Guide

How everything is wired together in production, and how to update / change it.

## Architecture

```
                  ┌─────────────────────────────┐
                  │  Cloudflare Pages           │
   Browser  ─────►│  https://backspin-maestro   │
                  │      .pages.dev             │
                  │  (static React build)       │
                  └──────────┬──────────────────┘
                             │ socket.io
                             ▼
                  ┌──────────────────────────────┐
                  │  Fly.io                      │
                  │  https://backspin-maestro-   │
                  │   snowy-starlight-1230       │
                  │      .fly.dev                │
                  │  (Express + Socket.IO)       │
                  └────┬──────────────┬──────────┘
                       │              │
                       ▼              ▼
            ┌──────────────────┐   ┌──────────────────┐
            │ Supabase         │   │ Upstash          │
            │ (Postgres)       │   │ (Redis)          │
            │  songs table     │   │  sessions,       │
            │                  │   │  game cache,     │
            │                  │   │  BullMQ jobs     │
            └──────────────────┘   └──────────────────┘
```

| Service       | What it hosts                                  | Dashboard                           |
| ------------- | ---------------------------------------------- | ----------------------------------- |
| Fly.io        | Server (`backspin-maestro-snowy-starlight-1230`) | https://fly.io/dashboard          |
| Cloudflare    | Client (Pages) + avatar images (R2)            | https://dash.cloudflare.com         |
| Supabase      | Postgres (songs catalog only)                  | https://supabase.com/dashboard      |
| Upstash       | Redis (sessions, game state, BullMQ)           | https://console.upstash.com         |

---

## Making code changes and deploying

The repo has three packages: `shared/`, `server/`, `client/`. They deploy independently.

### Server changes (anything in `server/` or `shared/`)

```sh
fly deploy
```

That's it. Fly rebuilds the Docker image, pushes it, and restarts the machine. Migrations in `server/src/db/migrations/` run automatically on boot via `server/entrypoint.sh`.

Takes 2–4 minutes. Watch progress with `fly logs` in another terminal.

After deploy, verify with:

```sh
curl https://backspin-maestro-snowy-starlight-1230.fly.dev/health
# Expected: {"ok":true}
```

### Client changes (anything in `client/` or `shared/`)

Two steps — build locally, then upload to Cloudflare:

```sh
pnpm --filter @backspin-maestro/shared build
pnpm --filter @backspin-maestro/client build
wrangler pages deploy client/dist --project-name backspin-maestro
```

Wrangler prints a deployment URL when done. After hard refresh (Cmd+Shift+R), changes are live at `https://backspin-maestro.pages.dev`.

> **Why two builds?** The client imports types and Zod schemas from `shared/`. If you skip the `shared` build, you'll deploy stale types.

### Both at once

```sh
fly deploy &
pnpm --filter @backspin-maestro/shared build && \
  pnpm --filter @backspin-maestro/client build && \
  wrangler pages deploy client/dist --project-name backspin-maestro
wait
```

---

## Adding or changing environment variables

There are three places env vars live. Pick based on what you're configuring.

### 1. Server (Fly secrets)

For anything the **server** reads via `process.env.X` — DB URLs, API keys, tokens.

Set or update:

```sh
fly secrets set FOO='bar' BAZ='qux'
```

Setting a secret **automatically restarts** the machine. No separate redeploy needed.

List current secrets (names only, values are hidden):

```sh
fly secrets list
```

Remove one:

```sh
fly secrets unset FOO
```

Currently set:
- `DATABASE_URL` — Supabase Session Pooler URL with `?sslmode=require&uselibpqcompat=true`
- `REDIS_URL` — Upstash rediss:// URL
- `CLIENT_URL` — `https://backspin-maestro.pages.dev` (used for CORS — must match the actual Pages origin)
- `METRICS_TOKEN` — random hex, gates `/metrics` endpoint

### 2. Client at build time (Vite env vars)

Anything the **client** needs at runtime gets baked into the JS bundle at **build time**. These must start with `VITE_` to be exposed to client code.

Edit `client/.env.production`:

```
VITE_SERVER_URL=https://backspin-maestro-snowy-starlight-1230.fly.dev
VITE_R2_BASE_URL=https://pub-e5bf4f42e81341b4b284554f1072643d.r2.dev
```

Then rebuild + redeploy the client (the two-step process above). The new values are baked into the new bundle.

> Local dev uses `client/.env` instead (different file, gitignored). Vite picks the right one based on whether you ran `vite dev` or `vite build`.

### 3. Local development (server/.env)

For running the server locally against Docker Postgres + Redis:

```
DATABASE_URL=postgresql://hitster:hitster@localhost:5432/hitster
REDIS_URL=redis://localhost:6379
PORT=8080
CLIENT_URL=http://localhost:5173
```

This file is gitignored. Production never reads it — Fly secrets take over there.

---

## Common operations

### View logs

| Where    | Command                                              |
| -------- | ---------------------------------------------------- |
| Fly      | `fly logs` (streaming)                               |
| Pages    | Cloudflare dashboard → Pages → backspin-maestro → Deployments → click a deployment |
| Supabase | Dashboard → Database → Logs                          |
| Upstash  | Dashboard → your DB → Logs                           |

### Restart the server

```sh
fly machine restart
```

Or just set any secret to trigger a restart:

```sh
fly secrets set FORCE_RESTART="$(date +%s)"
```

### Roll back to a previous version

Fly stores past releases. List them:

```sh
fly releases
```

Roll back to a specific version:

```sh
fly releases rollback <version-number>
```

For the client, Cloudflare Pages keeps every deployment. Dashboard → Pages → backspin-maestro → Deployments → click an old one → "Rollback to this deployment".

### SSH into the server

```sh
fly ssh console
```

You're inside the Fly machine. Useful for one-off debugging — `node`, `psql`, etc. are NOT installed by default.

### Seed more songs

Edit `server/src/db/seed.ts` and add entries to the `songs` array (`{ q: 'search query', year: YYYY }`). Then run against production:

```sh
DATABASE_URL='postgresql://postgres.lrfxquzwdditdurrgzey:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true' \
  pnpm --filter @backspin-maestro/server seed
```

Replace `PASSWORD` with the actual Supabase password. Skips duplicates automatically (checks `deezer_id`).

### Reset the production DB

Supabase dashboard → SQL Editor → run:

```sql
TRUNCATE TABLE songs CASCADE;
```

Or for schema changes, write a new migration in `server/src/db/migrations/` and `fly deploy` (it runs on boot).

---

## Adding a new feature

End-to-end: a new socket event from client to server.

1. **Define the Zod schema** in `shared/src/schemas.ts`.
2. **Add the typed event** to `ClientToServerEvents` or `ServerToClientEvents` in `shared/src/events.ts`.
3. **Implement the handler** in the right file under `server/src/socket/`.
4. **Listen on the client** in `client/src/hooks/useSocket.ts` (the only place client listeners live).
5. Build shared: `pnpm --filter @backspin-maestro/shared build`.
6. Deploy server: `fly deploy`.
7. Deploy client: `pnpm --filter @backspin-maestro/client build && wrangler pages deploy client/dist --project-name backspin-maestro`.

---

## Adding a new dependency

```sh
# Server only
pnpm --filter @backspin-maestro/server add some-package

# Client only
pnpm --filter @backspin-maestro/client add some-package

# Shared types/schemas only
pnpm --filter @backspin-maestro/shared add some-package
```

`pnpm-lock.yaml` is committed. After adding deps:
- Server changes → `fly deploy` (Docker rebuild picks up new deps).
- Client changes → rebuild + `wrangler pages deploy`.

---

## Domains and URLs

| Resource           | URL                                                          |
| ------------------ | ------------------------------------------------------------ |
| Client (public)    | https://backspin-maestro.pages.dev                           |
| Server (public)    | https://backspin-maestro-snowy-starlight-1230.fly.dev        |
| Server health      | https://backspin-maestro-snowy-starlight-1230.fly.dev/health |
| Avatars (R2)       | https://pub-e5bf4f42e81341b4b284554f1072643d.r2.dev          |
| Fly app name       | `backspin-maestro-snowy-starlight-1230`                      |
| Cloudflare project | `backspin-maestro`                                           |
| Supabase project   | `lrfxquzwdditdurrgzey`                                       |
| Upstash DB         | `quick-terrapin-121962`                                      |

### Adding a custom domain

**Client (Cloudflare Pages):** Dashboard → Pages → backspin-maestro → Custom domains → Set up a domain. Cloudflare handles SSL automatically.

After adding, update Fly's `CLIENT_URL` secret to match the new origin so CORS still passes:

```sh
fly secrets set CLIENT_URL='https://your-new-domain.com'
```

**Server (Fly):** `fly certs add api.yourdomain.com`. Point a CNAME at `backspin-maestro-snowy-starlight-1230.fly.dev` per Fly's instructions. Then update `client/.env.production`:

```
VITE_SERVER_URL=https://api.yourdomain.com
```

…and rebuild + redeploy the client.

---

## Troubleshooting

### "Could not resolve host"
Server isn't running. `fly status` should show STATE=`started`. If `stopped`, `fly machine start <id>`.

### "self-signed certificate in certificate chain" on boot
Your `DATABASE_URL` needs `&uselibpqcompat=true` appended. See current setting; if missing, update via `fly secrets set DATABASE_URL='...'`.

### Client says "SERVER ERROR. TRY AGAIN."
- CORS rejection — `CLIENT_URL` secret on Fly doesn't match the actual Pages origin. Update via `fly secrets set CLIENT_URL='https://...'`.
- Wrong `VITE_SERVER_URL` — open DevTools Network tab, see what host the `socket.io` requests go to. If it's `pages.dev`, the build doesn't have `VITE_SERVER_URL` baked in. Check `client/.env.production`, rebuild, redeploy.

### Local dev: "password authentication failed"
Make sure Docker postgres is running (`docker ps` shows `*-postgres-*`). Check `server/.env` matches the actual postgres user/db. If you ever set `DATABASE_URL` via `export` in your shell, that overrides `.env` — `unset DATABASE_URL` to clear it.

### Logs show no output / something seems stale
`fly logs` only shows what's currently emitted. For historical logs, use the Fly dashboard → Monitoring → Live logs view. Pages logs are per-deployment in the Cloudflare dashboard.

---

## Costs

| Service    | Plan                                  | Approx. cost              |
| ---------- | ------------------------------------- | ------------------------- |
| Fly.io     | shared-cpu-1x, 1GB RAM, 1 machine     | ~$5/mo always-on          |
| Cloudflare | Pages Free + R2 (sub-10GB)            | $0 + ~$0.015/GB R2 egress |
| Supabase   | Free tier                             | $0 (500MB DB cap)         |
| Upstash    | Pay-as-you-go Redis                   | ~$0 idle, scales w/ usage |

If you scale up Fly machines (`fly scale count N`), cost is linear. Socket.IO + the Redis adapter handle multi-instance correctly.
