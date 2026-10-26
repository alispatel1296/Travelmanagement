import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  verifyBoardingToken
} from '../controllers/bookingController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin can view all passenger bookings and manifest
router.get('/', verifyToken, requireRole('admin'), getAllBookings);

// Passenger endpoints
router.post('/', verifyToken, createBooking);
router.get('/my', verifyToken, getMyBookings);
router.patch('/:id/cancel', verifyToken, cancelBooking);

// Driver / Admin can verify and check in boarding passes
router.post('/verify-token', verifyToken, requireRole('driver', 'admin'), verifyBoardingToken);

export default router;
