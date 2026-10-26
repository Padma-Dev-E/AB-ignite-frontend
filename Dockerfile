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
COPY auth.ts middleware.ts next-env.d.ts next.config.mjs postcss.config.js tailwind.config.ts tsconfig.json ./
ARG NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS=600
ARG API_INTERNAL_URL=http://api:4100
ARG AUTH_URL=http://localhost:3100
ENV NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS=${NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS} \
    API_INTERNAL_URL=${API_INTERNAL_URL} \
    AUTH_URL=${AUTH_URL} \
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
CMD ["node_modules/.bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
