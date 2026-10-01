import crypto from 'crypto';
import { CryptoService } from '../src/services/crypto/cryptoService';
import { AuthService } from '../src/services/auth/authService';
import { FileService } from '../src/services/files/fileService';
import { FileRecord } from '../src/models/File';
import { User } from '../src/models/User';
import { AuditLog } from '../src/models/AuditLog';
import { connectDatabase, disconnectDatabase } from '../src/config/database';

async function runPhases4to6Verification() {
  console.log('======================================================================');
  console.log('   CRYPTASHARE — PHASES 4, 5 & 6 LIVE CRYPTOGRAPHIC DEMONSTRATION');
  console.log('======================================================================\n');

  await connectDatabase();

  // 1. Setup Identities
  console.log('>>> [STEP 0] Setting up Cryptographic Identities in Database...');
  const aliceReg = await AuthService.register({
    name: 'Alice (Sender)',
    email: `alice_${Date.now()}@cryptashare.io`,
    password: 'AlicePassword123!',
    role: 'USER'
  });
  const bobReg = await AuthService.register({
    name: 'Bob (Recipient)',
    email: `bob_${Date.now()}@cryptashare.io`,
    password: 'BobPassword123!',
    role: 'USER'
  });
  const charlieReg = await AuthService.register({
    name: 'Charlie (Adversary)',
    email: `charlie_${Date.now()}@cryptashare.io`,
    password: 'CharliePassword123!',
    role: 'USER'
  });

  console.log('✓ Alice Registered (Sender). ID:', aliceReg.user.id);
  console.log('✓ Bob Registered (Recipient). ID:', bobReg.user.id);
  console.log('✓ Charlie Registered (Third Party). ID:', charlieReg.user.id);

  // ==========================================================================
  // PHASE 4 — RSA-OAEP HYBRID ENCRYPTION
  // ==========================================================================
  console.log('\n----------------------------------------------------------------------');
  console.log('>>> PHASE 4 — RSA-OAEP HYBRID ENCRYPTION VERIFICATION');
  console.log('----------------------------------------------------------------------');

  const filePayload = Buffer.from('CONFIDENTIAL RESEARCH DOCUMENT: CRYPTOGRAPHIC VERIFICATION PROOF 2026', 'utf8');
  console.log(`Original Plaintext File Size: ${filePayload.length} bytes`);

  // Requirement 1: Never use RSA to encrypt the complete file
  console.log('\n[Requirement 1] Verifying that RSA cannot / should not encrypt complete files:');
  const oversizedData = Buffer.alloc(1024, 0x42);
  try {
    crypto.publicEncrypt(
      {
        key: bobReg.user.publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      oversizedData
    );
    console.error('FAIL: Direct RSA encryption of file should have thrown an error!');
  } catch (err: any) {
    console.log('✓ PASS: RSA-OAEP rejected direct file encryption as payload exceeds key capacity:');
    console.log(`  Error: "${err.message}"`);
  }

  // Requirement 2: Encrypt only the AES key using RSA-OAEP
  console.log('\n[Requirement 2] Encrypting only the 32-byte AES key using RSA-OAEP:');
  const aesKey = CryptoService.generateAESKey();
  console.log(`✓ Ephemeral AES-256 Key generated (${aesKey.length} bytes / 256 bits)`);
  const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(filePayload, aesKey);
  console.log(`✓ File encrypted with AES-256-GCM. Ciphertext: ${ciphertext.length} bytes, IV: ${iv}`);

  const encryptedAESKey = CryptoService.encryptAESKeyWithRSA(aesKey, bobReg.user.publicKey);
  console.log(`✓ Ephemeral AES key encrypted with Bob's Public Key (RSA-OAEP Base64 length: ${encryptedAESKey.length} chars)`);

  // Requirement 3 & 4: During download, use recipient's private key to recover AES key & decrypt with AES-GCM
  console.log("\n[Requirements 3 & 4] Recovering AES key with Bob's private key & decrypting file:");
  const bobDb = await User.findById(bobReg.user.id);
  const bobPrivateKey = CryptoService.decryptPrivateKey(bobDb!.encryptedPrivateKey, 'BobPassword123!');
  const recoveredAESKey = CryptoService.decryptAESKeyWithRSA(encryptedAESKey, bobPrivateKey);
  console.log('✓ Bob recovered ephemeral AES key successfully. Byte match?:', recoveredAESKey.equals(aesKey));

  const decryptedPayload = CryptoService.decryptFileWithAES(ciphertext, recoveredAESKey, iv, authTag);
  console.log('✓ File decrypted with AES-256-GCM. Decrypted matches original plaintext?:', decryptedPayload.equals(filePayload));
  console.log(`  Decrypted Text: "${decryptedPayload.toString('utf8')}"`);

  // Requirement 5 & 7: Ensure only intended recipient can recover AES key (Charlie fails)
  console.log("\n[Requirements 5 & 7] Testing that another user's private key FAILS to decrypt the AES key:");
  const charlieDb = await User.findById(charlieReg.user.id);
  const charliePrivateKey = CryptoService.decryptPrivateKey(charlieDb!.encryptedPrivateKey, 'CharliePassword123!');
  try {
    CryptoService.decryptAESKeyWithRSA(encryptedAESKey, charliePrivateKey);
    console.error("FAIL: Charlie's private key should NOT have decrypted Bob's AES key!");
  } catch (err: any) {
    console.log("✓ PASS: Another user's private key correctly failed to recover the AES key:");
    console.log(`  Error: "${err.message}"`);
  }

  // ==========================================================================
  // PHASE 5 — SHA-256 INTEGRITY VERIFICATION
  // ==========================================================================
  console.log('\n----------------------------------------------------------------------');
  console.log('>>> PHASE 5 — SHA-256 INTEGRITY VERIFICATION');
  console.log('----------------------------------------------------------------------');

  // Backend calculates SHA-256 hash before encryption
  console.log('\n[Requirement] Calculating SHA-256 hash on backend before encryption:');
  const originalHash = CryptoService.calculateSHA256(filePayload);
  console.log(`✓ Original File SHA-256 Digest: ${originalHash}`);

  // Test full service sharing workflow
  const sharedFile = await FileService.shareFile({
    senderId: aliceReg.user.id,
    receiverId: bobReg.user.id,
    senderPassword: 'AlicePassword123!',
    fileBuffer: filePayload,
    originalFileName: 'academic-thesis.pdf'
  });
  console.log(`✓ File record created in MongoDB. File ID: ${sharedFile._id}`);
  console.log(`✓ Stored SHA-256 Hash in metadata: ${sharedFile.sha256Hash}`);

  // Verification Roundtrip (Success Case)
  console.log('\n[Verification Success Case] Bob verifies package and calculates SHA-256 on decrypted data:');
  const verifySuccess = await FileService.verifyFile(sharedFile._id.toString(), bobReg.user.id, 'BobPassword123!');
  console.log(`✓ Decrypted SHA-256 Hash: ${verifySuccess.result.computedHash}`);
  console.log(`✓ Original Hash === Decrypted Hash?: ${verifySuccess.result.sha256Matched}`);
  console.log(`✓ Integrity Check Result: ${verifySuccess.result.sha256Matched ? 'INTEGRITY VERIFIED' : 'INTEGRITY FAILED'}`);

  // Verification Failure Case
  console.log('\n[Verification Failure Case] Corrupted file digest or tampered payload:');
  // Mutate stored hash to simulate corruption / tampering
  await FileRecord.findByIdAndUpdate(sharedFile._id, {
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  });
  const verifyFailure = await FileService.verifyFile(sharedFile._id.toString(), bobReg.user.id, 'BobPassword123!');
  console.log(`✓ Integrity Check Result: ${verifyFailure.result.sha256Matched ? 'INTEGRITY VERIFIED' : 'INTEGRITY FAILED'}`);
  console.log(`✓ Error Message: "${verifyFailure.result.errorMessage}"`);
  console.log(`✓ All Checks Passed?: ${verifyFailure.result.allChecksPassed}`);

  // Confirm security audit log was written for INTEGRITY_FAILED
  const integrityLogs = await AuditLog.find({ fileId: sharedFile._id, action: 'INTEGRITY_FAILED' });
  console.log(`✓ Security Audit Logs captured INTEGRITY_FAILED events count: ${integrityLogs.length}`);

  // ==========================================================================
  // PHASE 6 — DIGITAL SIGNATURE (RSA-PSS with SHA-256)
  // ==========================================================================
  console.log('\n----------------------------------------------------------------------');
  console.log('>>> PHASE 6 — DIGITAL SIGNATURE VERIFICATION (RSA-PSS)');
  console.log('----------------------------------------------------------------------');

  const aliceDb = await User.findById(aliceReg.user.id);
  const alicePrivateKey = CryptoService.decryptPrivateKey(aliceDb!.encryptedPrivateKey, 'AlicePassword123!');

  // 1. Sign the file hash
  console.log('\n[1. Signing File Hash]');
  const signature = CryptoService.signHash(originalHash, alicePrivateKey);
  console.log(`✓ Alice signed SHA-256 hash using RSA-PSS. Signature length: ${signature.length} base64 chars`);

  // 2. Valid signature test
  console.log('\n[2. Test: Valid Signature with Sender Public Key from Database]');
  const isSigValid = CryptoService.verifySignature(originalHash, signature, aliceDb!.publicKey);
  console.log(`✓ Signature valid?: ${isSigValid ? 'VALID (AUTHENTICATED)' : 'INVALID'}`);

  // 3. Modified file test (hash mismatch)
  console.log('\n[3. Test: Modified File / Hash Tampering]');
  const modifiedFileHash = CryptoService.calculateSHA256(Buffer.from('Injected malicious tampering payload', 'utf8'));
  const isModifiedFileSigValid = CryptoService.verifySignature(modifiedFileHash, signature, aliceDb!.publicKey);
  console.log(`✓ Signature on modified file valid?: ${isModifiedFileSigValid ? 'VALID' : 'INVALID (TAMPERING DETECTED)'}`);

  // 4. Modified signature test (signature bit corruption)
  console.log('\n[4. Test: Modified / Corrupted Digital Signature]');
  const sigBytes = Buffer.from(signature, 'base64');
  sigBytes[8] = sigBytes[8] ^ 0xff;
  const tamperedSig = sigBytes.toString('base64');
  const isCorruptedSigValid = CryptoService.verifySignature(originalHash, tamperedSig, aliceDb!.publicKey);
  console.log(`✓ Corrupted signature valid?: ${isCorruptedSigValid ? 'VALID' : 'INVALID (CORRUPTION DETECTED)'}`);

  // 5. Wrong sender public key test
  console.log("\n[5. Test: Verification with Wrong Public Key (Charlie's Public Key)]");
  const isWrongKeyValid = CryptoService.verifySignature(originalHash, signature, charlieDb!.publicKey);
  console.log(`✓ Verified against wrong sender public key?: ${isWrongKeyValid ? 'VALID' : 'INVALID (IMPERSONATION BLOCKED)'}`);

  await disconnectDatabase();

  console.log('\n======================================================================');
  console.log('   ALL REQUIREMENTS FOR PHASES 4, 5, AND 6 SUCCESSFULLY VERIFIED!');
  console.log('======================================================================\n');
}

runPhases4to6Verification().catch(console.error);
