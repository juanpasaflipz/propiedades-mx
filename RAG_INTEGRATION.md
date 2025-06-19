# RAG Integration for Real Estate Aggregator

## Overview

We've successfully integrated RAG (Retrieval-Augmented Generation) capabilities into your existing real estate aggregator. This enhancement provides semantic search, AI-powered insights, and conversational property discovery.

## What's New

### 1. **Embedding Service** (`apps/api/src/services/embedding.service.ts`)
- Generates vector embeddings for property descriptions using OpenAI
- Caches embeddings for performance
- Batch processing support
- Creates rich text representations of properties for better search

### 2. **Enhanced Property Service** (`apps/api/src/services/property-enhanced.service.ts`)
- **Semantic Search**: Find properties using natural language queries
- **Similar Properties**: Discover similar listings based on embeddings
- **Neighborhood Insights**: AI-generated market summaries
- **Hybrid Search**: Combines SQL filters with vector similarity

### 3. **New API Endpoints** (`/api/ai/v2/`)

#### Semantic Search
```bash
POST /api/ai/v2/semantic-search
{
  "query": "casa moderna con alberca en zona tranquila",
  "filters": {
    "city": "Guadalajara",
    "maxPrice": 5000000
  },
  "limit": 10,
  "includeExplanation": true
}
```

#### Find Similar Properties
```bash
POST /api/ai/v2/similar-properties
{
  "propertyId": "12345",
  "limit": 5
}
```

#### Neighborhood Insights
```bash
POST /api/ai/v2/neighborhood-insights
{
  "neighborhood": "Polanco",
  "city": "Ciudad de México"
}
```

#### Conversational Search
```bash
POST /api/ai/v2/conversational-search
{
  "message": "Busco una casa para mi familia con 3 hijos",
  "conversationId": "conv_123",
  "context": [
    {"role": "user", "content": "Necesito 4 recámaras"},
    {"role": "assistant", "content": "Entiendo, buscaré casas con 4 recámaras..."}
  ]
}
```

### 4. **Background Workers**

#### Embedding Worker (`apps/api/src/workers/embedding-worker.ts`)
- Automatically generates embeddings for new properties
- Updates embeddings when properties change
- Runs every minute in production
- Processes properties in batches of 50

#### Summary Worker (`apps/api/src/workers/summary-worker.ts`)
- Generates daily neighborhood market summaries
- Creates insights for different price bands
- Uses GPT-4 to analyze market trends
- Runs once per day

### 5. **Database Schema Updates** (`migrations/003_add_embeddings.sql`)
- **property_embeddings**: Stores vector embeddings with pgvector
- **neighborhood_summaries**: Caches AI-generated market summaries
- **search_history**: Tracks queries for improving recommendations

## How to Use

### 1. Run Database Migration
```bash
cd apps/api
npm run db:migrate
```

### 2. Enable Workers
Set environment variable to enable workers in development:
```bash
ENABLE_WORKERS=true npm run dev
```

Workers automatically start in production.

### 3. Test Semantic Search
```bash
# Natural language search
curl -X POST http://localhost:5001/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "casa familiar con jardín cerca de escuelas",
    "limit": 5,
    "includeExplanation": true
  }'
```

### 4. Generate Initial Embeddings
For existing properties, you can manually trigger embedding generation:
```bash
# This happens automatically, but you can force it:
curl -X POST http://localhost:5001/api/admin/generate-embeddings
```

## Configuration

### Environment Variables
```env
# Existing variables work as-is
OPENAI_API_KEY=sk-...

# Optional: Control workers
ENABLE_WORKERS=true  # Enable workers in development
```

### Performance Tuning
- Embedding batch size: 50 properties (adjustable in worker)
- Cache TTL: 24 hours
- Worker intervals:
  - Embedding: 1 minute
  - Summary: 24 hours

## Architecture Benefits

1. **No Breaking Changes**: All existing endpoints continue to work
2. **Progressive Enhancement**: New features are additive
3. **Scalable Design**: Workers process data asynchronously
4. **Cost Efficient**: Embeddings are cached and reused
5. **Language Aware**: Works with Spanish and English queries

## Next Steps

1. **Monitor Performance**
   - Check embedding generation progress in logs
   - Monitor OpenAI API usage

2. **Fine-tune Search**
   - Adjust similarity thresholds
   - Customize property text representation

3. **Enhance Scrapers** (Optional)
   - Extract richer descriptions
   - Capture neighborhood features
   - Add structured amenities

## Troubleshooting

### Embeddings Not Generating
- Check OpenAI API key is set
- Verify workers are running: `ENABLE_WORKERS=true`
- Check logs for errors

### Search Not Working
- Ensure database migration was run
- Verify pgvector extension is enabled
- Check that properties have embeddings

### Performance Issues
- Reduce batch size in workers
- Increase cache TTL
- Add database indexes if needed