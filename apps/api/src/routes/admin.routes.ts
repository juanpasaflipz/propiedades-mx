import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// API Monitoring routes
router.get('/api-logs', adminController.getApiLogs);
router.get('/api-stats', adminController.getApiStats);
router.get('/api-providers', adminController.getApiProviders);
router.put('/api-providers/:id', adminController.updateApiProvider);

export const adminRoutes = router;