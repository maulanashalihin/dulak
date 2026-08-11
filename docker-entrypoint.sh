#!/bin/sh
set -e

# Fix ownership of the data directory. The ./data bind mount is created
# by Docker as root on first deploy; chown it so the non-root bun user
# (UID 1000, built into oven/bun) can write SQLite + uploads.
# Idempotent — safe on every restart.
if [ -d /app/data ]; then
	chown -R bun:bun /app/data 2>/dev/null || true
fi

# Drop to the non-root bun user and exec the app (CMD).
exec su-exec bun "$@"
