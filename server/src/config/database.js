import mongoose from 'mongoose';
import Redis from 'ioredis';

export const connectMongo = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ir-section-controller';
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection error:', error);
    // Do not exit process for redis failure in phase 1, just log it.
  }
};
