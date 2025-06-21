import { Router } from 'express';
import { container } from '../container';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Get controller lazily to avoid initialization issues
const getPropertyController = () => container.get('propertyController');

// Debug endpoint to test database connection
router.get('/debug/test', async (req, res) => {
  try {
    const pool = container.get('pool');
    const result = await pool.query('SELECT COUNT(*) FROM properties');
    res.json({
      success: true,
      count: result.rows[0].count,
      message: 'Database connection successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

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