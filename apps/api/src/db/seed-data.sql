-- Seed data for testing
-- This adds sample properties to the database

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE properties CASCADE;

-- Insert sample properties
INSERT INTO properties (
  source, country, state_province, city, neighborhood, address,
  coordinates_lat, coordinates_lng, transaction_type, price_amount,
  price_currency, property_type, bedrooms, bathrooms, area_sqm,
  listing_date, last_updated, description, images
) VALUES 
-- Polanco properties
(
  'manual', 'Mexico', 'CDMX', 'Ciudad de México', 'Polanco',
  'Av. Presidente Masaryk 123', 19.4326, -99.1332, 'rent', 45000,
  'MXN', 'house', 4, 3, 320, NOW(), NOW(),
  'Casa moderna en Polanco con acabados de lujo y jardín privado',
  ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800']
),
(
  'manual', 'Mexico', 'CDMX', 'Ciudad de México', 'Polanco',
  'Calle Homero 456', 19.4340, -99.1910, 'sale', 8500000,
  'MXN', 'apartment', 3, 3, 250, NOW(), NOW(),
  'Penthouse de lujo con vista panorámica en la mejor zona de Polanco',
  ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800']
),
(
  'manual', 'Mexico', 'CDMX', 'Ciudad de México', 'Polanco',
  'Av. Horacio 789', 19.4350, -99.1920, 'rent', 35000,
  'MXN', 'apartment', 2, 2, 150, NOW(), NOW(),
  'Departamento con jardín en Polanco, pet-friendly',
  ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']
),

-- Condesa properties
(
  'manual', 'Mexico', 'CDMX', 'Ciudad de México', 'Condesa',
  'Av. Amsterdam 234', 19.4115, -99.1650, 'rent', 22000,
  'MXN', 'apartment', 1, 1, 85, NOW(), NOW(),
  'Loft de artista en el corazón de la Condesa',
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800']
),
(
  'manual', 'Mexico', 'CDMX', 'Ciudad de México', 'Condesa',
  'Calle Tamaulipas 567', 19.4120, -99.1680, 'sale', 5200000,
  'MXN', 'house', 3, 2, 280, NOW(), NOW(),
  'Casa colonial renovada en la Condesa con patio interior',
  ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800']
),

-- Roma Norte properties
(
  'manual', 'Mexico', 'CDMX', 'Ciudad de México', 'Roma Norte',
  'Calle Orizaba 123', 19.4170, -99.1600, 'rent', 25000,
  'MXN', 'apartment', 2, 1, 100, NOW(), NOW(),
  'Departamento renovado en Roma Norte cerca de cafés y restaurantes',
  ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']
),

-- Beach properties
(
  'manual', 'Mexico', 'Quintana Roo', 'Playa del Carmen', 'Centro',
  'Av. 5ta con Calle 38', 20.6296, -87.0739, 'sale', 5800000,
  'MXN', 'condo', 2, 2, 120, NOW(), NOW(),
  'Condominio frente al mar en Playa del Carmen',
  ARRAY['https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=800']
),
(
  'manual', 'Mexico', 'Quintana Roo', 'Tulum', 'Aldea Zama',
  'Calle Kinich Ahau', 20.2114, -87.4654, 'sale', 9500000,
  'MXN', 'house', 4, 4, 380, NOW(), NOW(),
  'Casa de playa en Tulum con diseño eco-chic',
  ARRAY['https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=800']
),

-- Other cities
(
  'manual', 'Mexico', 'Jalisco', 'Guadalajara', 'Chapalita',
  'Av. Guadalupe 890', 20.6597, -103.3496, 'rent', 15000,
  'MXN', 'apartment', 1, 1, 70, NOW(), NOW(),
  'Loft moderno en zona céntrica de Guadalajara',
  ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800']
),
(
  'manual', 'Mexico', 'Nuevo León', 'Monterrey', 'San Pedro',
  'Av. Vasconcelos 1234', 25.6866, -100.3161, 'sale', 6800000,
  'MXN', 'house', 4, 3, 350, NOW(), NOW(),
  'Casa familiar en San Pedro Garza García',
  ARRAY['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800']
);

-- Add more amenities to some properties
UPDATE properties 
SET amenities = ARRAY['parking', 'pool', 'gym', 'security', 'garden']
WHERE property_type = 'house' AND price_amount > 5000000;

UPDATE properties 
SET amenities = ARRAY['parking', 'gym', 'security', 'pet-friendly']
WHERE property_type = 'apartment' AND transaction_type = 'rent';

-- Verify the data was inserted
SELECT 
  city, 
  COUNT(*) as property_count,
  AVG(price_amount) as avg_price,
  MIN(price_amount) as min_price,
  MAX(price_amount) as max_price
FROM properties 
GROUP BY city
ORDER BY property_count DESC;