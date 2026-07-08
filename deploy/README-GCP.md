# DoseLoop — Google Cloud Deployment Guide

This guide walks you through deploying the DoseLoop monorepo to **Google Cloud Run** using **Cloud Build** and **Artifact Registry**.

---

## Architecture

```
Internet
   │
   ├── /api/** ──► Cloud Run: doseloop-server  (Express API — port 5000)
   │
   └── /**  ────► Cloud Run: doseloop-client  (Nginx SPA — port 80)
```

Both services are deployed to the same GCP region and talk to the externally hosted **Supabase** database. No database container is needed.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| `gcloud` CLI | Latest | https://cloud.google.com/sdk/docs/install |
| Docker Desktop | Latest | https://docs.docker.com/get-docker/ |
| GCP Account | — | https://console.cloud.google.com |

---

## Step 1 — GCP Project Setup

```bash
# Log in
gcloud auth login

# Create a new project (or use an existing one)
gcloud projects create doseloop-prod --name="DoseLoop Production"

# Set as default project
gcloud config set project doseloop-prod

# Enable billing (required) — do this in the GCP Console:
# https://console.cloud.google.com/billing

# Enable required APIs
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com
```

---

## Step 2 — Artifact Registry

Create a Docker repository to store the images:

```bash
gcloud artifacts repositories create doseloop \
  --repository-format=docker \
  --location=us-central1 \
  --description="DoseLoop Docker images"

# Authenticate Docker to push to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## Step 3 — Store Secrets in Secret Manager

Never bake secrets into Docker images. Store them in Secret Manager:

```bash
# DATABASE_URL
echo -n "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres?sslmode=require" \
  | gcloud secrets create doseloop-database-url --data-file=-

# SUPABASE_SERVICE_ROLE_KEY
echo -n "your-service-role-key" \
  | gcloud secrets create doseloop-supabase-service-role-key --data-file=-

# JWT_SECRET
echo -n "your-jwt-secret" \
  | gcloud secrets create doseloop-jwt-secret --data-file=-

# GROQ_API_KEY
echo -n "your-groq-api-key" \
  | gcloud secrets create doseloop-groq-api-key --data-file=-

# RESEND_API_KEY
echo -n "your-resend-api-key" \
  | gcloud secrets create doseloop-resend-api-key --data-file=-

# RESEND_FROM_EMAIL
echo -n "emergency@doseloop.com" \
  | gcloud secrets create doseloop-resend-from-email --data-file=-
```

---

## Step 4 — Grant Cloud Build Permissions

```bash
# Get the Cloud Build service account email
PROJECT_NUMBER=$(gcloud projects describe doseloop-prod --format="value(projectNumber)")
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding doseloop-prod \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding doseloop-prod \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding doseloop-prod \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding doseloop-prod \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 5 — First Deployment (two-phase)

Because the client needs the server's Cloud Run URL at **build time** (Vite env var), do the server first:

### 5a — Deploy the Server

```bash
gcloud builds submit \
  --config deploy/cloudbuild.yaml \
  --substitutions \
    _PROJECT_ID=doseloop-prod,\
    _REGION=us-central1,\
    _SERVER_CLOUD_RUN_URL=https://placeholder.a.run.app,\
    _VITE_SUPABASE_ANON_KEY=your-anon-key
```

After this step completes, get the server's URL:

```bash
gcloud run services describe doseloop-server \
  --region=us-central1 \
  --format="value(status.url)"
# → https://doseloop-server-XXXXXXXX-uc.a.run.app
```

**Enable secrets on the server service** (uncomment the `--set-secrets` block in `cloudbuild.yaml` and redeploy, or set via Console):

```bash
gcloud run services update doseloop-server \
  --region=us-central1 \
  --set-secrets="DATABASE_URL=doseloop-database-url:latest,SUPABASE_SERVICE_ROLE_KEY=doseloop-supabase-service-role-key:latest,JWT_SECRET=doseloop-jwt-secret:latest,GROQ_API_KEY=doseloop-groq-api-key:latest,RESEND_API_KEY=doseloop-resend-api-key:latest,RESEND_FROM_EMAIL=doseloop-resend-from-email:latest"
```

### 5b — Deploy the Client (with real server URL)

```bash
gcloud builds submit \
  --config deploy/cloudbuild.yaml \
  --substitutions \
    _PROJECT_ID=doseloop-prod,\
    _REGION=us-central1,\
    _SERVER_CLOUD_RUN_URL=https://doseloop-server-XXXXXXXX-uc.a.run.app,\
    _VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get the client URL:

```bash
gcloud run services describe doseloop-client \
  --region=us-central1 \
  --format="value(status.url)"
# → https://doseloop-client-XXXXXXXX-uc.a.run.app
```

---

## Step 6 — Set Up Cloud Build Trigger (CI/CD)

Automate future deployments on every push to `main`:

```bash
gcloud builds triggers create github \
  --repo-name=DOOSELOOP \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=deploy/cloudbuild.yaml \
  --substitutions \
    _PROJECT_ID=doseloop-prod,\
    _REGION=us-central1,\
    _SERVER_CLOUD_RUN_URL=https://doseloop-server-XXXXXXXX-uc.a.run.app,\
    _VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Local Docker Testing (before deploying)

Test the full stack locally with Docker Compose:

```bash
# From the repo root
docker-compose up --build

# Client → http://localhost:80
# Server → http://localhost:5000
# Health → http://localhost:5000/api/v1/health
```

---

## Cost Estimate (Cloud Run — minimal usage)

| Service | Memory | CPU | Min instances | Est. monthly cost |
|---------|--------|-----|---------------|-------------------|
| doseloop-server | 512 Mi | 1 | 0 | ~$0–5 |
| doseloop-client | 256 Mi | 1 | 0 | ~$0–3 |

With `min-instances=0` Cloud Run scales to zero when idle — **free tier** covers most hobby/dev traffic.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `PRISMA_GENERATE` fails in Docker | Ensure `prisma/schema.prisma` is copied before `npm install` |
| Client shows blank page | Check `VITE_API_URL` build arg — must point to server Cloud Run URL |
| API 500 errors in production | Check Cloud Run logs: `gcloud run services logs read doseloop-server --region=us-central1` |
| CORS errors | Set `CORS_ORIGIN` env var on the server Cloud Run service to the client's Cloud Run URL |
