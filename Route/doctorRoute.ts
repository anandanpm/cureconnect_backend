import express from 'express';
import { doctorController } from "../Controllers/doctorController";

const docrouter = express.Router();

docrouter.post('/getOtp', doctorController.getOtp.bind(doctorController));
docrouter.post('/verifyOtp', doctorController.verifyOtp.bind(doctorController));
docrouter.post('/resendOtp',doctorController.resendOtp.bind(doctorController));
docrouter.post('/login',doctorController.login.bind(doctorController));
docrouter.post('/logout',doctorController.logout.bind(doctorController));
export default docrouter;