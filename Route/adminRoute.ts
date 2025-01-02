import express from 'express';
import { adminController } from '../Controllers/adminController'

const adminrouter = express.Router();

adminrouter.post('/login',adminController.login.bind(adminController));
adminrouter.post('/logout',adminController.logout.bind(adminController));

export default adminrouter;