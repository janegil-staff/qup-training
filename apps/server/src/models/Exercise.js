import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  category:     { type: String, required: true, enum: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE', 'CARDIO', 'FLEXIBILITY', 'FULL_BODY'] },
  equipment:    { type: String, enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'BAND', 'KETTLEBELL', 'NONE'], default: 'NONE' },
  muscleGroups: [{ type: String }],
  instructions: { type: String, default: '' },
  image:        { type: String, default: null },
  difficulty:   { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
  type:         { type: String, enum: ['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BALANCE'], default: 'STRENGTH' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

exerciseSchema.index({ name: 'text' });
exerciseSchema.index({ category: 1, equipment: 1 });

export default mongoose.model('Exercise', exerciseSchema);
