import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectMongo, connectRedis, redisClient } from './config/database.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}

const startServer = () => {
  // Start DB connection attempts in the background
  connectMongo();
  connectRedis();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(async () => {
      console.log('HTTP server closed.');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      }
      if (redisClient.status === 'ready') {
        redisClient.quit();
        console.log('Redis connection closed.');
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
