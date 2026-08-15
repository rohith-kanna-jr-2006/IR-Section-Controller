import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const stationCount = await mongoose.connection.collection('stations').countDocuments();
    const sectionCount = await mongoose.connection.collection('sections').countDocuments();
    const trainCount = await mongoose.connection.collection('trains').countDocuments();
    const scheduleCount = await mongoose.connection.collection('trainschedules').countDocuments();
    const stopCount = await mongoose.connection.collection('trainstops').countDocuments();
    
    console.log(`STATION_COUNT=${stationCount}`);
    console.log(`SECTION_COUNT=${sectionCount}`);
    console.log(`TRAIN_COUNT=${trainCount}`);
    console.log(`SCHEDULE_COUNT=${scheduleCount}`);
    console.log(`STOP_COUNT=${stopCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to DB', error);
    process.exit(1);
  }
};

connectDB();
