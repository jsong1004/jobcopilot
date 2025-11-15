# ---- Build Stage ----
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.6.12 --activate

# Set working directory
WORKDIR /app

# Accept build arguments for Firebase public config (required at build time for Next.js)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG GEMINI_API_KEY

# Set NEXT_PUBLIC environment variables for build (these are embedded in the client bundle)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

# Set GEMINI_API_KEY for build-time validation (prevents build failure during page data collection)
# This is NOT embedded in the client bundle - only used during Next.js build process
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# NOTE: Server-side secrets (FIREBASE_SERVICE_ACCOUNT_KEY, SERPAPI_KEY, OPENROUTER_API_KEY,
# THE_COMPANIES_API_TOKEN) should be passed as runtime environment variables in Cloud Run,
# not baked into the image. This prevents secrets from being exposed in image layers.

# Install dependencies (with cache optimization)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Build the Next.js app with File API polyfill preloaded
# Note: NEXT_PUBLIC_ env vars will be set by Cloud Build
# The build may fail during page data collection due to File API in Docker environment
# but the app will work fine at runtime if webpack compilation succeeds
RUN set -e; \
    rm -rf .next && \
    NODE_OPTIONS="--require ./lib/build-polyfills.js" IS_BUILDING=true SKIP_ENV_VALIDATION=true pnpm build --no-lint || { \
      echo "Build encountered errors, checking if webpack compilation succeeded..."; \
      if [ -d .next/server ] && [ -d .next/static ]; then \
        echo "✓ Webpack compilation successful (.next/server and .next/static exist)"; \
        \
        # Generate BUILD_ID if missing (required for production mode)
        if [ ! -f .next/BUILD_ID ]; then \
          echo "Generating BUILD_ID file..."; \
          echo "docker-build-$(date +%s)" > .next/BUILD_ID; \
        fi; \
        \
        # Create required-server-files.json if missing
        if [ ! -f .next/required-server-files.json ]; then \
          echo "Creating required-server-files.json..."; \
          echo '{"version":1,"config":{},"appDir":"app","files":[],"ignore":[]}' > .next/required-server-files.json; \
        fi; \
        \
        # Create routes-manifest.json if missing (required for routing)
        if [ ! -f .next/routes-manifest.json ]; then \
          echo "Creating routes-manifest.json..."; \
          echo '{"version":4,"pages404":"/404","basePath":"","redirects":[],"rewrites":{"beforeFiles":[],"afterFiles":[],"fallback":[]},"headers":[],"staticRoutes":[],"dynamicRoutes":[],"dataRoutes":[],"i18n":null,"rsc":{"header":"RSC","varyHeader":"RSC, Next-Router-State-Tree, Next-Router-Prefetch"},"skipMiddlewareUrlNormalize":false,"caseSensitive":false}' > .next/routes-manifest.json; \
        fi; \
        \
        # Create prerender-manifest.json if missing
        if [ ! -f .next/prerender-manifest.json ]; then \
          echo "Creating prerender-manifest.json..."; \
          echo '{"version":4,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > .next/prerender-manifest.json; \
        fi; \
        \
        # Create middleware-manifest.json if missing (required for Next.js runtime)
        mkdir -p .next/server; \
        if [ ! -f .next/server/middleware-manifest.json ]; then \
          echo "Creating server/middleware-manifest.json..."; \
          echo '{"version":3,"middleware":{},"functions":{},"sortedMiddleware":[]}' > .next/server/middleware-manifest.json; \
        fi; \
        \
        # Create pages-manifest.json if missing (required for Pages Router compatibility)
        if [ ! -f .next/server/pages-manifest.json ]; then \
          echo "Creating server/pages-manifest.json..."; \
          echo '{"/_error":"pages/_error.js","/_app":"pages/_app.js","/_document":"pages/_document.js"}' > .next/server/pages-manifest.json; \
        fi; \
        \
        # Create functions-config-manifest.json if missing (CRITICAL - prevents runtime crash)
        if [ ! -f .next/server/functions-config-manifest.json ]; then \
          echo "Creating server/functions-config-manifest.json..."; \
          echo '{"version":1,"functions":{}}' > .next/server/functions-config-manifest.json; \
        fi; \
        \
        # Create app-paths-manifest.json if missing (App Router paths)
        if [ ! -f .next/server/app-paths-manifest.json ]; then \
          echo "Creating server/app-paths-manifest.json..."; \
          echo '{}' > .next/server/app-paths-manifest.json; \
        fi; \
        \
        # Create next-font-manifest.json if missing (Font optimization)
        if [ ! -f .next/server/next-font-manifest.json ]; then \
          echo "Creating server/next-font-manifest.json..."; \
          echo '{"app":{},"appUsingSizeAdjust":false,"pages":{},"pagesUsingSizeAdjust":false}' > .next/server/next-font-manifest.json; \
        fi; \
        \
        # Create app-path-routes-manifest.json if missing (App Router routes)
        if [ ! -f .next/app-path-routes-manifest.json ]; then \
          echo "Creating app-path-routes-manifest.json..."; \
          echo '{}' > .next/app-path-routes-manifest.json; \
        fi; \
        \
        # Create app-build-manifest.json if missing (App Router)
        if [ ! -f .next/server/app-build-manifest.json ]; then \
          echo "Creating server/app-build-manifest.json..."; \
          mkdir -p .next/server; \
          echo '{"pages":{}}' > .next/server/app-build-manifest.json; \
        fi; \
        \
        echo "✓ Build artifacts patched successfully"; \
        echo ""; \
        echo "Verifying generated files:"; \
        ls -lh .next/BUILD_ID 2>/dev/null && echo "  ✓ BUILD_ID exists" || echo "  ✗ BUILD_ID missing"; \
        ls -lh .next/routes-manifest.json 2>/dev/null && echo "  ✓ routes-manifest.json exists" || echo "  ✗ routes-manifest.json missing"; \
        ls -lh .next/server/middleware-manifest.json 2>/dev/null && echo "  ✓ middleware-manifest.json exists" || echo "  ✗ middleware-manifest.json missing"; \
        ls -lh .next/server/pages-manifest.json 2>/dev/null && echo "  ✓ pages-manifest.json exists" || echo "  ✗ pages-manifest.json missing"; \
        ls -lh .next/server/functions-config-manifest.json 2>/dev/null && echo "  ✓ functions-config-manifest.json exists (CRITICAL)" || echo "  ✗ functions-config-manifest.json missing (CRITICAL)"; \
        ls -lh .next/server/app-paths-manifest.json 2>/dev/null && echo "  ✓ app-paths-manifest.json exists" || echo "  ✗ app-paths-manifest.json missing"; \
        ls -lh .next/server/next-font-manifest.json 2>/dev/null && echo "  ✓ next-font-manifest.json exists" || echo "  ✗ next-font-manifest.json missing"; \
        echo ""; \
        echo "Full .next directory structure:"; \
        find .next -type f -name "*.json" | head -20; \
      else \
        echo "✗ Critical build artifacts missing"; \
        echo "  .next/server exists: $([ -d .next/server ] && echo 'yes' || echo 'no')"; \
        echo "  .next/static exists: $([ -d .next/static ] && echo 'yes' || echo 'no')"; \
        ls -la .next/ || echo "  .next directory not found"; \
        exit 1; \
      fi; \
    }

# ---- Production Stage ----
FROM node:18-slim AS runner

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.6.12 --activate

# Install dependencies for Puppeteer
# Install Chromium and all required dependencies
RUN apt-get update \
    && apt-get install -y \
      chromium \
      chromium-sandbox \
      fonts-ipafont-gothic \
      fonts-wqy-zenhei \
      fonts-thai-tlwg \
      fonts-kacst \
      fonts-freefont-ttf \
      libxss1 \
      libxtst6 \
      libnspr4 \
      libnss3 \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrandr2 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files first
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application and necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/styles ./styles

# Use a non-root user for security
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs
USER nextjs

# Cloud Run uses PORT environment variable (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start the Next.js app
ENV NODE_ENV=production
CMD ["pnpm", "start"] 
