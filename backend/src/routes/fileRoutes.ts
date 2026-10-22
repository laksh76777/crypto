import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { FileController } from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.php', '.pl', '.cgi',
  '.vbs', '.msi', '.com', '.scr', '.pif', '.hta', '.cpl', '.jar'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Upload blocked: Executable or script file type (${ext}) is forbidden.`));
    }
    cb(null, true);
  }
});

const router = Router();

// Apply authentication to all file routes
router.use(authenticateToken);

// File operations
router.post('/upload', apiLimiter, upload.single('file') as any, FileController.share);
router.post('/share', apiLimiter, upload.single('file') as any, FileController.share);
router.get('/sent', FileController.getSentFiles);
router.get('/received', FileController.getReceivedFiles);
router.get('/:id', FileController.getFileById);

// Rate-limited sensitive cryptographic endpoints
router.post('/:id/verify', apiLimiter, FileController.verifyFile);
router.post('/:id/download', apiLimiter, FileController.downloadFile);
router.get('/:id/download', apiLimiter, FileController.downloadFile);

// Tampering simulation endpoints (strictly development & testing environments only)
router.post('/:id/tamper', FileController.simulateTamper);
router.post('/:id/restore', FileController.restoreTamper);

export default router;
