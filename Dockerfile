ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS build
WORKDIR /app
COPY app ./app
COPY src ./src
COPY types ./types
COPY public ./public
COPY docker ./docker
COPY auth.ts middleware.ts next-env.d.ts next.config.mjs postcss.config.js tailwind.config.ts tsconfig.json ./
ARG NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS=600
ENV NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS=${NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS} \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node package.json next.config.mjs ./
COPY --chown=node:node docker ./docker
USER node
EXPOSE 3000
CMD ["node", "docker/start.mjs"]
