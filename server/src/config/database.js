import mongoose from 'mongoose';
import Redis from 'ioredis';

let isMongoConnecting = false;

export const connectMongo = () => {
  if (isMongoConnecting || mongoose.connection.readyState === 1) return;
  isMongoConnecting = true;
  
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ir-section-controller';
  
  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
  }).then(() => {
    console.log('MongoDB connected successfully');
    isMongoConnecting = false;
  }).catch((error) => {
    console.error('MongoDB initial connection error. Will retry on next request or let mongoose auto-reconnect if possible. Error:', error.message);
    isMongoConnecting = false;
  });
};

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 5) {
      console.error('Redis connection retries exceeded. Stopping retries.');
      return null; // Stop retrying after 5 attempts
    }
    const delay = Math.min(times * 1000, 5000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

export const connectRedis = () => {
  redisClient.connect().catch((error) => {
    console.error('Redis initial connection error:', error.message);
  });
};
