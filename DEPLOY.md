# Deploy do Zux Portal na VPS

Passo a passo para colocar o portal no ar em uma VPS Ubuntu/Debian usando **Docker Compose + Nginx + Let's Encrypt**.

---

## Pré-requisitos

- Uma VPS Ubuntu 22.04+ ou Debian 12+ com acesso root via SSH
- Um domínio (ex: `portal.zux.com.br`) com **registro A** apontando para o IP da VPS
- O repositório já publicado no GitHub

---

## 1. Conectar na VPS

```bash
ssh root@<IP_DA_VPS>
```

## 2. Bootstrap inicial (uma vez)

Instala Docker, Docker Compose e configura firewall:

```bash
curl -fsSL https://raw.githubusercontent.com/<USER>/<REPO>/main/scripts/vps-bootstrap.sh | bash
```

> Alternativa sem `curl direto`: clone o repo primeiro e rode `bash scripts/vps-bootstrap.sh`.

## 3. Clonar o projeto

```bash
cd /srv
git clone https://github.com/<USER>/<REPO>.git zux-portal
cd zux-portal
```

> Se o repo for **privado**, configure uma deploy key ou use HTTPS com Personal Access Token.

## 4. Configurar variáveis de ambiente

```bash
cp .env.production.example .env
nano .env
```

Preencha:

```env
POSTGRES_USER=zux
POSTGRES_PASSWORD=<senha-forte-aqui>
POSTGRES_DB=zux_portal

AUTH_SECRET=<gere-com-openssl-rand-base64-32>
AUTH_URL=https://portal.zux.com.br

# Apenas no PRIMEIRO deploy para criar usuário admin
SEED_ON_BOOT=1
```

Gere o `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 5. Deploy (primeira vez)

```bash
bash scripts/deploy.sh portal.zux.com.br ops@zux.com.br
```

O script executa:

1. Cria pastas do Certbot
2. Sobe Nginx em modo "bootstrap" (HTTP only)
3. Emite o certificado SSL via Let's Encrypt (HTTP-01 challenge)
4. Substitui a config do Nginx pela versão final (HTTPS)
5. Sobe app + postgres + nginx + container de renovação automática

> **Teste primeiro com `--staging`** se quiser evitar limites de rate do Let's Encrypt:
> ```bash
> bash scripts/deploy.sh portal.zux.com.br ops@zux.com.br --staging
> ```
> Depois rode sem o flag para emitir o certificado real.

## 6. Verificar

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

Acesse `https://portal.zux.com.br` e faça login com `admin@zux.com.br` / `admin123`.

## 7. **IMPORTANTE — após o primeiro deploy:**

```bash
nano .env
# Troque SEED_ON_BOOT=1 para SEED_ON_BOOT=0
```

E **mude a senha do admin** logando no portal!

---

## Redeploy (após `git push`)

Conecte na VPS e rode:

```bash
cd /srv/zux-portal
bash scripts/deploy.sh
```

Sem argumentos = modo redeploy: faz `git pull`, rebuild da imagem do app e restart.

---

## Comandos úteis

| Ação | Comando |
|------|---------|
| Logs do app | `docker compose -f docker-compose.prod.yml logs -f app` |
| Logs do nginx | `docker compose -f docker-compose.prod.yml logs -f nginx` |
| Status | `docker compose -f docker-compose.prod.yml ps` |
| Restart app | `docker compose -f docker-compose.prod.yml restart app` |
| Backup do Postgres | `docker exec zux-postgres pg_dump -U zux zux_portal > backup-$(date +%F).sql` |
| Restaurar Postgres | `cat backup.sql \| docker exec -i zux-postgres psql -U zux zux_portal` |
| Shell no app | `docker compose -f docker-compose.prod.yml exec app sh` |
| Renovar SSL manualmente | `docker compose -f docker-compose.prod.yml run --rm certbot renew` |

---

## Troubleshooting

### Certbot falhou ("DNS problem" ou "Connection refused")

- Verifique se o A record do domínio aponta de fato para o IP da VPS:
  ```bash
  dig +short portal.zux.com.br
  ```
- Confira que a porta 80 está aberta:
  ```bash
  ufw status
  curl -I http://portal.zux.com.br/.well-known/acme-challenge/test
  ```

### App não conecta no banco

```bash
docker compose -f docker-compose.prod.yml logs postgres
docker compose -f docker-compose.prod.yml exec app sh
# Dentro do container:
echo $DATABASE_URL
```

### Reset total (cuidado!)

```bash
docker compose -f docker-compose.prod.yml down -v   # -v REMOVE os volumes (DB)
rm -rf certbot/ nginx/conf.d/zux.conf
```

---

## Backup automático recomendado

Crie um cron em `/etc/cron.daily/zux-backup`:

```bash
#!/bin/bash
DEST=/srv/backups
mkdir -p $DEST
docker exec zux-postgres pg_dump -U zux zux_portal | gzip > $DEST/zux-$(date +%F).sql.gz
find $DEST -name "zux-*.sql.gz" -mtime +30 -delete
```

```bash
chmod +x /etc/cron.daily/zux-backup
```
