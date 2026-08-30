import mongoose from 'mongoose';
import { seedDatabase } from './autoSeed.js';

let mongoMemoryServerInstance = null;
let isMongoConnecting = false;

export const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (isMongoConnecting) return;
  isMongoConnecting = true;

  try {
    let connected = false;
    let uri = process.env.MONGO_URI;

    if (uri) {
      try {
        console.log(`[AI Studio] Attempting connection to configured MONGO_URI...`);
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 2000
        });
        console.log('[AI Studio] Connected to external MongoDB successfully!');
        connected = true;
      } catch (err) {
        console.warn(`[AI Studio] Configured MONGO_URI unreachable (${err.message}). Falling back to MongoMemoryServer.`);
      }
    }

    if (!connected) {
      console.log('[AI Studio] Initializing in-memory MongoMemoryServer...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
      const memUri = mongoMemoryServerInstance.getUri();
      console.log(`[AI Studio] MongoMemoryServer created at ${memUri}`);

      await mongoose.connect(memUri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log('[AI Studio] Connected to MongoMemoryServer database successfully!');
    }

    // Automatically seed data into the database
    await seedDatabase();
  } catch (error) {
    console.error('[AI Studio] Fatal error initializing MongoDB:', error);
  } finally {
    isMongoConnecting = false;
  }
};

// In-memory Redis store stub
const store = new Map();
export const redisClient = {
  status: 'ready',
  get: async (k) => store.get(k) ?? null,
  set: async (k, v) => { store.set(k, v); return 'OK'; },
  del: async (k) => store.delete(k),
  incr: async (k) => { const n = (store.get(k) || 0) + 1; store.set(k, n); return n; },
  on: (event, cb) => {
    if (event === 'connect') setTimeout(cb, 0);
  },
  connect: async () => {},
  quit: async () => {
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
  },
};

export const connectRedis = () => {
  console.log('[AI Studio] Using in-memory Redis client');
};
