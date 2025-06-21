-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state_province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100),
  postal_code VARCHAR(20),
  address TEXT NOT NULL,
  coordinates_lat DECIMAL(10, 8) NOT NULL,
  coordinates_lng DECIMAL(11, 8) NOT NULL,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('rent', 'sale')),
  price_amount DECIMAL(15, 2) NOT NULL,
  price_currency VARCHAR(3) NOT NULL,
  property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('house', 'apartment', 'condo', 'commercial', 'land')),
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  area_sqm DECIMAL(10, 2) NOT NULL,
  lot_size_sqm DECIMAL(10, 2),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  description TEXT,
  contact_info TEXT,
  listing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common search fields
CREATE INDEX idx_properties_country ON properties(country);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_transaction_type ON properties(transaction_type);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_price_amount ON properties(price_amount);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_bathrooms ON properties(bathrooms);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 