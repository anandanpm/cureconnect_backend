"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const user_1 = require("../Interfaces/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository_1 = require("../Repository/userRepository");
class AdminService {
    async login(email, password) {
        try {
            const admin = await userRepository_1.userRepository.findUserByEmail(email);
            if (!admin || admin.role !== user_1.UserRole.ADMIN) {
                throw new Error('Invalid credentials');
            }
            const passwordMatch = await bcrypt_1.default.compare(password, admin.password);
            if (!passwordMatch) {
                throw new Error('Invalid credentials');
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET || 'your_default_secret', { expiresIn: '15m' });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: admin._id }, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', { expiresIn: '7d' });
            return {
                accessToken,
                refreshToken,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                isActive: admin.is_active
            };
        }
        catch (error) {
            throw error;
        }
    }
    async logout(userId) {
        // Implement any necessary logout logic, such as invalidating tokens
        // This might involve adding the token to a blacklist or clearing sessions
        return { message: 'Logout successful' };
    }
}
exports.adminService = new AdminService();
