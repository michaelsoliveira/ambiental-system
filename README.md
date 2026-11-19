# Ambiental System

Sistema de gestao ambiental e financeira, composto por uma API Fastify, interface Next.js, PostgreSQL/PostGIS, Redis e integracao opcional com a Evolution API (WhatsApp).

## Portas

| Servico | Porta local | Endereco |
| --- | ---: | --- |
| Financeiro (web) | 3000 | http://localhost:3000 |
| API e documentacao | 3333 | http://localhost:3333/docs |
| PostgreSQL/PostGIS | 5432 | `localhost:5432` |
| Redis | 6379 | `localhost:6379` |
| Evolution API (opcional) | 8080 | http://localhost:8080 |

As portas podem ser alteradas no arquivo `.env.local`. Elas ficam expostas somente em `127.0.0.1`, portanto nao ficam acessiveis por outros equipamentos da rede local.

## Instalacao local (Docker — recomendada)

### Requisitos

- Docker Desktop 4+ com Docker Compose v2;
- ao menos 4 GB de memoria disponivel para o Docker.

1. Crie o arquivo de configuracao local:

   ```powershell
   Copy-Item .env.local.example .env.local
   ```

   Abra `.env.local` e preencha `POSTGRES_PASSWORD` e `JWT_SECRET` com valores locais fortes antes de continuar.

2. Inicie a aplicacao:

   ```powershell
   npm run docker:local
   ```

   Na primeira execucao a imagem pode levar alguns minutos para ser criada. As migracoes do banco sao aplicadas automaticamente pela API.

3. Acesse http://localhost:3000. A documentacao da API esta em http://localhost:3333/docs.

4. Para acompanhar a inicializacao:

   ```powershell
   npm run docker:local:logs
   ```

5. Para parar os containers, preservando os dados:

   ```powershell
   npm run docker:local:down
   ```

### Banco de dados local

O banco e iniciado vazio. Se precisar da massa de desenvolvimento apos os containers estarem saudaveis, execute:

```powershell
docker compose --env-file .env.local -f docker-compose.local.yml exec api /seed-api.sh
```

O seed de desenvolvimento recria usuarios e dados de exemplo. Nao o execute em uma base que voce queira preservar.
O usuario inicial criado pelo seed e `michaelsoliveira@gmail.com`, com senha `secret`; altere-o ou remova-o em qualquer ambiente compartilhado.

## Desenvolvimento sem Docker para Node.js

Use o Docker apenas para PostgreSQL e Redis, e execute API/web no host:

```powershell
pnpm install
pnpm --filter @saas/api dev
pnpm --filter @saas/financeiro dev
```

Nesse modo, configure no `.env` uma `DATABASE_URL` apontando para `localhost:5432`, `REDIS_URL=redis://localhost:6379/0`, `NEXT_PUBLIC_API_URL=http://localhost:3333` e `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

## Instalacao em servidor (producao)

### Requisitos

- Linux com Docker Engine e Docker Compose v2;
- DNS dos dominios apontando para o servidor;
- portas 80 e 443 liberadas no firewall (quando usar o gateway deste repositorio);
- uma rede Docker do MinIO ja existente, caso os arquivos de midia do CMS sejam utilizados.

1. No servidor, obtenha o codigo e crie o arquivo de ambiente:

   ```bash
   git clone <URL_DO_REPOSITORIO> ambiental-system
   cd ambiental-system
   cp docker/env.example .env
   ```

2. Edite `.env`. Troque todas as senhas e chaves de exemplo e informe, no minimo, `POSTGRES_PASSWORD`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_APP_URL`. As URLs devem ser os dominios HTTPS definitivos.

3. Se usar o MinIO de outro projeto na mesma maquina, confirme que a rede indicada em `MINIO_DOCKER_NETWORK` existe. Caso nao use MinIO, crie essa rede para permitir a subida da stack:

   ```bash
   docker network create app_network
   ```

4. Suba a aplicacao:

   ```bash
   npm run docker:prod
   ```

   A API e o frontend nao publicam portas diretamente na producao; eles ficam acessiveis somente pela rede Docker. As migracoes sao aplicadas automaticamente.

5. Para servidor sem outro proxy ocupando as portas 80/443, configure os arquivos de Nginx em `docker/nginx/`, emita o certificado conforme `docker/README-GATEWAY.txt` e suba o gateway:

   ```bash
   npm run docker:prod:gateway
   ```

   Se ja houver um Nginx/reverse proxy no servidor, mantenha `docker:prod` e direcione o proxy para os containers `api:3333` e `financeiro:3000` na rede `bomanejo_ambiental`. O guia de integracao com um gateway existente esta em `docker/README-GATEWAY.txt`.

## Operacao

```bash
# Logs da producao
npm run docker:prod:logs

# Estado dos servicos locais
docker compose --env-file .env.local -f docker-compose.local.yml ps
```

Nunca versione `.env` ou `.env.local`: eles podem conter senhas, tokens e chaves de integracoes externas.
