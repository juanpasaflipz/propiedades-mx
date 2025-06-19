# Run Database Migration for RAG Features

## Current Status
✅ API is deployed and connected to Supabase
✅ 314 properties exist in the database
✅ OpenAI key is set in Render
❌ RAG tables don't exist yet (migration needed)

## How to Run Migration

### Option 1: Using Render Shell (Recommended)

1. Go to your Render dashboard
2. Navigate to your `real-estate-aggregator-api` service
3. Click on "Shell" tab
4. Run these commands:

```bash
cd /opt/render/project/src/apps/api
npm run db:migrate
```

### Option 2: Run Locally Against Production Database

1. In your local terminal:
```bash
cd /Users/juan/Desktop/VS Code/re-aggregator-consolidation/real-estate-aggregator-mx/apps/api

# Set the production database URL
export DATABASE_URL="your-supabase-database-url"

# Run migration
npm run db:migrate
```

### Option 3: Run Migration SQL Directly in Supabase

1. Go to Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `apps/api/migrations/003_add_embeddings.sql`
4. Execute the SQL

## What the Migration Creates

1. **property_embeddings** table - Stores vector embeddings for semantic search
2. **neighborhood_summaries** table - Stores AI-generated market insights
3. **search_history** table - Tracks user queries for analytics

## After Migration

Once migration is complete:

1. **Embedding Worker** will automatically start processing all 314 properties
   - Takes about 5-10 minutes to complete
   - Generates embeddings at ~50 properties/minute

2. **Summary Worker** will generate neighborhood insights
   - Runs once per day
   - Creates summaries for each city

3. **Test Semantic Search**:
```bash
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "casa moderna con jardín",
    "limit": 5,
    "includeExplanation": true
  }'
```

## Monitor Progress

Watch the Render logs for:
- "Processing 50 unembedded properties"
- "Generated embeddings for property..."
- "Processed 50 properties, 264 remaining"

## Verify Success

After 5-10 minutes, test the features:

```bash
# Should return properties with AI explanations
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "casa familiar", "limit": 3}'

# Should return neighborhood insights
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/neighborhood-insights \
  -H "Content-Type: application/json" \
  -d '{"city": "Benito Juárez"}'
```