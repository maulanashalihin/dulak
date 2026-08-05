# Multi-stage: build assets in stage 1, minimal runtime in stage 2.
FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.3-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
EXPOSE 4000
# bun runs TS directly; dist/assets are prebuilt in the build stage.
CMD ["bun", "run", "src/index.ts"]
