import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFile extends Document {
  originalFileName: string;
  storageFileName: string;
  fileSize: number;
  mimeType: string;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  encryptedAESKey: string;     // Base64 (Encrypted with Receiver's RSA Public Key)
  iv: string;                  // Base64 (12 bytes AES-GCM IV)
  authTag: string;             // Base64 (16 bytes AES-GCM tag)
  sha256Hash: string;          // Hex string of the original unencrypted file
  digitalSignature: string;    // Base64 (RSA-PSS signature of sha256Hash by Sender's Private Key)
  expiresAt: Date | null;      // Expiration date or null for never
  status: 'ACTIVE' | 'EXPIRED' | 'TAMPERED' | 'VERIFIED';
  isTampered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    originalFileName: { type: String, required: true },
    storageFileName: { type: String, required: true, unique: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    encryptedAESKey: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    sha256Hash: { type: String, required: true },
    digitalSignature: { type: String, required: true },
    expiresAt: { type: Date, default: null, index: true },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'TAMPERED', 'VERIFIED'], default: 'ACTIVE' },
    isTampered: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const FileRecord = mongoose.model<IFile>('File', FileSchema);
