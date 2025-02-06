import { User, UserRole } from "../Interfaces/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userRepository } from "../Repository/userRepository";
import { emailService } from "./emailService";
dotenv.config();

class AdminService {
  async login(email: string, password: string) {
    try {
      const admin = await userRepository.findUserByEmail(email);
      if (!admin || admin.role !== UserRole.ADMIN) {
        throw new Error("Invalid credentials");
      }

      const passwordMatch = await bcrypt.compare(password, admin.password!);
      if (!passwordMatch) {
        throw new Error("Invalid credentials");
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }

      const accessToken = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("REFRESH_TOKEN_SECRET is not defined");
      }

      const refreshToken = jwt.sign(
        { userId: admin._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      return {
        accessToken,
        refreshToken,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPatients(): Promise<User[]> {
    try {
      const users = await userRepository.findAllUsers();

      const patients = users.filter((user) => user.role === "patient");

      return patients;
    } catch (error) {
      console.error("Error fetching patients:", error);
      throw error;
    }
  }

  async togglePatientStatus(
    id: string,
    is_active: boolean
  ): Promise<User | null> {
    try {
      const user = await userRepository.findUserById(id);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.role !== UserRole.PATIENT) {
        throw new Error("User is not a patient");
      }

      const updatedUser = await userRepository.updateUserStatus(id, is_active);
      return updatedUser;
    } catch (error) {
      console.error("Error toggling patient status:", error);
      throw error;
    }
  }

  async getVerifyDoctors(): Promise<User[]> {
    try {
      return await userRepository.findAllVerifyDoctors();
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  }

  async getDoctors(): Promise<User[]> {
    try {
      return await userRepository.findAllDoctors();
    } catch (error) {
      console.error("Error fetching doctor", error);
      throw error;
    }
  }

  async rejectDoctor(id: string, reason: string): Promise<void> {
    try {
      const doctor = await userRepository.findUserById(id)

      if (!doctor) {
        throw new Error("Doctor not found")
      }

      if (doctor.role !== UserRole.DOCTOR) {
        throw new Error("User is not a doctor")
      }

      // Send rejection email
      await emailService.sendRejectionEmail(doctor.email, reason)

      // Remove doctor from the database
      await userRepository.removeUser(id)
    } catch (error) {
      console.error("Error rejecting doctor:", error)
      throw error
    }
  }

  async toggleDoctorStatus(id: string): Promise<User | null> {
    try {
      const user = await userRepository.findUserById(id);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.role !== UserRole.DOCTOR) {
        throw new Error("User is not a doctor");
      }
      const newStatus = !user.is_active;

      return await userRepository.updateUserStatus(id, newStatus);
    } catch (error) {
      console.error("Error toggling doctor status:", error);
      throw error;
    }
  }

  // async verifyDoctor(id: string): Promise<User | null> {
  //   try {
  //     const user = await userRepository.findUserById(id);

  //     if (!user) {
  //       throw new Error("User not found");
  //     }

  //     if (user.role !== UserRole.DOCTOR) {
  //       throw new Error("User is not a doctor");
  //     }

  //     const is_verified = !user.verified;
  //     return await userRepository.updateDoctorVerification(id, is_verified);
  //   } catch (error) {
  //     console.error("Error verifying doctor:", error);
  //     throw error;
  //   }
  // }

  async verifyDoctor(id: string): Promise<User | null> {
    try {
      const user = await userRepository.findUserById(id)

      if (!user) {
        throw new Error("User not found")
      }

      if (user.role !== UserRole.DOCTOR) {
        throw new Error("User is not a doctor")
      }

      const is_verified = true // Always set to true when approving
      const updatedUser = await userRepository.updateDoctorVerification(id, is_verified)

      if (updatedUser && is_verified) {
        // Send approval email
        await emailService.sendApprovalEmail(updatedUser.email)
      }

      return updatedUser
    } catch (error) {
      console.error("Error verifying doctor:", error)
      throw error
    }
  }
}

export const adminService = new AdminService();
