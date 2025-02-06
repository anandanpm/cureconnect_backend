import UserModel from '../Model/userModel';
import { User, UserRole } from '../Interfaces/user';
import AppointmentModel from '../Model/appointmentModel';


 class UserRepository {
  async createUser(user: User): Promise<User> {
    const newUser = new UserModel(user);
    return newUser.save();
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return UserModel.findOne({ email });
  }

  async findUserById(id: string): Promise<User | null> {
    return UserModel.findById(id);
  }

  async updateUser(user: User): Promise<User | null> {
    return UserModel.findByIdAndUpdate(user._id, user, { new: true });
  }

  async updateUserProfile(_id: string, updateData: Partial<User>): Promise<User | null> {
    return UserModel.findOneAndUpdate(
      { _id: _id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async findAllUsers(): Promise<User[]> {
    return UserModel.find(); 
  }

  async updateUserStatus(_id: string, is_active: boolean): Promise<User | null> {
    return UserModel.findOneAndUpdate(
      { _id: _id },
      { $set: { is_active: is_active } },
      { new: true, runValidators: true }
    );
  }

  async findAllVerifyDoctors(): Promise<User[]> {
    return UserModel.find({ role: UserRole.DOCTOR ,verified:true});
  }

  async findAllDoctors():Promise<User[]>{
    return UserModel.find({role:UserRole.DOCTOR,verified:false})
  }


  async updateDoctorVerification(_id: string, is_verified: boolean): Promise<User | null> {
    return UserModel.findOneAndUpdate(
      { _id: _id },
      { $set: { verified: is_verified } },
      { new: true, runValidators: true }
    );
  }

  async findUsersByRole(userRole: UserRole): Promise<User[]> {
    return UserModel.find({ role: userRole });

}

async removeUser(_id: string): Promise<void> {
  await UserModel.findByIdAndDelete(_id)
}


async createAppointment(appointmentData: {
  slot_id: string;
  user_id: string;
  amount: number;
  payment_id:string;
  status: string;
}): Promise<any> {
  const appointment = new AppointmentModel(appointmentData);
  return appointment.save();
}

async findAppointmentBySlotId(slotId: string): Promise<any> {
  return AppointmentModel.findOne({ slot_id: slotId });
}

async findAppointmentById(appointmentId:string):Promise<any>{
  return AppointmentModel.findOne({_id:appointmentId})
}

async findAppointmentsByDoctorId(doctorId: string) {
  try {
    return await AppointmentModel.find({}) 
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
      .then((appointments: any) => 
        appointments
          .filter((appointment: { slot_id: null; }) => appointment.slot_id !== null)
          .map((appointment: { user_id: { username: any; email: any; _id: any; }; slot_id: { start_time: any; end_time: any; day: any; }; status: any; }) => ({
            username: appointment.user_id.username, 
            userEmail: appointment.user_id.email || '',
            startTime: appointment.slot_id.start_time,
            endTime: appointment.slot_id.end_time,
            date: appointment.slot_id.day,
            status: appointment.status,
            userId: appointment.user_id._id
          }))
      ); 
 
  } catch (error) {
    console.error('Error in findAppointmentsByDoctorId:', error);
    throw error;
  }
 }



async findPendingAppointmentsByUserId(userId: string): Promise<any[]> {
  return AppointmentModel.find({ 
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
  .lean()
}


}

export const userRepository = new UserRepository();
