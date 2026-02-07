FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY turbo.json ./

# Generate Prisma Client
RUN cd apps/backend && pnpm prisma:generate

# Development
FROM base AS development
CMD ["pnpm", "--filter", "@bot-hosting/backend", "dev"]

# Build
FROM base AS builder
RUN pnpm --filter @bot-hosting/backend build

# Production
FROM node:18-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/main.js"]
