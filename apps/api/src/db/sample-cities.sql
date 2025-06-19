-- Sample SQL to check what cities are in the database
SELECT DISTINCT city, COUNT(*) as property_count 
FROM properties 
WHERE city IS NOT NULL 
GROUP BY city 
ORDER BY property_count DESC
LIMIT 50;

-- Common Mexican cities/neighborhoods that might be in the database:
-- Mexico City areas: Polanco, Condesa, Roma Norte, Roma Sur, Coyoacán, Del Valle, Santa Fe, Lomas de Chapultepec
-- Other cities: Guadalajara, Monterrey, Playa del Carmen, Cancún, Puerto Vallarta, Querétaro

-- If you need to update city names to match common searches:
-- UPDATE properties SET city = 'Polanco' WHERE LOWER(city) = 'polanco';
-- UPDATE properties SET city = 'Condesa' WHERE LOWER(city) = 'condesa';
-- UPDATE properties SET city = 'Roma Norte' WHERE LOWER(city) = 'roma norte';
-- UPDATE properties SET city = 'Santa Fe' WHERE LOWER(city) = 'santa fe';