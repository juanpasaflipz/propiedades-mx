import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      api: true,
      // Database will be false until we set up PostgreSQL
      database: false,
      redis: false
    }
  });
});

export default router;