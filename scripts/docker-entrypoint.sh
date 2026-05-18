#!/bin/sh
set -e

echo "▸ Aplicando schema no banco (prisma db push)…"
npx prisma db push --skip-generate --accept-data-loss=false || {
  echo "Falha ao aplicar schema. Verifique DATABASE_URL e conectividade."
  exit 1
}

# Roda o seed apenas se a flag SEED_ON_BOOT=1 estiver setada
if [ "${SEED_ON_BOOT:-0}" = "1" ]; then
  echo "▸ Rodando seed…"
  node prisma/seed.js 2>/dev/null || npx tsx prisma/seed.ts || echo "(seed pulado — provavelmente já rodou)"
fi

echo "▸ Iniciando Next.js na porta ${PORT:-3000}…"
exec node server.js
