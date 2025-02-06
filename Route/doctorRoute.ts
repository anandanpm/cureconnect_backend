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
export default docrouter;