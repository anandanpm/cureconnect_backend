import { Review } from 'Interfaces/user';
import mongoose, { Schema, Document, Model } from 'mongoose';

const ReviewSchema: Schema<Review> = new Schema({
    appointmentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Appointment' // Reference to Appointment model
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    reviewText: {
      type: String,
      required: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User' // Reference to User model
    }
  }, {
    timestamps: true // Automatically manage createdAt and updatedAt
  });
  
  // Create and export the model
  const ReviewModel: Model<Review> = mongoose.model<Review>('Review', ReviewSchema);
  
  export default ReviewModel;