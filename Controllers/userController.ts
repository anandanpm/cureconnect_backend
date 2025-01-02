import { Request, Response } from 'express';
import { userService } from '../Services/userService';

export class UserController {
  
  async getOtp(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const result = await userService.signup(userData);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Signup Error:", error);
      res.status(400).json({ message: error.message }); 
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otpString } = req.body;
      const result = await userService.verifyOtp(email, otpString);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      res.status(400).json({ message: error.message }); 
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> { 
    try {
      const { email } = req.body;
      console.log(req.body,'the resent otp')
      if (!email) {
         res.status(400).json({ message: 'Email is required' });
         return
      }

      const result = await userService.resendOtp(email);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log(req.body,'the body is comming in the login')
      const {accessToken,refreshToken,username,Email,role,isActive} = await userService.login(email, password);
      console.log(username,Email,isActive,role,'it is comming')
      console.log(accessToken,'accessstoken')
      console.log(refreshToken,'refreshtoken')

      res.cookie('accessToken', accessToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, 
        path: '/'
        
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        path: '/'
         
      });

      res.json({ message: 'Login successful',username,email:Email,role,isActive }); 
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(401).json({ message: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
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


export const userController = new UserController();