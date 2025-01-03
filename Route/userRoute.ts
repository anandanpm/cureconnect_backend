import express from 'express';
import { userController } from "../Controllers/userController";

const userrouter = express.Router();

userrouter.post('/getOtp', userController.getOtp.bind(userController));
userrouter.post('/verifyOtp', userController.verifyOtp.bind(userController));
userrouter.post('/login',userController.login.bind(userController));
userrouter.post('/resendOtp',userController.resendOtp.bind(userController));
userrouter.post('/logout',userController.logout.bind(userController));
userrouter.post('/google-auth',userController.googleAuth.bind(userController))

export default userrouter;