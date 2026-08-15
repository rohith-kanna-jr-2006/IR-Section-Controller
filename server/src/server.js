import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectMongo, connectRedis } from './config/database.js';

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}

const startServer = async () => {
  await connectMongo();
  await connectRedis();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();
