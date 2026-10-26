import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', verifyToken, requireRole('admin'), getDashboardAnalytics);

export default router;
