import { userRepository } from '../Repository/userRepository';
import { User } from '../Interfaces/user';
import { OtpService } from './otpService';
import { UserRole } from '../Interfaces/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class DoctorService {

  async signup(userData: User) {
    const existingUser = await userRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password!,10)
    const otp = OtpService.generateOTP();
    const otpExpiration = OtpService.generateOtpExpiration();
    const newUser = { ...userData, password:hashedPassword,role:UserRole.DOCTOR,otp, otp_expiration: otpExpiration };

    const createdUser = await userRepository.createUser(newUser);
    if(!createdUser) throw new Error("User not created")
    const emailSent = await OtpService.sendOTPEmail(userData.email, otp,userData.role);
    if (!emailSent) {
      await userRepository.updateUser({...createdUser,otp:null,otp_expiration:null})
      throw new Error('Failed to send OTP email');
    }
    return {message:"Otp send successfully",userId:createdUser._id,username:createdUser.username,email:createdUser.email,role:createdUser.role};
  }

  async verifyOtp(email: string, otp: string) {
    const user = await userRepository.findUserByEmail(email);
    if (!user || !user.otp || !user.otp_expiration) {
      throw new Error('Invalid OTP or user not found');
    }

    if (OtpService.validateOTP(user.otp, user.otp_expiration, otp)) {
      user.is_active = true;
      user.otp = null;
      user.otp_expiration = null;
      await userRepository.updateUser(user);
      return { message: 'Signup successful' };
    } else {
      throw new Error('Invalid or expired OTP');
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const passwordMatch = await bcrypt.compare(password, user.password!);
      if (!passwordMatch) {
        throw new Error('Invalid credentials');
      }

      const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_default_secret', {
        expiresIn: '15m', 
      });

      const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', { 
        expiresIn: '7d', 
      });

      return { accessToken,refreshToken,username:user.username,Email:user.email,role:user.role,isActive:user.is_active };
    } catch (error) {
      throw error;
    }
  }

  async resendOtp(email: string) {
    try {
      const user = await userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.is_active) {
        return { message: 'User is already verified' }; 
      }

      const otp = OtpService.generateOTP();
      const otpExpiration = OtpService.generateOtpExpiration();
      user.otp = otp;
      user.otp_expiration = otpExpiration;

      const updatedUser = await userRepository.updateUser(user);
      if(!updatedUser) throw new Error("User not updated")

      const emailSent = await OtpService.sendOTPEmail(email, otp,user.role);
      if (!emailSent) {
        user.otp = null;
        user.otp_expiration = null;
        await userRepository.updateUser(user);
        throw new Error('Failed to send OTP email');
      }

      return { message: 'New OTP sent successfully' };
    } catch (error) {
      throw error;
    }
  }

   async googleAuth(token: string) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: "608044793656-ijtreinvo4rrlavpjbrmjsf01n7rg5fr.apps.googleusercontent.com"
        });
        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
          throw new Error('Invalid Google token');
        }
  
        let user = await userRepository.findUserByEmail(payload.email);
  
        if (!user) {
          // Create a new user if they don't exist
          const newUser: User = {
            username: payload.name || '',
            email: payload.email,
            password: undefined, 
            role: UserRole.DOCTOR, 
            is_active: true // 
          };
          user = await userRepository.createUser(newUser);
        }
  
        const accessToken = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET || 'your_default_secret',
          { expiresIn: '15m' }
        );
  
        const refreshToken = jwt.sign(
          { userId: user._id },
          process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret',
          { expiresIn: '7d' }
        );
  
        return {
          accessToken,
          refreshToken,
          username: user.username,
          email: user.email,
          isActive: user.is_active,
          role: user.role
        };
      } catch (error) {
        console.error('Google Auth Error:', error);
        throw new Error('Failed to authenticate with Google');
      }
    }

}

export const doctorService = new DoctorService()