import { userRepository } from "../Repository/userRepository";
import { slotRepository } from "../Repository/slotRepository";
import { User } from "../Interfaces/user";
import { OtpService } from "./otpService";
import { UserRole } from "../Interfaces/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import { Slot } from "../Interfaces/slot";
dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class DoctorService {
  async signup(userData: User) {
    const existingUser = await userRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    const otp = OtpService.generateOTP();
    const otpExpiration = OtpService.generateOtpExpiration();
    const newUser = {
      ...userData,
      password: hashedPassword,
      role: UserRole.DOCTOR,
      otp,
      otp_expiration: otpExpiration,
    };

    const createdUser = await userRepository.createUser(newUser);
    if (!createdUser) throw new Error("User not created");
    const emailSent = await OtpService.sendOTPEmail(
      userData.email,
      otp,
      userData.role
    );
    if (!emailSent) {
      await userRepository.updateUser({
        ...createdUser,
        otp: null,
        otp_expiration: null,
      });
      throw new Error("Failed to send OTP email");
    }
    return {
      message: "Otp send successfully",
      userId: createdUser._id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await userRepository.findUserByEmail(email);
    if (!user || !user.otp || !user.otp_expiration) {
      throw new Error("Invalid OTP or user not found");
    }

    if (OtpService.validateOTP(user.otp, user.otp_expiration, otp)) {
      user.is_active = true;
      user.otp = null;
      user.otp_expiration = null;
      await userRepository.updateUser(user);
      return { message: "Signup successful" };
    } else {
      throw new Error("Invalid or expired OTP");
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error("Invalid credentials");
      }

      if (user.role !== UserRole.DOCTOR) {
        throw new Error("Only doctor can login here");
      }

      const passwordMatch = await bcrypt.compare(password, user.password!);
      if (!passwordMatch) {
        throw new Error("Invalid credentials");
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }
      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("REFRESH_TOKEN_SECRET is not defined");
      }
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return {
        accessToken,
        refreshToken,
        username: user.username,
        Email: user.email,
        role: user.role,
        isActive: user.is_active,
        profile_pic: user.profile_pic,
        phone: user.phone,
        age: user.age,
        certification: user.certification,
        department: user.department,
        education: user.education,
        experience: user.experience,
        about: user.about,
        address: user.address,
        clinic_name: user.clinic_name,
        medical_license: user.medical_license,
        gender: user.gender,
        _id: user._id,
      };
    } catch (error) {
      throw error;
    }
  }

  async resendOtp(email: string) {
    try {
      const user = await userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.is_active) {
        return { message: "User is already verified" };
      }

      const otp = OtpService.generateOTP();
      const otpExpiration = OtpService.generateOtpExpiration();
      user.otp = otp;
      user.otp_expiration = otpExpiration;

      const updatedUser = await userRepository.updateUser(user);
      if (!updatedUser) throw new Error("User not updated");

      const emailSent = await OtpService.sendOTPEmail(email, otp, user.role);
      if (!emailSent) {
        user.otp = null;
        user.otp_expiration = null;
        await userRepository.updateUser(user);
        throw new Error("Failed to send OTP email");
      }

      return { message: "New OTP sent successfully" };
    } catch (error) {
      throw error;
    }
  }

  async googleAuth(token: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new Error("Invalid Google token");
      }

      let user = await userRepository.findUserByEmail(payload.email);

      if (!user) {
        // Create a new user if they don't exist
        const newUser: User = {
          username: payload.name || "",
          email: payload.email,
          password: undefined,
          role: UserRole.DOCTOR,
          is_active: true, //
        };
        user = await userRepository.createUser(newUser);
      }
      if (user.role !== UserRole.DOCTOR) {
        throw new Error("Only doctor can login here");
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }

      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("REFRESH_TOKEN_SECRET is not defined");
      }

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      return {
        accessToken,
        refreshToken,
        username: user.username,
        email: user.email,
        isActive: user.is_active,
        role: user.role,
        profile_pic: user.profile_pic,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        address: user.address,
        _id: user._id,
        medical_license: user.medical_license,
        department: user.department,
        certification: user.certification,
        experience: user.experience,
        clinic_name: user.clinic_name,
        about: user.about,
        education: user.education,
      };
    } catch (error) {
      console.error("Google Auth Error:", error);
      throw new Error("Failed to authenticate with Google");
    }
  }

  async profile(docDetails: User) {
    try {
      const { _id, ...updateData } = docDetails;
      console.log(docDetails, "this is corrected or not");

      if (!_id) {
        throw new Error("User ID is required");
      }
      const user = await userRepository.findUserById(_id.toString());
      if (!user) {
        throw new Error("User not found");
      }

      Object.keys(updateData).forEach((key) => {
        const typedKey = key as keyof typeof updateData;
        if (
          updateData[typedKey] === undefined ||
          updateData[typedKey] === "" ||
          (typeof updateData[typedKey] === "object" &&
            Object.keys(updateData[typedKey] as object).length === 0)
        ) {
          delete updateData[typedKey];
        }
      });

      console.log(
        updateData,
        "after the deletion of empty string and empty objects"
      );

      const updatedUser = await userRepository.updateUserProfile(
        _id.toString(),
        updateData
      );
      if (!updatedUser) {
        throw new Error("Failed to update profile");
      }
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
  async addSlots(slotData: any) {
    try {
      const { doctor_id, day, start_time, end_time } = slotData;
      if (!doctor_id || !day || !start_time || !end_time) {
        throw new Error(
          "Doctor ID, day, start time, and end time are required"
        );
      }
      const doctor = await userRepository.findUserById(doctor_id);
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      if (doctor.role !== UserRole.DOCTOR) {
        throw new Error("Only doctors can add slots");
      }
      const slot = await slotRepository.createSlot(slotData);
      if (!slot) {
        throw new Error("Failed to add slot");
      }
      return slot;
    } catch (error) {
      throw error;
    }
  }

  async getSlots(doctorId: string): Promise<Slot[]> {
    try {
      const currentDate = new Date();

      await slotRepository.deletePastSlots(doctorId, currentDate);

      const slots = await slotRepository.getSlotsByDoctorId(doctorId);
      return slots;
    } catch (error) {
      console.error("Error fetching slots:", error);
      throw new Error("Failed to fetch slots");
    }
  }

  async getDoctorAppointments(doctorId: string) {
    try {
      const appointments = await userRepository.findAppointmentsByDoctorId(doctorId);
      if (!appointments) {
        return [];
      }
      console.log(appointments,'the appointments are comming ')
      return appointments
     
    } catch (error) {
      console.error('Error in getDoctorAppointments:', error);
      throw new Error('Failed to fetch doctor appointments');
    }
  }
}

export const doctorService = new DoctorService();
