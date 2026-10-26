import express from 'express';
import { register, login, getMe, getDrivers } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/drivers', verifyToken, getDrivers);

export default router;
