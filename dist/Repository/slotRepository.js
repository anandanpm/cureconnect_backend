"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotRepository = void 0;
const slotModel_1 = __importDefault(require("../Model/slotModel"));
class SlotRepository {
    async createSlot(slot) {
        const newSlot = new slotModel_1.default(slot);
        return newSlot.save();
    }
    async getSlotsByDoctorId(doctorId) {
        return slotModel_1.default.find({ doctor_id: doctorId, status: 'available' }).exec();
    }
    async deletePastSlots(doctorId, currentDate) {
        await slotModel_1.default.deleteMany({
            doctor_id: doctorId,
            day: { $lt: currentDate.toISOString().split('T')[0] }
        }).exec();
    }
    async updateSlotStatus(slotId, status) {
        return slotModel_1.default.findByIdAndUpdate(slotId, { status: status }, { new: true }).exec();
    }
}
exports.slotRepository = new SlotRepository();
