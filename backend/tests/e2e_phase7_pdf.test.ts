import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/User';
import { FileRecord } from '../src/models/File';
import { AuditLog } from '../src/models/AuditLog';
import { config } from '../src/config/env';

import { resetAndSeedUsers } from '../src/scripts/seedUsers';

describe('PHASE 7 — Complete Secure File Sharing & Security Demonstration (PDF End-to-End)', () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let pdfFileId: string;

  // Real valid PDF buffer header and structure for testing
  const samplePdfBuffer = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n' +
    '4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 18 Tf 50 700 Td (VeriCrypt Confidential Security Report 2026) Tj ET\nendstream\nendobj\n' +
    'xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000206 00000 n\n' +
    'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%EOF',
    'utf8'
  );

  beforeAll(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await FileRecord.deleteMany({});
    await AuditLog.deleteMany({});

    // Register User A (Alice - Sender)
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Sender',
        email: 'alice.sender@VeriCrypt.io',
        password: 'SenderPassword123!'
      });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Register User B (Bob - Receiver)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Receiver',
        email: 'bob.receiver@VeriCrypt.io',
        password: 'ReceiverPassword123!'
      });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  afterAll(async () => {
    await resetAndSeedUsers();
    await disconnectDatabase();
  });

  test('Step 1 & 2: User A selects PDF and shares with User B (AES-256-GCM + RSA-OAEP + RSA-PSS + SHA-256)', async () => {
    const res = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'SenderPassword123!')
      .field('expirationHours', '48')
      .attach('file', samplePdfBuffer, 'Security-Audit-Report.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('fileId');
    expect(res.body.data).toHaveProperty('sha256Hash');
    pdfFileId = res.body.data.fileId;

    // Confirm that the storage file exists on disk as encrypted payload
    const storedFile = await FileRecord.findById(pdfFileId);
    expect(storedFile).not.toBeNull();
    expect(storedFile!.originalFileName).toBe('Security-Audit-Report.pdf');
    expect(storedFile!.encryptedAESKey).toBeDefined();
    expect(storedFile!.iv).toBeDefined();
    expect(storedFile!.authTag).toBeDefined();
    expect(storedFile!.digitalSignature).toBeDefined();
  });

  test('Step 3: User B views received file in received list', async () => {
    const res = await request(app)
      .get('/api/files/received')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const file = res.body.data.find((f: any) => f._id === pdfFileId);
    expect(file).toBeDefined();
    expect(file.originalFileName).toBe('Security-Audit-Report.pdf');
    expect(file.senderId.email).toBe('alice.sender@VeriCrypt.io');
  });

  test('Step 4: User B executes verification (RSA-OAEP, AES-GCM, SHA-256, RSA-PSS)', async () => {
    const res = await request(app)
      .post(`/api/files/${pdfFileId}/verify`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'ReceiverPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aesKeyDecrypted).toBe(true);
    expect(res.body.data.aesGcmAuthPassed).toBe(true);
    expect(res.body.data.sha256Matched).toBe(true);
    expect(res.body.data.signatureVerified).toBe(true);
    expect(res.body.data.allChecksPassed).toBe(true);
  });

  test('Step 5: User B downloads verified original PDF and confirms bit-for-bit match', async () => {
    const res = await request(app)
      .post(`/api/files/${pdfFileId}/download`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'ReceiverPassword123!' })
      .responseType('blob');

    expect(res.status).toBe(200);
    // Exact byte equality with the original uploaded PDF buffer
    const downloadedBuffer = Buffer.from(res.body);
    expect(downloadedBuffer.equals(samplePdfBuffer)).toBe(true);
    expect(downloadedBuffer.toString('utf8')).toContain('VeriCrypt Confidential Security Report 2026');
  });

  describe('SECURITY DEMONSTRATION TEST: Unauthorized Tampering Detection', () => {
    test('Development tampering simulation flips ciphertext on disk', async () => {
      const res = await request(app)
        .post(`/api/files/${pdfFileId}/tamper`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('tampering demonstration');

      const record = await FileRecord.findById(pdfFileId);
      expect(record!.isTampered).toBe(true);
    });

    test('User B verification fails on tampered file and shows SECURITY ALERT', async () => {
      const res = await request(app)
        .post(`/api/files/${pdfFileId}/verify`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ password: 'ReceiverPassword123!' });

      expect(res.body.data.allChecksPassed).toBe(false);
      expect(res.body.data.aesGcmAuthPassed).toBe(false);
      expect(res.body.data.errorMessage).toContain('SECURITY ALERT: File integrity verification failed. The file may have been modified or corrupted.');
    });

    test('User B download is strictly refused (422) and logs security event', async () => {
      const res = await request(app)
        .post(`/api/files/${pdfFileId}/download`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ password: 'ReceiverPassword123!' });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('SECURITY ALERT');
      expect(res.body.message).toContain('File integrity verification failed. The file may have been modified or corrupted.');

      // Check audit log entry
      const auditLog = await AuditLog.findOne({
        fileId: pdfFileId,
        action: 'INTEGRITY_FAILED',
        result: 'FAILURE'
      });
      expect(auditLog).not.toBeNull();
    });

    test('Tampering simulation is strictly blocked in production environment', async () => {
      const originalEnv = config.NODE_ENV;
      (config as any).NODE_ENV = 'production';

      const res = await request(app)
        .post(`/api/files/${pdfFileId}/tamper`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('restricted strictly to development and test environments');

      (config as any).NODE_ENV = originalEnv;
    });
  });
});
