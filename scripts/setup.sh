#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "── Zux Portal · Setup ───────────────────────────────"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js não encontrado. Instale Node 20+ antes de continuar:"
  echo "    https://nodejs.org/  ou  brew install node"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "✗ Node $NODE_MAJOR detectado. Use Node 20 ou superior."
  exit 1
fi

if [ ! -f .env ]; then
  echo "→ Copiando .env.example para .env"
  cp .env.example .env
  echo "  (revise o DATABASE_URL e AUTH_SECRET em .env)"
fi

echo "→ Instalando dependências (npm install)…"
npm install

echo "→ Subindo PostgreSQL via Docker (opcional)…"
if command -v docker >/dev/null 2>&1; then
  docker compose up -d
else
  echo "  Docker não encontrado — certifique-se de que o PostgreSQL esteja rodando manualmente."
fi

echo "→ Gerando cliente Prisma…"
npx prisma generate

echo "→ Aplicando schema no banco (db push)…"
npx prisma db push

echo "→ Rodando seed…"
npm run db:seed

echo ""
echo "✓ Pronto! Inicie o app com:"
echo "    npm run dev"
echo ""
echo "Depois acesse http://localhost:3000"
