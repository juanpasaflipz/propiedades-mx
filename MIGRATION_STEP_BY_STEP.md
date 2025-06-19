# Step-by-Step Guide to Run RAG Migration

## Method 1: Using Supabase SQL Editor (EASIEST)

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your project (the one with 314 properties)

### Step 2: Navigate to SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. You'll see a blank SQL query window

### Step 3: Copy the Migration SQL
Copy this entire SQL code:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create property embeddings table
CREATE TABLE IF NOT EXISTS property_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR(255) NOT NULL UNIQUE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS property_embeddings_embedding_idx 
ON property_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for property_id lookups
CREATE INDEX IF NOT EXISTS property_embeddings_property_id_idx 
ON property_embeddings(property_id);

-- Create neighborhood summaries table
CREATE TABLE IF NOT EXISTS neighborhood_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  summary TEXT NOT NULL,
  avg_price_rent NUMERIC,
  avg_price_sale NUMERIC,
  total_listings INTEGER DEFAULT 0,
  price_band TEXT CHECK (price_band IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(neighborhood, city, price_band)
);

-- Create search history table for improving recommendations
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  query_embedding vector(1536),
  filters JSONB,
  results_count INTEGER DEFAULT 0,
  user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_property_embeddings_updated_at BEFORE UPDATE
ON property_embeddings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_neighborhood_summaries_updated_at BEFORE UPDATE
ON neighborhood_summaries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION search_similar_properties(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  property_id varchar(255),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.property_id,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM property_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Step 4: Run the Migration
1. Paste the SQL code into the SQL Editor
2. Click the **"Run"** button (usually a play icon ▶️)
3. You should see "Success. No rows returned" or similar message

### Step 5: Verify Tables Were Created
Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('property_embeddings', 'neighborhood_summaries', 'search_history');
```

You should see all 3 tables listed.

---

## Method 2: Using Render Shell

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com/
2. Log in to your account
3. Find your service: **"real-estate-aggregator-api"**

### Step 2: Open Shell
1. Click on your service name
2. In the top navigation, click on **"Shell"** tab
3. Wait for the shell to load (may take 10-30 seconds)

### Step 3: Navigate to API Directory
Type this command in the shell:
```bash
cd /opt/render/project/src/apps/api
```

### Step 4: Run Migration Command
Type this command:
```bash
npm run db:migrate
```

### Step 5: Verify Success
You should see output like:
```
Running migrations...
Executing migration: 003_add_embeddings.sql
✓ Migration completed successfully
```

---

## What Happens Next (Automatic)

### Within 1 minute:
- The embedding worker will detect 314 unembedded properties
- It will start generating embeddings in batches of 50
- You'll see in logs: "Processing 50 unembedded properties..."

### Within 5-10 minutes:
- All 314 properties will have embeddings
- Semantic search will start working
- You'll see: "No unembedded properties found, checking for stale embeddings"

### Within 24 hours:
- Summary worker will generate neighborhood insights
- Market summaries will be available

---

## Test If It Worked

After 5 minutes, test the semantic search:

```bash
curl -X POST https://real-estate-aggregator-api.onrender.com/api/ai/v2/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "casa con 3 recámaras",
    "limit": 3
  }'
```

If successful, you'll get property results with AI-powered relevance scoring!

---

## Troubleshooting

### If pgvector extension fails:
In Supabase, first run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then run the rest of the migration.

### If migration says "already exists":
This is fine! The migration is idempotent and won't duplicate data.

### If semantic search still fails after 10 minutes:
Check Render logs for any OpenAI API errors.