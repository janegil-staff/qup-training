import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 8 },
  avatar:       { type: String, default: null },
  bio:          { type: String, default: '' },
  dateOfBirth:  { type: Date },
  gender:       { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
  height:       { value: Number, unit: { type: String, enum: ['CM', 'FT'], default: 'CM' } },
  weight:       { value: Number, unit: { type: String, enum: ['KG', 'LBS'], default: 'KG' } },
  fitnessLevel: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
  goals:        [{ type: String, enum: ['LOSE_WEIGHT', 'BUILD_MUSCLE', 'STAY_FIT', 'FLEXIBILITY', 'ENDURANCE'] }],
  isTrainer:    { type: Boolean, default: false },
  stripeCustomerId: String,
  streakCount:  { type: Number, default: 0 },
  lastWorkoutDate: Date,
  followers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  refreshToken: String,
  resetCode: String,
  resetCodeExpiry: Date,
  expoPushToken: String,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);

});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

export default mongoose.model('User', userSchema);
