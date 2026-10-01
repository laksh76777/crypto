import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { AuthService } from './services/auth/authService';
import { User } from './models/User';
import { FileService } from './services/files/fileService';

const startServer = async () => {
  try {
    // Ensure upload directory exists
    FileService.ensureUploadDir();

    // Connect to MongoDB (or launch MongoMemoryServer if no DB URI is supplied)
    await connectDatabase();

    // Ensure default 3 primary accounts always exist
    const defaultAccounts = [
      { name: 'Laksh Suthar', email: 'laksh@gmail.com', password: 'Password123!', role: 'USER' as const },
      { name: 'Paritosh Nilmani', email: 'paritosh@gmail.com', password: 'Password123!', role: 'USER' as const },
      { name: 'Admin User', email: 'admin@gmail.com', password: 'Password123!', role: 'ADMIN' as const }
    ];

    for (const acc of defaultAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        console.log(`[Bootstrap] Creating missing account: ${acc.email}...`);
        await AuthService.register(acc);
      }
    }

    const server = app.listen(config.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🛡️  VeriCrypt Hybrid Cryptographic Backend Running`);
      console.log(`📡 URL: http://localhost:${config.PORT}`);
      console.log(`🔒 Encryption: AES-256-GCM + RSA-OAEP (${config.RSA_KEY_SIZE}-bit)`);
      console.log(`✍️  Integrity & Signatures: SHA-256 + RSA-PSS`);
      console.log(`=======================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Shutdown] Closing server...');
      server.close(() => {
        console.log('[Shutdown] Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();
