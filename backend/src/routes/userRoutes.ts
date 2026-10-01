import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/recipients', UserController.getRecipients);
router.get('/statistics', UserController.getStatistics);

export default router;
