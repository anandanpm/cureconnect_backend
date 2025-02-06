import { userRepository } from '../Repository/userRepository';
import { User,UserRole } from '../Interfaces/user';
import { OtpService } from './otpService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { slotRepository } from '../Repository/slotRepository';
import Stripe from "stripe"
import SlotModel from '../Model/slotModel';
dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia", 
})

export class UserService {
  async signup(userData: User) {
    const existingUser = await userRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email is already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password!,10)
    const otp = OtpService.generateOTP();
    const otpExpiration = OtpService.generateOtpExpiration();
    const newUser = { ...userData, password:hashedPassword, otp, otp_expiration: otpExpiration };

    const createdUser = await userRepository.createUser(newUser);
    if(!createdUser) {
      throw  new Error('User not created');
    }
    const emailSent = await OtpService.sendOTPEmail(userData.email, otp,userData.role);
    if (!emailSent) {
      await userRepository.updateUser({...createdUser,otp:null,otp_expiration:null})
      throw   new Error('Failed to send OTP email');
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
        throw new Error('Email is incorrect');
      }

      if(user.is_active === false){
        throw new Error('User is Blocked');
      }
      
      if(user.role !== UserRole.PATIENT){
        throw new Error('Only patient can login here');
      }
      const passwordMatch = await bcrypt.compare(password, user.password!);
      if (!passwordMatch) {
        throw new Error('Password is incorrect');
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d', 
      });

      if (!process.env.REFRESH_TOKEN_SECRET ) {
        throw new Error('REFRESH_TOKEN_SECRET is not defined');
      }

      const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { 
        expiresIn: '7d', 
      });

      return { accessToken,refreshToken,username:user.username,Email:user.email,isActive:user.is_active,role:user.role,_id:user._id,gender:user.gender,profile_pic:user.profile_pic,phone:user.phone,age:user.age,address:user.address };
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
          role: UserRole.PATIENT, 
          is_active: true // 
        };
        user = await userRepository.createUser(newUser);
      }

      if(user.role!==UserRole.PATIENT){
        throw new Error('Only patient can login here');
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
        role: user.role,
        profile_pic:user.profile_pic,
        phone:user.phone,
        age:user.age,
        gender:user.gender,
        address:user.address,
        _id:user._id
      };
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  async profile(userdetails: User) {
    try {
      const { _id, ...updateData } = userdetails;
  
      if (!_id) {
        throw new Error('Email is required for profile update');
      }
  
      // Remove keys with undefined or empty string values
      Object.keys(updateData).forEach((key) => {
        const typedKey = key as keyof typeof updateData; 
        if (updateData[typedKey] === undefined || updateData[typedKey] === '') {
          delete updateData[typedKey];
        }
      });
  
      const updatedUser = await userRepository.updateUserProfile(_id.toString(), updateData);
      
  
      if (!updatedUser) {
        throw new Error('User not found or update failed');
      }
  
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }
  
  async getDoctors() {
    try {
      const doctors = await userRepository.findUsersByRole(UserRole.DOCTOR);
      const verifiedDoctors = doctors.filter(doctor => doctor.verified === true);
      return verifiedDoctors;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  async getDoctorSlots(doctorId: string) {
    try {
      const doctor = await userRepository.findUserById(doctorId)
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new Error("Doctor not found")
      }
      const currentDate = new Date();
      await slotRepository.deletePastSlots(doctorId,currentDate)
      return slotRepository.getSlotsByDoctorId(doctorId)
    } catch (error) {
      console.error("Error fetching doctor slots:", error)
      throw error
    }
  }

  async createPaymentIntent(amount: number) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, 
        currency: "usd",
        payment_method_types: ["card"],
      })

      return paymentIntent.client_secret
    } catch (error) {
      console.error("Error creating payment intent:", error)
      throw new Error("Failed to create payment intent")
    }
  }

  async createAppointment(appointmentData: {
    slot_id: string
    user_id: string
    amount: number
    payment_id:string
    status: string
  }) {
    try {
      const appointment = await userRepository.createAppointment(appointmentData)

      const updatedSlot = await slotRepository.updateSlotStatus(appointmentData.slot_id, "booked")

      if (!updatedSlot) {
        throw new Error("Failed to update slot status")
      }

      return {
        message: "Appointment created successfully and slot updated",
        appointment,
        updatedSlot,
      }
    } catch (error) {
      throw error
    }
  }


async getAppointmentDetails(userId: string) {
  try {
    const appointmentDetails = await userRepository.findPendingAppointmentsByUserId(userId)

    if (!appointmentDetails || appointmentDetails.length === 0) {
      throw new Error("No pending appointments found")
    }

    return appointmentDetails.map(appointment => ({
      doctorName: appointment.slot_id?.doctor_id?.username || 'Unknown Doctor',
      doctorDepartment: appointment.slot_id?.doctor_id?.department || 'Not Specified',
      patientName: appointment.user_id?.username || 'Unknown Patient',
      startTime: appointment.slot_id?.start_time || '',
      endTime: appointment.slot_id?.end_time || '',
      appointmentDate: appointment.slot_id?.day || '',
      status: appointment.status || 'pending',
      appointmentId:appointment._id
    }))
  } catch (error) {
    console.error("Error fetching appointment details:", error)
    throw error
  }
}

async refundPayment(appointmentId:string){
  try {
    const appointment = await userRepository.findAppointmentById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new Error('Appointment is already cancelled');
    }

    // Calculate 50% refund amount
    const refundAmount = Math.floor(appointment.amount * 0.5);

    const refund = await stripe.refunds.create({
      payment_intent: appointment.payment_id,
      amount: refundAmount
    });

    if (refund.status === 'succeeded') {

      appointment.status = 'cancelled';
      await appointment.save();

      await SlotModel.findByIdAndUpdate(
        appointment.slot_id,
        { status: 'available' }
      );

      return {
        success: true,
        message: 'Refund processed successfully',
        refundAmount,
        appointmentId: appointment._id
      };
    } else {
      throw new Error('Refund processing failed');
    }


    
  } catch (error) {
    
  }
}

}

export const userService = new UserService()