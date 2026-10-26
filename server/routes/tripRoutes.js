import express from 'express';
import {
  getAllTrips,
  getTripById,
  createTrip,
  advanceTripStop,
  updateTripStatus,
  getDriverTrips
} from '../controllers/tripController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllTrips);
router.get('/my-assigned', verifyToken, requireRole('driver', 'admin'), getDriverTrips);
router.get('/:id', getTripById);

// Admin-only creation
router.post('/', verifyToken, requireRole('admin'), createTrip);

// Driver & Admin dispatch operations
router.patch('/:id/advance-stop', verifyToken, requireRole('driver', 'admin'), advanceTripStop);
router.patch('/:id/status', verifyToken, requireRole('driver', 'admin'), updateTripStatus);

export default router;
