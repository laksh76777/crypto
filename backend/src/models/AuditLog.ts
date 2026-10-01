import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId | null;
  fileId?: Types.ObjectId | null;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    fileId: { type: Schema.Types.ObjectId, ref: 'File', default: null, index: true },
    action: {
      type: String,
      required: true,
      index: true
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      required: true
    },
    ipAddress: { type: String, default: '127.0.0.1' },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
