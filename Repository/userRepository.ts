import UserModel from '../Model/userModel';
import { User } from '../Interfaces/user';

export class UserRepository {
  async createUser(user: User): Promise<User> {
    const newUser = new UserModel(user);
    return newUser.save();
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return UserModel.findOne({ email });
  }

  async updateUser(user: User): Promise<User | null> {
    return UserModel.findByIdAndUpdate(user._id, user, { new: true });
  }
}

export const userRepository = new UserRepository();