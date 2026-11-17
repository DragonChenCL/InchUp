FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5173 \
    DATABASE_PATH=/app/data/inchup.sqlite \
    ENABLE_DEMO=false

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/schema.sql ./server/schema.sql
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 5173

HEALTHCHECK --interval=15s --timeout=8s --start-period=20s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:5173/api/config', {signal: AbortSignal.timeout(5000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "--experimental-sqlite", "dist/server/index.js"]
