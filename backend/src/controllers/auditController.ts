import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/audit/auditService';

export class AuditController {
  static async getLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      const userId = isAdmin ? (req.query.userId as string) : req.user!.id;
      const action = req.query.action as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const logs = await AuditService.getLogs({
        userId,
        action,
        limit
      });

      res.status(200).json({
        success: true,
        message: 'Security audit logs retrieved',
        data: logs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
