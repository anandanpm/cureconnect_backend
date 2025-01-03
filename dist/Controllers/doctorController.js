"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorController = exports.DoctorController = void 0;
const doctorService_1 = require("../Services/doctorService");
class DoctorController {
    async getOtp(req, res) {
        try {
            const userData = req.body;
            console.log(req.body, 'Hello from the doctor');
            const result = await doctorService_1.doctorService.signup(userData);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Signup Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;
            console.log(req.body, 'from the verify otp email and otp is comming from the front end ');
            const result = await doctorService_1.doctorService.verifyOtp(email, otp);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("OTP Verification Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async resendOtp(req, res) {
        try {
            const { email } = req.body;
            console.log(req.body, 'the resent otp');
            if (!email) {
                res.status(400).json({ message: 'Email is required' });
                return;
            }
            const result = await doctorService_1.doctorService.resendOtp(email);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Resend OTP Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken, username, Email, isActive, role } = await doctorService_1.doctorService.login(email, password);
            res.cookie('docaccessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000,
            });
            res.cookie('docrefreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({ message: 'Login successful', username, email: Email, role, isActive });
        }
        catch (error) {
            console.error("Login Error:", error);
            res.status(401).json({ message: error.message });
        }
    }
    async logout(req, res) {
        try {
            res.clearCookie('docaccessToken');
            res.clearCookie('docrefreshToken');
            res.json({ message: 'Logout successfully' });
        }
        catch (error) {
            console.error('Logout Error:', error);
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(400).json({ message: 'An unknown error occurred' });
            }
        }
    }
    async googleAuth(req, res) {
        try {
            const { token } = req.body;
            const result = await doctorService_1.doctorService.googleAuth(token);
            res.cookie('docaccessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 60 * 60 * 1000,
                path: '/'
            });
            res.cookie('docaccessToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });
            res.status(200).json({
                message: 'Google authentication successful',
                username: result.username,
                email: result.email,
                role: result.role,
                isActive: result.isActive
            });
        }
        catch (error) {
            console.error("Google Auth Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
}
exports.DoctorController = DoctorController;
exports.doctorController = new DoctorController();
