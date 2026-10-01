import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuditController } from '../controllers/auditController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/users', UserController.getAllUsers);
router.patch('/users/:id/status', UserController.updateUserStatus);
router.get('/statistics', UserController.getStatistics);
router.get('/audit-logs', AuditController.getLogs);

export default router;
