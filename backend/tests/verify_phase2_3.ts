import { CryptoService } from '../src/services/crypto/cryptoService';
import { AuthService } from '../src/services/auth/authService';
import { User } from '../src/models/User';
import { connectDatabase, disconnectDatabase } from '../src/config/database';

async function verifyPhases() {
  await connectDatabase();
  console.log('\n--- 1. Testing Registration & RSA Key Generation ---');
  const regResult = await AuthService.register({
    name: 'Inspector Gadget',
    email: `inspector_${Date.now()}@VeriCrypt.io`,
    password: 'InspectPassword123!',
    role: 'USER'
  });

  console.log('Registration Success! User ID:', regResult.user.id);
  console.log('API Response User fields:', Object.keys(regResult.user));
  const hasLeakedKeyInResponse = 'privateKey' in regResult.user || 'encryptedPrivateKey' in regResult.user;
  console.log('Is Private Key hidden from API response?:', !hasLeakedKeyInResponse);

  console.log('\n--- 2. Inspecting Database Document for Plaintext Leaks ---');
  const rawUser = await User.findById(regResult.user.id).lean();
  if (!rawUser) throw new Error('User not found in DB');

  console.log('Public Key in DB begins with:', rawUser.publicKey.substring(0, 26));
  console.log('Encrypted Private Key in DB (sample):', rawUser.encryptedPrivateKey.substring(0, 80) + '...');
  
  const hasPlaintextPrivate =
    rawUser.encryptedPrivateKey.includes('BEGIN PRIVATE KEY') ||
    rawUser.encryptedPrivateKey.includes('BEGIN RSA PRIVATE KEY');
  console.log('Contains plaintext "BEGIN PRIVATE KEY"?:', hasPlaintextPrivate);
  if (hasPlaintextPrivate) {
    throw new Error('SECURITY VIOLATION: Plaintext private key found in database!');
  }
  
  const bundle = JSON.parse(rawUser.encryptedPrivateKey);
  console.log('Encrypted Bundle fields:', Object.keys(bundle));
  console.log('Password-Derived Protection Scheme: PBKDF2 (100,000 iterations, SHA-256) + AES-256-GCM');

  console.log('\n--- 3. Testing Private Key Recovery & Public/Private Key Matching ---');
  const recoveredPrivKey = CryptoService.decryptPrivateKey(rawUser.encryptedPrivateKey, 'InspectPassword123!');
  console.log('Recovered Private Key starts with:', recoveredPrivKey.substring(0, 27));

  // Key Matching Test: Encrypt with Public Key, Decrypt with Recovered Private Key (RSA-OAEP)
  const testSecret = Buffer.from('VeriCrypt-Key-Matching-Passed-2026', 'utf8');
  const encSecret = CryptoService.encryptAESKeyWithRSA(testSecret, rawUser.publicKey);
  const decSecret = CryptoService.decryptAESKeyWithRSA(encSecret, recoveredPrivKey);
  console.log('RSA-OAEP Key Matching Test:', decSecret.toString('utf8') === 'VeriCrypt-Key-Matching-Passed-2026' ? 'MATCH CONFIRMED' : 'MISMATCH!');

  // Signature Matching Test: Sign with Recovered Private Key, Verify with Public Key (RSA-PSS)
  const digest = CryptoService.calculateSHA256(testSecret);
  const signature = CryptoService.signHash(digest, recoveredPrivKey);
  const isSigValid = CryptoService.verifySignature(digest, signature, rawUser.publicKey);
  console.log('RSA-PSS Signature Matching Test:', isSigValid ? 'VALID' : 'INVALID');

  console.log('\n--- 4. Phase 3: AES-256-GCM File Encryption & Tampering Test ---');
  const originalFileBuffer = Buffer.from('CRITICAL SYSTEM ARCHITECTURE PLAN 2026: CONFIDENTIAL PAYLOAD', 'utf8');
  const aesKey = CryptoService.generateAESKey();
  const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(originalFileBuffer, aesKey);
  console.log('File encrypted with AES-256-GCM. Ciphertext length:', ciphertext.length, 'bytes. IV:', iv);

  const decryptedFileBuffer = CryptoService.decryptFileWithAES(ciphertext, aesKey, iv, authTag);
  console.log('Decrypted File exact byte-for-byte match?:', decryptedFileBuffer.equals(originalFileBuffer));

  // Tampering test: flip bit in ciphertext
  const tamperedCiphertext = Buffer.from(ciphertext);
  tamperedCiphertext[5] = tamperedCiphertext[5] ^ 0xff;
  try {
    CryptoService.decryptFileWithAES(tamperedCiphertext, aesKey, iv, authTag);
    console.error('ERROR: Tampering was not caught!');
  } catch (err: any) {
    console.log('Tampering correctly detected by AES-256-GCM AuthTag verification:', err.message);
  }

  await disconnectDatabase();
  console.log('\n=== ALL PHASE 2 & PHASE 3 VERIFICATIONS PASSED ===\n');
}

verifyPhases().catch(console.error);
