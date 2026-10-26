import express from 'express';
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  deleteRoute
} from '../controllers/routeController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

// Admin-only endpoints
router.post('/', verifyToken, requireRole('admin'), createRoute);
router.delete('/:id', verifyToken, requireRole('admin'), deleteRoute);

export default router;
