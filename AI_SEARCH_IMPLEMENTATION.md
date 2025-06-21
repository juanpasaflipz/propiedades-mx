# LLM-Driven Contextual Search Implementation

## Overview

This document describes the implemented LLM-driven contextual search architecture for Propiedades MX, which enables natural language property searches with semantic understanding and AI-powered ranking.

## Architecture Components

### 1. Vector Embeddings (✅ Implemented)

**Database Setup:**
- PostgreSQL with pgvector extension enabled
- `property_embeddings` table stores 1536-dimensional vectors
- IVFFlat index for efficient similarity search
- Automatic embedding generation via background worker

**Embedding Service:**
- Uses OpenAI's `text-embedding-ada-002` model
- Supports both Spanish and English text
- Language detection for optimal embedding generation
- LRU cache to reduce API calls
- Batch processing with rate limiting

### 2. Semantic Search API (✅ Implemented)

**Endpoint:** `POST /api/ai/v2/semantic-search`

**Features:**
- Natural language query processing
- Vector similarity search using pgvector
- Hybrid search combining vector + SQL filters
- LLM re-ranking for relevance optimization
- Multi-language support (Spanish/English)
- Explanations for search results

**Request Example:**
```json
{
  "query": "casa moderna con alberca cerca de escuelas",
  "filters": {
    "city": "Ciudad de México",
    "maxPrice": 5000000
  },
  "limit": 20,
  "includeExplanation": true,
  "useLLMReranking": true,
  "language": "es"
}
```

### 3. LLM Re-ranking Service (✅ Implemented)

**Features:**
- Uses GPT-4o-mini for intelligent result ranking
- Considers user intent and property features
- Provides relevance scores (0-1)
- Generates match explanations in Spanish/English
- Context-aware ranking based on Mexican market

**Re-ranking Process:**
1. Vector search returns initial candidates
2. LLM analyzes query intent
3. Properties scored based on relevance
4. Results sorted by LLM relevance score
5. Explanations generated for top matches

### 4. Frontend Integration (✅ Implemented)

**Components:**
- `SemanticPropertySearch`: Main search component with AI features
- `useSemanticSearch`: React hook for semantic search
- Toggle between traditional and AI-powered search
- Real-time relevance scores and explanations
- Demo page at `/demo/semantic-search`

**Features:**
- Natural language input with examples
- Visual relevance indicators
- Match explanations (optional)
- Language auto-detection
- Smooth animations and loading states

### 5. Language Support (✅ Implemented)

**Spanish Optimization:**
- Property embeddings generated in Spanish by default
- Spanish-specific keywords for language detection
- Bilingual property text representation
- Query enhancement in detected language

**Language Detection Keywords:**
- Spanish: casa, departamento, recámara, baño, jardín, etc.
- English: house, apartment, bedroom, bathroom, garden, etc.

### 6. Background Processing (✅ Implemented)

**Embedding Worker:**
- Runs every minute in production
- Automatically generates embeddings for new properties
- Updates stale embeddings
- Batch processing with configurable size
- Error handling and retry logic

**Manual Embedding Generation:**
- Endpoint: `POST /api/ai/v2/generate-embeddings`
- Generate embeddings for specific properties or all
- Regenerate option for updating existing embeddings
- Progress tracking and statistics

### 7. Monitoring & Analytics (✅ Implemented)

**Embedding Statistics Endpoint:** `GET /api/ai/v2/embedding-stats`

Returns:
- Total properties
- Properties with/without embeddings
- Oldest/newest embedding timestamps
- Coverage percentage

## API Endpoints Summary

### Semantic Search
- `POST /api/ai/v2/semantic-search` - Natural language property search
- `POST /api/ai/v2/enhance-query` - Query enhancement with context
- `POST /api/ai/v2/similar-properties` - Find similar properties
- `POST /api/ai/v2/conversational-search` - Chat-based search

### Embedding Management
- `POST /api/ai/v2/generate-embeddings` - Manual embedding generation
- `GET /api/ai/v2/embedding-stats` - Embedding coverage statistics

### Analysis & Generation
- `POST /api/ai/v2/neighborhood-insights` - AI neighborhood analysis
- `POST /api/ai/v2/generate-description` - AI property descriptions

## Usage Examples

### 1. Basic Semantic Search
```bash
curl -X POST http://localhost:3002/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "casa con 3 recámaras en zona tranquila",
    "limit": 10
  }'
```

### 2. Advanced Search with Filters
```bash
curl -X POST http://localhost:3002/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "modern apartment with pool near metro",
    "filters": {
      "city": "Ciudad de México",
      "propertyType": "apartment",
      "minBedrooms": 2,
      "maxPrice": 3000000
    },
    "includeExplanation": true,
    "language": "en"
  }'
```

### 3. Generate Embeddings
```bash
curl -X POST http://localhost:3002/api/ai/v2/generate-embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "regenerate": false
  }'
```

## Performance Considerations

### Optimization Strategies
1. **Caching**: 24-hour TTL for embeddings
2. **Batch Processing**: 10 properties per batch
3. **Rate Limiting**: 100ms delay between batches
4. **Vector Index**: IVFFlat with 100 lists
5. **Hybrid Search**: Combines vector + SQL for efficiency

### Scalability
- Embedding generation can be parallelized
- Vector search scales with pgvector indexes
- LLM re-ranking can be toggled off for speed
- Frontend caches search results

## Future Enhancements

### Planned Features
1. **Geospatial Search** (Todo #8)
   - School proximity queries
   - PostGIS integration
   - Distance-based ranking

2. **Advanced Hybrid Search** (Todo #10)
   - Weighted combination of vector + SQL scores
   - Custom similarity thresholds
   - Filter-aware embeddings

3. **Redis Caching**
   - Distributed embedding cache
   - Search result caching
   - Session-based personalization

4. **Multi-modal Search**
   - Image-based property search
   - Floor plan analysis
   - Virtual tour integration

## Environment Variables

Required for AI features:
```bash
OPENAI_API_KEY=sk-...  # Required for embeddings and LLM features
```

Optional optimizations:
```bash
REDIS_URL=redis://...  # For distributed caching
EMBEDDING_BATCH_SIZE=10  # Batch size for embedding generation
EMBEDDING_WORKER_INTERVAL=60000  # Worker interval in ms
```

## Troubleshooting

### Common Issues

1. **No embeddings generated**
   - Check OPENAI_API_KEY is set
   - Verify embedding worker is running
   - Check API usage limits

2. **Slow search performance**
   - Ensure pgvector indexes are created
   - Consider disabling LLM re-ranking
   - Check database connection pool

3. **Language detection issues**
   - Queries default to Spanish
   - Can override with language parameter
   - Check keyword lists in embedding service

### Debug Tools
- Embedding stats: `/api/ai/v2/embedding-stats`
- Search logs in API console
- Frontend demo at `/demo/semantic-search`

## Conclusion

The implemented LLM-driven search architecture provides a sophisticated, production-ready solution for natural language property searches. It combines vector embeddings, semantic understanding, and intelligent ranking to deliver highly relevant results in both Spanish and English.