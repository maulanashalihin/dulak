# Multi-stage: build assets in stage 1, minimal runtime in stage 2.
FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.3-alpine
# curl: docker-compose healthcheck. su-exec: drop privileges in entrypoint.
RUN apk add --no-cache curl su-exec
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/dulak-entrypoint.sh
RUN chmod +x /usr/local/bin/dulak-entrypoint.sh
# /app/data is the SQLite + uploads volume (bind-mounted in compose).
# Pre-create with bun ownership; the entrypoint re-fixes after the mount.
RUN mkdir -p /app/data && chown -R bun:bun /app
EXPOSE 4000
# Container starts as root so the entrypoint can fix bind-mount ownership,
# then drops to the non-root bun user (UID 1000) before exec'ing the app.
ENTRYPOINT ["/usr/local/bin/dulak-entrypoint.sh"]
CMD ["bun", "run", "src/index.ts"]
