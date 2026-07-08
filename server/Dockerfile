# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install ALL dependencies, generate Prisma client, and compile TypeScript.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL — required by Prisma query engine on Alpine
RUN apk add --no-cache openssl

# Copy manifests first for optimal layer caching
# npm ci requires package-lock.json to exist
COPY package.json package-lock.json ./

# Install ALL deps (incl. devDependencies needed for tsc/tsc-alias build)
# --ignore-scripts: prevents postinstall from running prisma generate here
# (we run it explicitly below with the schema present)
RUN npm ci --ignore-scripts

# Copy Prisma schema first so prisma generate can run
COPY prisma ./prisma

# Generate the Prisma client for linux-musl-openssl-3.0.x (Alpine target)
RUN npx prisma generate

# Copy the rest of the source files
COPY . .

# Compile TypeScript → dist/
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production
# Lean image with only the compiled output and production node_modules.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Install OpenSSL — required by Prisma at runtime on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security best practices
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs --no-create-home nodeuser

# Copy package manifests and install PRODUCTION dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema + generated client (required at runtime by @prisma/client)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set correct ownership so non-root user can read all files
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Cloud Run: PORT env var is set by the platform; expose both 5000 (our default)
# and 8080 for documentation — actual port is determined by $PORT at runtime.
EXPOSE 5000

# Health check — Cloud Run / GCP load balancer uses this
# wget is available in node:alpine
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/v1/health/ready || exit 1

CMD ["node", "dist/server.js"]
