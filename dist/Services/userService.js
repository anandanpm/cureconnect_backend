"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const userRepository_1 = require("../Repository/userRepository");
const user_1 = require("../Interfaces/user");
const otpService_1 = require("./otpService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
class UserService {
    async signup(userData) {
        const existingUser = await userRepository_1.userRepository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('Email is already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
        const otp = otpService_1.OtpService.generateOTP();
        const otpExpiration = otpService_1.OtpService.generateOtpExpiration();
        const newUser = { ...userData, password: hashedPassword, otp, otp_expiration: otpExpiration };
        const createdUser = await userRepository_1.userRepository.createUser(newUser);
        if (!createdUser) {
            throw new Error('User not created');
        }
        const emailSent = await otpService_1.OtpService.sendOTPEmail(userData.email, otp, userData.role);
        if (!emailSent) {
            await userRepository_1.userRepository.updateUser({ ...createdUser, otp: null, otp_expiration: null });
            throw new Error('Failed to send OTP email');
        }
        return { message: "Otp send successfully", userId: createdUser._id, username: createdUser.username, email: createdUser.email, role: createdUser.role };
    }
    async verifyOtp(email, otp) {
        const user = await userRepository_1.userRepository.findUserByEmail(email);
        if (!user || !user.otp || !user.otp_expiration) {
            throw new Error('Invalid OTP or user not found');
        }
        if (otpService_1.OtpService.validateOTP(user.otp, user.otp_expiration, otp)) {
            user.is_active = true;
            user.otp = null;
            user.otp_expiration = null;
            await userRepository_1.userRepository.updateUser(user);
            return { message: 'Signup successful' };
        }
        else {
            throw new Error('Invalid or expired OTP');
        }
    }
    async login(email, password) {
        try {
            const user = await userRepository_1.userRepository.findUserByEmail(email);
            if (!user) {
                throw new Error('Email is incorrect');
            }
            const passwordMatch = await bcrypt_1.default.compare(password, user.password);
            if (!passwordMatch) {
                throw new Error('Password is incorrect');
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_default_secret', {
                expiresIn: '15m',
            });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', {
                expiresIn: '7d',
            });
            return { accessToken, refreshToken, username: user.username, Email: user.email, isActive: user.is_active, role: user.role };
        }
        catch (error) {
            throw error;
        }
    }
    async resendOtp(email) {
        try {
            const user = await userRepository_1.userRepository.findUserByEmail(email);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.is_active) {
                return { message: 'User is already verified' };
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
                throw new Error('Failed to send OTP email');
            }
            return { message: 'New OTP sent successfully' };
        }
        catch (error) {
            throw error;
        }
    }
    async googleAuth(token) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: "608044793656-ijtreinvo4rrlavpjbrmjsf01n7rg5fr.apps.googleusercontent.com"
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error('Invalid Google token');
            }
            let user = await userRepository_1.userRepository.findUserByEmail(payload.email);
            if (!user) {
                // Create a new user if they don't exist
                const newUser = {
                    username: payload.name || '',
                    email: payload.email,
                    password: undefined,
                    role: user_1.UserRole.PATIENT,
                    is_active: true // 
                };
                user = await userRepository_1.userRepository.createUser(newUser);
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_default_secret', { expiresIn: '15m' });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', { expiresIn: '7d' });
            return {
                accessToken,
                refreshToken,
                username: user.username,
                email: user.email,
                isActive: user.is_active,
                role: user.role
            };
        }
        catch (error) {
            console.error('Google Auth Error:', error);
            throw new Error('Failed to authenticate with Google');
        }
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
