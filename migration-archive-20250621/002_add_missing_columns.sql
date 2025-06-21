-- Add listing_date column if it doesn't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS listing_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add last_updated column if it doesn't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update any null values
UPDATE properties 
SET listing_date = COALESCE(listing_date, created_at, CURRENT_TIMESTAMP)
WHERE listing_date IS NULL;

UPDATE properties 
SET last_updated = COALESCE(last_updated, updated_at, CURRENT_TIMESTAMP)
WHERE last_updated IS NULL;