import { AuditLog } from '../../models/AuditLog';
import { Types } from 'mongoose';

export interface CreateAuditLogParams {
  userId?: Types.ObjectId | string | null;
  fileId?: Types.ObjectId | string | null;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Records a security audit log event.
   * Strips out any sensitive cryptographic material or password fields before writing.
   */
  static async logEvent(params: CreateAuditLogParams): Promise<void> {
    try {
      const sanitizedMeta: Record<string, any> = {};
      if (params.metadata) {
        for (const [key, value] of Object.entries(params.metadata)) {
          // Never log raw secret keys or passwords
          if (
            ['password', 'passwordHash', 'privateKey', 'aesKey', 'secret', 'token'].some(s =>
              key.toLowerCase().includes(s)
            )
          ) {
            sanitizedMeta[key] = '[REDACTED]';
          } else {
            sanitizedMeta[key] = value;
          }
        }
      }

      await AuditLog.create({
        userId: params.userId ? new Types.ObjectId(params.userId.toString()) : null,
        fileId: params.fileId ? new Types.ObjectId(params.fileId.toString()) : null,
        action: params.action,
        result: params.result,
        ipAddress: params.ipAddress || '127.0.0.1',
        timestamp: new Date(),
        metadata: sanitizedMeta
      });
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err);
    }
  }

  /**
   * Retrieves audit logs with optional filtering.
   */
  static async getLogs(filter: { userId?: string; action?: string; limit?: number }) {
    const query: any = {};
    if (filter.userId) {
      query.userId = filter.userId;
    }
    if (filter.action) {
      query.action = filter.action;
    }
    const limit = filter.limit || 100;

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email role')
      .populate('fileId', 'originalFileName status');
  }
}
