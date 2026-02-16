import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  type:     { type: String, enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], required: true },
  name:     { type: String, required: true },
  calories: { type: Number, default: 0 },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },
  time:     { type: Date, default: Date.now },
});

const nutritionLogSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:             { type: Date, required: true },
  meals:            [mealSchema],
  waterMl:          { type: Number, default: 0 },
  dailyCalorieGoal: { type: Number, default: 2000 },
  dailyProteinGoal: { type: Number, default: 150 },
}, { timestamps: true });

nutritionLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('NutritionLog', nutritionLogSchema);
