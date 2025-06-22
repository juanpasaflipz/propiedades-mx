-- Add listing_url column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS listing_url TEXT;

-- Add index for listing_url lookups
CREATE INDEX IF NOT EXISTS idx_properties_listing_url ON properties(listing_url);

-- Update existing properties with placeholder URLs where contact_info contains URLs
UPDATE properties 
SET listing_url = contact_info 
WHERE contact_info LIKE 'http%' 
AND listing_url IS NULL;