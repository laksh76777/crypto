import crypto from 'crypto';
import { CryptoService } from '../src/services/crypto/cryptoService';

describe('Cryptographic Services Unit Tests', () => {
  const sampleData = Buffer.from('CryptaShare Top Secret Academic Cryptography Document 2026', 'utf8');
  let senderKeys: { publicKey: string; privateKey: string };
  let recipientKeys: { publicKey: string; privateKey: string };
  let thirdPartyKeys: { publicKey: string; privateKey: string };

  beforeAll(() => {
    // Generate keypairs for Sender, Recipient, and Third Party (2048-bit for fast unit test execution)
    senderKeys = CryptoService.generateRSAKeyPair(2048);
    recipientKeys = CryptoService.generateRSAKeyPair(2048);
    thirdPartyKeys = CryptoService.generateRSAKeyPair(2048);
  });

  describe('Core Cryptographic Primitives & Key Management', () => {
    test('1. RSA Key Pair Generation produces valid PEM keys', () => {
      expect(senderKeys.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(senderKeys.privateKey).toContain('BEGIN PRIVATE KEY');
      expect(recipientKeys.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(recipientKeys.privateKey).toContain('BEGIN PRIVATE KEY');
      expect(thirdPartyKeys.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(thirdPartyKeys.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    test('2. Private Key Protection (PBKDF2 + AES-256-GCM encryption & decryption)', () => {
      const password = 'SuperSecureUserPassword123!';
      const encryptedBundle = CryptoService.encryptPrivateKey(senderKeys.privateKey, password);

      expect(typeof encryptedBundle).toBe('string');
      const parsed = JSON.parse(encryptedBundle);
      expect(parsed).toHaveProperty('salt');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('authTag');
      expect(parsed).toHaveProperty('encryptedData');

      // Successful decryption with correct password
      const recoveredPrivateKey = CryptoService.decryptPrivateKey(encryptedBundle, password);
      expect(recoveredPrivateKey).toBe(senderKeys.privateKey);

      // Failed decryption with incorrect password
      expect(() => {
        CryptoService.decryptPrivateKey(encryptedBundle, 'WrongPassword!');
      }).toThrow();
    });
  });

  describe('PHASE 4 — RSA-OAEP Hybrid Encryption', () => {
    test('4.1 Requirement 1: Never use RSA to encrypt the complete file (mathematical & size boundary)', () => {
      // A typical file (e.g., 1024 bytes) exceeds RSA-2048 OAEP capacity (max payload = 256 - 2*32 - 2 = 190 bytes)
      const largeFileBuffer = Buffer.alloc(1024, 'A');
      
      expect(() => {
        crypto.publicEncrypt(
          {
            key: recipientKeys.publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          largeFileBuffer
        );
      }).toThrow(/data too large for key size/i);
    });

    test('4.2 Requirement 2: Encrypt only the AES key using RSA-OAEP', () => {
      const aesKey = CryptoService.generateAESKey();
      expect(aesKey.length).toBe(32); // 256-bit symmetric session key

      // RSA-OAEP encrypts ONLY the 32-byte AES key
      const encryptedAESKey = CryptoService.encryptAESKeyWithRSA(aesKey, recipientKeys.publicKey);
      expect(typeof encryptedAESKey).toBe('string');
      expect(encryptedAESKey.length).toBeGreaterThan(0);
    });

    test('4.3 Requirements 3, 4 & 5: Complete Hybrid Encryption/Decryption Roundtrip', () => {
      // Step 1: Encrypt file with AES-256-GCM
      const aesKey = CryptoService.generateAESKey();
      const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(sampleData, aesKey);
      expect(ciphertext).toBeInstanceOf(Buffer);
      expect(ciphertext).not.toEqual(sampleData);

      // Step 2: Encrypt AES key using recipient's RSA public key (RSA-OAEP)
      const encryptedAESKey = CryptoService.encryptAESKeyWithRSA(aesKey, recipientKeys.publicKey);

      // Step 3: Recipient recovers AES key using their private key (RSA-OAEP)
      const recoveredAESKey = CryptoService.decryptAESKeyWithRSA(encryptedAESKey, recipientKeys.privateKey);
      expect(recoveredAESKey).toEqual(aesKey);

      // Step 4: Recipient decrypts file using recovered AES key (AES-256-GCM)
      const decryptedData = CryptoService.decryptFileWithAES(ciphertext, recoveredAESKey, iv, authTag);
      expect(decryptedData).toEqual(sampleData);
    });

    test('4.4 Requirement 7: Another user private key fails to decrypt the AES key', () => {
      const aesKey = CryptoService.generateAESKey();
      // Ephemeral AES key encrypted for Recipient
      const encryptedAESKey = CryptoService.encryptAESKeyWithRSA(aesKey, recipientKeys.publicKey);

      // Third party (unauthorized user) attempts to decrypt with their own private key
      expect(() => {
        CryptoService.decryptAESKeyWithRSA(encryptedAESKey, thirdPartyKeys.privateKey);
      }).toThrow();

      // Sender private key also cannot decrypt it (only intended recipient holds the key)
      expect(() => {
        CryptoService.decryptAESKeyWithRSA(encryptedAESKey, senderKeys.privateKey);
      }).toThrow();
    });
  });

  describe('PHASE 5 — SHA-256 Integrity Verification', () => {
    test('5.1 SHA-256 hash generation produces deterministic 64-char hex digest', () => {
      const hash1 = CryptoService.calculateSHA256(sampleData);
      const hash2 = CryptoService.calculateSHA256(sampleData);
      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    test('5.2 Integrity Verification Success: Decrypted file matches original hash (INTEGRITY VERIFIED)', () => {
      const originalHash = CryptoService.calculateSHA256(sampleData);

      // Hybrid roundtrip
      const aesKey = CryptoService.generateAESKey();
      const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(sampleData, aesKey);
      const encKey = CryptoService.encryptAESKeyWithRSA(aesKey, recipientKeys.publicKey);
      const recKey = CryptoService.decryptAESKeyWithRSA(encKey, recipientKeys.privateKey);
      const decryptedData = CryptoService.decryptFileWithAES(ciphertext, recKey, iv, authTag);

      const decryptedHash = CryptoService.calculateSHA256(decryptedData);
      expect(decryptedHash).toBe(originalHash);
    });

    test('5.3 Integrity Verification Failure: Corrupted or altered file hash mismatch (INTEGRITY FAILED)', () => {
      const originalHash = CryptoService.calculateSHA256(sampleData);

      // Even a 1-bit flip changes the entire digest due to the avalanche effect
      const modifiedData = Buffer.from(sampleData);
      modifiedData[0] = modifiedData[0] ^ 0x01;

      const modifiedHash = CryptoService.calculateSHA256(modifiedData);
      expect(modifiedHash).not.toBe(originalHash);
    });

    test('5.4 Tampering detection: modified ciphertext causes AES-GCM authentication failure', () => {
      const aesKey = CryptoService.generateAESKey();
      const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(sampleData, aesKey);

      // Mutate a byte in ciphertext
      const tamperedCiphertext = Buffer.from(ciphertext);
      tamperedCiphertext[0] = tamperedCiphertext[0] ^ 0xff;

      expect(() => {
        CryptoService.decryptFileWithAES(tamperedCiphertext, aesKey, iv, authTag);
      }).toThrow(/AES-256-GCM decryption failed/);
    });

    test('5.5 Tampering detection: modified authentication tag causes AES-GCM failure', () => {
      const aesKey = CryptoService.generateAESKey();
      const { ciphertext, iv, authTag } = CryptoService.encryptFileWithAES(sampleData, aesKey);

      const invalidAuthTag = Buffer.alloc(16, 0).toString('base64');
      expect(() => {
        CryptoService.decryptFileWithAES(ciphertext, aesKey, iv, invalidAuthTag);
      }).toThrow();
    });
  });

  describe('PHASE 6 — Digital Signature (RSA-PSS with SHA-256)', () => {
    test('6.1 Valid signature verifies successfully with sender public key', () => {
      const fileHash = CryptoService.calculateSHA256(sampleData);
      // Sender signs the file hash with sender's private key
      const signature = CryptoService.signHash(fileHash, senderKeys.privateKey);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(50);

      // Receiver verifies signature with sender's public key
      const isValid = CryptoService.verifySignature(fileHash, signature, senderKeys.publicKey);
      expect(isValid).toBe(true);
    });

    test('6.2 Modified file (different hash) fails signature verification', () => {
      const fileHash = CryptoService.calculateSHA256(sampleData);
      const signature = CryptoService.signHash(fileHash, senderKeys.privateKey);

      // Modified file produces different hash
      const tamperedFileHash = CryptoService.calculateSHA256(Buffer.from('Malicious Injected Content', 'utf8'));
      const isTamperedValid = CryptoService.verifySignature(tamperedFileHash, signature, senderKeys.publicKey);
      expect(isTamperedValid).toBe(false);
    });

    test('6.3 Modified signature fails signature verification', () => {
      const fileHash = CryptoService.calculateSHA256(sampleData);
      const signature = CryptoService.signHash(fileHash, senderKeys.privateKey);

      // Tamper signature bytes
      const sigBuffer = Buffer.from(signature, 'base64');
      sigBuffer[10] = sigBuffer[10] ^ 0xff;
      const tamperedSignature = sigBuffer.toString('base64');

      const isTamperedSigValid = CryptoService.verifySignature(fileHash, tamperedSignature, senderKeys.publicKey);
      expect(isTamperedSigValid).toBe(false);
    });

    test('6.4 Wrong sender public key fails signature verification', () => {
      const fileHash = CryptoService.calculateSHA256(sampleData);
      const signature = CryptoService.signHash(fileHash, senderKeys.privateKey);

      // Verifying against recipient or third party public key must fail
      const isRecipientKeyValid = CryptoService.verifySignature(fileHash, signature, recipientKeys.publicKey);
      expect(isRecipientKeyValid).toBe(false);

      const isThirdPartyKeyValid = CryptoService.verifySignature(fileHash, signature, thirdPartyKeys.publicKey);
      expect(isThirdPartyKeyValid).toBe(false);
    });
  });

  describe('Key Matching Integration with Protected Keys at Rest', () => {
    test('Public/Private Key Matching: Encrypt with public key, decrypt with recovered protected private key', () => {
      const userPassword = 'TestPasswordMatch2026!';
      const { publicKey, privateKey } = CryptoService.generateRSAKeyPair(2048);

      const protectedBundle = CryptoService.encryptPrivateKey(privateKey, userPassword);
      const recoveredPrivateKey = CryptoService.decryptPrivateKey(protectedBundle, userPassword);

      const secretMessage = Buffer.from('Quantum-Resistant-Secret-Exchange', 'utf8');
      const encryptedKey = CryptoService.encryptAESKeyWithRSA(secretMessage, publicKey);

      const decryptedMessage = CryptoService.decryptAESKeyWithRSA(encryptedKey, recoveredPrivateKey);
      expect(decryptedMessage.toString('utf8')).toBe('Quantum-Resistant-Secret-Exchange');
    });

    test('Public/Private Key Matching: Sign with recovered protected private key, verify with public key', () => {
      const userPassword = 'SignaturePassword2026!';
      const { publicKey, privateKey } = CryptoService.generateRSAKeyPair(2048);

      const protectedBundle = CryptoService.encryptPrivateKey(privateKey, userPassword);
      const recoveredPrivateKey = CryptoService.decryptPrivateKey(protectedBundle, userPassword);

      const messageHash = CryptoService.calculateSHA256(Buffer.from('Message to be authenticated', 'utf8'));
      const signature = CryptoService.signHash(messageHash, recoveredPrivateKey);

      const isMatch = CryptoService.verifySignature(messageHash, signature, publicKey);
      expect(isMatch).toBe(true);
    });
  });
});
