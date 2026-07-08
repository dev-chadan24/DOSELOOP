# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install dependencies and produce the Vite static bundle.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json* bun.lock* ./

# Install all dependencies
RUN npm install

# Accept the backend API URL as a build-time argument.
# In production this will be the Cloud Run URL of doseloop-server.
ARG VITE_API_URL=http://localhost:5000/api/v1
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy source
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

# Copy the built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check for Cloud Run / load balancer
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
