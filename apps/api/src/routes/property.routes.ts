import { Router } from 'express';
import { container } from '../container';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Get controller lazily to avoid initialization issues
const getPropertyController = () => container.get('propertyController');

// Search properties with optional auth for favorites
router.get('/search', optionalAuth, (req, res, next) => getPropertyController().searchProperties(req, res, next));

// Get property statistics
router.get('/stats', (req, res, next) => getPropertyController().getPropertyStats(req, res, next));

// Get specific property
router.get('/:id', (req, res, next) => getPropertyController().getPropertyById(req, res, next));

// Get properties by location
router.get('/country/:country', (req, res, next) => getPropertyController().getPropertiesByCountry(req, res, next));
router.get('/city/:city', (req, res, next) => getPropertyController().getPropertiesByCity(req, res, next));

export const propertyRoutes = router; 