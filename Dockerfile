# ==============================================================================
# Multi-stage Dockerfile for Standalone 2.5D MMORPG Game Server
# Combined Three.js 3D Action RPG + Full MMORPG Backend & Web Hub
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configs and dependencies manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

# Install dependencies
RUN pnpm install --frozen-lockfile=false

# Build all packages with strict typing check
RUN pnpm run build:all

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy node_modules and built bundles
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=builder /app/artifacts/mmorpg-game/dist ./artifacts/mmorpg-game/dist
COPY --from=builder /app/artifacts/mmorpg-game/package.json ./artifacts/mmorpg-game/package.json

EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/api/healthz || exit 1

# Launch standalone unified server (serves both API & Frontend)
CMD ["node", "./artifacts/api-server/dist/index.mjs"]
