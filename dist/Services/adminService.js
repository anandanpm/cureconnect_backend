"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const user_1 = require("../Interfaces/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRepository_1 = require("../Repository/userRepository");
const emailService_1 = require("./emailService");
dotenv_1.default.config();
class AdminService {
    async login(email, password) {
        try {
            const admin = await userRepository_1.userRepository.findUserByEmail(email);
            if (!admin || admin.role !== user_1.UserRole.ADMIN) {
                throw new Error("Invalid credentials");
            }
            const passwordMatch = await bcrypt_1.default.compare(password, admin.password);
            if (!passwordMatch) {
                throw new Error("Invalid credentials");
            }
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not defined");
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
            if (!process.env.REFRESH_TOKEN_SECRET) {
                throw new Error("REFRESH_TOKEN_SECRET is not defined");
            }
            const refreshToken = jsonwebtoken_1.default.sign({ userId: admin._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
            return {
                accessToken,
                refreshToken,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                isActive: admin.is_active,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getPatients() {
        try {
            const users = await userRepository_1.userRepository.findAllUsers();
            const patients = users.filter((user) => user.role === "patient");
            return patients;
        }
        catch (error) {
            console.error("Error fetching patients:", error);
            throw error;
        }
    }
    async togglePatientStatus(id, is_active) {
        try {
            const user = await userRepository_1.userRepository.findUserById(id);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.role !== user_1.UserRole.PATIENT) {
                throw new Error("User is not a patient");
            }
            const updatedUser = await userRepository_1.userRepository.updateUserStatus(id, is_active);
            return updatedUser;
        }
        catch (error) {
            console.error("Error toggling patient status:", error);
            throw error;
        }
    }
    async getVerifyDoctors() {
        try {
            return await userRepository_1.userRepository.findAllVerifyDoctors();
        }
        catch (error) {
            console.error("Error fetching doctors:", error);
            throw error;
        }
    }
    async getDoctors() {
        try {
            return await userRepository_1.userRepository.findAllDoctors();
        }
        catch (error) {
            console.error("Error fetching doctor", error);
            throw error;
        }
    }
    async rejectDoctor(id, reason) {
        try {
            const doctor = await userRepository_1.userRepository.findUserById(id);
            if (!doctor) {
                throw new Error("Doctor not found");
            }
            if (doctor.role !== user_1.UserRole.DOCTOR) {
                throw new Error("User is not a doctor");
            }
            // Send rejection email
            await emailService_1.emailService.sendRejectionEmail(doctor.email, reason);
            // Remove doctor from the database
            await userRepository_1.userRepository.removeUser(id);
        }
        catch (error) {
            console.error("Error rejecting doctor:", error);
            throw error;
        }
    }
    async toggleDoctorStatus(id) {
        try {
            const user = await userRepository_1.userRepository.findUserById(id);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.role !== user_1.UserRole.DOCTOR) {
                throw new Error("User is not a doctor");
            }
            const newStatus = !user.is_active;
            return await userRepository_1.userRepository.updateUserStatus(id, newStatus);
        }
        catch (error) {
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
    async verifyDoctor(id) {
        try {
            const user = await userRepository_1.userRepository.findUserById(id);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.role !== user_1.UserRole.DOCTOR) {
                throw new Error("User is not a doctor");
            }
            const is_verified = true; // Always set to true when approving
            const updatedUser = await userRepository_1.userRepository.updateDoctorVerification(id, is_verified);
            if (updatedUser && is_verified) {
                // Send approval email
                await emailService_1.emailService.sendApprovalEmail(updatedUser.email);
            }
            return updatedUser;
        }
        catch (error) {
            console.error("Error verifying doctor:", error);
            throw error;
        }
    }
}
exports.adminService = new AdminService();
