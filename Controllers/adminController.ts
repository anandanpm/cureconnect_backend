import { Request, Response } from 'express';
import { adminService } from '../Services/adminService';

class AdminController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, username, email: adminEmail, role, isActive } = await adminService.login(email, password);

      res.cookie('adminaccessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, 
      });

      res.cookie('adminrefreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.json({ message: 'Admin login successful', username, email: adminEmail, role, isActive });
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      res.status(401).json({ message: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('adminaccessToken');
      res.clearCookie('adminrefreshToken');
      res.json({ message: 'Logout successfully' });
    } catch (error) {
      console.error('Logout Error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: 'An unknown error occurred' });
      }
    }
  }

}

export const adminController = new AdminController();

