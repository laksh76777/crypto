import { Request, Response } from 'express';
import { AuthService } from '../services/auth/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const result = await AuthService.register({
        name,
        email,
        password,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. RSA Keypair generated and protected.',
        data: result
      });
    } catch (err: any) {
      const status = err.message.includes('already exists') ? 409 : 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Registration failed'
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({
        email,
        password,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (err: any) {
      const status = err.message.includes('disabled') ? 403 : 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Login failed'
      });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash -encryptedPrivateKey');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved',
        data: {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          publicKey: user.publicKey,
          createdAt: user.createdAt
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
      });
    }
  }
}
