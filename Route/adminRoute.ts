import express from 'express';
import { adminController } from '../Controllers/adminController'
import { adminAuth } from '../Middleware/authMiddleware';

const adminrouter = express.Router();

adminrouter.post('/login',adminController.login.bind(adminController));
adminrouter.post('/logout',adminController.logout.bind(adminController));
adminrouter.get('/patients',adminAuth,adminController.getPatients.bind(adminController));
adminrouter.patch('/patients/:id/toggle-status',adminAuth, adminController.togglePatientStatus.bind(adminController));
adminrouter.get('/verifydoctors', adminAuth,adminController.getVerifyDoctors.bind(adminController));
adminrouter.get('/doctors',adminAuth,adminController.getDoctors.bind(adminController));
adminrouter.post('/doctors/:id/reject',adminAuth,adminController.rejectDoctor.bind(adminController));
adminrouter.patch('/doctors/:id/toggle-status',adminAuth,adminController.toggleDoctorStatus.bind(adminController));
adminrouter.patch('/doctors/:id/verify',adminAuth,adminController.verifyDoctor.bind(adminController));

export default adminrouter;