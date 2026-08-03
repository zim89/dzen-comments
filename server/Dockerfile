FROM node:20-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

ENV DATABASE_URL=postgresql://comments:comments@postgres:5432/comments

COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN npm install --no-save prisma@7.9.1 ts-node@10.9.2 typescript@5.7.3 \
  && chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p uploads \
  && chown -R node:node /app

USER node

EXPOSE 4040

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
