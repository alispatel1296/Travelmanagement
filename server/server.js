import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TransFleet API Engine',
    timestamp: new Date().toISOString()
  });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend assets from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

import databaseRoutes from './routes/databaseRoutes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/database', databaseRoutes);

// SPA Fallback for client routes
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database initialization and server bootstrap
async function startServer() {
  try {
    console.log('[Server] Initializing TransFleet Database...');
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 TransFleet Backend running on: http://localhost:${PORT}`);
      console.log(`📌 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Error during startup:', error);
    process.exit(1);
  }
}

startServer();
