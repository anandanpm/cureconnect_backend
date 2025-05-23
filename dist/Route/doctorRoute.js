"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../Controllers/doctorController");
const authMiddleware_1 = require("../Middleware/authMiddleware");
const docrouter = express_1.default.Router();
docrouter.post('/getOtp', doctorController_1.doctorController.getOtp.bind(doctorController_1.doctorController));
docrouter.post('/verifyOtp', doctorController_1.doctorController.verifyOtp.bind(doctorController_1.doctorController));
docrouter.post('/resendOtp', doctorController_1.doctorController.resendOtp.bind(doctorController_1.doctorController));
docrouter.post('/login', doctorController_1.doctorController.login.bind(doctorController_1.doctorController));
docrouter.post('/logout', doctorController_1.doctorController.logout.bind(doctorController_1.doctorController));
docrouter.post('/google-auth', doctorController_1.doctorController.googleAuth.bind(doctorController_1.doctorController));
docrouter.put('/profile', authMiddleware_1.doctorAuth, doctorController_1.doctorController.updateProfile.bind(doctorController_1.doctorController));
docrouter.post('/slots', authMiddleware_1.doctorAuth, doctorController_1.doctorController.addSlots.bind(doctorController_1.doctorController));
docrouter.get('/getslots/:doctorId', authMiddleware_1.doctorAuth, doctorController_1.doctorController.getSlots.bind(doctorController_1.doctorController));
docrouter.delete('/deleteSlot/:slotId', authMiddleware_1.doctorAuth, doctorController_1.doctorController.deleteSlot.bind(doctorController_1.doctorController));
docrouter.get('/appointments/:doctorId', authMiddleware_1.doctorAuth, doctorController_1.doctorController.getAppointment.bind(doctorController_1.doctorController));
docrouter.get('/check-appointment-time/:appointmentId', authMiddleware_1.doctorAuth, doctorController_1.doctorController.checkAppointmentTime.bind(doctorController_1.doctorController));
docrouter.post('/reset-password', doctorController_1.doctorController.resetPassword.bind(doctorController_1.doctorController));
docrouter.post('/send-forgottenpassword', doctorController_1.doctorController.sendForgottenpassword.bind(doctorController_1.doctorController));
docrouter.post('/verify-forgottenpassword', doctorController_1.doctorController.verifyForgottenpassword.bind(doctorController_1.doctorController));
docrouter.post('/reset-forgottenpassword', doctorController_1.doctorController.resetForgottenpassword.bind(doctorController_1.doctorController));
docrouter.post('/prescription', doctorController_1.doctorController.prescription.bind(doctorController_1.doctorController));
docrouter.patch('/completeappointment/:appointmentId', doctorController_1.doctorController.completeAppointment.bind(doctorController_1.doctorController));
docrouter.post('/refresh-token', doctorController_1.doctorController.refreshToken.bind(doctorController_1.doctorController));
docrouter.get('/dashboard/:doctorId', authMiddleware_1.doctorAuth, doctorController_1.doctorController.getDetailsDashboard.bind(doctorController_1.doctorController));
exports.default = docrouter;
