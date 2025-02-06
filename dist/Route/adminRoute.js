"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../Controllers/adminController");
const authMiddleware_1 = require("../Middleware/authMiddleware");
const adminrouter = express_1.default.Router();
adminrouter.post('/login', adminController_1.adminController.login.bind(adminController_1.adminController));
adminrouter.post('/logout', adminController_1.adminController.logout.bind(adminController_1.adminController));
adminrouter.get('/patients', authMiddleware_1.adminAuth, adminController_1.adminController.getPatients.bind(adminController_1.adminController));
adminrouter.patch('/patients/:id/toggle-status', authMiddleware_1.adminAuth, adminController_1.adminController.togglePatientStatus.bind(adminController_1.adminController));
adminrouter.get('/verifydoctors', authMiddleware_1.adminAuth, adminController_1.adminController.getVerifyDoctors.bind(adminController_1.adminController));
adminrouter.get('/doctors', authMiddleware_1.adminAuth, adminController_1.adminController.getDoctors.bind(adminController_1.adminController));
adminrouter.post('/doctors/:id/reject', authMiddleware_1.adminAuth, adminController_1.adminController.rejectDoctor.bind(adminController_1.adminController));
adminrouter.patch('/doctors/:id/toggle-status', authMiddleware_1.adminAuth, adminController_1.adminController.toggleDoctorStatus.bind(adminController_1.adminController));
adminrouter.patch('/doctors/:id/verify', authMiddleware_1.adminAuth, adminController_1.adminController.verifyDoctor.bind(adminController_1.adminController));
exports.default = adminrouter;
