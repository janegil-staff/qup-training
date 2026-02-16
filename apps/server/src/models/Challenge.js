import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  progress:    { type: Number, default: 0 },
  joinedAt:    { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { _id: false });

const challengeSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  description:  { type: String, default: '' },
  image:        { type: String, default: null },
  type:         { type: String, enum: ['WORKOUT_COUNT', 'CALORIES', 'STREAK', 'DISTANCE', 'CUSTOM'], default: 'WORKOUT_COUNT' },
  target:       { type: Number, required: true },
  unit:         { type: String, default: '' },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  participants: [participantSchema],
  isPublic:     { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Challenge', challengeSchema);
