import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URI) {
      throw new Error('DATABASE_URI is not configured');
    }

    await mongoose.connect(process.env.DATABASE_URI!, {
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
