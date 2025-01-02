"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const adminService_1 = require("../Services/adminService");
class AdminController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken, username, email: adminEmail, role, isActive } = await adminService_1.adminService.login(email, password);
            res.cookie('adminaccessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('adminrefreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({ message: 'Admin login successful', username, email: adminEmail, role, isActive });
        }
        catch (error) {
            console.error("Admin Login Error:", error);
            res.status(401).json({ message: error.message });
        }
    }
    async logout(req, res) {
        try {
            res.clearCookie('adminaccessToken');
            res.clearCookie('adminrefreshToken');
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
}
exports.adminController = new AdminController();
