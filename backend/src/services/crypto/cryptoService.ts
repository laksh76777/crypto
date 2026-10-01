import crypto from 'crypto';
import { config } from '../../config/env';

export interface EncryptedPrivateKeyBundle {
  salt: string;        // Hex
  iv: string;          // Hex
  authTag: string;     // Hex
  encryptedData: string; // Hex
}

export interface AESEncryptionResult {
  ciphertext: Buffer;
  iv: string;       // Base64
  authTag: string;  // Base64
}

export class CryptoService {
  /**
   * Generates a new RSA Key Pair (PKCS#8 for private key, SPKI for public key)
   * Supports 2048 or 3072 bit length.
   */
  static generateRSAKeyPair(modulusLength: number = config.RSA_KEY_SIZE): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  /**
   * Protects the user's RSA private key before database persistence.
   * Derives a 256-bit key from the user's password using PBKDF2 (100,000 iterations, SHA-256),
   * then encrypts the private key PEM using AES-256-GCM.
   */
  static encryptPrivateKey(privateKeyPem: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(privateKeyPem, 'utf8')),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    const bundle: EncryptedPrivateKeyBundle = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encryptedData: encrypted.toString('hex')
    };

    return JSON.stringify(bundle);
  }

  /**
   * Decrypts the user's protected RSA private key using their password.
   */
  static decryptPrivateKey(encryptedBundleJson: string, password: string): string {
    const bundle: EncryptedPrivateKeyBundle = JSON.parse(encryptedBundleJson);
    const salt = Buffer.from(bundle.salt, 'hex');
    const iv = Buffer.from(bundle.iv, 'hex');
    const authTag = Buffer.from(bundle.authTag, 'hex');
    const encryptedData = Buffer.from(bundle.encryptedData, 'hex');

    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);
      return decrypted.toString('utf8');
    } catch (err) {
      throw new Error('Failed to decrypt private key: Invalid password or corrupted key bundle');
    }
  }

  /**
   * Generates a cryptographically secure random 256-bit (32 bytes) AES key.
   */
  static generateAESKey(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypts file data using AES-256-GCM with a random 96-bit (12 bytes) IV/nonce.
   * Produces ciphertext, base64-encoded IV, and base64-encoded authentication tag.
   */
  static encryptFileWithAES(fileBuffer: Buffer, aesKey: Buffer): AESEncryptionResult {
    if (aesKey.length !== 32) {
      throw new Error('AES key must be exactly 32 bytes (256 bits)');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  /**
   * Decrypts file ciphertext using AES-256-GCM.
   * Verifies the authentication tag to ensure ciphertext integrity and authenticity.
   */
  static decryptFileWithAES(
    ciphertext: Buffer,
    aesKey: Buffer,
    ivBase64: string,
    authTagBase64: string
  ): Buffer {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);
      return decrypted;
    } catch (err: any) {
      throw new Error(`AES-256-GCM decryption failed: ${err.message || 'Authentication tag mismatch / tampered ciphertext'}`);
    }
  }

  /**
   * Encrypts the ephemeral AES key using RSA-OAEP with recipient's public key (SHA-256 digest).
   */
  static encryptAESKeyWithRSA(aesKey: Buffer, recipientPublicKeyPem: string): string {
    const encryptedBuffer = crypto.publicEncrypt(
      {
        key: recipientPublicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      aesKey
    );

    return encryptedBuffer.toString('base64');
  }

  /**
   * Decrypts the ephemeral AES key using RSA-OAEP with recipient's private key (SHA-256 digest).
   */
  static decryptAESKeyWithRSA(encryptedAESKeyBase64: string, recipientPrivateKeyPem: string): Buffer {
    const bufferToDecrypt = Buffer.from(encryptedAESKeyBase64, 'base64');
    const decryptedKey = crypto.privateDecrypt(
      {
        key: recipientPrivateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      bufferToDecrypt
    );

    return decryptedKey;
  }

  /**
   * Calculates the SHA-256 cryptographic hash of a data buffer.
   * Returns a 64-character lowercase hex string.
   */
  static calculateSHA256(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Digitally signs a file hash using the sender's RSA private key with RSA-PSS padding.
   */
  static signHash(sha256Hex: string, senderPrivateKeyPem: string): string {
    const signer = crypto.createSign('sha256');
    signer.update(sha256Hex);
    signer.end();

    const signature = signer.sign({
      key: senderPrivateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
    });

    return signature.toString('base64');
  }

  /**
   * Verifies the RSA-PSS digital signature of a file hash using sender's public RSA key.
   */
  static verifySignature(sha256Hex: string, signatureBase64: string, senderPublicKeyPem: string): boolean {
    try {
      const verifier = crypto.createVerify('sha256');
      verifier.update(sha256Hex);
      verifier.end();

      return verifier.verify(
        {
          key: senderPublicKeyPem,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        },
        Buffer.from(signatureBase64, 'base64')
      );
    } catch (err) {
      return false;
    }
  }
}
