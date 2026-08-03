#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Seeding database..."
  TS_NODE_TRANSPILE_ONLY=true npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
fi

echo "Starting API..."
exec "$@"
