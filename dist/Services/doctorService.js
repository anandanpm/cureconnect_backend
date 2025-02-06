"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorService = exports.DoctorService = void 0;
const userRepository_1 = require("../Repository/userRepository");
const slotRepository_1 = require("../Repository/slotRepository");
const otpService_1 = require("./otpService");
const user_1 = require("../Interfaces/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const google_auth_library_1 = require("google-auth-library");
dotenv_1.default.config();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
class DoctorService {
    async signup(userData) {
        const existingUser = await userRepository_1.userRepository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error("Email already exists");
        }
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
        const otp = otpService_1.OtpService.generateOTP();
        const otpExpiration = otpService_1.OtpService.generateOtpExpiration();
        const newUser = {
            ...userData,
            password: hashedPassword,
            role: user_1.UserRole.DOCTOR,
            otp,
            otp_expiration: otpExpiration,
        };
        const createdUser = await userRepository_1.userRepository.createUser(newUser);
        if (!createdUser)
            throw new Error("User not created");
        const emailSent = await otpService_1.OtpService.sendOTPEmail(userData.email, otp, userData.role);
        if (!emailSent) {
            await userRepository_1.userRepository.updateUser({
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
    async verifyOtp(email, otp) {
        const user = await userRepository_1.userRepository.findUserByEmail(email);
        if (!user || !user.otp || !user.otp_expiration) {
            throw new Error("Invalid OTP or user not found");
        }
        if (otpService_1.OtpService.validateOTP(user.otp, user.otp_expiration, otp)) {
            user.is_active = true;
            user.otp = null;
            user.otp_expiration = null;
            await userRepository_1.userRepository.updateUser(user);
            return { message: "Signup successful" };
        }
        else {
            throw new Error("Invalid or expired OTP");
        }
    }
    async login(email, password) {
        try {
            const user = await userRepository_1.userRepository.findUserByEmail(email);
            if (!user) {
                throw new Error("Invalid credentials");
            }
            if (user.role !== user_1.UserRole.DOCTOR) {
                throw new Error("Only doctor can login here");
            }
            const passwordMatch = await bcrypt_1.default.compare(password, user.password);
            if (!passwordMatch) {
                throw new Error("Invalid credentials");
            }
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not defined");
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            if (!process.env.REFRESH_TOKEN_SECRET) {
                throw new Error("REFRESH_TOKEN_SECRET is not defined");
            }
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: "7d",
            });
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
        }
        catch (error) {
            throw error;
        }
    }
    async resendOtp(email) {
        try {
            const user = await userRepository_1.userRepository.findUserByEmail(email);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.is_active) {
                return { message: "User is already verified" };
            }
            const otp = otpService_1.OtpService.generateOTP();
            const otpExpiration = otpService_1.OtpService.generateOtpExpiration();
            user.otp = otp;
            user.otp_expiration = otpExpiration;
            const updatedUser = await userRepository_1.userRepository.updateUser(user);
            if (!updatedUser)
                throw new Error("User not updated");
            const emailSent = await otpService_1.OtpService.sendOTPEmail(email, otp, user.role);
            if (!emailSent) {
                user.otp = null;
                user.otp_expiration = null;
                await userRepository_1.userRepository.updateUser(user);
                throw new Error("Failed to send OTP email");
            }
            return { message: "New OTP sent successfully" };
        }
        catch (error) {
            throw error;
        }
    }
    async googleAuth(token) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error("Invalid Google token");
            }
            let user = await userRepository_1.userRepository.findUserByEmail(payload.email);
            if (!user) {
                // Create a new user if they don't exist
                const newUser = {
                    username: payload.name || "",
                    email: payload.email,
                    password: undefined,
                    role: user_1.UserRole.DOCTOR,
                    is_active: true, //
                };
                user = await userRepository_1.userRepository.createUser(newUser);
            }
            if (user.role !== user_1.UserRole.DOCTOR) {
                throw new Error("Only doctor can login here");
            }
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not defined");
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
            if (!process.env.REFRESH_TOKEN_SECRET) {
                throw new Error("REFRESH_TOKEN_SECRET is not defined");
            }
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
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
        }
        catch (error) {
            console.error("Google Auth Error:", error);
            throw new Error("Failed to authenticate with Google");
        }
    }
    async profile(docDetails) {
        try {
            const { _id, ...updateData } = docDetails;
            console.log(docDetails, "this is corrected or not");
            if (!_id) {
                throw new Error("User ID is required");
            }
            const user = await userRepository_1.userRepository.findUserById(_id.toString());
            if (!user) {
                throw new Error("User not found");
            }
            Object.keys(updateData).forEach((key) => {
                const typedKey = key;
                if (updateData[typedKey] === undefined ||
                    updateData[typedKey] === "" ||
                    (typeof updateData[typedKey] === "object" &&
                        Object.keys(updateData[typedKey]).length === 0)) {
                    delete updateData[typedKey];
                }
            });
            console.log(updateData, "after the deletion of empty string and empty objects");
            const updatedUser = await userRepository_1.userRepository.updateUserProfile(_id.toString(), updateData);
            if (!updatedUser) {
                throw new Error("Failed to update profile");
            }
            return updatedUser;
        }
        catch (error) {
            throw error;
        }
    }
    async addSlots(slotData) {
        try {
            const { doctor_id, day, start_time, end_time } = slotData;
            if (!doctor_id || !day || !start_time || !end_time) {
                throw new Error("Doctor ID, day, start time, and end time are required");
            }
            const doctor = await userRepository_1.userRepository.findUserById(doctor_id);
            if (!doctor) {
                throw new Error("Doctor not found");
            }
            if (doctor.role !== user_1.UserRole.DOCTOR) {
                throw new Error("Only doctors can add slots");
            }
            const slot = await slotRepository_1.slotRepository.createSlot(slotData);
            if (!slot) {
                throw new Error("Failed to add slot");
            }
            return slot;
        }
        catch (error) {
            throw error;
        }
    }
    async getSlots(doctorId) {
        try {
            const currentDate = new Date();
            await slotRepository_1.slotRepository.deletePastSlots(doctorId, currentDate);
            const slots = await slotRepository_1.slotRepository.getSlotsByDoctorId(doctorId);
            return slots;
        }
        catch (error) {
            console.error("Error fetching slots:", error);
            throw new Error("Failed to fetch slots");
        }
    }
    async getDoctorAppointments(doctorId) {
        try {
            const appointments = await userRepository_1.userRepository.findAppointmentsByDoctorId(doctorId);
            if (!appointments) {
                return [];
            }
            console.log(appointments, 'the appointments are comming ');
            return appointments;
        }
        catch (error) {
            console.error('Error in getDoctorAppointments:', error);
            throw new Error('Failed to fetch doctor appointments');
        }
    }
}
exports.DoctorService = DoctorService;
exports.doctorService = new DoctorService();
