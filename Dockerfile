# Build multi-stage: minimiza la imagen final usando next.config.ts
# `output: "standalone"` (Paso 27). El engine de Prisma se genera dentro del
# stage builder (alpine/linux-musl), así que no importa qué SO use quien
# construye la imagen — el binario correcto siempre se genera en el container.

# ---- deps: solo instala dependencias, capa cacheable ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: genera el cliente Prisma y compila Next.js ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner: imagen final, solo lo que el server necesita en runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# El tracing de "standalone" solo copia lo que el server de Next.js importa en
# runtime (incluye @prisma/client, que sí se usa). La CLI de prisma (con todas
# sus dependencias internas) no se usa en runtime pero SÍ la necesita
# `docker compose exec app npx prisma migrate deploy` (comando documentado en
# CLAUDE.md). Copiar archivos sueltos de node_modules/prisma no alcanza —
# tiene demasiadas dependencias transitivas (effect, etc.) que el tracer no
# captura — así que se instala fresca, fijada a la misma versión que
# package.json para no desincronizar el engine generado arriba.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
RUN npm install --no-save prisma@6.19.3

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
