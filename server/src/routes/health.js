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
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.status === 'ready' ? 'connected' : 'disconnected';
  
  if (mongoStatus !== 'connected') {
    return res.status(503).json({ status: 'error', reason: 'Database unavailable' });
  }

  res.json({
    status: 'ready',
    mongo: mongoStatus,
    redis: redisStatus
  });
});

export default router;
