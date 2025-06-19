# RAG Integration Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration
```bash
# SSH to your server
ssh user@your-server

# Navigate to API directory
cd /path/to/real-estate-aggregator-mx/apps/api

# Run migration
npm run db:migrate
```

### 2. Install Dependencies
```bash
# Update package dependencies
cd apps/api
npm install
```

### 3. Environment Variables
Add to your `.env` file if not already present:
```env
# Required (should already exist)
OPENAI_API_KEY=sk-...

# Optional - Enable workers in staging/dev
ENABLE_WORKERS=true
```

### 4. Build the Application
```bash
# In the monorepo root
npm run build
```

## Deployment Commands

### For Render.com
```bash
# Deployment happens automatically on push to main
# But ensure these settings in Render dashboard:

# Build Command:
npm install && npm run build

# Start Command:
npm run start:prod

# Environment Variables:
# Add ENABLE_WORKERS=true in production
```

### For Manual VPS Deployment
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
cd apps/api && npm run db:migrate && cd ../..

# Build all apps
npm run build

# Restart services
pm2 restart all
# or
docker-compose restart
```

## Post-Deployment Verification

### 1. Check Database Migration
```sql
-- Connect to your database and verify tables exist
\dt property_embeddings
\dt neighborhood_summaries
\dt search_history
```

### 2. Test Health Check
```bash
curl https://your-api-domain.com/health
```

### 3. Test Semantic Search
```bash
curl -X POST https://your-api-domain.com/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "casa en guadalajara con 3 recámaras",
    "limit": 3
  }'
```

### 4. Monitor Workers
Check logs to ensure workers are running:
```bash
# Check for these log messages:
# "Starting embedding worker"
# "Starting summary worker"

# On Render:
# Check logs in dashboard

# On VPS:
pm2 logs api
# or
docker logs your-api-container
```

### 5. Monitor OpenAI Usage
- Check OpenAI dashboard for API usage
- Embedding generation will create initial spike
- Should stabilize after first run

## Rollback Plan

If issues arise:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout previous version
git checkout 77caf0a
```

## Expected Behavior

1. **First 5-10 minutes**: Workers will process existing properties
2. **Embedding Generation**: ~50 properties per minute
3. **API Response**: Existing endpoints unchanged
4. **New Endpoints**: Available at `/api/ai/v2/*`

## Troubleshooting

### Workers Not Running
- Check `ENABLE_WORKERS` env var in production
- Verify OpenAI API key is set
- Check logs for worker errors

### Embeddings Not Generating
- Ensure pgvector extension is enabled
- Check database connection
- Verify migration was successful

### Search Returns No Results
- Wait for embeddings to generate (5-10 min)
- Check if properties exist in database
- Verify OpenAI API key has access to embeddings model