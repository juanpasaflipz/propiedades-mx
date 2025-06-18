import { Router } from 'express';
import { container } from '../container';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const propertyController = container.get('propertyController');

// Search properties with optional auth for favorites
router.get('/search', optionalAuth, propertyController.searchProperties);

// Get property statistics
router.get('/stats', propertyController.getPropertyStats);

// Get specific property
router.get('/:id', propertyController.getPropertyById);

// Get properties by location
router.get('/country/:country', propertyController.getPropertiesByCountry);
router.get('/city/:city', propertyController.getPropertiesByCity);

export const propertyRoutes = router; 