FROM node:22-alpine AS base
RUN apk add --no-cache bash && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

# Etapa de dependências
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Etapa de build
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY . .

# build standalone
RUN pnpm build

# Etapa final (imagem leve)
FROM base AS runner
WORKDIR /app

ENV ENVIRONMENT=production

# Usuário seguro
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
