-- Check embedding generation progress
SELECT 
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(*) FROM property_embeddings) as embedded_properties,
  ROUND(
    (SELECT COUNT(*)::numeric FROM property_embeddings) / 
    (SELECT COUNT(*)::numeric FROM properties) * 100, 
    2
  ) as percentage_complete;

-- Check some sample embeddings
SELECT 
  pe.property_id,
  p.address,
  p.city,
  p.bedrooms,
  p.price_amount
FROM property_embeddings pe
JOIN properties p ON p.id = pe.property_id::uuid
LIMIT 5;