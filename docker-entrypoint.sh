#!/bin/sh
set -e
echo "LOTUS container baslatiliyor..."
npx tsx scripts/prod-setup.ts
exec "$@"
