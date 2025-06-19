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