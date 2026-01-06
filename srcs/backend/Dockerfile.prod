# ---- Build stage ----
FROM node:20-alpine AS builder

RUN apk add --no-cache bash curl

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY tsconfig.json ./
COPY src/ ./src

RUN npx tsc

##########################################################################

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000
CMD ["node", "dist/index.js"]
