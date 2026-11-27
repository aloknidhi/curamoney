#!/usr/bin/env bash
# CuraMoney backend build script for Render
# Run as: bash render-build.sh  (or ./render-build.sh)
set -e

echo "=== Installing dependencies ==="
npm install

echo "=== Building TypeScript ==="
npm run build

echo "=== Generating Prisma Client ==="
npx prisma generate

echo "=== Running database migrations ==="
npx prisma migrate deploy

echo "=== Seeding database ==="
npx tsx prisma/seed.ts

echo "=== Build complete ==="
