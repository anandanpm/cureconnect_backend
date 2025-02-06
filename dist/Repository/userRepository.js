"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const userModel_1 = __importDefault(require("../Model/userModel"));
const user_1 = require("../Interfaces/user");
const appointmentModel_1 = __importDefault(require("../Model/appointmentModel"));
class UserRepository {
    async createUser(user) {
        const newUser = new userModel_1.default(user);
        return newUser.save();
    }
    async findUserByEmail(email) {
        return userModel_1.default.findOne({ email });
    }
    async findUserById(id) {
        return userModel_1.default.findById(id);
    }
    async updateUser(user) {
        return userModel_1.default.findByIdAndUpdate(user._id, user, { new: true });
    }
    async updateUserProfile(_id, updateData) {
        return userModel_1.default.findOneAndUpdate({ _id: _id }, { $set: updateData }, { new: true, runValidators: true });
    }
    async findAllUsers() {
        return userModel_1.default.find();
    }
    async updateUserStatus(_id, is_active) {
        return userModel_1.default.findOneAndUpdate({ _id: _id }, { $set: { is_active: is_active } }, { new: true, runValidators: true });
    }
    async findAllVerifyDoctors() {
        return userModel_1.default.find({ role: user_1.UserRole.DOCTOR, verified: true });
    }
    async findAllDoctors() {
        return userModel_1.default.find({ role: user_1.UserRole.DOCTOR, verified: false });
    }
    async updateDoctorVerification(_id, is_verified) {
        return userModel_1.default.findOneAndUpdate({ _id: _id }, { $set: { verified: is_verified } }, { new: true, runValidators: true });
    }
    async findUsersByRole(userRole) {
        return userModel_1.default.find({ role: userRole });
    }
    async removeUser(_id) {
        await userModel_1.default.findByIdAndDelete(_id);
    }
    async createAppointment(appointmentData) {
        const appointment = new appointmentModel_1.default(appointmentData);
        return appointment.save();
    }
    async findAppointmentBySlotId(slotId) {
        return appointmentModel_1.default.findOne({ slot_id: slotId });
    }
    async findAppointmentById(appointmentId) {
        return appointmentModel_1.default.findOne({ _id: appointmentId });
    }
    async findAppointmentsByDoctorId(doctorId) {
        try {
            return await appointmentModel_1.default.find({})
                .populate({
                path: 'slot_id',
                match: { doctor_id: doctorId },
            })
                .populate({
                path: 'user_id',
                select: 'username email'
            })
                .sort({ 'slot_id.day': -1 })
                .exec()
                .then((appointments) => appointments
                .filter((appointment) => appointment.slot_id !== null)
                .map((appointment) => ({
                username: appointment.user_id.username,
                userEmail: appointment.user_id.email || '',
                startTime: appointment.slot_id.start_time,
                endTime: appointment.slot_id.end_time,
                date: appointment.slot_id.day,
                status: appointment.status,
                userId: appointment.user_id._id
            })));
        }
        catch (error) {
            console.error('Error in findAppointmentsByDoctorId:', error);
            throw error;
        }
    }
    async findPendingAppointmentsByUserId(userId) {
        return appointmentModel_1.default.find({
            user_id: userId,
            status: 'pending'
        })
            .populate({
            path: "slot_id",
            populate: {
                path: "doctor_id",
                select: "username department profile_pic"
            }
        })
            .populate("user_id", "username email")
            .lean();
    }
}
exports.userRepository = new UserRepository();
