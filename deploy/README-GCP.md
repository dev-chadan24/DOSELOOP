# DoseLoop — GCP Production Deployment Runbook
**Version:** 1.0 | **Updated:** 2026-07-08

This document is the complete step-by-step guide to deploying DoseLoop to Google Cloud Run for the first time and for subsequent deployments.

---

## 1. Prerequisites

### 1.1 GCP Project Setup
```bash
# Set your project ID
export PROJECT_ID="doseloop-prod"
export REGION="us-central1"

# Set default project
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com
```

### 1.2 Artifact Registry Repository
```bash
gcloud artifacts repositories create doseloop \
  --repository-format=docker \
  --location=$REGION \
  --description="DoseLoop container images"
```

### 1.3 Service Account for Cloud Build
```bash
# Get the Cloud Build SA email
export CB_SA="$(gcloud projects describe $PROJECT_ID \
  --format='value(projectNumber)')@cloudbuild.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer"
```

---

## 2. Rotate All Compromised Secrets

> ⚠️ **CRITICAL:** All secrets in the committed `.env` file must be rotated BEFORE deploying.

### 2.1 Supabase
1. Go to Supabase Dashboard → Settings → API
2. Click "Regenerate" on the **service_role** key
3. Update the new key in Secret Manager (see Step 3)

### 2.2 JWT Secret
```bash
# Generate a new cryptographically strong secret
openssl rand -hex 32
# Copy the output — you'll use it in Step 3
```

### 2.3 Groq API Key
1. Go to https://console.groq.com/keys
2. Revoke the current key, create a new one

### 2.4 Resend API Key
1. Go to https://resend.com/api-keys
2. Revoke the current key, create a new one

---

## 3. Create Secrets in Google Secret Manager

```bash
# DATABASE_URL — Supabase Transaction Pooler (port 6543)
# Format: postgresql://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require&connection_limit=5
echo -n "YOUR_POOLED_DATABASE_URL" | \
  gcloud secrets create doseloop-database-url --data-file=-

# DIRECT_URL — Supabase direct (non-pooled, for migrations)
echo -n "YOUR_DIRECT_DATABASE_URL" | \
  gcloud secrets create doseloop-direct-url --data-file=-

# SUPABASE_URL
echo -n "https://YOUR_PROJECT_REF.supabase.co" | \
  gcloud secrets create doseloop-supabase-url --data-file=-

# SUPABASE_SERVICE_ROLE_KEY (rotated in Step 2.1)
echo -n "YOUR_NEW_SERVICE_ROLE_KEY" | \
  gcloud secrets create doseloop-supabase-service-role-key --data-file=-

# JWT_SECRET (generated in Step 2.2)
echo -n "YOUR_NEW_JWT_SECRET_HEX_32" | \
  gcloud secrets create doseloop-jwt-secret --data-file=-

# GROQ_API_KEY (rotated in Step 2.3)
echo -n "gsk_YOUR_NEW_KEY" | \
  gcloud secrets create doseloop-groq-api-key --data-file=-

# RESEND_API_KEY (rotated in Step 2.4)
echo -n "re_YOUR_NEW_KEY" | \
  gcloud secrets create doseloop-resend-api-key --data-file=-

# CORS_ORIGIN — set after first client deploy (see Step 6)
echo -n "https://doseloop-client-PLACEHOLDER.a.run.app" | \
  gcloud secrets create doseloop-cors-origin --data-file=-

# CRON_SECRET — for Cloud Scheduler → /api/v1/cron/reminders
openssl rand -hex 32 | \
  gcloud secrets create doseloop-cron-secret --data-file=-
```

---

## 4. Configure Supabase Dashboard (Manual Steps)

These cannot be automated — they must be done manually in the Supabase dashboard.

### 4.1 Auth Redirect URLs
Go to Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://doseloop-client-XXXX.a.run.app`
- **Additional redirect URLs:** Add the Cloud Run client URL

### 4.2 Row Level Security (RLS)
**CRITICAL:** Verify RLS is enabled on all tables containing patient data.

Go to Supabase Dashboard → Database → Tables, and for each table verify RLS is enabled:
- `Medication`, `WellnessMetric`, `ClinicalNote`, `EmergencyContact`
- `FamilyMember`, `Notification`, `AuditLog`, and ALL other PHI tables

If RLS is disabled on any PHI table, **enable it immediately** and configure appropriate policies before any production traffic.

### 4.3 Storage Bucket Policies
Go to Supabase Dashboard → Storage:
- Ensure no bucket is set to "Public" unless contents are explicitly public
- Review bucket policies to ensure they require authentication

---

## 5. First-Time Deploy

### 5.1 Deploy Server First (to get its URL for Vite build arg)
```bash
# Deploy server placeholder to reserve the Cloud Run URL
gcloud run deploy doseloop-server \
  --image=gcr.io/cloudrun/placeholder \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=5000 \
  --project=$PROJECT_ID

# Get the server URL
export SERVER_URL=$(gcloud run services describe doseloop-server \
  --region=$REGION --format='value(status.url)')
echo "Server URL: $SERVER_URL"
```

### 5.2 Update Cloud Build Trigger Substitutions
In the Cloud Build trigger, set:
- `_SERVER_CLOUD_RUN_URL` = URL from Step 5.1
- `_VITE_SUPABASE_ANON_KEY` = your Supabase anon key (mark as SECRET in trigger UI)

### 5.3 Update CORS_ORIGIN Secret After Client Deploy
After running the full pipeline and getting the client URL:
```bash
export CLIENT_URL="https://doseloop-client-XXXX.a.run.app"

# Update the CORS_ORIGIN secret
echo -n "$CLIENT_URL" | \
  gcloud secrets versions add doseloop-cors-origin --data-file=-
```

---

## 6. Connect Cloud Scheduler for Reminder Engine

```bash
export CRON_SECRET=$(gcloud secrets versions access latest \
  --secret=doseloop-cron-secret)

gcloud scheduler jobs create http doseloop-reminders \
  --location=$REGION \
  --schedule="*/15 * * * *" \
  --uri="${SERVER_URL}/api/v1/cron/reminders" \
  --http-method=POST \
  --headers="Authorization=Bearer ${CRON_SECRET},Content-Type=application/json" \
  --message-body='{}' \
  --time-zone="UTC"
```

---

## 7. Verify Deployment

```bash
# Check server health
curl "${SERVER_URL}/api/v1/health"
curl "${SERVER_URL}/api/v1/health/ready"

# Check server logs in Cloud Logging
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=doseloop-server" \
  --limit=20 --format=json
```

---

## 8. GCP Architecture Summary

```
Internet
    │
    ├─ HTTPS ─► Cloud Run: doseloop-client (nginx:alpine, port 80)
    │           Static SPA — React + Vite
    │           VITE_API_URL baked in at build time
    │
    └─ HTTPS ─► Cloud Run: doseloop-server (node:alpine, port 5000)
                Express + TypeScript + Prisma
                Secrets from Secret Manager
                │
                ├─► Supabase PostgreSQL (TLS, Transaction Pooler port 6543)
                ├─► Supabase Auth (JWT validation via service-role key)
                ├─► Supabase Storage (file storage)
                ├─► Groq API (AI assistant — llama-3.3-70b-versatile)
                └─► Resend (transactional email)

Cloud Scheduler ─► POST /api/v1/cron/reminders (*/15 * * * *, CRON_SECRET auth)
Secret Manager ─► Env vars mounted to doseloop-server at deploy time
Artifact Registry ─► Container images (server + client)
Cloud Build ─► Build → Migrate → Push → Deploy pipeline
```

---

## 9. Outstanding Manual Actions (MUST complete before production launch)

| # | Action | Priority |
|---|--------|---------|
| 1 | **Rotate ALL secrets** from committed `.env` (Step 2) | 🔴 CRITICAL |
| 2 | **Enable RLS** on all PHI tables in Supabase (Step 4.2) | 🔴 CRITICAL |
| 3 | Configure Supabase Auth redirect URLs (Step 4.1) | 🔴 HIGH |
| 4 | Create all Secret Manager secrets (Step 3) | 🔴 HIGH |
| 5 | Configure Cloud Build trigger substitutions (Step 5.2) | 🔴 HIGH |
| 6 | Update CORS_ORIGIN after first client deploy (Step 5.3) | 🔴 HIGH |
| 7 | Configure Cloud Scheduler for reminders (Step 6) | 🟡 MEDIUM |
| 8 | Review Supabase Storage bucket policies (Step 4.3) | 🟡 MEDIUM |
| 9 | Configure custom domain + SSL cert mapping | 🟡 MEDIUM |
