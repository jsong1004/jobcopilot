# Docker Compose Quick Start Guide

## Prerequisites

Make sure your `.env.local` file has all required environment variables:

```bash
# Firebase Public Config (required at build time)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (runtime only)
FIREBASE_SERVICE_ACCOUNT_KEY='{"your":"service_account_json"}'

# External APIs (runtime only)
SERPAPI_KEY=your_key
OPENROUTER_API_KEY=your_key
THE_COMPANIES_API_TOKEN=your_token
# ... other API keys
```

## Basic Commands

### First Time Setup / Full Rebuild

```bash
# Build from scratch (no cache)
docker-compose build --no-cache

# Build and start
docker-compose up --build
```

### Normal Usage

```bash
# Start the application
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Troubleshooting Commands

```bash
# Rebuild only (faster than --no-cache)
docker-compose build

# Force recreate containers
docker-compose up --force-recreate

# Remove everything and start fresh
docker-compose down -v
docker-compose build --no-cache
docker-compose up

# Check container status
docker-compose ps

# Execute commands in running container
docker-compose exec app sh
docker-compose exec app chromium --version
docker-compose exec app ls -la .next/
```

## Common Issues & Solutions

### Issue: "Could not find a production build"

**Cause**: The `.next` directory or BUILD_ID file is missing.

**Solution**:
```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Issue: Build warnings about config options

**Current Known Warnings** (non-critical):
- `skipTrailingSlashRedirect` moved from experimental to root config
- These warnings don't affect functionality

### Issue: Container keeps restarting

**Check logs**:
```bash
docker-compose logs app
```

**Common causes**:
1. Missing environment variables → Check `.env.local`
2. Build artifacts missing → Rebuild with `--no-cache`
3. Port 3000 already in use → Change port in docker-compose.yml

### Issue: Chromium/PDF generation fails

**Verify Chromium**:
```bash
docker-compose exec app chromium --version
# Should output: Chromium 142.0.7444.134 ...
```

**If Chromium is missing**, rebuild:
```bash
docker-compose build --no-cache
```

## Build Process Explanation

### What Happens During Build

1. **Builder Stage** (node:18-alpine):
   - Install dependencies with pnpm
   - Copy source files
   - Run `next build`
   - Generate `.next` directory with webpack bundles

2. **Build Validation**:
   - Check if `.next/server` and `.next/static` exist
   - Generate `BUILD_ID` file if missing (needed for production)
   - Create `required-server-files.json` if missing

3. **Runtime Stage** (node:18-slim):
   - Install Chromium and dependencies
   - Copy build artifacts from builder
   - Install production dependencies only
   - Start server with `next start`

### Expected Build Warnings

The build may show this error during "Collecting page data":
```
ReferenceError: File is not defined
```

**This is expected and handled automatically**. The Dockerfile:
- Detects this error
- Validates webpack compilation succeeded
- Generates missing BUILD_ID file
- Allows build to continue

The application will work correctly at runtime.

## Performance Tips

### Speed Up Builds

1. **Use BuildKit** (faster builds):
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build
   ```

2. **Layer Caching**: Don't use `--no-cache` unless necessary

3. **Parallel Builds**: Build images in parallel (if you have multiple services)

### Reduce Image Size

The current multi-stage build already optimizes size:
- Build stage: Uses alpine (smaller)
- Runtime stage: Only production dependencies
- Final image: ~1-1.5GB (includes Chromium)

## Environment Variables Reference

### Build-time Variables (--build-arg)
- `NEXT_PUBLIC_*` variables (embedded in client bundle)

### Runtime Variables (-e or .env.local)
- All server-side secrets and API keys
- Firebase service account
- External service tokens

## Health Check

The container includes a health check at `/api/health`:

```bash
# Check if app is healthy
curl http://localhost:3000/api/health
```

Or view in Docker:
```bash
docker-compose ps
# Look for "healthy" status
```

## Quick Debug Session

```bash
# 1. Check if container is running
docker-compose ps

# 2. View recent logs
docker-compose logs --tail=50 app

# 3. Enter container
docker-compose exec app sh

# 4. Inside container, check build
ls -la .next/
cat .next/BUILD_ID
node -v
chromium --version

# 5. Exit container
exit
```

## Next Steps

After successful startup:
- App runs at: http://localhost:3000
- Check logs: `docker-compose logs -f app`
- View metrics: `docker stats`

For deployment to Cloud Run, see **DOCKER_DEPLOYMENT.md**.
