import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'cryptashare_jwt_super_secret_production_ready_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  FILE_STORAGE_PATH: process.env.FILE_STORAGE_PATH || path.resolve(__dirname, '../../uploads'),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  RSA_KEY_SIZE: parseInt(process.env.RSA_KEY_SIZE || '2048', 10) // 2048 or 3072
};

if (config.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cryptashare_jwt_super_secret_production_ready_key_2026')) {
  console.warn('⚠️ [SECURITY WARNING] Production instance detected using default or missing JWT_SECRET! Please configure a strong, unique secret.');
}
