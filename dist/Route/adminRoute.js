"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../Controllers/adminController");
const adminrouter = express_1.default.Router();
adminrouter.post('/login', adminController_1.adminController.login.bind(adminController_1.adminController));
adminrouter.post('/logout', adminController_1.adminController.logout.bind(adminController_1.adminController));
exports.default = adminrouter;
