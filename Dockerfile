# ==============================================================================
# Multi-stage Dockerfile for Chiến Long Bá Monorepo
# Targets available:
#   1) builder      : common compilation stage
#   2) api-server   : backend API & WebSocket Gateway (port 3001)
#   3) client       : Nginx Alpine web server (port 80)
#   4) standalone   : unified Node.js server (port 8080 - default)
# ==============================================================================

# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Workspace Dependencies & Universal Builder
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable modern pnpm package manager via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo workspace configurations and dependencies manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile=false

# Build all packages with strict typing check
RUN pnpm run build:all

# ──────────────────────────────────────────────────────────────────────────────
# Target: api-server (Port 3001)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS api-server

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install postgresql-client for pg_isready verification and enable pnpm
RUN apk add --no-cache postgresql-client && corepack enable && corepack prepare pnpm@latest --activate

# Copy production dependencies, build outputs and database migration assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts/package.json ./scripts/package.json
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY assets ./assets
COPY game ./game
COPY artifacts/api-server/entrypoint.sh ./entrypoint.sh

# Ensure Linux LF line endings and executable permission
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 3001

# Healthcheck targeting the lightweight /api/healthz endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/healthz || exit 1

CMD ["sh", "./entrypoint.sh"]

# ──────────────────────────────────────────────────────────────────────────────
# Target: client (Port 80 via Nginx)
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS client

# Remove default boilerplate HTML
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static frontend bundles from builder
COPY --from=builder /app/artifacts/mmorpg-game/dist/public /usr/share/nginx/html

# Copy custom Nginx configuration (reverse-proxy /api/ to api-server)
COPY artifacts/mmorpg-game/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check to ensure web server is responding
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ──────────────────────────────────────────────────────────────────────────────
# Target: standalone (Unified Node.js single-container runner on port 8080)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS standalone

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN apk add --no-cache postgresql-client && corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies, both API and Frontend dist bundles
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts/package.json ./scripts/package.json
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=builder /app/artifacts/mmorpg-game/dist ./artifacts/mmorpg-game/dist
COPY --from=builder /app/artifacts/mmorpg-game/package.json ./artifacts/mmorpg-game/package.json
COPY assets ./assets
COPY game ./game
COPY artifacts/api-server/entrypoint.sh ./entrypoint.sh

RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/api/healthz || exit 1

# Launch standalone unified server (serves both API & Frontend)
CMD ["sh", "./entrypoint.sh"]
