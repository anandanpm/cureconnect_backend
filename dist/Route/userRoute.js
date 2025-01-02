"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../Controllers/userController");
const userrouter = express_1.default.Router();
userrouter.post('/getOtp', userController_1.userController.getOtp.bind(userController_1.userController));
userrouter.post('/verifyOtp', userController_1.userController.verifyOtp.bind(userController_1.userController));
userrouter.post('/login', userController_1.userController.login.bind(userController_1.userController));
userrouter.post('/resendOtp', userController_1.userController.resendOtp.bind(userController_1.userController));
userrouter.post('/logout', userController_1.userController.logout.bind(userController_1.userController));
exports.default = userrouter;
