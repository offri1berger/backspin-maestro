FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ── build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY shared/ ./shared/
COPY server/ ./server/
COPY tsconfig.json ./
RUN pnpm --filter @hitster/shared build
RUN pnpm --filter @hitster/server build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/dist ./server/dist

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
