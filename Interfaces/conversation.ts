import { Types } from 'mongoose';

export interface Message {
  _id?: Types.ObjectId;
  text?: string;
  sender: Types.ObjectId;
  seen: boolean;
  timestamp: Date;
}

export interface Conversation {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  messages: Message[];
  created_at?: Date;
  updated_at?: Date;
}