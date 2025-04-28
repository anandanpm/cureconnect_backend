import { userRepository } from "../Repository/userRepository";
import { slotRepository } from "../Repository/slotRepository";
import { DashboardResponseType, DoctorAppointment, DoctorLoginResponse, DoctorSignupResponse, User } from "../Interfaces/user";
import { otpService } from '../Services/otpService'
import { UserRole } from "../Interfaces/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import { IUserRepository } from "../Interfaces/iUserRepository";
import { Slot } from '../Interfaces/slot';
import { ISlotRepository } from "../Interfaces/iSlotRepository";
import { IDoctorService } from "../Interfaces/iDoctorService";
import { IOtpService } from "../Interfaces/iotpService";
import { Prescription } from "Interfaces/prescription";

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class DoctorService implements IDoctorService {
  constructor(private userRepository: IUserRepository, private slotRepository: ISlotRepository, private OtpService: IOtpService) { }


  async signup(userData: User): Promise<DoctorSignupResponse> {
    const existingUser = await this.userRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    const otp = this.OtpService.generateOTP();
    const otpExpiration = this.OtpService.generateOtpExpiration();
    const newUser = {
      ...userData,
      password: hashedPassword,
      role: UserRole.DOCTOR,
      otp,
      otp_expiration: otpExpiration,
    };

    const createdUser = await this.userRepository.createUser(newUser);
    if (!createdUser) throw new Error("User not created");
    const emailSent = await this.OtpService.sendOTPEmail(
      userData.email,
      otp
    );
    if (!emailSent) {
      await this.userRepository.updateUser({
        ...createdUser,
        otp: null,
        otp_expiration: null,
      });
      throw new Error("Failed to send OTP email");
    }
    return {
      message: "Otp send successfully",
      userId: createdUser._id as string,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user || !user.otp || !user.otp_expiration) {
      throw new Error("Invalid OTP or user not found");
    }

    if (this.OtpService.validateOTP(user.otp, user.otp_expiration, otp)) {
      user.is_active = true;
      user.otp = null;
      user.otp_expiration = null;
      await userRepository.updateUser(user);
      return { message: "Signup successful" };
    } else {
      throw new Error("Invalid or expired OTP");
    }
  }

  async login(email: string, password: string): Promise<DoctorLoginResponse> {
    try {
      const user = await this.userRepository.findUserByEmail(email);
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

      if (user.is_active === false) {
        throw new Error('User is Blocked');
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
        { userId: user._id, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return {
        accessToken,
        refreshToken,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.is_active ?? false,
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
        _id: user._id as string,
      };
    } catch (error) {
      throw error;
    }
  }

  async resendOtp(email: string) {
    try {
      const user = await this.userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.is_active) {
        return { message: "User is already verified" };
      }

      const otp = this.OtpService.generateOTP();
      const otpExpiration = this.OtpService.generateOtpExpiration();
      user.otp = otp;
      user.otp_expiration = otpExpiration;

      const updatedUser = await this.userRepository.updateUser(user);
      if (!updatedUser) throw new Error("User not updated");

      const emailSent = await this.OtpService.sendOTPEmail(email, otp);
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

  async googleAuth(token: string): Promise<DoctorLoginResponse> {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new Error("Invalid Google token");
      }

      let user = await this.userRepository.findUserByEmail(payload.email);

      if (!user) {
        // Create a new user if they don't exist
        const newUser: User = {
          username: payload.name || "",
          email: payload.email,
          password: undefined,
          role: UserRole.DOCTOR,
          is_active: true, //
        };
        user = await this.userRepository.createUser(newUser);
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
        isActive: user.is_active ?? false,
        role: user.role,
        profile_pic: user.profile_pic,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        address: user.address,
        _id: user._id as string,
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
      const user = await this.userRepository.findUserById(_id.toString());
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

      const updatedUser = await this.userRepository.updateUserProfile(
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
      const doctor = await this.userRepository.findUserById(doctor_id);
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      if (doctor.role !== UserRole.DOCTOR) {
        throw new Error("Only doctors can add slots");
      }
      const slot = await slotRepository.createSlot(slotData);
      if (slot === undefined || slot === null) {
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

      const slots = await this.slotRepository.getSlotsByDoctorId(doctorId);
      return slots;
    } catch (error) {
      console.error("Error fetching slots:", error);
      throw new Error("Failed to fetch slots");
    }
  }

  async deleteSlot(slotId: string): Promise<Slot> {
    try {
      const slot = await this.slotRepository.deleteSlotById(slotId);
      if (!slot) {
        throw new Error("Failed to delete slot");
      }
      return slot;
    } catch (error) {
      console.error("Error deleting slot:", error);
      throw new Error("Failed to delete slot");
    }
  }


  async getDoctorAppointments(doctorId: string): Promise<DoctorAppointment[]> {
    try {
      const appointments = await this.userRepository.findAppointmentsByDoctorId(doctorId);
      if (!appointments) {
        return [];
      }
      console.log(appointments, 'the appointments are comming ')
      return appointments

    } catch (error) {
      console.error('Error in getDoctorAppointments:', error);
      throw new Error('Failed to fetch doctor appointments');
    }
  }

  async checkAppointmentValidity(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await this.userRepository.findAppointmentWithSlot(appointmentId);

      if (!appointment) {
        console.log('Appointment not found');
        return false;
      }

      // Check if slot_id exists
      if (!appointment.slot_id) {
        console.log('Slot data not found');
        return false;
      }

      console.log('Retrieved slot data:', appointment.slot_id);

      // Check for required time fields
      if (!appointment.slot_id.start_time || !appointment.slot_id.end_time) {
        console.log('Missing time data in slot');
        return false;
      }

      // Get current time
      const currentTime = new Date();

      // Determine appointment date - using the appointment date if available, 
      // otherwise fallback to the current date
      let appointmentDate;
      if (appointment.slot_id.date) {
        appointmentDate = new Date(appointment.slot_id.date);
      } else if (appointment.date) {
        appointmentDate = new Date(appointment.date);
      } else {
        // Fallback to today's date if no date field is found
        appointmentDate = new Date();
        console.log('No date field found, using current date as fallback');
      }

      console.log(appointmentDate, 'the appointmentDate being used');

      // Convert slot times to Date objects for comparison
      const [startHours, startMinutes] = appointment.slot_id.start_time.split(':');
      const appointmentStartTime = new Date(appointmentDate);
      appointmentStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);

      const [endHours, endMinutes] = appointment.slot_id.end_time.split(':');
      const appointmentEndTime = new Date(appointmentDate);
      appointmentEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

      // Allow calls 5 minutes before the appointment start time
      const bufferTime = new Date(appointmentStartTime);
      bufferTime.setMinutes(appointmentStartTime.getMinutes() - 5);

      // Check if current time is within the valid range
      const isWithinTimeRange = currentTime >= bufferTime && currentTime <= appointmentEndTime;

      // Check if appointment status is valid (not cancelled)
      const isValidStatus = appointment.status === 'pending' || appointment.status === 'completed';

      console.log({
        currentTime,
        appointmentStartTime,
        appointmentEndTime,
        bufferTime,
        isWithinTimeRange,
        isValidStatus,
        appointmentStatus: appointment.status
      });

      return isWithinTimeRange && isValidStatus;
    } catch (error) {
      console.error('Error in checkAppointmentValidity:', error);
      throw new Error('Failed to check appointment validity');
    }
  }

  async resetPassword(doctorId: string, oldPassword: string, newPassword: string) {
    try {
      const user = await this.userRepository.findUserById(doctorId)
      if (!user) {
        throw new Error('User not found')
      }
      const passwordMatch = await bcrypt.compare(oldPassword, user.password!);
      if (!passwordMatch) {
        throw new Error('Old Password is incorrect');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      user.password = hashedPassword
      await this.userRepository.updateUser(user)
      return { message: 'Password updated successfully' }
    } catch (error) {
      console.error("Error updating password:", error)
      throw error
    }
  }

  async sendForgottenpassword(email: string) {
    try {
      const user = await this.userRepository.findUserByEmail(email)
      if (!user) {
        throw new Error('User not found')
      }
      const otp = this.OtpService.generateOTP();
      const otpExpiration = this.OtpService.generateOtpExpiration();
      user.otp = otp;
      user.otp_expiration = otpExpiration;
      await this.userRepository.updateUser(user)
      const emailSent = await this.OtpService.sendOTPEmail(email, otp);
      if (!emailSent) {
        user.otp = null;
        user.otp_expiration = null;
        await this.userRepository.updateUser(user);
        throw new Error('Failed to send OTP email');
      }
      return { message: 'New OTP sent successfully' };
    } catch (error) {
      console.error("Error sending forgotten password:", error)
      throw error
    }
  }

  async verifyForgottenpassword(email: string, otpString: string) {
    try {
      const user = await this.userRepository.findUserByEmail(email)
      if (!user || !user.otp || !user.otp_expiration) {
        throw new Error('Invalid OTP or user not found');
      }

      if (this.OtpService.validateOTP(user.otp, user.otp_expiration, otpString)) {
        user.otp = null;
        user.otp_expiration = null;
        await this.userRepository.updateUser(user);
        return { message: 'Otp verified successfully' };
      } else {
        throw new Error('Invalid or expired OTP');
      }
    } catch (error) {
      console.error("Error verifying forgotten password:", error)
      throw error
    }
  }

  async resetForgottenpassword(email: string, password: string) {
    try {
      const user = await this.userRepository.findUserByEmail(email)
      if (!user) {
        throw new Error('User not found')
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      user.password = hashedPassword
      await this.userRepository.updateUser(user)
      return { message: 'Password updated successfully' }
    } catch (error) {
      console.error("Error updating password:", error)
      throw error
    }

  }

  async prescription(prescriptionData: Prescription): Promise<Prescription> {
    try {
      if (!prescriptionData.appointment_id) {
        throw new Error('Appointment ID is required');
      }

      const savedPrescription = await this.userRepository.createPrescription(prescriptionData) as Prescription;

      return savedPrescription;
    } catch (error) {
      console.error('Error in prescription service:', error);
      throw error;
    }
  }

  async completeAppointment(appointmentId: string): Promise<DoctorAppointment> {
    try {
      const appointment = await this.userRepository.findAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status === 'completed') {
        throw new Error('Appointment already completed');
      }

      let status = 'completed';
      const updatedAppointment = await this.userRepository.updateAppointment(appointmentId, status);
      if (!updatedAppointment) {
        throw new Error('Failed to complete appointment');
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error in completeAppointment:', error);
      throw new Error('Failed to complete appointment');
    }
  }

  async getDetailsDashboard(doctorId: string): Promise<DashboardResponseType> {
    try {
      const response = await this.userRepository.getDoctorDashboard(doctorId);
      console.log(response, 'is what is comming')
      return response;
    } catch (error) {
      console.error('Error in getDetailsDashboard:', error);
      throw new Error('Failed to fetch dashboard details');
    }
  }

}

export const doctorService = new DoctorService(userRepository, slotRepository, otpService);
