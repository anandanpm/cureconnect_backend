import express from 'express';
import { doctorController } from "../Controllers/doctorController";
import { doctorAuth } from '../Middleware/authMiddleware';

const docrouter = express.Router();

docrouter.post('/getOtp', doctorController.getOtp.bind(doctorController));
docrouter.post('/verifyOtp', doctorController.verifyOtp.bind(doctorController));
docrouter.post('/resendOtp',doctorController.resendOtp.bind(doctorController));
docrouter.post('/login',doctorController.login.bind(doctorController));
docrouter.post('/logout',doctorController.logout.bind(doctorController));
docrouter.post('/google-auth',doctorController.googleAuth.bind(doctorController));
docrouter.put('/profile', doctorAuth,doctorController.updateProfile.bind(doctorController));
docrouter.post('/slots',doctorAuth,doctorController.addSlots.bind(doctorController));
docrouter.get('/getslots/:doctorId',doctorAuth,doctorController.getSlots.bind(doctorController));
docrouter.get('/appointments/:doctorId',doctorAuth,doctorController.getAppointment.bind(doctorController));
docrouter.get('/check-appointment-time/:appointmentId', doctorController.checkAppointmentTime.bind(doctorController));
docrouter.post('/reset-password',doctorAuth,doctorController.resetPassword.bind(doctorController));
 docrouter.post('/send-forgottenpassword',doctorController.sendForgottenpassword.bind(doctorController));
docrouter.post('/verify-forgottenpassword',doctorController.verifyForgottenpassword.bind(doctorController));
docrouter.post('/reset-forgottenpassword',doctorController.resetForgottenpassword.bind(doctorController));
docrouter.post('/prescription',doctorController.prescription.bind(doctorController));
docrouter.patch('/completeappointment/:appointmentId',doctorAuth,doctorController.completeAppointment.bind(doctorController));
export default docrouter;