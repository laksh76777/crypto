import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

import dns from 'dns';

// Ensure Node.js uses reliable public DNS to prevent ISP/router DNS timeout on Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if system restricts custom DNS servers
}

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    return 'Already connected';
  }

  // If MONGODB_URI is provided, try to connect to it first
  if (config.MONGODB_URI) {
    const connectOptions: mongoose.ConnectOptions = {
      dbName: 'vericrypt',
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2
    };

    // Attempt 1 with Atlas
    try {
      await mongoose.connect(config.MONGODB_URI, connectOptions);
      console.log(`[Database] Connected to configured MongoDB at ${config.MONGODB_URI}`);
      return config.MONGODB_URI;
    } catch (err: any) {
      console.warn(`[Database] Initial connection attempt to configured MONGODB_URI failed: ${err?.message || err}. Retrying once...`);
      try {
        await mongoose.connect(config.MONGODB_URI, connectOptions);
        console.log(`[Database] Connected to configured MongoDB on retry at ${config.MONGODB_URI}`);
        return config.MONGODB_URI;
      } catch (retryErr: any) {
        console.warn(`[Database] Could not connect to configured MONGODB_URI after retry: ${retryErr?.message || retryErr}. Falling back to embedded MongoMemoryServer...`);
      }
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
