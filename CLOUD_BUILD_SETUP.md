# Google Cloud Build Deployment Setup Guide

This guide walks you through setting up automated deployment to Google Cloud Run using Cloud Build and Secret Manager.

## Prerequisites

✅ Google Cloud Project: `myresume-457817`
✅ Cloud Run Service: `jobcopilot`
✅ Region: `us-west1`
✅ Existing secrets in Secret Manager (see below)

## 🔐 Secret Manager Status

### ✅ Existing Secrets (Already Created)

These secrets already exist in your Secret Manager and are mapped correctly:

| Environment Variable | Secret Manager Name | Status |
|---------------------|---------------------|--------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `ServiceAccountKey` | ✅ Ready |
| `SERPAPI_KEY` | `SERPAPI_KEY` | ✅ Ready |
| `OPENROUTER_API_KEY` | `OPENROUTER_API_KEY` | ✅ Ready |
| `GEMINI_API_KEY` | `GEMINI_API_KEY` | ✅ Ready (Build + Runtime) |
| `THE_COMPANIES_API_TOKEN` | `THE_COMPANIES_API_TOKEN` | ✅ Ready |
| `GITHUB_TOKEN` | `GITHUB_TOKEN` | ✅ Ready |
| `CRON_SECRET` | `CRON_SECRET` | ✅ Ready |
| `GMAIL_USER` | `GMAIL_USER` | ✅ Ready |
| `GMAIL_PASS` | `GMAIL_APP_PASSWORD` | ✅ Ready |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `FIREBASE_WEB_API_KEY` | ✅ Ready |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `FIREBASE_MESSAGING_SENDER_ID` | ✅ Ready |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `FIREBASE_APP_ID` | ✅ Ready |

### ❌ Missing Secrets (Need to Create)

Create these 6 secrets before first deployment:

#### 1. Firebase Configuration Secrets

```bash
# These values are from your Firebase Console → Project Settings → General

# 1. Firebase Auth Domain
echo -n "myresume-457817.firebaseapp.com" | gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  --data-file=- \
  --project=myresume-457817 \
  --replication-policy=automatic

# 2. Firebase Project ID
echo -n "myresume-457817" | gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  --data-file=- \
  --project=myresume-457817 \
  --replication-policy=automatic

# 3. Firebase Storage Bucket
echo -n "myresume-457817.firebasestorage.app" | gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  --data-file=- \
  --project=myresume-457817 \
  --replication-policy=automatic
```

#### 2. NextAuth Secret

```bash
# Using your existing NEXTAUTH_SECRET value from .env.local
echo -n "jsong0114" | gcloud secrets create NEXTAUTH_SECRET \
  --data-file=- \
  --project=myresume-457817 \
  --replication-policy=automatic

# For production, you may want to generate a stronger secret:
# openssl rand -base64 32 | gcloud secrets create NEXTAUTH_SECRET --data-file=- --project=myresume-457817
```

#### 3. Site URL

```bash
# Using your production site URL from .env.local
echo -n "https://myjob.ai-biz.app" | gcloud secrets create NEXT_PUBLIC_SITE_URL \
  --data-file=- \
  --project=myresume-457817 \
  --replication-policy=automatic

# Note: If deploying to a new Cloud Run URL, update this after first deploy
```

#### 4. Notification Email

```bash
# Create NOTIFY_TO secret with your notification email
echo -n "jsong@koreatous.com" | gcloud secrets create NOTIFY_TO \
  --data-file=- \
  --project=myresume-457817 \
  --replication-policy=automatic
```

---

## 🔑 Grant Service Account Access to Secrets

The Cloud Run service account needs permission to access all secrets:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe myresume-457817 --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Service Account: $SERVICE_ACCOUNT"

# Grant access to ALL secrets (run this script)
for SECRET in \
  ServiceAccountKey \
  SERPAPI_KEY \
  OPENROUTER_API_KEY \
  GEMINI_API_KEY \
  THE_COMPANIES_API_TOKEN \
  GITHUB_TOKEN \
  CRON_SECRET \
  GMAIL_USER \
  GMAIL_APP_PASSWORD \
  ADMIN_EMAIL \
  FIREBASE_WEB_API_KEY \
  FIREBASE_MESSAGING_SENDER_ID \
  FIREBASE_APP_ID \
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  NEXTAUTH_SECRET \
  NEXT_PUBLIC_SITE_URL \
  NOTIFY_TO
do
  echo "Granting access to: $SECRET"
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=myresume-457817 \
    2>/dev/null || echo "  ⚠️  Secret $SECRET not found (may not be created yet)"
done
```

---

## 🚀 Enable Required Google Cloud APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project=myresume-457817
```

---

## 🔧 Build Process & Error Resilience

The Docker build process is designed to be resilient to Next.js build failures:

### Build-Time Secrets
- **`GEMINI_API_KEY`**: Used during Next.js build for page data collection
- **Firebase Config**: `NEXT_PUBLIC_*` variables embedded in client bundle
- **Site URL**: `NEXT_PUBLIC_SITE_URL` for client-side routing

### Fallback Manifest Generation
If the Next.js build fails during "Collecting page data" (e.g., missing environment variables), the Dockerfile will:
1. Verify webpack compilation succeeded (`.next/server` and `.next/static` exist)
2. Generate missing manifest files required for Next.js runtime:
   - `BUILD_ID` - Build identifier
   - `routes-manifest.json` - Routing configuration
   - `middleware-manifest.json` - Middleware configuration
   - `pages-manifest.json` - Pages Router compatibility
   - **`functions-config-manifest.json`** - Function configuration (CRITICAL)
   - `app-paths-manifest.json` - App Router paths
   - `next-font-manifest.json` - Font optimization
   - `prerender-manifest.json` - Static generation config

This ensures the deployment succeeds even if the build partially fails.

---

## 📦 Initial Deployment

### Step 1: Verify Setup

```bash
# Check that secrets exist
gcloud secrets list --project=myresume-457817 | grep -E "(NEXT_PUBLIC|NEXTAUTH)"

# Expected output should include:
# - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# - NEXT_PUBLIC_FIREBASE_PROJECT_ID
# - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# - NEXT_PUBLIC_SITE_URL
# - NEXTAUTH_SECRET
```

### Step 2: First Deployment

```bash
# Run deployment script
./deploy.sh

# This will:
# 1. Submit build to Cloud Build (10-15 min first time)
# 2. Build Docker image with secrets from Secret Manager
# 3. Push image to Artifact Registry
# 4. Deploy to Cloud Run
# 5. Configure with 2Gi memory, 2 CPUs
```

### Step 3: Update Site URL

After first successful deployment, update the site URL secret:

```bash
# Get the actual Cloud Run URL
CLOUD_RUN_URL=$(gcloud run services describe jobcopilot \
  --region=us-west1 \
  --project=myresume-457817 \
  --format="value(status.url)")

echo "Cloud Run URL: $CLOUD_RUN_URL"

# Update NEXT_PUBLIC_SITE_URL with actual URL
echo -n "$CLOUD_RUN_URL" | gcloud secrets versions add NEXT_PUBLIC_SITE_URL \
  --data-file=- \
  --project=myresume-457817

# Update NEXTAUTH_URL environment variable in Cloud Run
gcloud run services update jobcopilot \
  --region=us-west1 \
  --project=myresume-457817 \
  --update-env-vars=NEXTAUTH_URL=$CLOUD_RUN_URL
```

### Step 4: Redeploy with Correct URL

```bash
# Redeploy to ensure client bundle has correct site URL
./deploy.sh
```

---

## 🔄 Subsequent Deployments

After initial setup, deploying is simple:

```bash
# Deploy latest code
./deploy.sh

# Or with custom tag
./deploy.sh v2.8.0

# Or with specific git commit
./deploy.sh $(git rev-parse --short HEAD)
```

---

## 🧪 Verify Deployment

### Check Build Status

```bash
# View recent builds
gcloud builds list --limit=5 --project=myresume-457817

# View specific build logs
gcloud builds log <BUILD_ID> --project=myresume-457817
```

### Check Cloud Run Service

```bash
# Service details
gcloud run services describe jobcopilot \
  --region=us-west1 \
  --project=myresume-457817

# Service URL
gcloud run services describe jobcopilot \
  --region=us-west1 \
  --project=myresume-457817 \
  --format="value(status.url)"
```

### Test Endpoints

```bash
CLOUD_RUN_URL=$(gcloud run services describe jobcopilot --region=us-west1 --format="value(status.url)")

# Health check
curl $CLOUD_RUN_URL/api/health

# Homepage
curl -I $CLOUD_RUN_URL
```

### View Logs

```bash
# Stream logs
gcloud run services logs tail jobcopilot \
  --region=us-west1 \
  --project=myresume-457817

# Recent logs
gcloud run services logs read jobcopilot \
  --region=us-west1 \
  --project=myresume-457817 \
  --limit=50
```

---

## 🐛 Troubleshooting

### Build Fails: "Secret not found"

**Problem**: Missing secret in Secret Manager
**Solution**: Create the missing secret using commands in "Missing Secrets" section above

### Build Fails: "Permission denied"

**Problem**: Service account doesn't have access to secrets
**Solution**: Run the "Grant Service Account Access" script above

### Deployment Succeeds but App Crashes

**Problem**: Runtime secret is missing or incorrect
**Solution**:
1. Check Cloud Run logs: `gcloud run services logs read jobcopilot --region=us-west1`
2. Verify all secrets exist: `gcloud secrets list --project=myresume-457817`
3. Check secret values: `gcloud secrets versions access latest --secret=SECRET_NAME`

### Chromium/Puppeteer Errors

**Problem**: PDF generation fails
**Solution**: Ensure Cloud Run has 2Gi memory (already configured in cloudbuild.yaml)

### "NEXTAUTH_URL" Error

**Problem**: NextAuth can't determine callback URL
**Solution**: Update NEXTAUTH_URL after first deploy (see Step 3 above)

---

## 📊 Cost Estimation

**Cloud Build**: ~$0.003/minute = ~$0.15-0.45 per build
**Cloud Run**: Pay per request, ~$0-20/month depending on traffic
**Artifact Registry**: Storage ~$0.10/GB/month
**Secret Manager**: ~$0.06 per 10,000 accesses

**Estimated Monthly Cost**: $5-25 for low to moderate traffic

---

## 🔒 Security Best Practices

✅ **Never commit secrets** - All credentials in Secret Manager
✅ **Use latest version** - Secrets use `:latest` for automatic updates
✅ **Principle of least privilege** - Service account only has access to needed secrets
✅ **Audit access** - Monitor secret access in Cloud Console → Security
✅ **Rotate secrets** - Update secrets periodically using `gcloud secrets versions add`

---

## 📝 Quick Reference Commands

```bash
# Deploy
./deploy.sh

# View builds
gcloud builds list --limit=10

# View service
gcloud run services describe jobcopilot --region=us-west1

# View logs
gcloud run services logs tail jobcopilot --region=us-west1

# Update secret
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Rollback deployment
gcloud run services update-traffic jobcopilot --to-revisions=REVISION=100 --region=us-west1
```

---

## ✅ Pre-Deployment Checklist

Before running `./deploy.sh`:

- [ ] All 6 missing secrets created in Secret Manager
- [ ] Service account granted access to all secrets
- [ ] Required APIs enabled
- [ ] Firebase configuration values correct
- [ ] `deploy.sh` has execute permission (`chmod +x deploy.sh`)
- [ ] You're authenticated with gcloud (`gcloud auth login`)
- [ ] Correct project set (`gcloud config get-value project`)

---

**Questions or Issues?** Check Cloud Build logs or Cloud Run logs for detailed error messages.
