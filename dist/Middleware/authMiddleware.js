"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.doctorAuth = exports.userAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth = (allowedRoles) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Please login to continue' });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Role check
            if (!allowedRoles.includes(decoded.role)) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
            // Active status check
            if (!decoded._active == false) {
                res.status(403).json({ message: 'Account is inactive' });
                return;
            }
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({
                    message: 'Token expired',
                    tokenExpired: true
                });
                return;
            }
            res.status(401).json({ message: 'Invalid token' });
        }
    };
};
// Create middleware for each role
exports.userAuth = auth(['patient']);
exports.doctorAuth = auth(['doctor']);
exports.adminAuth = auth(['admin']);
