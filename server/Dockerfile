# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install ALL dependencies, generate Prisma client, and compile TypeScript.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json* ./

# Install ALL deps (including devDependencies needed for the build)
RUN npm install --ignore-scripts

# Copy Prisma schema and generate the client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source
COPY . .

# Compile TypeScript → dist/
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production
# Lean image with only the compiled output and production node_modules.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifest and install PRODUCTION deps only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema + generated client (needed at runtime by @prisma/client)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose the API port (Cloud Run default: 8080, but we keep 5000 and set PORT env)
EXPOSE 5000

# Health check — Cloud Run / GCP load balancer uses this
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
