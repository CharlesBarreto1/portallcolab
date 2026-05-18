#!/usr/bin/env bash
# Bootstrap inicial da VPS — Ubuntu/Debian.
# Rode UMA ÚNICA VEZ como root:  bash vps-bootstrap.sh
set -e

echo "── Zux Portal · VPS bootstrap ──"

# Atualiza pacotes
apt update && apt upgrade -y

# Utilidades básicas
apt install -y curl git ufw ca-certificates gnupg lsb-release

# ── Docker ──
if ! command -v docker >/dev/null 2>&1; then
  echo "▸ Instalando Docker…"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo $ID)/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release; echo $ID) $(. /etc/os-release; echo $VERSION_CODENAME) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt update
  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Confirma versões
docker --version
docker compose version

# ── Firewall ──
echo "▸ Configurando UFW…"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# ── Diretório do app ──
mkdir -p /srv
cd /srv

echo ""
echo "✓ Bootstrap concluído. Próximos passos:"
echo ""
echo "  1) cd /srv && git clone <SEU_REPO> zux-portal"
echo "  2) cd zux-portal && cp .env.production.example .env"
echo "  3) Edite .env (POSTGRES_PASSWORD, AUTH_SECRET, AUTH_URL)"
echo "  4) bash scripts/deploy.sh <SEU_DOMINIO> <SEU_EMAIL>"
