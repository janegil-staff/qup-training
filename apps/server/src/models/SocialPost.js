import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const socialPostSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['WORKOUT', 'PROGRESS', 'ACHIEVEMENT', 'TEXT', 'CHALLENGE_COMPLETE'], default: 'TEXT' },
  content:      { type: String, default: '' },
  image:        { type: String, default: null },
  workoutLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutLog', default: null },
  challengeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', default: null },
  likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:     [commentSchema],
}, { timestamps: true });

socialPostSchema.index({ createdAt: -1 });
socialPostSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('SocialPost', socialPostSchema);
