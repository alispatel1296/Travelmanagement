import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);

// Admin-only endpoints
router.post('/', verifyToken, requireRole('admin'), createVehicle);
router.put('/:id', verifyToken, requireRole('admin'), updateVehicle);
router.delete('/:id', verifyToken, requireRole('admin'), deleteVehicle);

export default router;
