import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';

const router = Router();
const propertyController = new PropertyController();

// Search properties with filters
router.get('/search', propertyController.searchProperties);

// Get property by ID
router.get('/:id', propertyController.getPropertyById);

// Get properties by country
router.get('/country/:country', propertyController.getPropertiesByCountry);

// Get properties by city
router.get('/city/:city', propertyController.getPropertiesByCity);

export const propertyRoutes = router; 