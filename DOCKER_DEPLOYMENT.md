# Docker Deployment Guide

## Building the Docker Image

### Local Build
```bash
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id" \
  -t myjobv2 .
```

### Local Run with Secrets
```bash
docker run -p 3000:3000 \
  -e FIREBASE_SERVICE_ACCOUNT_KEY='{"your":"service_account_json"}' \
  -e SERPAPI_KEY="your_serpapi_key" \
  -e OPENROUTER_API_KEY="your_openrouter_key" \
  -e THE_COMPANIES_API_TOKEN="your_companies_api_token" \
  myjobv2
```

## Google Cloud Run Deployment

### Build and Push to Google Container Registry
```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Build the image
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/myjobv2 \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID"
```

### Deploy to Cloud Run
```bash
gcloud run deploy myjobv2 \
  --image gcr.io/$PROJECT_ID/myjobv2 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account:latest" \
  --set-secrets "SERPAPI_KEY=serpapi-key:latest" \
  --set-secrets "OPENROUTER_API_KEY=openrouter-api-key:latest" \
  --set-secrets "THE_COMPANIES_API_TOKEN=companies-api-token:latest" \
  --memory 2Gi \
  --timeout 300 \
  --max-instances 10
```

## Managing Secrets in Google Secret Manager

### Create Secrets
```bash
# Create secrets in Google Secret Manager
echo -n "your_firebase_service_account_json" | gcloud secrets create firebase-service-account --data-file=-
echo -n "your_serpapi_key" | gcloud secrets create serpapi-key --data-file=-
echo -n "your_openrouter_key" | gcloud secrets create openrouter-api-key --data-file=-
echo -n "your_companies_api_token" | gcloud secrets create companies-api-token --data-file=-
```

### Grant Access to Cloud Run Service Account
```bash
# Get the Cloud Run service account email
SERVICE_ACCOUNT=$(gcloud run services describe myjobv2 --platform managed --region us-central1 --format 'value(spec.template.spec.serviceAccountName)')

# Grant secret accessor role
gcloud secrets add-iam-policy-binding firebase-service-account --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding serpapi-key --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding openrouter-api-key --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding companies-api-token --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
```

## Docker Compose for Local Development

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        NEXT_PUBLIC_FIREBASE_API_KEY: ${NEXT_PUBLIC_FIREBASE_API_KEY}
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
        NEXT_PUBLIC_FIREBASE_APP_ID: ${NEXT_PUBLIC_FIREBASE_APP_ID}
    ports:
      - "3000:3000"
    environment:
      - FIREBASE_SERVICE_ACCOUNT_KEY=${FIREBASE_SERVICE_ACCOUNT_KEY}
      - SERPAPI_KEY=${SERPAPI_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - THE_COMPANIES_API_TOKEN=${THE_COMPANIES_API_TOKEN}
    env_file:
      - .env.local
```

Then run with:
```bash
docker-compose up --build
```

**Note**: The docker-compose.yml includes Chromium/Puppeteer optimizations:
- `seccomp:unconfined` - Required for Chromium sandboxing in Docker
- `shm_size: '2gb'` - Shared memory for Chromium (prevents crashes on large pages)

## Troubleshooting

### Chromium/Puppeteer Issues
If you encounter issues with Puppeteer/Chromium:
- Ensure sufficient memory is allocated (at least 2Gi for Cloud Run)
- Check that Chromium is properly installed: `docker run --rm myjobv2 chromium --version`
- Verify Puppeteer can find Chromium: `docker run --rm myjobv2 sh -c "node -e \"console.log(process.env.PUPPETEER_EXECUTABLE_PATH)\""`
- Run the comprehensive test script: `docker run --rm myjobv2 node test-chromium.js`
- The Dockerfile uses Chromium (open-source) instead of Chrome for better compatibility with Debian Slim

**Common Chromium Issues:**
- **Memory errors**: Increase shared memory size (`shm_size: '2gb'` in docker-compose.yml)
- **Permission errors**: Ensure `seccomp:unconfined` security option is set
- **Timeout errors**: Increase timeout values in Puppeteer launch options
- **Large page crashes**: Use `--disable-dev-shm-usage` flag in Puppeteer args

### Build Warnings
The Dockerfile now properly separates:
- **Build-time secrets**: Only `NEXT_PUBLIC_*` variables (these are embedded in the client bundle)
- **Runtime secrets**: API keys and service accounts (passed as environment variables/secrets at runtime)

This approach prevents sensitive data from being baked into the Docker image layers.

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use Google Secret Manager** for production deployments
3. **Rotate secrets regularly**
4. **Use least-privilege service accounts**
5. **Enable Cloud Armor** for DDoS protection
6. **Set up Cloud Monitoring** for suspicious activity
