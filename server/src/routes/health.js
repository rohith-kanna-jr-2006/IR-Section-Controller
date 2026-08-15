import { Router } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/database.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ir-section-controller',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/ready', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'available' : 'unavailable';
  const redisStatus = redisClient.status === 'ready' ? 'available' : 'unavailable';
  
  if (mongoStatus !== 'available' || redisStatus !== 'available') {
    return res.status(503).json({
      status: 'not_ready',
      dependencies: {
        mongodb: mongoStatus,
        redis: redisStatus
      }
    });
  }

  res.json({
    status: 'ready',
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

export default router;
