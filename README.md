# Zux Portal

Portal do Colaborador da **Zux** — single-tenant agora, preparado para evoluir para SaaS multi-tenant.

## Módulos

| Módulo                  | Status         | Descrição                                                                  |
|-------------------------|----------------|----------------------------------------------------------------------------|
| Autenticação            | ✅ Funcional    | Login, cadastro com aprovação manual pelo admin                            |
| Gestão de permissões    | ✅ Funcional    | Cargos customizáveis + permissões granulares + papéis de sistema           |
| Ponto eletrônico        | ✅ Funcional    | Batidas, cálculo CLT (HE 50% / 100%, intervalo art. 71), histórico, export |
| Admin (usuários/cargos) | ✅ Funcional    | Aprovação, edição, gestão de cargos e departamentos                        |
| Relatórios de ponto     | ✅ Funcional    | Exportação CSV (com BOM, abre direto no Excel) por mês ou colaborador      |
| Área de RH              | 🚧 Em construção | Schema pronto; UI placeholder                                              |
| Faculdade Corporativa   | 🚧 Em construção | Schema pronto; UI placeholder                                              |
| Novidades (blog)        | 🚧 Em construção | Schema pronto; UI placeholder                                              |
| Documentos              | 🚧 Em construção | Schema pronto; UI placeholder                                              |

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** v3
- **Prisma** + **PostgreSQL 16**
- **NextAuth v5** (Auth.js) — JWT + Credentials
- **bcryptjs** para hash de senha
- **zod** para validação
- **lucide-react** para ícones

## Pré-requisitos

- **Node.js 20+** — https://nodejs.org/ (ou `brew install node`)
- **Docker** (recomendado, para subir o PostgreSQL automaticamente) — https://www.docker.com/products/docker-desktop
  - Alternativa: instale o PostgreSQL localmente e ajuste o `DATABASE_URL` no `.env`.

## Setup rápido (recomendado)

```bash
cd ~/projects/zux-portal
./scripts/setup.sh
npm run dev
```

Acesse http://localhost:3000.

### Acessos de teste (criados pelo seed)

| Perfil      | E-mail                   | Senha     |
|-------------|--------------------------|-----------|
| Admin       | admin@zux.com.br         | admin123  |
| Colaborador | colaborador@zux.com.br   | colab123  |

> ⚠️ **Antes de produção:** altere essas senhas e gere um `AUTH_SECRET` forte no `.env`
> (`openssl rand -base64 32`).

## Setup manual (sem o script)

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# Edite .env conforme necessário

# 3. Banco de dados (via Docker)
docker compose up -d
# Ou: certifique-se de que o Postgres está rodando e o DATABASE_URL aponta para ele

# 4. Schema + Prisma Client
npx prisma generate
npx prisma db push

# 5. Seed (admin + cargos + departamentos)
npm run db:seed

# 6. Rodar
npm run dev
```

## Variáveis de ambiente

| Variável                       | Default                       | Descrição                                         |
|--------------------------------|-------------------------------|---------------------------------------------------|
| `DATABASE_URL`                 | `postgres://zux:zux@localhost:5432/zux_portal` | Conexão Postgres                                  |
| `AUTH_SECRET`                  | —                             | Secret do NextAuth (`openssl rand -base64 32`)    |
| `AUTH_URL`                     | `http://localhost:3000`       | URL base do app                                   |
| `PONTO_JORNADA_DIARIA_MIN`     | `480`                         | Jornada diária esperada em minutos (8h)           |
| `PONTO_TOLERANCIA_MIN`         | `10`                          | Tolerância de minutos para atraso/extra           |
| `PONTO_ADICIONAL_HE`           | `0.5`                         | Adicional padrão de HE (50%)                      |
| `PONTO_ADICIONAL_HE_DSR`       | `1.0`                         | Adicional de HE em DSR/feriado (100%)             |

## Estrutura do projeto

```
zux-portal/
├── prisma/
│   ├── schema.prisma           # Modelo de dados completo (todos os módulos)
│   └── seed.ts                 # Seed: permissões + cargos + admin + exemplo
├── src/
│   ├── middleware.ts           # Auth.js middleware (protege rotas)
│   ├── app/
│   │   ├── (auth)/             # Login e cadastro (sem sidebar)
│   │   │   ├── login/
│   │   │   └── cadastro/
│   │   ├── (app)/              # Área autenticada (com sidebar)
│   │   │   ├── dashboard/
│   │   │   ├── ponto/          # 🟢 Ponto eletrônico funcional
│   │   │   ├── perfil/
│   │   │   ├── rh/             # 🚧 placeholder
│   │   │   ├── faculdade/      # 🚧 placeholder
│   │   │   ├── novidades/      # 🚧 placeholder
│   │   │   ├── documentos/     # 🚧 placeholder
│   │   │   └── admin/          # 🟢 Admin funcional
│   │   │       ├── usuarios/
│   │   │       ├── cargos/
│   │   │       ├── departamentos/
│   │   │       ├── pontos/
│   │   │       └── relatorios/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       └── relatorios/ponto/   # Geração de CSV
│   ├── components/
│   │   ├── em-construcao.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       └── topbar.tsx
│   └── lib/
│       ├── auth.ts             # Auth.js config + types
│       ├── prisma.ts
│       ├── permissions.ts      # Catálogo de permissões + helpers
│       ├── ponto.ts            # Cálculo CLT (HE, intervalo, etc.)
│       └── utils.ts            # Helpers (CPF, formatação)
├── docker-compose.yml          # Postgres 16
├── scripts/setup.sh
└── package.json
```

## Como funciona o cálculo de ponto (CLT)

O motor está em `src/lib/ponto.ts`:

1. **Tipos de batida**: `ENTRADA`, `SAIDA_INTERVALO`, `RETORNO_INTERVALO`, `SAIDA`.
2. **Trabalho efetivo** = soma dos pares ENTRADA→SAIDA_INTERVALO + RETORNO_INTERVALO→SAIDA (ou ENTRADA→SAIDA quando não há intervalo).
3. **Intervalo automático**: se o colaborador trabalhou > 6h sem registrar intervalo, descontamos 60min (CLT art. 71).
4. **Horas extras** = trabalhado − jornada esperada do dia.
5. **Adicional**: 50% em dias úteis, **100%** em domingos e feriados (configurado em `Holiday`).
6. **Inconsistências**: batidas ímpares, saída antes de entrada, etc. — sinalizadas no relatório.

### Não implementado nesta versão (TODOs)

- Banco de horas com compensação
- Adicional noturno (22h–05h, hora reduzida 52'30")
- DSR proporcional
- Escala 12x36 / turnos variados
- Justificativas e atestados com fluxo de aprovação
- Geolocalização e selfie no momento da batida (campos no schema, falta UI)

## Fluxos principais

### Cadastro de novo colaborador

1. Colaborador acessa `/cadastro` e preenche nome, e-mail, CPF, telefone e senha.
2. Conta é criada com `status = PENDENTE`.
3. Admin vê o cadastro em `/admin/usuarios` (filtro "Pendentes").
4. Admin atribui cargo, departamento e papel de sistema, e clica em **Aprovar**.
5. Status muda para `ATIVO` e o colaborador consegue logar.

### Bater ponto

1. Colaborador acessa `/ponto`.
2. O sistema sugere a próxima batida (ENTRADA, INTERVALO, RETORNO, SAIDA) com base no histórico do dia.
3. Ao registrar, gravamos timestamp do servidor + IP + user-agent.
4. O resumo do mês é recalculado em tempo real conforme novas batidas chegam.

### Permissões

- Cada usuário tem um **papel de sistema** (`COLABORADOR`/`GESTOR`/`RH`/`ADMIN`) que dá um set base de permissões.
- Adicionalmente, recebe um **cargo customizado** (`JobRole`) com permissões granulares definidas pelo admin.
- As duas listas são **unidas** ao gerar o JWT da sessão.

## Comandos úteis

```bash
npm run dev               # Inicia em modo desenvolvimento
npm run build && npm start  # Build + produção
npm run db:studio         # Abre o Prisma Studio
npm run db:seed           # Re-roda o seed
npx prisma migrate dev    # Cria/aplica migração (para produção, use migrate em vez de db push)
```

## Roadmap (próximos passos)

1. **RH**: upload de holerite (PDF) por colaborador + área de avisos com confirmação de leitura (hash + timestamp).
2. **Documentos**: storage em S3 (ou MinIO local), pastas com permissões.
3. **Faculdade**: player de vídeo + quizzes + emissão de certificados.
4. **Novidades**: editor rich-text (Tiptap) + comentários.
5. **Multi-tenant**: adicionar `companyId` em todos os modelos e isolar por subdomínio.
6. **Mobile PWA**: registrar ponto fora do escritório (já temos campos lat/long no schema).
7. **Notificações por e-mail** (Resend / Postmark) ao aprovar cadastro, postar holerite, etc.

## Licença

Proprietário — Zux.
