-- Create scraper_status table for monitoring scraping operations
CREATE TABLE IF NOT EXISTS scraper_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('idle', 'running', 'failed')),
  total_scraped INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for scraper name
CREATE INDEX idx_scraper_status_name ON scraper_status(name);

-- Create scraper_logs table for detailed logging
CREATE TABLE IF NOT EXISTS scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_name VARCHAR(100) NOT NULL,
  run_id UUID NOT NULL,
  level VARCHAR(20) CHECK (level IN ('info', 'warn', 'error')),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for scraper logs
CREATE INDEX idx_scraper_logs_scraper_name ON scraper_logs(scraper_name);
CREATE INDEX idx_scraper_logs_run_id ON scraper_logs(run_id);
CREATE INDEX idx_scraper_logs_created_at ON scraper_logs(created_at);

-- Add unique constraint on properties to prevent duplicates
ALTER TABLE properties ADD CONSTRAINT unique_property_listing 
  UNIQUE NULLS NOT DISTINCT (source, address, city);