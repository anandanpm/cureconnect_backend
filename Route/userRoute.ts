import express from 'express';
import { userController } from "../Controllers/userController";
import {userAuth} from '../Middleware/authMiddleware'

const userrouter = express.Router();

userrouter.post('/getOtp', userController.getOtp.bind(userController));
userrouter.post('/verifyOtp', userController.verifyOtp.bind(userController));
userrouter.post('/login',userController.login.bind(userController));
userrouter.post('/resendOtp',userController.resendOtp.bind(userController));
userrouter.post('/logout',userController.logout.bind(userController));
userrouter.post('/google-auth',userController.googleAuth.bind(userController));
userrouter.put('/update-profile',userAuth,userController.updateProfile.bind(userController));
userrouter.get('/verified-doctors',userAuth,userController.getDoctors.bind(userController));
userrouter.get('/doctor-slots/:id',userAuth,userController.doctorSlots.bind(userController));
userrouter.post('/create-payment-intent',userAuth, userController.createPaymentIntent.bind(userController));
userrouter.post('/book-appointment',userAuth,userController.createAppointment.bind(userController));
 userrouter.get('/appointment-details/:id',userAuth,userController.appointmentDetails.bind(userController));
 userrouter.post('/refund-appointment',userAuth,userController.refundPayment.bind(userController))


export default userrouter;