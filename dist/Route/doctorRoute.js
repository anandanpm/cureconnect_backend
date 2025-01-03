"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../Controllers/doctorController");
const docrouter = express_1.default.Router();
docrouter.post('/getOtp', doctorController_1.doctorController.getOtp.bind(doctorController_1.doctorController));
docrouter.post('/verifyOtp', doctorController_1.doctorController.verifyOtp.bind(doctorController_1.doctorController));
docrouter.post('/resendOtp', doctorController_1.doctorController.resendOtp.bind(doctorController_1.doctorController));
docrouter.post('/login', doctorController_1.doctorController.login.bind(doctorController_1.doctorController));
docrouter.post('/logout', doctorController_1.doctorController.logout.bind(doctorController_1.doctorController));
docrouter.post('/google-auth', doctorController_1.doctorController.googleAuth.bind(doctorController_1.doctorController));
exports.default = docrouter;
