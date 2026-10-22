import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import userRoutes from './routes/userRoutes';
import auditRoutes from './routes/auditRoutes';
import adminRoutes from './routes/adminRoutes';
import { config } from './config/env';

const app = express();

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');

      // Localhost origins (dev / testing)
      if (normalizedOrigin.startsWith('http://localhost:') || normalizedOrigin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Check configured CLIENT_URL list (supports comma-separated origins)
      const allowedUrls = (config.CLIENT_URL || '')
        .split(',')
        .map((u) => u.trim().replace(/\/$/, ''))
        .filter(Boolean);

      if (allowedUrls.includes('*') || allowedUrls.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow any Vercel production or preview deployment (*.vercel.app)
      if (normalizedOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      if (config.NODE_ENV === 'production') {
        return callback(new Error(`CORS access denied for origin: ${origin}`));
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VeriCrypt Backend',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);

// 404 Not Found Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('[Error Handler]', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

export default app;
