#!/usr/bin/env bash
# CuraMoney backend build script for Render
set -euo pipefail

echo "=== Installing dependencies ==="
npm install

echo "=== Building TypeScript ==="
npx tsc

echo "=== Generating Prisma Client ==="
npx prisma generate

echo "=== Running database migrations ==="
npx prisma migrate deploy

echo "=== Seeding database ==="
npx tsx prisma/seed.ts

echo "=== Build complete ==="
