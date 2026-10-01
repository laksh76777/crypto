import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    return 'Already connected';
  }

  // If MONGODB_URI is provided, try to connect to it first
  if (config.MONGODB_URI) {
    try {
      await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
      console.log(`[Database] Connected to configured MongoDB at ${config.MONGODB_URI}`);
      return config.MONGODB_URI;
    } catch (err) {
      console.warn(`[Database] Could not connect to configured MONGODB_URI. Falling back to embedded MongoMemoryServer...`);
    }
  }

  // In-memory Mongo fallback
  console.log('[Database] Starting in-memory MongoDB server for seamless zero-setup execution...');
  mongoMemoryServer = await MongoMemoryServer.create({
    binary: {
      version: '4.4.18'
    }
  });
  const uri = mongoMemoryServer.getUri();
  await mongoose.connect(uri);
  console.log(`[Database] Connected to in-memory MongoDB at ${uri}`);
  return uri;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
  console.log('[Database] Disconnected from MongoDB');
};
