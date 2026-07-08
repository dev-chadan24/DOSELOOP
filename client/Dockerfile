# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install dependencies and produce the Vite static bundle.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first for optimal layer caching
# npm ci requires package-lock.json to exist and produces reproducible installs
COPY package.json package-lock.json ./

# Install all dependencies (dev included — needed for Vite build)
RUN npm ci

# Accept the backend API URL as a build-time argument.
# In production this will be the Cloud Run URL of doseloop-server.
# These VITE_* vars are baked into the static bundle at build time.
ARG VITE_API_URL=http://localhost:5000/api/v1
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy source (after installing deps to benefit from layer cache)
COPY . .

# Build the production bundle → dist/
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production
# Serve the static bundle with Nginx (Alpine — very small image).
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our SPA-friendly nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run routes to port 80 for the client container
EXPOSE 80

# Health check for Cloud Run / load balancer
# wget is available in nginx:alpine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
