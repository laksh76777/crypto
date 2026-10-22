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

    const now = new Date();

    const [
      totalFiles,
      sentCount,
      receivedCount,
      verifiedLogs,
      failedLogs,
      expiredCount,
      totalUsers,
      activeUsers
    ] = await Promise.all([
      FileRecord.countDocuments(fileQuery),
      userId ? FileRecord.countDocuments({ senderId: userId }) : FileRecord.countDocuments(),
      userId ? FileRecord.countDocuments({ receiverId: userId }) : FileRecord.countDocuments(fileQuery),
      AuditLog.countDocuments({
        action: 'INTEGRITY_VERIFIED',
        result: 'SUCCESS',
        ...(userId ? { userId } : {})
      }),
      AuditLog.countDocuments({
        action: 'INTEGRITY_FAILED',
        result: 'FAILURE',
        ...(userId ? { userId } : {})
      }),
      FileRecord.countDocuments({
        ...fileQuery,
        expiresAt: { $ne: null, $lt: now }
      }),
      User.countDocuments(),
      User.countDocuments({ status: 'ACTIVE' })
    ]);

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
