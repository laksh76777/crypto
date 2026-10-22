import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileRecord, IFile } from '../../models/File';
import { User } from '../../models/User';
import { CryptoService } from '../crypto/cryptoService';
import { AuditService } from '../audit/auditService';
import { config } from '../../config/env';

export interface ShareFileOptions {
  senderId: string;
  receiverId: string;
  senderPassword: string;
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType?: string;
  expirationHours?: number; // 1, 24, 168 (7 days), or 0 for Never
  ipAddress?: string;
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

export class FileService {
  /**
   * Ensures the storage directory exists.
   */
  static ensureUploadDir(): void {
    if (!fs.existsSync(config.FILE_STORAGE_PATH)) {
      fs.mkdirSync(config.FILE_STORAGE_PATH, { recursive: true });
    }
  }

  /**
   * Encrypts and shares a file from sender to recipient using Hybrid Cryptography:
   * 1. Unlocks sender's RSA private key using sender's password
   * 2. Computes original file's SHA-256 hash
   * 3. Digitally signs the hash with sender's private key (RSA-PSS)
   * 4. Generates a fresh 256-bit AES key and random 12-byte IV
   * 5. Encrypts file with AES-256-GCM, producing ciphertext and authentication tag
   * 6. Encrypts AES key with receiver's RSA public key (RSA-OAEP)
   * 7. Persists only encrypted file and security package metadata
   */
  static async shareFile(options: ShareFileOptions): Promise<IFile> {
    const {
      senderId,
      receiverId,
      senderPassword,
      fileBuffer,
      originalFileName,
      mimeType = 'application/octet-stream',
      expirationHours,
      ipAddress
    } = options;

    this.ensureUploadDir();

    // 1. Fetch sender and receiver concurrently
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);
    if (!sender) {
      throw new Error('Sender user not found');
    }
    if (!receiver) {
      throw new Error('Recipient user not found');
    }
    if (receiver.status === 'DISABLED') {
      throw new Error('Recipient account is disabled');
    }

    // 2. Unlock sender's private RSA key
    let senderPrivateKeyPem: string;
    try {
      senderPrivateKeyPem = CryptoService.decryptPrivateKey(sender.encryptedPrivateKey, senderPassword);
    } catch (err) {
      await AuditService.logEvent({
        userId: senderId,
        action: 'UNAUTHORIZED_ACCESS',
        result: 'FAILURE',
        ipAddress,
        metadata: { reason: 'Incorrect sender password while unlocking private key' }
      });
      throw new Error('Invalid sender password. Could not unlock your private RSA key for signing.');
    }

    // 3. Calculate SHA-256 Hash of original file
    const sha256Hash = CryptoService.calculateSHA256(fileBuffer);

    // 4. Create RSA-PSS digital signature over the SHA-256 hash
    const digitalSignature = CryptoService.signHash(sha256Hash, senderPrivateKeyPem);

    // 5. Generate random 256-bit AES Key
    const aesKey = CryptoService.generateAESKey();

    // 6. Encrypt file with AES-256-GCM
    const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(fileBuffer, aesKey);

    // 7. Encrypt the ephemeral AES key with Recipient's RSA Public Key (RSA-OAEP)
    const encryptedAESKey = CryptoService.encryptAESKeyWithRSA(aesKey, receiver.publicKey);

    // Validate file size and filename
    if (!originalFileName || originalFileName.trim() === '') {
      throw new Error('Filename cannot be empty');
    }
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Cannot upload empty file');
    }
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error('File exceeds maximum allowable size (50MB)');
    }

    // 8. Sanitize filename and prevent path traversal
    const sanitizedOriginalName = path.basename(originalFileName).replace(/[\/\\]/g, '_');
    const storageId = crypto.randomUUID();
    const storageFileName = `${storageId}.enc`;
    const storageFilePath = path.resolve(config.FILE_STORAGE_PATH, storageFileName);

    // Verify storageFilePath is strictly contained within config.FILE_STORAGE_PATH
    const normalizedStorageDir = path.resolve(config.FILE_STORAGE_PATH);
    if (!storageFilePath.startsWith(normalizedStorageDir)) {
      throw new Error('Path traversal attempt detected in storage path');
    }

    // Write ONLY the ciphertext to persistent disk
    fs.writeFileSync(storageFilePath, ciphertext);

    // 9. Compute expiration timestamp
    let expiresAt: Date | null = null;
    if (expirationHours && expirationHours > 0) {
      expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    }

    // 10. Save metadata in DB
    const fileRecord = await FileRecord.create({
      originalFileName: sanitizedOriginalName,
      storageFileName,
      fileSize: fileBuffer.length,
      mimeType,
      senderId: sender._id,
      receiverId: receiver._id,
      encryptedAESKey,
      iv,
      authTag,
      sha256Hash,
      digitalSignature,
      expiresAt,
      status: 'ACTIVE',
      isTampered: false
    });

    // 11. Audit logs
    await AuditService.logEvent({
      userId: senderId,
      fileId: fileRecord._id,
      action: 'FILE_UPLOADED',
      result: 'SUCCESS',
      ipAddress,
      metadata: { originalFileName, fileSize: fileBuffer.length }
    });

    await AuditService.logEvent({
      userId: senderId,
      fileId: fileRecord._id,
      action: 'FILE_ENCRYPTED',
      result: 'SUCCESS',
      ipAddress,
      metadata: { algorithm: 'AES-256-GCM', keyProtection: 'RSA-OAEP', signature: 'RSA-PSS' }
    });

    await AuditService.logEvent({
      userId: senderId,
      fileId: fileRecord._id,
      action: 'FILE_SHARED',
      result: 'SUCCESS',
      ipAddress,
      metadata: { receiverId: receiver._id.toString(), receiverEmail: receiver.email }
    });

    return fileRecord;
  }

  /**
   * Verifies the cryptographic integrity and digital signature of a file package.
   */
  static async verifyFile(
    fileId: string,
    recipientId: string,
    recipientPassword: string,
    ipAddress?: string
  ): Promise<{ result: VerificationResult; decryptedBuffer?: Buffer }> {
    const file = await FileRecord.findById(fileId).populate('senderId', 'name email publicKey');
    if (!file) {
      throw new Error('File not found');
    }

    // Check expiration
    if (file.expiresAt && new Date() > file.expiresAt) {
      file.status = 'EXPIRED';
      await file.save();
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'FILE_EXPIRED',
        result: 'FAILURE',
        ipAddress,
        metadata: { originalFileName: file.originalFileName }
      });

      return {
        result: {
          fileId: file._id.toString(),
          originalFileName: file.originalFileName,
          isExpired: true,
          aesKeyDecrypted: false,
          aesGcmAuthPassed: false,
          sha256Matched: false,
          signatureVerified: false,
          allChecksPassed: false,
          originalHash: file.sha256Hash,
          errorMessage: 'This file package has expired and can no longer be accessed.'
        }
      };
    }

    const receiver = await User.findById(recipientId);
    if (!receiver) {
      throw new Error('Receiver user not found');
    }

    // Read ciphertext from disk
    const storageFilePath = path.join(config.FILE_STORAGE_PATH, file.storageFileName);
    if (!fs.existsSync(storageFilePath)) {
      throw new Error('Encrypted file payload missing from storage');
    }
    const ciphertext = fs.readFileSync(storageFilePath);

    const verification: VerificationResult = {
      fileId: file._id.toString(),
      originalFileName: file.originalFileName,
      isExpired: false,
      aesKeyDecrypted: false,
      aesGcmAuthPassed: false,
      sha256Matched: false,
      signatureVerified: false,
      allChecksPassed: false,
      originalHash: file.sha256Hash
    };

    // Step 1: Unlock Receiver's private RSA key
    let receiverPrivateKeyPem: string;
    try {
      receiverPrivateKeyPem = CryptoService.decryptPrivateKey(receiver.encryptedPrivateKey, recipientPassword);
    } catch (err) {
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'UNAUTHORIZED_ACCESS',
        result: 'FAILURE',
        ipAddress,
        metadata: { reason: 'Incorrect recipient password when attempting to decrypt private key' }
      });
      verification.errorMessage = 'Incorrect password. Could not unlock your private RSA key.';
      return { result: verification };
    }

    // Step 2: Decrypt ephemeral AES key using RSA-OAEP
    let aesKey: Buffer;
    try {
      aesKey = CryptoService.decryptAESKeyWithRSA(file.encryptedAESKey, receiverPrivateKeyPem);
      verification.aesKeyDecrypted = true;
    } catch (err: any) {
      verification.errorMessage = `RSA-OAEP key decryption failed: ${err.message}`;
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'UNAUTHORIZED_ACCESS',
        result: 'FAILURE',
        ipAddress,
        metadata: { reason: 'RSA-OAEP AES key recovery failed: private key mismatch' }
      });
      return { result: verification };
    }

    // Step 3: Decrypt ciphertext with AES-256-GCM (Verifying authentication tag)
    let decryptedBuffer: Buffer;
    try {
      decryptedBuffer = CryptoService.decryptFileWithAES(ciphertext, aesKey, file.iv, file.authTag);
      verification.aesGcmAuthPassed = true;
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'FILE_DECRYPTED',
        result: 'SUCCESS',
        ipAddress
      });
    } catch (err: any) {
      verification.aesGcmAuthPassed = false;
      verification.errorMessage = `SECURITY ALERT: File integrity verification failed. The file may have been modified or corrupted. (AES-256-GCM authentication failed: Ciphertext or authentication tag was modified)`;
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'INTEGRITY_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { reason: 'AES-GCM authentication tag mismatch' }
      });
      return { result: verification };
    }

    // Step 4: Calculate SHA-256 hash of decrypted file and compare
    const computedHash = CryptoService.calculateSHA256(decryptedBuffer);
    verification.computedHash = computedHash;

    if (computedHash === file.sha256Hash) {
      verification.sha256Matched = true;
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'INTEGRITY_VERIFIED',
        result: 'SUCCESS',
        ipAddress,
        metadata: { hash: computedHash }
      });
    } else {
      verification.sha256Matched = false;
      verification.errorMessage = 'SECURITY ALERT: File integrity verification failed. The file may have been modified or corrupted. (SHA-256 hash mismatch! Decrypted file does not match original digest)';
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'INTEGRITY_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { expected: file.sha256Hash, computed: computedHash }
      });
      return { result: verification };
    }

    // Step 5: Verify Sender's RSA-PSS digital signature over sha256Hash
    const sender = file.senderId as any;
    if (!sender || !sender.publicKey) {
      verification.signatureVerified = false;
      verification.errorMessage = 'Sender public key not found in database. Sender record may have been deleted.';
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'SIGNATURE_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { reason: 'Sender public key not found in database' }
      });
      return { result: verification };
    }

    const isSigValid = CryptoService.verifySignature(file.sha256Hash, file.digitalSignature, sender.publicKey);

    if (isSigValid) {
      verification.signatureVerified = true;
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'SIGNATURE_VERIFIED',
        result: 'SUCCESS',
        ipAddress,
        metadata: { senderEmail: sender.email }
      });
    } else {
      verification.signatureVerified = false;
      verification.errorMessage = 'RSA-PSS Digital signature verification failed! Sender authenticity could not be verified.';
      await AuditService.logEvent({
        userId: recipientId,
        fileId: file._id,
        action: 'SIGNATURE_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { senderEmail: sender.email }
      });
      return { result: verification };
    }

    // Set file status to VERIFIED upon successful end-to-end cryptographic integrity verification
    verification.allChecksPassed = true;
    file.status = 'VERIFIED';
    await file.save();

    return { result: verification, decryptedBuffer };
  }

  /**
   * Tampering demonstration feature (Section 17):
   * Safely modifies stored ciphertext on disk to demonstrate detection by AES-GCM and SHA-256.
   */
  static async simulateTampering(fileId: string, ipAddress?: string): Promise<void> {
    const file = await FileRecord.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const storageFilePath = path.join(config.FILE_STORAGE_PATH, file.storageFileName);
    if (!fs.existsSync(storageFilePath)) {
      throw new Error('Storage file does not exist');
    }

    // Create a backup of pristine ciphertext if not already created
    const backupFilePath = path.join(config.FILE_STORAGE_PATH, `${file.storageFileName}.bak`);
    if (!fs.existsSync(backupFilePath)) {
      fs.copyFileSync(storageFilePath, backupFilePath);
    }

    const data = fs.readFileSync(storageFilePath);
    if (data.length > 0) {
      // Flip bits in the middle of ciphertext
      const offset = Math.floor(data.length / 2);
      data[offset] = data[offset] ^ 0xff;
      fs.writeFileSync(storageFilePath, data);
    }

    file.isTampered = true;
    file.status = 'TAMPERED';
    await file.save();

    await AuditService.logEvent({
      fileId: file._id,
      action: 'FILE_TAMPERED_DEMO',
      result: 'WARNING',
      ipAddress,
      metadata: { originalFileName: file.originalFileName, note: 'Simulated tampering applied for security demonstration' }
    });
  }

  /**
   * Restores pristine ciphertext from backup to demonstrate recovery after tampering.
   */
  static async restoreTampering(fileId: string, ipAddress?: string): Promise<void> {
    const file = await FileRecord.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const storageFilePath = path.join(config.FILE_STORAGE_PATH, file.storageFileName);
    const backupFilePath = path.join(config.FILE_STORAGE_PATH, `${file.storageFileName}.bak`);
    if (fs.existsSync(backupFilePath)) {
      fs.copyFileSync(backupFilePath, storageFilePath);
    }

    file.isTampered = false;
    file.status = 'ACTIVE';
    await file.save();

    await AuditService.logEvent({
      fileId: file._id,
      action: 'FILE_RESTORED_DEMO',
      result: 'SUCCESS',
      ipAddress,
      metadata: { originalFileName: file.originalFileName, note: 'Pristine ciphertext restored from backup' }
    });
  }
}
