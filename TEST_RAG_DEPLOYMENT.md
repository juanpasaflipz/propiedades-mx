# Testing RAG Deployment

## Current Status
- ✅ API is deployed and running
- ✅ Health check is working
- ❌ RAG endpoints are returning errors
- ❌ No properties in database

## Why RAG is Not Working Yet

1. **Database Migration Not Run**
   - The `property_embeddings`, `neighborhood_summaries`, and `search_history` tables don't exist
   - Run migration: `cd apps/api && npm run db:migrate`

2. **Environment Variables**
   - Ensure `OPENAI_API_KEY` is set in Render dashboard
   - Workers need `ENABLE_WORKERS=true` (already in render.yaml)

3. **No Properties in Database**
   - The database appears to be empty
   - Need to populate with property data first

## Test Commands

### 1. Check API Health
```bash
curl https://real-estate-aggregator-api.onrender.com/health
```

### 2. Test Semantic Search (After Migration)
```bash
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "casa con 3 recámaras en Guadalajara",
    "limit": 5
  }'
```

### 3. Test Similar Properties
```bash
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/similar-properties \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_PROPERTY_ID",
    "limit": 3
  }'
```

### 4. Test Neighborhood Insights
```bash
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/neighborhood-insights \
  -H "Content-Type: application/json" \
  -d '{
    "neighborhood": "Polanco",
    "city": "Ciudad de México"
  }'
```

### 5. Test Conversational Search
```bash
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/conversational-search \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Busco una casa para mi familia con 3 hijos",
    "conversationId": "test-123"
  }'
```

## Monitoring Workers

Check Render logs for:
- "Starting embedding worker"
- "Starting summary worker"
- "Processing X unembedded properties"
- "Generated X neighborhood summaries"

## Expected Timeline

1. **After Migration** (Immediate)
   - Tables will be created
   - Endpoints will stop returning table errors

2. **After First Property Added** (1-2 minutes)
   - Embedding worker will generate embeddings
   - Property will be searchable via semantic search

3. **After Multiple Properties** (5-10 minutes)
   - Summary worker will generate neighborhood insights
   - Similar properties will work

## Debugging Steps

1. **Check Render Logs**
   ```bash
   # In Render dashboard, view logs for error details
   ```

2. **Verify Migration**
   ```sql
   -- Connect to database and run:
   \dt property_embeddings
   \dt neighborhood_summaries
   \dt search_history
   ```

3. **Test OpenAI Connection**
   ```bash
   # Check if OpenAI key is working
   curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

## Next Steps

1. **Run Database Migration** (Most Important!)
   - SSH into server or use Render shell
   - Navigate to `/opt/render/project/src/apps/api`
   - Run `npm run db:migrate`

2. **Add OPENAI_API_KEY**
   - Go to Render dashboard
   - Add environment variable: `OPENAI_API_KEY=sk-...`

3. **Populate Properties**
   - Use scraper or add test data
   - Workers will automatically process new properties

4. **Monitor Logs**
   - Watch for embedding generation
   - Check for any errors