import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainSchedule', required: true },
  sequence: { type: Number, required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  stationCode: { type: String, required: true },
  arrival: { type: String },
  departure: { type: String },
  haltMinutes: { type: Number, default: 0 },
  dayOffset: { type: Number, required: true, default: 0 },
  platform: { type: String },
  remarks: { type: String }
}, { timestamps: true });

export const TrainStop = mongoose.model('TrainStop', schema);
