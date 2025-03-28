"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const userModel_1 = __importDefault(require("../Model/userModel"));
const user_1 = require("../Interfaces/user");
const appointmentModel_1 = __importDefault(require("../Model/appointmentModel"));
const prescriptionModel_1 = __importDefault(require("../Model/prescriptionModel"));
const reviewModel_1 = __importDefault(require("../Model/reviewModel"));
const slotModel_1 = __importDefault(require("../Model/slotModel"));
class UserRepository {
    async createUser(user) {
        console.log(user, 'from the createUser');
        const newUser = new userModel_1.default(user);
        return newUser.save();
    }
    async findUserByEmail(email) {
        return userModel_1.default.findOne({ email });
    }
    async findUserById(userid) {
        return userModel_1.default.findById(userid);
    }
    async findDoctorById(doctorid) {
        return userModel_1.default.findById(doctorid).select('username clinic_name department');
    }
    async updateUser(user) {
        return userModel_1.default.findByIdAndUpdate(user._id, user, { new: true });
    }
    async updateUserProfile(userid, updateData) {
        return userModel_1.default.findOneAndUpdate({ _id: userid }, { $set: updateData }, { new: true, runValidators: true });
    }
    async findAllUsers() {
        return userModel_1.default.find();
    }
    async updateUserStatus(userid, is_active) {
        return userModel_1.default.findOneAndUpdate({ _id: userid }, { $set: { is_active: is_active } }, { new: true, runValidators: true });
    }
    async findAllVerifyDoctors() {
        return userModel_1.default.find({ role: user_1.UserRole.DOCTOR, verified: true });
    }
    async findAllDoctors() {
        return userModel_1.default.find({ role: user_1.UserRole.DOCTOR, verified: false });
    }
    async updateDoctorVerification(doctorid, is_verified) {
        return userModel_1.default.findOneAndUpdate({ _id: doctorid }, { $set: { verified: is_verified } }, { new: true, runValidators: true });
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
                userId: appointment.user_id._id,
                appointmentId: appointment._id
            })));
        }
        catch (error) {
            console.error('Error in findAppointmentsByDoctorId:', error);
            throw error;
        }
    }
    // async findPendingAppointmentsByUserId(userId: string): Promise<any[]> {
    //   return AppointmentModel.find({ 
    //     user_id: userId, 
    //     status: 'pending' 
    //   })
    //   .populate({
    //     path: "slot_id",
    //     populate: {
    //       path: "doctor_id",
    //       select: "username department profile_pic"
    //     }
    //   })
    //   .populate("user_id", "username email")
    //   .lean()
    // }
    async findPendingAppointmentsByUserId(userId, page = 1, pageSize = 3) {
        const skip = (page - 1) * pageSize;
        const totalCount = await appointmentModel_1.default.countDocuments({
            user_id: userId,
            status: 'pending'
        });
        const appointments = await appointmentModel_1.default.find({
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
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .skip(skip)
            .limit(pageSize)
            .lean();
        return {
            appointments,
            totalCount
        };
    }
    // async findcancelandcompleteAppointmentsByUserId(userId: string): Promise<any[]> {
    //  return AppointmentModel.find({ 
    //     user_id: userId, 
    //     status: { $in: ['cancelled', 'completed'] }, 
    //   })
    //   .populate({
    //     path: "slot_id",
    //     populate: {
    //       path: "doctor_id",
    //       select: "username department profile_pic"
    //     }
    //   })
    //   .populate("user_id", "username email")
    //   .lean();
    // }
    async findcancelandcompleteAppointmentsByUserId(userId, status, skip, limit) {
        // Build the query based on parameters
        const query = { user_id: userId };
        if (status) {
            // If specific status is provided, use that
            query.status = status;
        }
        else {
            // Otherwise use the default of cancelled and completed
            query.status = { $in: ['cancelled', 'completed'] };
        }
        // Create the base query
        let appointmentsQuery = appointmentModel_1.default.find(query)
            .populate({
            path: "slot_id",
            populate: {
                path: "doctor_id",
                select: "username department profile_pic"
            }
        })
            .populate("user_id", "username email")
            .sort({ createdAt: -1 }); // Sort by creation date, newest first
        // Apply pagination if provided
        if (skip !== undefined && limit !== undefined) {
            appointmentsQuery = appointmentsQuery.skip(skip).limit(limit);
        }
        // Execute and return
        return appointmentsQuery.lean();
    }
    async getDashboardStats() {
        try {
            // Get counts for doctors and users
            const [totalDoctors, totalUsers, appointments] = await Promise.all([
                userModel_1.default.countDocuments({ role: user_1.UserRole.DOCTOR }),
                userModel_1.default.countDocuments({ role: user_1.UserRole.PATIENT }),
                appointmentModel_1.default.find({})
            ]);
            const totalAppointments = appointments.length;
            const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
            const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
            const pendingAppointments = appointments.filter(apt => apt.status === 'pending').length;
            const revenueGenerated = appointments
                .filter(apt => apt.status === 'completed')
                .reduce((total, apt) => total + (apt.amount || 0), 0);
            return {
                totalDoctors,
                totalUsers,
                totalAppointments,
                completedAppointments,
                cancelledAppointments,
                pendingAppointments,
                revenueGenerated
            };
        }
        catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }
    // async getAppointmentChartStats(timeRange: string): Promise<ChartAppointmentStats> {
    //   try {
    //     const now = new Date();
    //     let startDate: Date;
    //     let endDate: Date = new Date(now);
    //     // Adjust time ranges to match API parameters
    //     switch (timeRange) {
    //       case 'lastWeek':
    //         startDate = new Date(now);
    //         startDate.setDate(now.getDate() - 7);
    //         break;
    //       case 'lastMonth':
    //         startDate = new Date(now);
    //         startDate.setMonth(now.getMonth() - 1);
    //         break;
    //       case 'lastYear':
    //         startDate = new Date(now);
    //         startDate.setFullYear(now.getFullYear() - 1);
    //         break;
    //       default:
    //         startDate = new Date(now);
    //         startDate.setDate(now.getDate() - 7); // Default to last week
    //     }
    //     // Reset hours to get full day coverage
    //     startDate.setHours(0, 0, 0, 0);
    //     endDate.setHours(23, 59, 59, 999);
    //     console.log('Date Range:', {
    //       startDate: startDate.toISOString(),
    //       endDate: endDate.toISOString()
    //     });
    //     // Fetch appointments with correct date range
    //     const appointments = await AppointmentModel.find({
    //       createdAt: {
    //         $gte: startDate,
    //         $lte: endDate
    //       }
    //     }).lean();
    //     console.log('Found appointments:', appointments.length);
    //     const formatDate = (date: Date): string => {
    //       return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    //     };
    //     let result: ChartAppointmentStats = { daily: [], weekly: [], yearly: [] };
    //     // Generate daily stats for the selected period
    //     const days: any[] = [];
    //     let currentDate = new Date(startDate);
    //     while (currentDate <= endDate) {
    //       days.push(new Date(currentDate));
    //       currentDate.setDate(currentDate.getDate() + 1);
    //     }
    //     result.daily = days.map(date => {
    //       const dayStart = new Date(date);
    //       dayStart.setHours(0, 0, 0, 0);
    //       const dayEnd = new Date(date);
    //       dayEnd.setHours(23, 59, 59, 999);
    //       const count = appointments.filter(apt => {
    //         const aptDate = new Date(apt.created_at||now);
    //         return aptDate >= dayStart && aptDate <= dayEnd;
    //       }).length;
    //       return {
    //         name: formatDate(date),
    //         appointments: count
    //       };
    //     });
    //     // For weekly view, group by weeks
    //     if (timeRange === 'lastMonth') {
    //       const weeks = Math.ceil(days.length / 7);
    //       result.weekly = Array.from({ length: weeks }, (_, weekIndex) => {
    //         const weekStart = days[weekIndex * 7];
    //         const weekAppointments = appointments.filter(apt => {
    //           const aptDate = new Date(apt.created_at||now);
    //           const weekEndDate = new Date(weekStart);
    //           weekEndDate.setDate(weekStart.getDate() + 6);
    //           return aptDate >= weekStart && aptDate <= weekEndDate;
    //         });
    //         return {
    //           name: `Week ${weekIndex + 1}`,
    //           appointments: weekAppointments.length
    //         };
    //       });
    //     }
    //     // For yearly view, group by months
    //     if (timeRange === 'lastYear') {
    //       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    //       result.yearly = Array.from({ length: 12 }, (_, monthIndex) => {
    //         const monthStart = new Date(now.getFullYear(), now.getMonth() - (11 - monthIndex), 1);
    //         const monthEnd = new Date(now.getFullYear(), now.getMonth() - (10 - monthIndex), 0, 23, 59, 59, 999);
    //         const monthAppointments = appointments.filter(apt => {
    //           const aptDate = new Date(apt.created_at||now);
    //           return aptDate >= monthStart && aptDate <= monthEnd;
    //         });
    //         return {
    //           name: months[monthStart.getMonth()],
    //           appointments: monthAppointments.length
    //         };
    //       });
    //     }
    //     console.log('Generated stats:', result);
    //     return result;
    //   } catch (error) {
    //     console.error('Error getting appointment chart stats:', error);
    //     throw error;
    //   }
    // }
    // async getAppointmentChartStats(timeRange: string): Promise<ChartAppointmentStats> {
    //   try {
    //     const now = new Date();
    //     let startDate: Date;
    //     let endDate: Date = new Date(now);
    //     // Adjust time ranges to match API parameters
    //     switch (timeRange) {
    //       case 'lastWeek':
    //         startDate = new Date(now);
    //         startDate.setDate(now.getDate() - 7);
    //         break;
    //       case 'lastMonth':
    //         startDate = new Date(now);
    //         startDate.setMonth(now.getMonth() - 1);
    //         break;
    //       case 'lastYear':
    //         startDate = new Date(now);
    //         startDate.setFullYear(now.getFullYear() - 1);
    //         break;
    //       default:
    //         startDate = new Date(now);
    //         startDate.setDate(now.getDate() - 7); 
    //     }
    //     startDate.setHours(0, 0, 0, 0);
    //     endDate.setHours(23, 59, 59, 999);
    //     const appointments = await AppointmentModel.aggregate([
    //       {
    //         $match: {
    //           createdAt: {
    //             $gte: startDate,
    //             $lte: endDate
    //           }
    //         }
    //       },
    //       {
    //         $addFields: {
    //           createdAtDate: { $toDate: "$createdAt" }
    //         }
    //       }
    //     ]);
    //     const formatDate = (date: Date): string => {
    //       return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    //     };
    //     let result: ChartAppointmentStats = { daily: [], weekly: [], yearly: [] };
    //     const days: Date[] = [];
    //     let currentDate = new Date(startDate);
    //     while (currentDate <= endDate) {
    //       days.push(new Date(currentDate));
    //       currentDate.setDate(currentDate.getDate() + 1);
    //     }
    //     // Daily breakdown
    //     result.daily = days.map(date => {
    //       const dayStart = new Date(date);
    //       dayStart.setHours(0, 0, 0, 0);
    //       const dayEnd = new Date(date);
    //       dayEnd.setHours(23, 59, 59, 999);
    //       const count = appointments.filter(apt => {
    //         const aptDate = new Date(apt.createdAtDate);
    //         return aptDate >= dayStart && aptDate <= dayEnd;
    //       }).length;
    //       return {
    //         name: formatDate(date),
    //         appointments: count
    //       };
    //     });
    //     if (timeRange === 'lastMonth') {
    //       const weeks = Math.ceil(days.length / 7);
    //       result.weekly = Array.from({ length: weeks }, (_, weekIndex) => {
    //         const weekStart = new Date(days[weekIndex * 7]);
    //         const weekEnd = new Date(weekStart);
    //         weekEnd.setDate(weekStart.getDate() + 6);
    //         const weekAppointments = appointments.filter(apt => {
    //           const aptDate = new Date(apt.createdAtDate);
    //           return aptDate >= weekStart && aptDate <= weekEnd;
    //         });
    //         return {
    //           name: `Week ${weekIndex + 1}`,
    //           appointments: weekAppointments.length
    //         };
    //       });
    //     }
    //     // Yearly breakdown for last year
    //     if (timeRange === 'lastYear') {
    //       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    //       result.yearly = Array.from({ length: 12 }, (_, monthIndex) => {
    //         const monthStart = new Date(now.getFullYear(), monthIndex, 1);
    //         const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59, 999);
    //         const monthAppointments = appointments.filter(apt => {
    //           const aptDate = new Date(apt.createdAtDate);
    //           return aptDate >= monthStart && aptDate <= monthEnd;
    //         });
    //         return {
    //           name: months[monthIndex],
    //           appointments: monthAppointments.length
    //         };
    //       });
    //     }
    //     return result;
    //   } catch (error) {
    //     console.error('Error getting appointment chart stats:', error);
    //     throw error;
    //   }
    // }
    async getAppointmentChartStats(timeRange) {
        try {
            const now = new Date();
            let startDate;
            let endDate = new Date(now);
            // Adjust time ranges to match API parameters
            switch (timeRange) {
                case 'lastWeek':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'lastMonth':
                    startDate = new Date(now);
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'lastYear':
                    startDate = new Date(now);
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
            }
            // Reset hours to get full day coverage
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            // Fetch slots with correct date range
            const slots = await slotModel_1.default.aggregate([
                {
                    $match: {
                        created_at: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        status: 'booked' // Only count booked slots
                    }
                },
                {
                    $addFields: {
                        createdAtDate: { $toDate: "$created_at" }
                    }
                }
            ]);
            const formatDate = (date) => {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            };
            let result = { daily: [], weekly: [], yearly: [] };
            // Generate date range
            const days = [];
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                days.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            // Daily breakdown
            result.daily = days.map(date => {
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                const count = slots.filter((slot) => {
                    const slotDate = new Date(slot.created_at);
                    return slotDate >= dayStart && slotDate <= dayEnd;
                }).length;
                return {
                    name: formatDate(date),
                    appointments: count
                };
            });
            // Weekly breakdown for last month
            if (timeRange === 'lastMonth') {
                const weeks = Math.ceil(days.length / 7);
                result.weekly = Array.from({ length: weeks }, (_, weekIndex) => {
                    const weekStart = new Date(days[weekIndex * 7]);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const weekAppointments = slots.filter((slot) => {
                        const slotDate = new Date(slot.created_at);
                        return slotDate >= weekStart && slotDate <= weekEnd;
                    });
                    return {
                        name: `Week ${weekIndex + 1}`,
                        appointments: weekAppointments.length
                    };
                });
            }
            // Yearly breakdown for last year
            if (timeRange === 'lastYear') {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                result.yearly = Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthStart = new Date(now.getFullYear(), monthIndex, 1);
                    const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59, 999);
                    const monthAppointments = slots.filter((slot) => {
                        const slotDate = new Date(slot.created_at);
                        return slotDate >= monthStart && slotDate <= monthEnd;
                    });
                    return {
                        name: months[monthIndex],
                        appointments: monthAppointments.length
                    };
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error getting appointment chart stats:', error);
            throw error;
        }
    }
    async findAppointmentWithSlot(appointmentId) {
        try {
            const appointment = await appointmentModel_1.default.findOne({ _id: appointmentId })
                .populate({
                path: 'slot_id',
                select: 'date start_time end_time doctor_id'
            })
                .select('status slot_id')
                .lean();
            if (!appointment) {
                console.log('No appointment found for ID:', appointmentId);
                return null;
            }
            return appointment;
        }
        catch (error) {
            console.error('Error in findAppointmentWithSlot:', error);
            throw error;
        }
    }
    async findVerifiedDoctorsWithFilters(page = 1, limit = 6, search = "", department = "") {
        try {
            // Build the query
            let query = { role: user_1.UserRole.DOCTOR, verified: true };
            if (search) {
                query = {
                    ...query,
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { department: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            if (department) {
                query.department = department;
            }
            // Calculate pagination values
            const skip = (page - 1) * limit;
            // Execute queries in parallel for better performance
            const [doctors, totalDoctors, departments] = await Promise.all([
                userModel_1.default.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                userModel_1.default.countDocuments(query),
                userModel_1.default.distinct('department', { role: user_1.UserRole.DOCTOR, verified: true })
            ]);
            return {
                doctors,
                totalDoctors,
                totalPages: Math.ceil(totalDoctors / limit),
                currentPage: page,
                departments
            };
        }
        catch (error) {
            console.error('Error finding verified doctors with filters:', error);
            throw error;
        }
    }
    async createPrescription(prescriptionData) {
        try {
            // Create a new prescription document
            const newPrescription = new prescriptionModel_1.default(prescriptionData);
            // Save the prescription to the database
            const savedPrescription = await newPrescription.save();
            return savedPrescription;
        }
        catch (error) {
            console.error('Error creating prescription:', error);
            throw new Error('Failed to create prescription');
        }
    }
    async updateAppointment(appointmentId, status) {
        try {
            const updatedAppointment = await appointmentModel_1.default.findByIdAndUpdate(appointmentId, {
                status: status,
                updated_at: new Date()
            });
            if (!updatedAppointment) {
                throw new Error('Appointment not found');
            }
            // Log the update for tracking
            console.log(`Appointment ${appointmentId} updated to status: ${status}`);
            return updatedAppointment;
        }
        catch (error) {
        }
    }
    async getPrescriptions(appointmentId) {
        try {
            const prescriptions = await prescriptionModel_1.default
                .find({ appointment_id: appointmentId })
                .lean();
            return prescriptions;
        }
        catch (error) {
            console.error('Error fetching prescriptions:', error);
            // Rethrow to let the service handle the error
            throw error;
        }
    }
    async createReview(appointmentid, rating, reviewText, userid) {
        try {
            if (!appointmentid || !rating || !reviewText || !userid) {
                throw new Error('All fields are required');
            }
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }
            const review = new reviewModel_1.default({
                appointmentId: appointmentid,
                rating,
                reviewText,
                userId: userid
            });
            const savedReview = await review.save();
            console.log('Review created successfully:', savedReview);
        }
        catch (error) {
            console.error('Error in createReview:', error);
            throw error;
        }
    }
}
exports.userRepository = new UserRepository();
