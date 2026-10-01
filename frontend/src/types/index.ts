export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'DISABLED';
  publicKey?: string;
  createdAt: string;
}

export interface FileRecord {
  _id: string;
  originalFileName: string;
  storageFileName: string;
  fileSize: number;
  mimeType: string;
  senderId: User | string;
  receiverId: User | string;
  encryptedAESKey: string;
  iv: string;
  authTag: string;
  sha256Hash: string;
  digitalSignature: string;
  expiresAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'TAMPERED' | 'VERIFIED';
  isTampered: boolean;
  createdAt: string;
  updatedAt: string;
  isExpired?: boolean;
}

export interface VerificationResult {
  fileId: string;
  originalFileName: string;
  isExpired: boolean;
  aesKeyDecrypted: boolean;
  aesGcmAuthPassed: boolean;
  sha256Matched: boolean;
  signatureVerified: boolean;
  allChecksPassed: boolean;
  originalHash: string;
  computedHash?: string;
  errorMessage?: string;
}

export interface AuditLog {
  _id: string;
  userId?: User | null;
  fileId?: FileRecord | null;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemStats {
  totalFiles: number;
  sentCount: number;
  receivedCount: number;
  verifiedCount: number;
  failedVerificationCount: number;
  expiredCount: number;
  totalUsers: number;
  activeUsers: number;
}
