# CondoSync

Plataforma web de gestão condominial (SaaS multi-condomínio): reservas de áreas comuns, controle de
visitantes (portaria), mural de avisos, chamados/ocorrências e enquetes/votações.
Perfis de acesso: **Morador**, **Portaria**, **Síndico** e **Administrador**.

Este repositório contém a **base do projeto**: ambiente Docker, banco com o esquema completo,
cadastro/login com sessão segura, controle de acesso por perfil e a estrutura em camadas pronta para os
módulos de negócio.

## Stack

| Camada         | Tecnologia                                                    |
| -------------- | ------------------------------------------------------------- |
| Linguagem      | JavaScript (sem TypeScript)                                   |
| Frontend       | React 19                                                      |
| Backend        | Next.js 15 (App Router, API RESTful em `app/api/**`)          |
| Banco de dados | PostgreSQL 16 (dev em Docker; produção no Supabase)           |
| Estilo         | HTML + CSS Modules (login/cadastro) e Tailwind CSS 4 (painel) |
| Containers     | Docker + Docker Compose                                       |
| Bibliotecas    | `pg`, `bcryptjs`, `jose`, `zod`, `@supabase/supabase-js`      |
| Qualidade      | ESLint (`next/core-web-vitals`) + Prettier                    |

## Arquitetura

```
Navegador (React)  ──HTTP/JSON──▶  app/api/*  (rotas = controllers)
                                      │
                                      ▼
                                 src/services/*      (regras de negócio)
                                      │
                                      ▼
                                 src/repositories/*  (SQL parametrizado, sem ORM)
                                      │
                                      ▼
                                 PostgreSQL
```

- `middleware.js` + `src/middleware/rbac.js`: autenticação e autorização por perfil antes de cada rota.
- `src/lib/`: `db.js` (pool), `auth.js` (JWT), `session.js`, `env.js`, `validators.js` (zod), `http.js`.
- O módulo **avisos** é o exemplo completo de ponta a ponta:
  [app/api/avisos/route.js](app/api/avisos/route.js) → [src/services/avisosService.js](src/services/avisosService.js) → [src/repositories/avisosRepository.js](src/repositories/avisosRepository.js).
  `reservas` já está completo (Sprint 2); `visitas`, `chamados` e `enquetes` têm rotas provisórias que exigem login e respondem `501`.

```
condosync/
├─ app/
│  ├─ (painel)/            # layout autenticado: painel/, reservas/, portaria/, avisos/, chamados/, enquetes/, admin/
│  ├─ api/
│  │  ├─ health/           # GET  /api/health
│  │  ├─ auth/             # POST register, login, logout, forgot-password · GET me
│  │  ├─ condominios/      # GET  lista + /:id/unidades (públicos, usados no cadastro)
│  │  ├─ avisos/           # exemplo de módulo
│  │  ├─ reservas/        # RF.09 — reservas com regras de conflito (Sprint 2)
│  │  └─ visitas/ chamados/ enquetes/   # provisórios (501)
│  ├─ login/  cadastro/
│  └─ layout.js  page.js  globals.css
├─ src/
│  ├─ components/  services/  repositories/  middleware/
│  └─ lib/
├─ db/
│  ├─ condosync_schema.dbml        # modelagem oficial (fonte da verdade)
│  ├─ migrations/001_schema.sql    # conversão do DBML para PostgreSQL
│  └─ seeds/001_seed.sql           # dados de desenvolvimento
├─ scripts/  migrate.js  seed.js  wait-for-db.sh  _db.js
├─ .vscode/  Dockerfile  Dockerfile.dev  docker-compose.yml  docker-compose.prod.yml
└─ middleware.js  next.config.js  package.json
```

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com Docker Compose v2)
- [Node.js 20+](https://nodejs.org/): opcional para rodar via Docker, necessário para lint/format e para o VS Code
- [Visual Studio Code](https://code.visualstudio.com/): ao abrir a pasta, aceite instalar as extensões recomendadas

## Passo a passo (desenvolvimento)

```bash
# 1. Variáveis de ambiente
cp .env.example .env
#    Edite o .env e troque o JWT_SECRET. Para gerar um segredo:
#    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 2. Subir tudo (banco + migrations + seed + app com hot reload)
docker compose up --build
```

O que acontece:

1. `db` (Postgres 16) sobe e fica _healthy_ (`pg_isready`).
2. `migrate` aplica `db/migrations/*.sql` e depois `db/seeds/*.sql`, e termina.
3. `app` sobe o Next.js em modo dev com hot reload.

Para ter autocomplete e lint no VS Code, rode também `npm install` no host. O container usa o seu próprio
`node_modules`.

### URLs

| Serviço        | URL                               |
| -------------- | --------------------------------- |
| Aplicação      | http://localhost:3000             |
| Health check   | http://localhost:3000/api/health  |
| Adminer (opc.) | http://localhost:8080             |
| PostgreSQL     | `127.0.0.1:5432` (ou o `DB_PORT`) |

O Adminer só sobe com o profile `tools`: `docker compose --profile tools up -d adminer`.
Use servidor `db`, usuário e senha do `.env`.

### Credenciais de teste

> ⚠️ **Apenas para desenvolvimento.** Essas contas são criadas pelo seed e as senhas estão publicadas
> aqui. O `scripts/seed.js` se recusa a rodar com `NODE_ENV=production`.

O login aceita **e-mail ou CPF** (com ou sem máscara) + senha.

| Perfil   | CPF (login)    | Senha        | E-mail                   |
| -------- | -------------- | ------------ | ------------------------ |
| Morador  | 111.444.777-35 | `Condo@2026` | `morador@condosync.dev`  |
| Portaria | 222.555.888-46 | `Condo@2026` | `portaria@condosync.dev` |
| Síndico  | 333.666.999-57 | `Condo@2026` | `sindico@condosync.dev`  |

O seed cria ainda: o condomínio **Residencial Vila Aurora** (blocos A, B e C, unidades 101/102/201/202),
os espaços Salão de Festas, Churrasqueira e Quadra, 2 avisos, 1 chamado, 1 enquete com 3 opções e os
Termos de Uso/Política de Privacidade provisórios (`1.0-dev`).

## API de autenticação

| Método | Rota                        | Descrição                                                     |
| ------ | --------------------------- | ------------------------------------------------------------- |
| GET    | `/api/health`               | `200` com o banco acessível, `503` caso contrário             |
| POST   | `/api/auth/register`        | Cadastro (`201`); `422` validação, `409` e-mail/CPF duplicado |
| POST   | `/api/auth/login`           | `{ identificador, senha }` (e-mail ou CPF) → cookie de sessão |
| POST   | `/api/auth/logout`          | Remove o cookie (`204`)                                       |
| POST   | `/api/auth/forgot-password` | `{ email }` → `202` sempre (não revela se o e-mail existe)    |
| POST   | `/api/auth/reset-password`  | `{ token, senha }` → troca a senha; token de uso único (1 h)  |
| GET    | `/api/admin/cadastros`      | Síndico: cadastros pendentes do condomínio                    |
| POST   | `/api/admin/cadastros/:id`  | Síndico: `{ acao: 'aprovar' \| 'recusar' }`                   |
| GET    | `/api/auth/me`              | Dados da sessão atual                                         |

Exemplo de cadastro:

```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{
  "nome": "João da Silva", "email": "joao@exemplo.com", "telefone": "(11) 98888-7777",
  "cpf": "529.982.247-25", "dataNascimento": "1995-01-01",
  "senha": "Senha@123", "perfil": "MORADOR", "unidadeId": 1,
  "aceiteTermos": true, "aceitePrivacidade": true }'
```

## Banco de dados: migrations e seed

- **Migrations:** cada arquivo de `db/migrations/` roda uma única vez, em ordem alfabética e dentro de
  uma transação. O controle fica na tabela `schema_migrations`. Para mudar o esquema, crie um novo
  arquivo (`002_...sql`) e nunca edite um já aplicado.
- **Seeds:** mesmo mecanismo, com controle na tabela `schema_seeds`.

```bash
# Via Docker (recomendado)
docker compose run --rm migrate

# Pelo host (usa o DATABASE_URL do .env, que aponta para 127.0.0.1:DB_PORT)
npm run db:migrate
npm run db:seed
```

Rodar de novo é seguro: arquivos já aplicados são ignorados.

## Produção com Supabase

1. Crie um projeto em https://supabase.com.
2. Em **Project Settings → Database → Connection string → URI**, copie a string. Para containers de
   longa duração use a conexão direta ou o _Session pooler_ (porta 5432).
3. As extensões `citext` e `btree_gist` estão disponíveis no Supabase. A migration as cria com
   `CREATE EXTENSION IF NOT EXISTS`.
4. Crie um `.env` de produção com segredos novos (nunca reaproveite os de dev):
   ```env
   NODE_ENV=production
   APP_URL=https://seu-dominio.com.br
   DATABASE_URL=postgresql://postgres.<ref>:<senha>@<host>.pooler.supabase.com:5432/postgres
   DB_SSL=true
   JWT_SECRET=<segredo novo com 32+ caracteres>
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
5. Aplique as migrations no Supabase, **sem o seed**:
   ```bash
   npm run db:migrate          # no host, com o .env de produção
   ```
6. Cadastre os Termos de Uso e a Política de Privacidade reais em `termos_documentos`. Sem eles, o
   cadastro responde `503`.
7. Suba a aplicação:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
   A imagem é multi-stage (`output: 'standalone'`), roda como o usuário não-root `nextjs`, com sistema
   de arquivos somente leitura e `HEALTHCHECK` em `/api/health`. Coloque-a atrás de um proxy HTTPS: o
   cookie de sessão é `Secure` em produção.

## Comandos úteis

```bash
docker compose up --build             # sobe o ambiente (primeiro plano)
docker compose up -d                  # sobe em segundo plano
docker compose logs -f app            # logs da aplicação
docker compose logs migrate           # resultado das migrations/seed
docker compose exec db psql -U condosync -d condosync   # console SQL
docker compose run --rm migrate       # reaplica migrations/seed pendentes
docker compose down                   # para os containers (mantém os dados)
docker compose down -v                # para e APAGA o banco (reset completo)
docker compose build --no-cache app   # rebuild após mudar dependências

npm run lint                          # ESLint
npm run format                        # Prettier (formata tudo)
npm run build                         # build de produção local
```

Depois de adicionar uma dependência ao `package.json`, rode
`docker compose up --build --renew-anon-volumes app` para o container receber o novo `node_modules`.

## Solução de problemas

| Sintoma                                                           | Causa provável / solução                                                                                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ports are not available ... 5432`                                | Já existe um Postgres local na 5432. Defina `DB_PORT=5433` no `.env` e ajuste a porta no `DATABASE_URL`.                                                                                                    |
| `port is already allocated ... 3000`                              | Outro processo usa a 3000. Pare-o ou mude o mapeamento `ports` do `app`.                                                                                                                                    |
| `required variable POSTGRES_PASSWORD/JWT_SECRET is missing`       | Falta o `.env`: rode `cp .env.example .env`.                                                                                                                                                                |
| `migrate` termina com erro                                        | Veja `docker compose logs migrate`. Se o banco ficou inconsistente em dev, rode `docker compose down -v` e suba de novo.                                                                                    |
| Mudanças no código não recarregam                                 | O compose já ativa _polling_ (`WATCHPACK_POLLING`). Em pastas sincronizadas (OneDrive/Dropbox), prefira manter o projeto fora delas.                                                                        |
| `/api/health` responde `503`                                      | O banco está inacessível: confira `DATABASE_URL`/`DB_SSL` e `docker compose ps`.                                                                                                                            |
| Login responde `403` "aguardando a aprovação do síndico"          | Todo vínculo criado pelo cadastro nasce pendente (ver decisões). Entre como síndico e aprove em **Administração** (`/admin`).                                                                               |
| `failed to copy ... cloudfront.docker.com: EOF` ao baixar imagens | A rede bloqueia o CDN do Docker Hub. Use um espelho: `docker pull mirror.gcr.io/library/node:20-alpine && docker tag mirror.gcr.io/library/node:20-alpine node:20-alpine` (idem para `postgres:16-alpine`). |
| `wait-for-db.sh: not found` / `\r` no Linux                       | Arquivo salvo com CRLF. O `.gitattributes` força LF; rode `git add --renormalize .`.                                                                                                                        |

## Decisões técnicas

- **Esquema recebido em DBML.** A modelagem veio em DBML (dbdiagram.io), não em SQL. Ela está
  versionada em `db/condosync_schema.dbml` e foi convertida 1:1 em `db/migrations/001_schema.sql`
  (mesmas tabelas, tipos, checks, índices, FKs e regras de `ON DELETE`). `increment` virou
  `GENERATED BY DEFAULT AS IDENTITY`. Os `Records` de categorias ficaram na própria migration, por
  serem dados de referência.
- **`btree_gist` é criada, mas nenhuma constraint a usa.** O DBML não expressa _exclusion
  constraints_, e não acrescentei nenhuma para não alterar a modelagem. **Pendente:** para impedir
  reservas sobrepostas no mesmo espaço, a equipe pode criar uma migration `002` com
  `EXCLUDE USING gist (espaco_id WITH =, tstzrange(inicio, fim) WITH &&) WHERE (status IN ('PENDENTE','CONFIRMADA'))`.
- **Migrations próprias, sem ferramenta externa.** O `scripts/migrate.js` usa a tabela de controle
  `schema_migrations`, uma transação por arquivo e um _advisory lock_ contra execuções simultâneas.
- **Seed versionado.** O seed é controlado pela tabela `schema_seeds`, então não duplica dados. As
  senhas são hashes bcrypt já prontos no SQL.
- **Next.js 15 + ESLint 8.** É a última linha estável do Next com suporte a `next lint` e `.eslintrc.json`,
  como pede o projeto. Na migração para o Next 16 será preciso adotar a ESLint CLI (flat config).
- **Sessão em JWT HS256 (`jose`).** Fica em cookie `condosync_session` (`HttpOnly`, `SameSite=Lax`,
  `Secure` em produção), com validade de 8 horas. O payload é mínimo: id, nome, perfil, vínculo,
  condomínio e unidade. Ainda não há revogação: o logout apaga o cookie, mas o token vale até expirar.
- **Multi-condomínio.** Um usuário pode ter vários vínculos. O login escolhe o vínculo ativo de maior
  perfil (ADMIN > SÍNDICO > PORTARIA > MORADOR). Trocar de condomínio ou perfil fica para o módulo de conta.
- **Autocadastro e perfis privilegiados.** Para ninguém se declarar síndico sozinho, o cadastro público
  aceita Morador, Portaria e Síndico, mas **todo vínculo nasce pendente** (`ativo = false`), inclusive o
  de morador, e precisa ser aprovado pelo síndico (versão 2). ADMIN não pode ser criado pelo cadastro.
- **Login com mensagem genérica.** Usuário inexistente, senha errada e usuário inativo recebem a mesma
  resposta `401` ("Credenciais inválidas."), e o bcrypt roda mesmo sem usuário, para que o tempo de
  resposta não revele cadastros. Só depois de a senha ser conferida o sistema informa que o acesso está
  pendente (`403`).
- **Bloqueio por tentativas (versão 2).** Após 5 falhas em 15 minutos para o mesmo e-mail/CPF, o login
  responde `429` até a janela expirar. As falhas ficam em `tentativas_login` e são apagadas no login
  bem-sucedido.
- **Cadastro duplicado.** E-mail ou CPF repetido responde `409`. Isso permite descobrir se um e-mail já
  está cadastrado, um custo aceito em troca de uma mensagem útil no cadastro.
- **Recuperação de senha.** Gera um token aleatório, grava apenas o hash SHA-256 em `recuperacoes_senha`
  com validade de 1 hora, invalida os pedidos anteriores e envia o link `/redefinir-senha?token=...` por
  e-mail. O token é de uso único. O envio usa a API da Resend quando `RESEND_API_KEY` e `EMAIL_FROM`
  estão definidos; sem elas, em desenvolvimento o e-mail aparece no console do servidor e, em produção,
  não é enviado (o token nunca vai para os logs de produção).
- **Validação de CPF.** Confere os 11 dígitos, rejeita sequências repetidas e valida os dígitos
  verificadores (`src/lib/validators.js`).
- **Minimização de dados (versão 2).** O RG foi removido do cadastro e do banco (migration `002`).
- **Condomínios e unidades públicos.** `GET /api/condominios` e `/api/condominios/:id/unidades` não
  exigem login, para alimentar o formulário de cadastro. Em produção, considerar um código de convite
  por condomínio.
- **Cabeçalhos de segurança.** O `next.config.js` envia `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `COOP` e, em produção, HSTS. A CSP ainda não foi configurada,
  porque precisa de _nonce_ para os scripts do Next e fica para quando houver o front definitivo.
- **Porta do Postgres configurável (`DB_PORT`).** Evita conflito com um Postgres já instalado na máquina.
- **Ainda não há rate limiting no login.** Recomendado antes de produção, por exemplo via proxy reverso.

## Telas do painel (protótipo do Lovable)

As telas **Visão Geral, Reservas, Portaria, Mural de Avisos, Chamados e Enquetes** vieram do protótipo
feito no Lovable (React + Tailwind + shadcn/ui), convertidas para JavaScript e para o App Router do Next.js.

- Componentes das telas: `src/components/condo/*Tela.jsx`; layout (menu lateral e topo): `AppLayout.jsx`.
- Componentes de interface (shadcn/Radix): `src/components/ui/`.
- Estilos do painel: `app/condo.css` (Tailwind). O `app/globals.css` antigo foi colocado em uma camada
  de menor prioridade e, nas páginas sem painel (login e cadastro), os padrões do navegador são
  restaurados para que elas continuem iguais.
- **Dados:** as telas ainda usam **dados de demonstração** guardados no navegador
  (`src/lib/condo-store.jsx`). Só o usuário logado (nome, perfil, unidade) vem do login real.
  Para integrar com o banco, troque as funções do store por chamadas às rotas `app/api/*`.
- O login (e-mail ou CPF + senha) e o cadastro continuam com banco próprio e sessão em cookie.
