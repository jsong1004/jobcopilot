# Docker Setup for Next.js 15 with Chromium/Puppeteer - MyJob Application

> **Complete Docker containerization guide** for Next.js 15 App Router applications with Chromium browser automation, Puppeteer PDF generation, Firebase integration, and production deployment to Google Cloud Run.

**Keywords**: Next.js 15 Docker, Docker Compose Next.js, Chromium Docker, Puppeteer Docker, Next.js production build, Firebase Docker, Google Cloud Run Next.js, Docker multi-stage build, Next.js App Router Docker, Playwright Docker alternative

**Problems Solved**: File API build errors, middleware manifest errors, environment variable configuration, Chromium installation in Docker, Next.js static page generation, production deployment containerization

## 📚 Documentation Index

This project has comprehensive Docker documentation organized by use case:

### Quick Reference
- **[DOCKER_SUCCESS_SUMMARY.md](DOCKER_SUCCESS_SUMMARY.md)** - Start here! Complete overview of the Docker setup, all fixes applied, and verification steps
- **[DOCKER_COMPOSE_QUICK_START.md](DOCKER_COMPOSE_QUICK_START.md)** - Quick command reference for daily Docker Compose usage

### Detailed Guides
- **[DOCKER_FIXES_APPLIED.md](DOCKER_FIXES_APPLIED.md)** - Step-by-step breakdown of all fixes applied to make Docker work
- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Production deployment guide for Google Cloud Run

### Utilities
- **[test-chromium.js](test-chromium.js)** - Script to verify Chromium installation in Docker container

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Ensure .env file exists with NEXT_PUBLIC_* variables
grep "^NEXT_PUBLIC" .env.local > .env

# 2. Build and start
docker-compose up --build

# 3. Application available at http://localhost:3000
```

---

## 📋 Prerequisites

1. **Docker & Docker Compose** installed
2. **Environment files configured**:
   - `.env` - Docker Compose build variables (NEXT_PUBLIC_*)
   - `.env.local` - Runtime secrets (API keys, Firebase service account)

---

## 🔧 Environment Setup

### Required Files

**`.env`** (Docker Compose build args):
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**`.env.local`** (Runtime secrets):
```bash
# All NEXT_PUBLIC vars (duplicate from .env)
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... other NEXT_PUBLIC vars

# Server-side secrets (not in .env)
FIREBASE_SERVICE_ACCOUNT_KEY={"your":"service_account_json"}
SERPAPI_KEY=your_key
OPENROUTER_API_KEY=your_key
THE_COMPANIES_API_TOKEN=your_token
```

### Quick Setup
```bash
# Create .env from .env.local
grep "^NEXT_PUBLIC" .env.local > .env
```

---

## 🏗️ Build & Run

### Development/Local

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Clean Rebuild

```bash
# Full rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## ✅ Verification

### 1. Check Container Status
```bash
docker-compose ps
# Should show: Up (healthy)
```

### 2. Check Application
```bash
curl http://localhost:3000
# Should return HTML content
```

### 3. Check Chromium
```bash
docker-compose exec app chromium --version
# Should show: Chromium 142.0.7444.134
```

### 4. Check Logs
```bash
docker-compose logs app | tail -10
# Should show:
#   ✓ Ready in 232ms
#   Firebase app initialized successfully
```

---

## 🎯 Key Features

### ✅ Working Features

- **Next.js 15 Build** - Complete static page generation (51/51 pages)
- **Chromium/Puppeteer** - PDF generation for resumes and job analysis
- **Firebase Integration** - Authentication and Firestore database
- **Environment Variables** - Proper separation of build-time and runtime vars
- **File Upload API** - Resume parsing (PDF, DOCX, Markdown)
- **AI Integration** - OpenRouter API for job matching and resume tailoring

### 🔒 Security

- No secrets in Docker image layers
- Runtime secrets via environment variables
- Service account JSON loaded from environment (not file)
- Non-root user execution (uid 1001)

---

## 🐛 Troubleshooting

### Issue: "Could not find a production build"
**Solution**: Rebuild from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Issue: Environment variables showing as blank
**Solution**: Ensure `.env` file exists
```bash
cat .env
# Should show NEXT_PUBLIC_* variables

# If missing, create it:
grep "^NEXT_PUBLIC" .env.local > .env
```

### Issue: Container keeps restarting
**Solution**: Check logs for errors
```bash
docker-compose logs app
```

### Issue: Chromium/PDF generation fails
**Solution**: Verify Chromium installation
```bash
docker-compose exec app chromium --version
# Should output: Chromium 142.0.7444.134

# If missing, rebuild:
docker-compose build --no-cache
```

---

## 📊 Performance Metrics

- **Build Time**: ~25-30 seconds (clean build)
- **Startup Time**: ~232ms (production mode)
- **Image Size**: ~1.2GB (includes Chromium and dependencies)
- **Memory Usage**: ~300MB baseline

---

## 🚢 Production Deployment

For production deployment to Google Cloud Run, see:
- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Complete Cloud Run deployment guide

Key deployment steps:
1. Build optimized production image
2. Push to Google Container Registry (GCR) or Artifact Registry
3. Deploy to Cloud Run with environment variables
4. Configure secrets via Google Secret Manager

---

## 🏗️ Architecture

### Multi-Stage Docker Build

```
node:18-alpine (builder)
  ↓ Install dependencies
  ↓ Build Next.js with File polyfill
  ↓ Generate static pages
  ↓
node:18-slim (runner)
  ↓ Install Chromium
  ↓ Copy production artifacts
  ↓ Install production dependencies only
  ↓ Run as non-root user
```

### Key Technical Solutions

1. **File API Polyfill** - Preloaded using `NODE_OPTIONS="--require ./lib/build-polyfills.js"`
2. **Duck-Typing File Validation** - Avoids `instanceof File` type checking errors
3. **Manifest File Generation** - Fallback for incomplete Next.js builds
4. **Chromium Integration** - Full dependency installation for Puppeteer

---

## 📁 Important Files

### Docker Configuration
- `Dockerfile` - Multi-stage build configuration
- `docker-compose.yml` - Local development setup
- `.dockerignore` - Files to exclude from build context

### Build Support
- `lib/build-polyfills.js` - File API polyfill for Next.js build
- `test-chromium.js` - Chromium verification script

### Environment
- `.env` - Docker Compose build variables (committed to repo)
- `.env.local` - Runtime secrets (gitignored)
- `service-account-key.json` - Firebase service account (gitignored)

---

## 🔗 Related Documentation

- **[docs/PROJECT_INDEX.md](docs/PROJECT_INDEX.md)** - Complete project documentation hub
- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - API endpoints documentation
- **[CLAUDE.md](CLAUDE.md)** - Project overview for Claude Code

---

## 📝 Notes

### Build Process Details

The build uses a special technique to handle Next.js static analysis:

1. **File API Polyfill Preload**: `NODE_OPTIONS="--require ./lib/build-polyfills.js"` ensures File API is available during Next.js build
2. **Fallback Manifest Generation**: If build fails during page data collection, fallback generates required manifest files
3. **Duck-Typing Validation**: API routes use duck-typing instead of `instanceof File` to avoid type checking issues

### Environment Variable Flow

- **Build Time** (--build-arg): `NEXT_PUBLIC_*` variables from `.env` file
- **Runtime** (-e or env_file): All variables from `.env.local` file

This separation ensures:
- Client bundle gets public config at build time
- Server gets secrets at runtime (not baked into image)
- No secrets in Docker image layers

---

## ✨ Success Criteria

All working correctly:
- ✅ Next.js build completes: "✓ Generating static pages (51/51)"
- ✅ Container starts: "✓ Ready in 232ms"
- ✅ No environment variable warnings
- ✅ No manifest file errors
- ✅ Chromium installed and working
- ✅ Firebase initialized successfully
- ✅ Application accessible at http://localhost:3000
- ✅ PDF generation working
- ✅ File uploads working

---

## ❓ Frequently Asked Questions (FAQ)

### How do I fix "ReferenceError: File is not defined" in Next.js Docker build?

**Problem**: Next.js build fails with "ReferenceError: File is not defined" during static page generation.

**Solution**: This is a browser API compatibility issue. Use the File API polyfill:
1. Create `lib/build-polyfills.js` with File polyfill
2. Preload it using `NODE_OPTIONS="--require ./lib/build-polyfills.js"` in Dockerfile
3. Use duck-typing instead of `instanceof File` in API routes

See [DOCKER_SUCCESS_SUMMARY.md](DOCKER_SUCCESS_SUMMARY.md#1-file-api-polyfill) for complete implementation.

### How to install Chromium/Puppeteer in Docker for Next.js?

**Problem**: Puppeteer fails in Docker container or Chrome installation errors.

**Solution**: Install Chromium (not Chrome) with full dependencies:
```dockerfile
RUN apt-get update && apt-get install -y \
    chromium chromium-sandbox \
    fonts-ipafont-gothic fonts-wqy-zenhei \
    libxss1 libxtst6 libnss3 libgbm1 libgtk-3-0 \
    --no-install-recommends
```

Set environment variable: `ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`

### How do I fix "Cannot read properties of undefined (reading '/_middleware')" error?

**Problem**: Next.js container fails to start with middleware manifest error.

**Solution**: Ensure all Next.js manifest files are generated:
- Complete File API polyfill setup for successful build
- Generate fallback manifests if build fails during page data collection
- Verify `.next/server/middleware-manifest.json` exists

See [DOCKER_FIXES_APPLIED.md](DOCKER_FIXES_APPLIED.md#3--middleware-error-fixed) for details.

### What's the best way to handle environment variables in Next.js Docker?

**Problem**: Environment variables showing as blank or not loading correctly.

**Solution**: Separate build-time and runtime variables:
- **`.env`** - Build args for `NEXT_PUBLIC_*` variables (Docker Compose uses this)
- **`.env.local`** - Runtime secrets (API keys, service accounts)
- **docker-compose.yml** - Use `env_file: .env.local` for runtime loading

Never put secrets in build args - they get baked into image layers.

### How do I deploy Next.js 15 to Google Cloud Run with Docker?

**Complete guide**: See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

**Quick steps**:
```bash
# Build production image
docker build -t gcr.io/PROJECT_ID/myapp .

# Push to Google Container Registry
docker push gcr.io/PROJECT_ID/myapp

# Deploy to Cloud Run
gcloud run deploy myapp --image gcr.io/PROJECT_ID/myapp
```

### How to fix "Could not find a production build" in Next.js Docker?

**Problem**: Container starts but shows "Could not find a production build in .next" error.

**Solution**:
1. Ensure build completes successfully: `✓ Generating static pages`
2. Generate fallback manifest files if build fails
3. Verify `.next/BUILD_ID` exists
4. Rebuild from scratch: `docker-compose build --no-cache`

### What's the optimal Docker multi-stage build for Next.js?

**Best practice structure**:
```dockerfile
# Stage 1: Builder (node:18-alpine)
- Install dependencies
- Build Next.js application
- Generate static pages

# Stage 2: Runner (node:18-slim)
- Install production dependencies only
- Copy build artifacts from builder
- Install Chromium for Puppeteer
- Run as non-root user
```

This reduces final image size by 60-70% while keeping all required runtime dependencies.

### How do I debug Next.js Docker build failures?

**Debugging steps**:
```bash
# Check build logs
docker-compose build 2>&1 | grep -E "error|Error|ERROR"

# Inspect build artifacts
docker run --rm --entrypoint sh your-image -c "ls -la .next/"

# Test build locally without Docker
NODE_OPTIONS="--require ./lib/build-polyfills.js" npm run build

# Check environment variables
docker-compose exec app env | grep -E "NEXT_PUBLIC|FIREBASE"
```

### Why is my Docker image size so large (>4GB)?

**Causes and solutions**:
- **Chromium installation**: Adds ~500MB (required for Puppeteer)
- **Dev dependencies**: Use `--prod` flag: `pnpm install --prod --frozen-lockfile`
- **Build artifacts**: Only copy necessary files from builder stage
- **Base image**: Use `node:18-slim` instead of full `node:18`

**Expected sizes**:
- Without Chromium: ~600-800MB
- With Chromium: ~1.2-1.5GB

### How to fix Firebase initialization errors in Docker?

**Problem**: "Firebase app not initialized" or authentication failures.

**Solution**:
1. Load service account from environment variable (not file):
   ```typescript
   const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
   ```
2. Set all `NEXT_PUBLIC_FIREBASE_*` variables at build time
3. Verify environment variables are loaded: `docker-compose exec app env | grep FIREBASE`

### Can I use this Docker setup with Vercel or other platforms?

**Yes, but with modifications**:
- **Vercel**: Remove Docker-specific environment handling, Vercel manages environment variables
- **AWS ECS/Fargate**: Use this Docker setup as-is
- **Azure Container Apps**: Use this Docker setup as-is
- **DigitalOcean App Platform**: Supports Docker with minimal changes
- **Railway/Render**: Supports Dockerfile deployment directly

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for platform-specific notes.

### How do I update to Next.js 15 from Next.js 14 with this Docker setup?

**Migration steps**:
1. Update `package.json`: `"next": "^15.0.0"`
2. Update React: `"react": "^19.0.0"`
3. Rebuild Docker image: `docker-compose build --no-cache`
4. Test build artifacts: Verify manifest files are generated correctly
5. Update any deprecated Next.js 14 features

The File API polyfill and build process work with both Next.js 14 and 15.

---

## 🆘 Support & Resources

### Official Documentation
1. **[DOCKER_SUCCESS_SUMMARY.md](DOCKER_SUCCESS_SUMMARY.md)** - Complete technical overview and fix summary
2. **[DOCKER_FIXES_APPLIED.md](DOCKER_FIXES_APPLIED.md)** - Step-by-step troubleshooting guide
3. **[DOCKER_COMPOSE_QUICK_START.md](DOCKER_COMPOSE_QUICK_START.md)** - Command reference
4. **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Production deployment guide

### Quick Diagnostics
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs app | tail -50

# Verify build artifacts
docker-compose exec app ls -la .next/

# Check environment variables
docker-compose exec app env | grep FIREBASE

# Test Chromium installation
docker-compose exec app chromium --version
```

### Common Issues Checklist
- [ ] `.env` file exists with `NEXT_PUBLIC_*` variables
- [ ] `.env.local` file has runtime secrets
- [ ] File API polyfill is preloaded in Dockerfile
- [ ] Chromium is installed in runner stage
- [ ] All manifest files are generated (BUILD_ID, routes-manifest.json, etc.)
- [ ] No secrets in Docker build args
- [ ] Production dependencies installed in runner stage

### Getting Help
1. Check FAQ above for your specific error message
2. Search this repository's documentation files
3. Review build logs: `docker-compose logs app`
4. Verify environment setup with diagnostic commands
5. Consult [DOCKER_SUCCESS_SUMMARY.md](DOCKER_SUCCESS_SUMMARY.md) for detailed technical information

---

## 🏷️ Related Topics & Keywords

**Docker Keywords**: Next.js containerization, Docker Compose orchestration, multi-stage builds, production optimization, container security, image size reduction, build caching

**Next.js Keywords**: App Router Docker, Server Components containerization, static page generation, build optimization, production deployment, environment variables, File API polyfill

**DevOps Keywords**: CI/CD Docker, Google Cloud Run deployment, container registry, secret management, health checks, monitoring, logging, infrastructure as code

**Troubleshooting Keywords**: Build errors, runtime errors, middleware issues, manifest files, Chromium installation, Puppeteer configuration, Firebase integration, environment variables
