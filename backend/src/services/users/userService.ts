import { User } from '../../models/User';
import { FileRecord } from '../../models/File';
import { AuditLog } from '../../models/AuditLog';

export class UserService {
  /**
   * Retrieves list of eligible recipients (all active users except the requester).
   */
  static async getRecipients(currentUserId: string) {
    return User.find({
      _id: { $ne: currentUserId },
      status: 'ACTIVE'
    })
      .select('name email publicKey role createdAt')
      .sort({ name: 1 });
  }

  /**
   * Admin: Retrieves all registered users.
   */
  static async getAllUsers() {
    return User.find()
      .select('-passwordHash -encryptedPrivateKey')
      .sort({ createdAt: -1 });
  }

  /**
   * Admin: Updates user status ('ACTIVE' | 'DISABLED').
   */
  static async updateUserStatus(userId: string, status: 'ACTIVE' | 'DISABLED') {
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-passwordHash -encryptedPrivateKey');

    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Calculates dashboard statistics for a given user or entire system (admin).
   */
  static async getStatistics(userId?: string) {
    const fileQuery: any = {};
    if (userId) {
      fileQuery.$or = [{ senderId: userId }, { receiverId: userId }];
    }

    const totalFiles = await FileRecord.countDocuments(fileQuery);
    const sentCount = userId ? await FileRecord.countDocuments({ senderId: userId }) : await FileRecord.countDocuments();
    const receivedCount = userId ? await FileRecord.countDocuments({ receiverId: userId }) : totalFiles;
    
    const verifiedLogs = await AuditLog.countDocuments({
      action: 'INTEGRITY_VERIFIED',
      result: 'SUCCESS',
      ...(userId ? { userId } : {})
    });

    const failedLogs = await AuditLog.countDocuments({
      action: 'INTEGRITY_FAILED',
      result: 'FAILURE',
      ...(userId ? { userId } : {})
    });

    const now = new Date();
    const expiredCount = await FileRecord.countDocuments({
      ...fileQuery,
      expiresAt: { $ne: null, $lt: now }
    });

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });

    return {
      totalFiles,
      sentCount,
      receivedCount,
      verifiedCount: verifiedLogs,
      failedVerificationCount: failedLogs,
      expiredCount,
      totalUsers,
      activeUsers
    };
  }
}
