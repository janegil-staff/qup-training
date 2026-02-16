import mongoose from 'mongoose';

const setSchema = new mongoose.Schema({
  setNumber: { type: Number, required: true },
  reps:      { type: Number, default: 0 },
  weight:    { type: Number, default: 0 },
  duration:  { type: Number, default: 0 },
  completed: { type: Boolean, default: true },
}, { _id: false });

const logExerciseSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  name:       { type: String, required: true },
  category:   { type: String },
  sets:       [setSchema],
}, { _id: false });

const workoutLogSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId:      { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutTemplate', default: null },
  name:            { type: String, required: true },
  startTime:       { type: Date, required: true },
  endTime:         { type: Date },
  durationMinutes: { type: Number, default: 0 },
  caloriesBurned:  { type: Number, default: 0 },
  mood:            { type: String, enum: ['GREAT', 'GOOD', 'OK', 'TIRED', 'TERRIBLE'] },
  notes:           { type: String, default: '' },
  exercises:       [logExerciseSchema],
  isPublic:        { type: Boolean, default: false },
  likes:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

workoutLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('WorkoutLog', workoutLogSchema);
