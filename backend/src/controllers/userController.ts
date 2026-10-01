import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/users/userService';

export class UserController {
  /**
   * Returns list of users who can receive files.
   */
  static async getRecipients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const recipients = await UserService.getRecipients(req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Eligible recipients retrieved',
        data: recipients
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Admin: Returns all users.
   */
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        success: true,
        message: 'Users retrieved',
        data: users
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Admin: Updates user status.
   */
  static async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'DISABLED'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status. Must be ACTIVE or DISABLED' });
        return;
      }

      const updatedUser = await UserService.updateUserStatus(req.params.id, status);
      res.status(200).json({
        success: true,
        message: `User status updated to ${status}`,
        data: updatedUser
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Returns user / system dashboard statistics.
   */
  static async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      const stats = await UserService.getStatistics(isAdmin ? undefined : req.user!.id);

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved',
        data: stats
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
