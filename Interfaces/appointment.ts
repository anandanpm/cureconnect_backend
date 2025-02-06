import { Types } from 'mongoose';

export interface Appointment {
  _id?: Types.ObjectId;
  slot_id: Types.ObjectId;
  user_id: Types.ObjectId;
   amount: number;
  status: 'pending'| 'cancelled' | 'completed';
  payment_id:string;
  created_at?: Date;
  updated_at?: Date;
}