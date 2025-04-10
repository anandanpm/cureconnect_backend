"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userService_1 = require("../Services/userService");
const userRepository_1 = require("../Repository/userRepository");
const otpService_1 = require("../Services/otpService");
const slotRepository_1 = require("../Repository/slotRepository");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserController {
    constructor(UserService) {
        this.UserService = UserService;
    }
    async getOtp(req, res) {
        try {
            const { email, password, username } = req.body;
            const result = await this.UserService.signup(username, email, password);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Signup Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async verifyOtp(req, res) {
        try {
            const { email, otpString } = req.body;
            console.log(email);
            const result = await this.UserService.verifyOtp(email, otpString);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("OTP Verification Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async resendOtp(req, res) {
        try {
            console.log(req.body);
            const { email } = req.body;
            console.log(email, 'the email is comming');
            if (!email) {
                res.status(400).json({ message: 'Email is required' });
                return;
            }
            const result = await this.UserService.resendOtp(email);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Resend OTP Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async login(req, res) {
        try {
            const { Email, password } = req.body;
            console.log(req.body);
            const { accessToken, refreshToken, username, email, role, isActive, _id, gender, profile_pic, phone, age, address } = await this.UserService.login(Email, password);
            res.cookie('accessToken', accessToken, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 60 * 60 * 1000,
                path: '/'
            });
            res.cookie('refreshToken', refreshToken, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });
            res.json({ message: 'Login successful', username, email, role, isActive, _id, age, gender, profile_pic, phone, address });
        }
        catch (error) {
            console.error("Login Error:", error);
            res.status(401).json({ message: error.message });
        }
    }
    async logout(req, res) {
        try {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
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
            const result = await this.UserService.googleAuth(token);
            res.cookie('accessToken', result.accessToken, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 60 * 60 * 1000,
                path: '/'
            });
            res.cookie('refreshToken', result.refreshToken, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });
            res.status(200).json({
                message: 'Google authentication successful',
                username: result.username,
                email: result.email,
                role: result.role,
                isActive: result.isActive,
                gender: result.gender,
                profile_pic: result.profile_pic,
                phone: result.phone,
                age: result.age,
                address: result.address,
                _id: result._id
            });
        }
        catch (error) {
            console.error("Google Auth Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            const userDetails = req.body;
            console.log('Incoming profile update request:', userDetails);
            const updatedUser = await this.UserService.profile(userDetails);
            res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
        }
        catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getDoctors(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 6;
            const search = req.query.search || "";
            const department = req.query.department || "";
            const result = await this.UserService.getDoctors(page, limit, search, department);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error fetching doctors:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async doctorSlots(req, res) {
        try {
            const doctorId = req.params.id;
            const slots = await this.UserService.getDoctorSlots(doctorId);
            console.log(slots, 'the slots are comming');
            res.status(200).json(slots);
        }
        catch (error) {
            console.error("Error fetching doctor slots:", error);
            if (error.message === "Doctor not found") {
                res.status(404).json({ message: "Doctor not found" });
            }
            else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
    async createPaymentIntent(req, res) {
        try {
            const { userId, amount } = req.body;
            const clientSecret = await this.UserService.createPaymentIntent(amount);
            console.log(clientSecret, 'is this creating');
            res.status(200).json({ clientSecret });
        }
        catch (error) {
            console.error("Payment Intent Error:", error);
            res.status(400).json({ message: error.message });
        }
    }
    async createAppointment(req, res) {
        try {
            console.log(req.body);
            const appointmentData = {
                slot_id: req.body.slotId,
                user_id: req.body.userId,
                amount: req.body.amount,
                payment_id: req.body.paymentId,
                status: 'pending'
            };
            const result = await this.UserService.createAppointment(appointmentData);
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({ message: 'Failed to create appointment' });
        }
    }
    // async appointmentDetails(req: Request, res: Response): Promise<void> {
    //   try {
    //     const userId = req.params.id
    //     console.log(req.params,'is this comming')
    //     console.log(userId, "the userId is coming from params")
    //     const appointmentDetails = await this.UserService.getAppointmentDetails(userId)
    //   console.log(appointmentDetails,'the details are comming ')
    //     res.status(200).json(appointmentDetails)
    //   } catch (error) {
    //     console.error("Error in appointmentDetails:", error)
    //     if (error instanceof Error && error.message === "No appointment found for this user") {
    //       res.status(404).json({ message: "No appointment found for this user" })
    //     } else {
    //       res.status(500).json({ message: "Internal server error" })
    //     }
    //   }
    // }
    async appointmentDetails(req, res) {
        try {
            const userId = req.params.id;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 3;
            console.log(userId, "the userId is coming from params");
            console.log("Pagination:", { page, pageSize });
            const appointmentDetails = await this.UserService.getAppointmentDetails(userId, page, pageSize);
            console.log('Total appointments found:', appointmentDetails.totalCount);
            console.log(appointmentDetails, 'the appointment details is comming or not');
            res.status(200).json(appointmentDetails);
        }
        catch (error) {
            console.error("Error in appointmentDetails:", error);
            if (error instanceof Error && error.message === "No appointment found for this user") {
                res.status(404).json({ message: "No appointment found for this user" });
            }
            else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
    async refundPayment(req, res) {
        try {
            console.log(req.body, 'the body is comming and correct');
            const { appointmentId } = req.body;
            const result = await this.UserService.refundPayment(appointmentId);
            res.status(200).json({ result });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    // async cancelandcompleteAppointmentDetails(req: Request, res: Response): Promise<void> {
    //   try {
    //     const userId = req.params.id
    //     console.log(req.params,'is this comming')
    //     console.log(userId, "the userId is coming from params")
    //     const appointmentDetails = await this.UserService.getcancelandcompleteAppointmentDetails(userId)
    //   console.log(appointmentDetails,'the details are comming ')
    //     res.status(200).json(appointmentDetails)
    //   } catch (error) {
    //     console.error("Error in appointmentDetails:", error)
    //     if (error instanceof Error && error.message === "No appointment found for this user") {
    //       res.status(404).json({ message: "No appointment found for this user" })
    //     } else {
    //       res.status(500).json({ message: "Internal server error" })
    //     }
    //   }
    // }
    async cancelandcompleteAppointmentDetails(req, res) {
        try {
            const userId = req.params.id;
            // Extract pagination and filter parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 3;
            const status = req.query.status;
            console.log(`Fetching appointments for user ${userId}, page ${page}, limit ${limit}, status ${status || 'all'}`);
            const result = await this.UserService.getcancelandcompleteAppointmentDetails(userId, page, limit, status);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error in appointmentDetails:", error);
            if (error instanceof Error && error.message === "No appointment found for this user") {
                res.status(404).json({ message: "No appointment found for this user" });
            }
            else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
    async resetPassword(req, res) {
        try {
            const { userId, oldPassword, newPassword } = req.body;
            const result = await this.UserService.resetPassword(userId, oldPassword, newPassword);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async sendForgottenpassword(req, res) {
        try {
            const { email } = req.body;
            let result = await this.UserService.sendForgottenpassword(email);
            res.status(200).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
    async verifyForgottenpassword(req, res) {
        try {
            console.log(req.body);
            const { email, otpString } = req.body;
            let result = await this.UserService.verifyForgottenpassword(email, otpString);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json(error);
        }
    }
    async resetForgottenpassword(req, res) {
        try {
            const { email, password } = req.body;
            console.log(req.body);
            let result = await this.UserService.resetForgottenpassword(email, password);
            res.status(200).json(result);
        }
        catch (error) {
        }
    }
    async getPrescriptions(req, res) {
        try {
            const appointmentId = req.params.appointmentid;
            console.log(appointmentId);
            let result = await this.UserService.getPrescriptions(appointmentId);
            console.log(result);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: 'something went wrong' });
        }
    }
    async reviews(req, res) {
        try {
            const { appointmentid, rating, reviewText, userid } = req.body;
            console.log(req.body);
            let result = await this.UserService.reviews(appointmentid, rating, reviewText, userid);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: 'something went wrong' });
        }
    }
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            console.log('Refresh token from cookies:', refreshToken);
            // Check if refresh token exists
            if (!refreshToken) {
                console.log('Refresh token not found in cookies');
                res.status(401).json({ message: 'Refresh token not found in cookies' });
                return;
            }
            // Verify the token
            try {
                if (!process.env.REFRESH_TOKEN_SECRET) {
                    throw new Error('JWT_REFRESH_SECRET is not defined');
                }
                const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                console.log(decoded, 'is the decoded is coming or not');
                // Generate new tokens
                const userId = decoded.userId;
                console.log(userId, 'the userid is comming or not');
                const newAccessToken = jsonwebtoken_1.default.sign({ userId: userId }, process.env.JWT_SECRET || '', { expiresIn: '15m' });
                const newRefreshToken = jsonwebtoken_1.default.sign({ userId: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                // Set the new tokens as cookies
                res.cookie('accessToken', newAccessToken, {
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 15 * 60 * 1000 // 15 minutes
                });
                res.cookie('refreshToken', newRefreshToken, {
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
                res.status(200).json({ message: 'Token refreshed successfully' });
                return;
            }
            catch (error) {
                console.error('Token verification error:', error);
                res.status(401).json({ message: 'Invalid refresh token' });
                return;
            }
        }
        catch (error) {
            console.error('Error refreshing token:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.userController = new UserController(new userService_1.UserService(userRepository_1.userRepository, slotRepository_1.slotRepository, otpService_1.otpService));
