#!/usr/bin/env bash
# Deploy script — rode dentro do diretório do projeto na VPS.
# Uso:  bash scripts/deploy.sh <DOMINIO> <EMAIL_LETSENCRYPT> [--staging]
#
# Exemplo:  bash scripts/deploy.sh portal.zux.com.br ops@zux.com.br
#
# Primeira execução:
#   1) Sobe Nginx com config de bootstrap
#   2) Pede certificado SSL via Certbot (HTTP-01 challenge)
#   3) Substitui config para a versão definitiva (HTTPS)
#   4) Sobe app + postgres + nginx
#
# Execuções seguintes (sem args):  apenas pull + rebuild + restart
set -e

DOMAIN="${1:-}"
EMAIL="${2:-}"
STAGING_FLAG=""
if [ "${3:-}" = "--staging" ]; then
  STAGING_FLAG="--staging"
fi

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# Modo "redeploy" (sem args) — apenas atualiza
if [ -z "$DOMAIN" ] && [ -f nginx/conf.d/zux.conf ]; then
  echo "▸ Redeploy: pulling, rebuilding, restarting…"
  git pull origin main || git pull
  docker compose -f docker-compose.prod.yml up -d --build app
  echo "✓ Redeploy concluído."
  exit 0
fi

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Uso: bash scripts/deploy.sh <DOMINIO> <EMAIL_LETSENCRYPT> [--staging]"
  exit 1
fi

if [ ! -f .env ]; then
  echo "✗ Arquivo .env não encontrado. Copie .env.production.example -> .env e preencha."
  exit 1
fi

# Validação simples do AUTH_URL
if ! grep -q "AUTH_URL=https://${DOMAIN}" .env; then
  echo "⚠ AUTH_URL no .env não corresponde a https://${DOMAIN}"
  echo "  Atualize antes de continuar (ou eu ajusto automaticamente)? [s/N]"
  read -r resp
  if [ "$resp" = "s" ] || [ "$resp" = "S" ]; then
    sed -i.bak "s|^AUTH_URL=.*|AUTH_URL=https://${DOMAIN}|" .env
    echo "  → .env atualizado."
  else
    exit 1
  fi
fi

echo "── Etapa 1: preparando diretórios do Certbot ──"
mkdir -p certbot/conf certbot/www nginx/conf.d

echo "── Etapa 2: config Nginx de bootstrap (HTTP only) ──"
sed "s|__DOMAIN__|${DOMAIN}|g" nginx/conf.d/bootstrap.conf.template > nginx/conf.d/zux.conf

# Sobe apenas nginx + dependências mínimas
echo "── Etapa 3: subindo Postgres + App + Nginx (sem SSL ainda) ──"
docker compose -f docker-compose.prod.yml up -d postgres app nginx

# Aguarda o Nginx responder na :80
echo "▸ Aguardando Nginx em http://${DOMAIN}/.well-known/…"
for i in $(seq 1 30); do
  if curl -sf "http://${DOMAIN}/.well-known/acme-challenge/test" -o /dev/null -w '%{http_code}' | grep -q "200\|404"; then
    break
  fi
  sleep 2
done

echo "── Etapa 4: emitindo certificado Let's Encrypt ──"
docker run --rm \
  -v "${ROOT}/certbot/conf:/etc/letsencrypt" \
  -v "${ROOT}/certbot/www:/var/www/certbot" \
  certbot/certbot:latest certonly \
    --webroot -w /var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos --no-eff-email \
    ${STAGING_FLAG} \
    -d "${DOMAIN}"

echo "── Etapa 5: ativando config Nginx com SSL ──"
sed "s|__DOMAIN__|${DOMAIN}|g" nginx/conf.d/zux.conf.template > nginx/conf.d/zux.conf

# Recarrega o Nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "── Etapa 6: subindo container de renovação automática (certbot) ──"
docker compose -f docker-compose.prod.yml up -d certbot

echo ""
echo "✓ Deploy concluído!"
echo "  → https://${DOMAIN}"
echo ""
echo "Comandos úteis:"
echo "  docker compose -f docker-compose.prod.yml logs -f app     # logs do app"
echo "  docker compose -f docker-compose.prod.yml logs -f nginx   # logs do nginx"
echo "  docker compose -f docker-compose.prod.yml ps              # status"
echo "  bash scripts/deploy.sh                                    # redeploy (após git push)"
