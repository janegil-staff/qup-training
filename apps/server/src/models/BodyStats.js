import mongoose from 'mongoose';

const bodyStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:   { type: Date, required: true },
  weight: { type: Number },
  bodyFat: { type: Number },
  measurements: {
    chest:      Number,
    waist:      Number,
    hips:       Number,
    bicepLeft:  Number,
    bicepRight: Number,
    thighLeft:  Number,
    thighRight: Number,
  },
  progressPhoto: {
    front: String,
    side:  String,
    back:  String,
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

bodyStatsSchema.index({ userId: 1, date: -1 });

export default mongoose.model('BodyStats', bodyStatsSchema);
