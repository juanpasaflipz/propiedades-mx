import { Router } from 'express';
import { container } from '../container';
import { AdminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();
const adminController = container.get<AdminController>('adminController');

// Apply admin authentication to all routes
router.use(requireAdmin);

// API Monitoring routes
router.get('/api-logs', adminController.getApiLogs);
router.get('/api-stats', adminController.getApiStats);
router.get('/api-providers', adminController.getApiProviders);
router.put('/api-providers/:id', adminController.updateApiProvider);

export const adminRoutes = router;