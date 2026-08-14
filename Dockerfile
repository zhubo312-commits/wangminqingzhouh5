FROM node:22-bookworm-slim AS build

ARG PUBLIC_BASE_PATH=/
ARG DEBIAN_MIRROR=http://deb.debian.org/debian
ENV PUBLIC_BASE_PATH=${PUBLIC_BASE_PATH}

WORKDIR /app
RUN sed -i "s|http://deb.debian.org/debian|${DEBIAN_MIRROR}|g" /etc/apt/sources.list.d/debian.sources \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/kangxi-dictionary/package.json ./packages/kangxi-dictionary/package.json
RUN npm ci

COPY apps ./apps
COPY packages ./packages
COPY playwright.config.ts ./playwright.config.ts
RUN npm run build \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

ARG RELEASE_REVISION=local
LABEL org.opencontainers.image.revision=${RELEASE_REVISION}

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    SQLITE_PATH=/data/guoxue.db \
    WEB_DIST_PATH=/app/apps/web/dist

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/server/package.json ./apps/server/package.json
COPY --from=build --chown=node:node /app/apps/server/dist ./apps/server/dist
COPY --from=build --chown=node:node /app/apps/server/migrations ./apps/server/migrations
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist
COPY --from=build --chown=node:node /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=node:node /app/packages/contracts/dist ./packages/contracts/dist

RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3001

CMD ["node", "apps/server/dist/server.js"]
