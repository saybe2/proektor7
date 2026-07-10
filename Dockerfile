# ==== Сборка ====
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .

# NEXT_PUBLIC_* вшиваются в сборку — передаются как build args
ARG NEXT_PUBLIC_SITE_URL="https://proektor7.ru"
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

ENV DATABASE_URL="file:/data/prod.db"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate && npm run build

# ==== Рантайм ====
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/data/prod.db"
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone-сборка Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma CLI для применения схемы при старте + сид
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p /data /app/public/img/uploads

EXPOSE 3000
VOLUME ["/data", "/app/public/img/uploads"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
