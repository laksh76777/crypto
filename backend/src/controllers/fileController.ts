import mongoose from 'mongoose';
import path from 'path';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { FileService } from '../services/files/fileService';
import { FileRecord } from '../models/File';
import { AuditService } from '../services/audit/auditService';
import { config } from '../config/env';

export class FileController {
  /**
   * Uploads, encrypts, and shares a file package with a recipient.
   */
  static async share(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please select a file to upload' });
        return;
      }

      const { receiverId, senderPassword, expirationHours } = req.body;

      if (!receiverId || !senderPassword) {
        res.status(400).json({
          success: false,
          message: 'Recipient and your password (to unlock your private key) are required'
        });
        return;
      }

      const hours = expirationHours ? parseInt(expirationHours, 10) : 0;

      const fileRecord = await FileService.shareFile({
        senderId: req.user!.id,
        receiverId,
        senderPassword,
        fileBuffer: req.file.buffer,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        expirationHours: hours,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'File encrypted with AES-256-GCM, signed with RSA-PSS, and shared successfully.',
        data: {
          fileId: fileRecord._id,
          originalFileName: fileRecord.originalFileName,
          fileSize: fileRecord.fileSize,
          receiverId: fileRecord.receiverId,
          sha256Hash: fileRecord.sha256Hash,
          expiresAt: fileRecord.expiresAt,
          status: fileRecord.status,
          createdAt: fileRecord.createdAt
        }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'File sharing failed'
      });
    }
  }

  /**
   * Returns list of files sent by current user.
   */
  static async getSentFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const files = await FileRecord.find({ senderId: req.user!.id })
        .populate('receiverId', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Sent files retrieved',
        data: files
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Returns list of files received by current user.
   */
  static async getReceivedFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const files = await FileRecord.find({ receiverId: req.user!.id })
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Received files retrieved',
        data: files
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Returns details for a single file package (with authorization check).
   */
  static async getFileById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ success: false, message: 'Invalid file package ID format.' });
        return;
      }

      const file = await FileRecord.findById(req.params.id)
        .populate('senderId', 'name email publicKey')
        .populate('receiverId', 'name email publicKey');

      if (!file) {
        res.status(404).json({ success: false, message: 'File package not found' });
        return;
      }

      // Authorization: Only sender, receiver, or admin can access
      const isSender = file.senderId._id.toString() === req.user!.id;
      const isReceiver = file.receiverId._id.toString() === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isSender && !isReceiver && !isAdmin) {
        await AuditService.logEvent({
          userId: req.user!.id,
          fileId: file._id,
          action: 'UNAUTHORIZED_ACCESS',
          result: 'FAILURE',
          ipAddress: req.ip,
          metadata: { reason: 'User not authorized to access file package' }
        });

        res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view this file.'
        });
        return;
      }

      // Check expiration status
      const isExpired = file.expiresAt ? new Date() > file.expiresAt : false;

      res.status(200).json({
        success: true,
        message: 'File package details retrieved',
        data: {
          ...file.toObject(),
          isExpired
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Verifies file integrity, authenticity, and decryption steps.
   */
  static async verifyFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ success: false, message: 'Invalid file package ID format.' });
        return;
      }

      const { password } = req.body;
      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Recipient password is required to decrypt your private key and verify package.'
        });
        return;
      }

      const file = await FileRecord.findById(req.params.id);
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      // Receiver or admin can verify
      const isReceiver = file.receiverId.toString() === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isReceiver && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Only the recipient or an administrator can run receiver verification.'
        });
        return;
      }

      const { result } = await FileService.verifyFile(
        file._id.toString(),
        req.user!.id,
        password,
        req.ip
      );

      res.status(200).json({
        success: result.allChecksPassed,
        message: result.allChecksPassed
          ? 'Cryptographic integrity and digital signature successfully verified.'
          : result.errorMessage || 'Verification failed.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Verification failed'
      });
    }
  }

  /**
   * Decrypts and downloads the verified file.
   */
  static async downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ success: false, message: 'Invalid file package ID format.' });
        return;
      }

      // Allow password via body (POST) or query param for direct download trigger
      const password = req.body.password || (req.query.password as string);
      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required to decrypt your private key.'
        });
        return;
      }

      const file = await FileRecord.findById(req.params.id);
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      // Authorization: Recipient or Admin
      const receiverIdStr = ((file.receiverId as any)?._id || file.receiverId).toString();
      const isReceiver = receiverIdStr === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isReceiver && !isAdmin) {
        await AuditService.logEvent({
          userId: req.user!.id,
          fileId: file._id,
          action: 'UNAUTHORIZED_ACCESS',
          result: 'FAILURE',
          ipAddress: req.ip,
          metadata: { reason: 'Unauthorized download attempt' }
        });
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not the intended recipient of this file.'
        });
        return;
      }

      // Check Expiration
      if (file.expiresAt && new Date() > file.expiresAt) {
        res.status(410).json({
          success: false,
          message: 'File has expired and is no longer available for download.'
        });
        return;
      }

      const { result, decryptedBuffer } = await FileService.verifyFile(
        file._id.toString(),
        req.user!.id,
        password,
        req.ip
      );

      if (!result.allChecksPassed || !decryptedBuffer) {
        res.status(422).json({
          success: false,
          message: 'SECURITY ALERT: File integrity verification failed. The file may have been modified or corrupted.',
          data: result
        });
        return;
      }

      await AuditService.logEvent({
        userId: req.user!.id,
        fileId: file._id,
        action: 'FILE_DOWNLOADED',
        result: 'SUCCESS',
        ipAddress: req.ip,
        metadata: { originalFileName: file.originalFileName }
      });

      const cleanFileName = path.basename(file.originalFileName).replace(/["'\r\n]/g, '_');
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${cleanFileName}"; filename*=UTF-8''${encodeURIComponent(cleanFileName)}`
      );
      res.setHeader('Content-Length', decryptedBuffer.length);
      res.send(decryptedBuffer);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Download failed'
      });
    }
  }

  /**
   * Tampering demonstration endpoint (Section 17).
   */
  static async simulateTamper(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (config.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Tampering simulation is restricted strictly to development and test environments.'
        });
        return;
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ success: false, message: 'Invalid file package ID format.' });
        return;
      }

      const file = await FileRecord.findById(req.params.id);
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      // Only sender, receiver, or admin can trigger tampering demo
      const senderIdStr = ((file.senderId as any)?._id || file.senderId).toString();
      const receiverIdStr = ((file.receiverId as any)?._id || file.receiverId).toString();
      const isSender = senderIdStr === req.user!.id;
      const isReceiver = receiverIdStr === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isSender && !isReceiver && !isAdmin) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await FileService.simulateTampering(file._id.toString(), req.ip);

      res.status(200).json({
        success: true,
        message: 'File ciphertext on disk successfully modified for tampering demonstration. AES-GCM tag verification and SHA-256 integrity check will now detect corruption and fail.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Restore ciphertext demo endpoint.
   */
  static async restoreTamper(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (config.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Tampering restore is restricted strictly to development and test environments.'
        });
        return;
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ success: false, message: 'Invalid file package ID format.' });
        return;
      }

      const file = await FileRecord.findById(req.params.id);
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      const senderIdStr = ((file.senderId as any)?._id || file.senderId).toString();
      const receiverIdStr = ((file.receiverId as any)?._id || file.receiverId).toString();
      const isSender = senderIdStr === req.user!.id;
      const isReceiver = receiverIdStr === req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      if (!isSender && !isReceiver && !isAdmin) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await FileService.restoreTampering(file._id.toString(), req.ip);

      res.status(200).json({
        success: true,
        message: 'File ciphertext restored to pristine state. Cryptographic verification will now succeed.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
