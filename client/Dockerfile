FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ── build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY shared/ ./shared/
COPY client/ ./client/
COPY tsconfig.json ./
ARG VITE_R2_BASE_URL
ARG VITE_SERVER_URL
ENV VITE_R2_BASE_URL=$VITE_R2_BASE_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN pnpm --filter @backspin-maestro/shared build
RUN pnpm --filter @backspin-maestro/client build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
