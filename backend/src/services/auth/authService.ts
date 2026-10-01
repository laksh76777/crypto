import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { CryptoService } from '../crypto/cryptoService';
import { AuditService } from '../audit/auditService';
import { config } from '../../config/env';

export class AuthService {
  /**
   * Registers a new user with RSA key pair and password-encrypted private key.
   */
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'USER' | 'ADMIN';
    ipAddress?: string;
  }) {
    const { name, email, password, role = 'USER', ipAddress } = userData;

    // Validate inputs
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new Error('A user with this email address already exists');
    }

    // 1. Generate user RSA Key Pair
    const { publicKey, privateKey } = CryptoService.generateRSAKeyPair(config.RSA_KEY_SIZE);

    // 2. Encrypt RSA Private Key with derived key from password (PBKDF2 + AES-256-GCM)
    const encryptedPrivateKey = CryptoService.encryptPrivateKey(privateKey, password);

    // 3. Hash user password with bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Save User to database
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      publicKey,
      encryptedPrivateKey,
      role,
      status: 'ACTIVE'
    });

    // 5. Audit Log
    await AuditService.logEvent({
      userId: newUser._id,
      action: 'USER_REGISTERED',
      result: 'SUCCESS',
      ipAddress,
      metadata: { email: newUser.email, role: newUser.role }
    });

    // 6. Generate JWT token
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        publicKey: newUser.publicKey,
        createdAt: newUser.createdAt
      }
    };
  }

  /**
   * Authenticates user, verifies password, and issues JWT.
   */
  static async login(loginData: { email: string; password: string; ipAddress?: string }) {
    const { email, password, ipAddress } = loginData;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      await AuditService.logEvent({
        action: 'LOGIN_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { email, reason: 'User not found' }
      });
      throw new Error('Invalid email or password');
    }

    if (user.status === 'DISABLED') {
      await AuditService.logEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { email, reason: 'Account disabled' }
      });
      throw new Error('This account has been disabled. Please contact an administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await AuditService.logEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        result: 'FAILURE',
        ipAddress,
        metadata: { email, reason: 'Password mismatch' }
      });
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    await AuditService.logEvent({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      ipAddress,
      metadata: { email: user.email, role: user.role }
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        publicKey: user.publicKey,
        createdAt: user.createdAt
      }
    };
  }
}
