import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/User';
import { FileRecord } from '../src/models/File';
import { AuditLog } from '../src/models/AuditLog';
import { CryptoService } from '../src/services/crypto/cryptoService';

import { resetAndSeedUsers } from '../src/scripts/seedUsers';

describe('CryptaShare End-to-End API Integration Tests', () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let userCToken: string;
  let userCId: string;
  let sharedFileId: string;

  beforeAll(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await FileRecord.deleteMany({});
    await AuditLog.deleteMany({});
  });

  afterAll(async () => {
    await resetAndSeedUsers();
    await disconnectDatabase();
  });

  test('1. User A, User B, and User C Registration with RSA Keypairs', async () => {
    // Register User A (Alice - Sender)
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Cooper',
        email: 'alice@test.io',
        password: 'Password123!'
      });

    expect(resA.status).toBe(201);
    expect(resA.body.success).toBe(true);
    expect(resA.body.data).toHaveProperty('token');
    expect(resA.body.data.user).toHaveProperty('publicKey');
    // Ensure API response NEVER exposes privateKey or encryptedPrivateKey
    expect(resA.body.data.user).not.toHaveProperty('privateKey');
    expect(resA.body.data.user).not.toHaveProperty('encryptedPrivateKey');
    expect(resA.body.data.user).not.toHaveProperty('passwordHash');

    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Database Inspection: Confirm that NO plaintext private key exists in DB
    const dbAlice = await User.findById(userAId);
    expect(dbAlice).not.toBeNull();
    expect(dbAlice!.publicKey).toContain('BEGIN PUBLIC KEY');
    // Critical: Verify private key is NOT in plaintext in database
    expect(dbAlice!.encryptedPrivateKey).not.toContain('BEGIN PRIVATE KEY');
    expect(dbAlice!.encryptedPrivateKey).not.toContain('BEGIN RSA PRIVATE KEY');
    
    // Verify it is a valid JSON PBKDF2 + AES-GCM bundle
    const keyBundle = JSON.parse(dbAlice!.encryptedPrivateKey);
    expect(keyBundle).toHaveProperty('salt');
    expect(keyBundle).toHaveProperty('iv');
    expect(keyBundle).toHaveProperty('authTag');
    expect(keyBundle).toHaveProperty('encryptedData');

    // Register User B (Bob - Recipient)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Marley',
        email: 'bob@test.io',
        password: 'Password123!'
      });

    expect(resB.status).toBe(201);
    expect(resB.body.success).toBe(true);
    expect(resB.body.data.user).not.toHaveProperty('privateKey');
    expect(resB.body.data.user).not.toHaveProperty('encryptedPrivateKey');
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;

    // Register User C (Charlie - Unauthorized third party)
    const resC = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Charlie Mallor',
        email: 'charlie@test.io',
        password: 'Password123!'
      });

    expect(resC.status).toBe(201);
    userCToken = resC.body.data.token;
    userCId = resC.body.data.user.id;
  });

  test('2. User Login and JWT Verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.io',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    // Verify /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.data.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('alice@test.io');
  });

  test('3. Recipient discovery endpoint', async () => {
    const res = await request(app)
      .get('/api/users/recipients')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    const recipientEmails = res.body.data.map((u: any) => u.email);
    expect(recipientEmails).toContain('bob@test.io');
    expect(recipientEmails).toContain('charlie@test.io');
    expect(recipientEmails).not.toContain('alice@test.io'); // Should not include self
  });

  test('4. PHASE 4 — Hybrid Encryption File Sharing: Alice -> Bob', async () => {
    const fileContent = 'CONFIDENTIAL RESEARCH PAPER FOR CRYPTASHARE 2026';
    const originalBuffer = Buffer.from(fileContent, 'utf8');

    const res = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'Password123!')
      .field('expirationHours', '24')
      .attach('file', originalBuffer, 'project-report.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('fileId');
    expect(res.body.data).toHaveProperty('sha256Hash');
    sharedFileId = res.body.data.fileId;

    // Database Inspection: Confirm Zero-Plaintext Storage and correct hybrid fields
    const dbRecord = await FileRecord.findById(sharedFileId);
    expect(dbRecord).not.toBeNull();
    expect(dbRecord!.encryptedAESKey).toBeDefined();
    expect(dbRecord!.iv).toBeDefined();
    expect(dbRecord!.authTag).toBeDefined();
    expect(dbRecord!.digitalSignature).toBeDefined();
    expect(dbRecord!.sha256Hash).toBe(CryptoService.calculateSHA256(originalBuffer));
  });

  test('4B. Path Traversal Prevention and Filename Sanitization', async () => {
    const maliciousName = '../../../../malicious.txt';
    const res = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'Password123!')
      .attach('file', Buffer.from('Path traversal test payload', 'utf8'), maliciousName);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const storedRecord = await FileRecord.findById(res.body.data.fileId);
    expect(storedRecord!.originalFileName).not.toContain('..');
    expect(storedRecord!.originalFileName).not.toContain('/');
    expect(storedRecord!.originalFileName).not.toContain('\\');
    expect(storedRecord!.storageFileName).toMatch(/^[0-9a-f-]+\.enc$/);
  });

  test('5. Bob views received file in dashboard', async () => {
    const res = await request(app)
      .get('/api/files/received')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const fileIds = res.body.data.map((f: any) => f._id);
    expect(fileIds).toContain(sharedFileId);
    expect(res.body.data[0].senderId.email).toBe('alice@test.io');
  });

  test('6. PHASE 4, 5 & 6 — Bob verifies cryptographic integrity & digital signature', async () => {
    const res = await request(app)
      .post(`/api/files/${sharedFileId}/verify`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aesKeyDecrypted).toBe(true);
    expect(res.body.data.aesGcmAuthPassed).toBe(true);
    expect(res.body.data.sha256Matched).toBe(true);
    expect(res.body.data.signatureVerified).toBe(true);
    expect(res.body.data.allChecksPassed).toBe(true);
  });

  test('7. Bob downloads the verified original file', async () => {
    const res = await request(app)
      .post(`/api/files/${sharedFileId}/download`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('CONFIDENTIAL RESEARCH PAPER FOR CRYPTASHARE 2026');
  });

  test('8. PHASE 4 Requirement 7: Another user (Charlie) cannot decrypt AES key or access file', async () => {
    // Charlie attempts unauthorized download -> rejected with 403 Forbidden
    const res = await request(app)
      .post(`/api/files/${sharedFileId}/download`)
      .set('Authorization', `Bearer ${userCToken}`)
      .send({ password: 'Password123!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    // Cryptographic proof: Charlie's private key CANNOT decrypt Bob's encrypted AES key
    const dbRecord = await FileRecord.findById(sharedFileId);
    const dbCharlie = await User.findById(userCId);
    const charliePrivateKey = CryptoService.decryptPrivateKey(dbCharlie!.encryptedPrivateKey, 'Password123!');

    expect(() => {
      CryptoService.decryptAESKeyWithRSA(dbRecord!.encryptedAESKey, charliePrivateKey);
    }).toThrow();
  });

  test('9. PHASE 5 Requirement: Client-supplied hash is not trusted (Backend calculates hash)', async () => {
    const spoofedHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const testPayload = Buffer.from('Testing that client hash is never trusted by backend', 'utf8');
    const realHash = CryptoService.calculateSHA256(testPayload);

    const res = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'Password123!')
      .field('sha256Hash', spoofedHash) // Client attempts to supply a fake hash
      .field('hash', spoofedHash)
      .attach('file', testPayload, 'spoof-test.txt');

    expect(res.status).toBe(201);
    // The stored hash MUST be the true hash computed on backend, NOT the spoofed client hash
    expect(res.body.data.sha256Hash).toBe(realHash);
    expect(res.body.data.sha256Hash).not.toBe(spoofedHash);

    const record = await FileRecord.findById(res.body.data.fileId);
    expect(record!.sha256Hash).toBe(realHash);
  });

  test('10. PHASE 5 Requirement: SHA-256 Integrity Failure blocks download and logs security event', async () => {
    // Share a new file from Alice to Bob
    const payload = Buffer.from('Original File To Test SHA-256 Digest Failure', 'utf8');
    const shareRes = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'Password123!')
      .attach('file', payload, 'integrity-fail-test.txt');

    const fileId = shareRes.body.data.fileId;

    // Simulate corrupted stored hash in database (e.g. metadata tampering)
    await FileRecord.findByIdAndUpdate(fileId, {
      sha256Hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    });

    // Bob attempts verification
    const verifyRes = await request(app)
      .post(`/api/files/${fileId}/verify`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(verifyRes.body.data.allChecksPassed).toBe(false);
    expect(verifyRes.body.data.sha256Matched).toBe(false);
    expect(verifyRes.body.data.errorMessage).toContain('SHA-256 hash mismatch');

    // Bob attempts to download -> Must be blocked with 422 Unprocessable Entity
    const downloadRes = await request(app)
      .post(`/api/files/${fileId}/download`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(downloadRes.status).toBe(422);
    expect(downloadRes.body.message).toMatch(/security alert/i);

    // Confirm that an INTEGRITY_FAILED audit log exists
    const auditLogs = await AuditLog.find({ fileId, action: 'INTEGRITY_FAILED', result: 'FAILURE' });
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  test('11. PHASE 6 Requirement: Tampered Digital Signature blocks download and logs SIGNATURE_FAILED', async () => {
    // Share file Alice -> Bob
    const payload = Buffer.from('Document with Valid Digital Signature To Be Tampered', 'utf8');
    const shareRes = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'Password123!')
      .attach('file', payload, 'tampered-signature-test.txt');

    const fileId = shareRes.body.data.fileId;
    const originalRecord = await FileRecord.findById(fileId);
    
    // Corrupt the signature in the database
    const corruptedSig = Buffer.from(originalRecord!.digitalSignature, 'base64');
    corruptedSig[5] = corruptedSig[5] ^ 0xff;
    await FileRecord.findByIdAndUpdate(fileId, { digitalSignature: corruptedSig.toString('base64') });

    // Bob attempts verification
    const verifyRes = await request(app)
      .post(`/api/files/${fileId}/verify`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(verifyRes.body.data.allChecksPassed).toBe(false);
    expect(verifyRes.body.data.signatureVerified).toBe(false);
    expect(verifyRes.body.data.errorMessage).toContain('RSA-PSS Digital signature verification failed');

    // Bob attempts download -> Must be blocked with 422
    const downloadRes = await request(app)
      .post(`/api/files/${fileId}/download`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(downloadRes.status).toBe(422);
    expect(downloadRes.body.message).toMatch(/security alert/i);

    // Confirm SIGNATURE_FAILED audit log was recorded
    const sigFailLogs = await AuditLog.find({ fileId, action: 'SIGNATURE_FAILED', result: 'FAILURE' });
    expect(sigFailLogs.length).toBeGreaterThan(0);
  });

  test('12. PHASE 6 Requirement: Signature verified using Sender Public Key from Database (Not Client-Supplied)', async () => {
    // Share file Alice -> Bob
    const payload = Buffer.from('Document to test sender public key identification from DB', 'utf8');
    const shareRes = await request(app)
      .post('/api/files/share')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('receiverId', userBId)
      .field('senderPassword', 'Password123!')
      .attach('file', payload, 'sender-db-key-test.txt');

    const fileId = shareRes.body.data.fileId;

    // Simulate sender public key mismatch in database (e.g. sender changed key or wrong sender ID)
    const fakeKeyPair = CryptoService.generateRSAKeyPair(2048);
    // Even if client passes a publicKey in verify request, backend only uses DB public key
    await FileRecord.findByIdAndUpdate(fileId, { senderId: userCId }); // Switch sender to Charlie in DB

    const verifyRes = await request(app)
      .post(`/api/files/${fileId}/verify`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        password: 'Password123!',
        senderPublicKey: fakeKeyPair.publicKey // Client tries to supply public key; must be ignored
      });

    // Verification must fail because signature was created with Alice's key, but DB now points to Charlie
    expect(verifyRes.body.data.allChecksPassed).toBe(false);
    expect(verifyRes.body.data.signatureVerified).toBe(false);

    const sigLogs = await AuditLog.find({ fileId, action: 'SIGNATURE_FAILED' });
    expect(sigLogs.length).toBeGreaterThan(0);
  });

  test('13. Tampering Demonstration (Section 17): Modified ciphertext triggers AES-GCM & SHA-256 failure', async () => {
    // Simulate tampering with stored ciphertext
    const tamperRes = await request(app)
      .post(`/api/files/${sharedFileId}/tamper`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(tamperRes.status).toBe(200);
    expect(tamperRes.body.success).toBe(true);

    // Bob now attempts verification on the tampered file
    const verifyRes = await request(app)
      .post(`/api/files/${sharedFileId}/verify`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(verifyRes.body.data.allChecksPassed).toBe(false);
    expect(verifyRes.body.data.aesGcmAuthPassed).toBe(false);

    // Bob attempts to download tampered file -> must be blocked with 422 Unprocessable Entity
    const downloadRes = await request(app)
      .post(`/api/files/${sharedFileId}/download`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ password: 'Password123!' });

    expect(downloadRes.status).toBe(422);
    expect(downloadRes.body.message).toMatch(/security alert/i);
  });

  test('14. Security Audit Logs capture complete system trail', async () => {
    // Check Alice's audit logs (Sender: file upload & hybrid encryption)
    const resA = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    const aliceActions = resA.body.data.map((l: any) => l.action);
    expect(aliceActions).toContain('USER_REGISTERED');
    expect(aliceActions).toContain('FILE_ENCRYPTED');
    expect(aliceActions).toContain('FILE_UPLOADED');
    expect(aliceActions).toContain('FILE_SHARED');

    // Check Bob's audit logs (Recipient: verification, integrity & signature checks, security failure logs)
    const resB = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    const bobActions = resB.body.data.map((l: any) => l.action);
    expect(bobActions).toContain('USER_REGISTERED');
    expect(bobActions).toContain('INTEGRITY_VERIFIED');
    expect(bobActions).toContain('SIGNATURE_VERIFIED');
    expect(bobActions).toContain('INTEGRITY_FAILED');
    expect(bobActions).toContain('SIGNATURE_FAILED');
  });
});
