"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const userModel_1 = __importDefault(require("../Model/userModel"));
class UserRepository {
    async createUser(user) {
        const newUser = new userModel_1.default(user);
        return newUser.save();
    }
    async findUserByEmail(email) {
        return userModel_1.default.findOne({ email });
    }
    async updateUser(user) {
        return userModel_1.default.findByIdAndUpdate(user._id, user, { new: true });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
