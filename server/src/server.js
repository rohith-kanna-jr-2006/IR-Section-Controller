import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectMongo, connectRedis, redisClient } from './config/database.js';
import mongoose from 'mongoose';
import { initSocket } from './config/socket.js';

const PORT = 3000;

const startServer = async () => {
  // Connect to DB and seed before accepting requests
  await connectMongo();
  connectRedis();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
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
