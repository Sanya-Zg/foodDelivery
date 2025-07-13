import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
console.log('MONGO_URI from .env:', uri);
if (!uri) {
  throw new Error('Please provide MONGO_URI in .env file');
}

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('connected to DB');
  } catch (error) {
    console.log('Mongo connect error', error.message);
    process.exit(1);
  }
};
export default connectDB;
