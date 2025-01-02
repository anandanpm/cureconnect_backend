import { User, UserRole } from '../Interfaces/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../Repository/userRepository';

class AdminService {
  async login(email: string, password: string) {
    try {
      const admin = await userRepository.findUserByEmail(email);
      if (!admin || admin.role !== UserRole.ADMIN) {
        throw new Error('Invalid credentials');
      }

      const passwordMatch = await bcrypt.compare(password, admin.password!);
      if (!passwordMatch) {
        throw new Error('Invalid credentials');
      }

      const accessToken = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET || 'your_default_secret',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: admin._id },
        process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret',
        { expiresIn: '7d' }
      );

      return {
        accessToken,
        refreshToken,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(userId: string) {
    // Implement any necessary logout logic, such as invalidating tokens
    // This might involve adding the token to a blacklist or clearing sessions
    return { message: 'Logout successful' };
  }
}

export const adminService = new AdminService();

