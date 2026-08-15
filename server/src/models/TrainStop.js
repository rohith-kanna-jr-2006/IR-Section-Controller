import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainSchedule', required: true },
  sequence: { type: Number, required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  stationCode: { type: String, required: true },
  
  // Internal strict validation format (HH:mm)
  arrival: { type: String },
  departure: { type: String },
  
  // Timetable display/public variations if needed
  scheduledArrival: { type: String },
  scheduledDeparture: { type: String },
  publicArrival: { type: String },
  publicDeparture: { type: String },
  
  haltMinutes: { type: Number, default: 0 },
  dayOffset: { type: Number, required: true, default: 0 },
  platform: { type: String },
  stopType: { type: String },
  remarks: { type: String }
}, { timestamps: true });

// Ensure unique sequence per schedule
schema.index({ scheduleId: 1, sequence: 1 }, { unique: true });

export const TrainStop = mongoose.model('TrainStop', schema);
