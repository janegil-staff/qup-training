import mongoose from "mongoose";

const templateExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 10 },
    duration: { type: Number, default: 0 },
    restSeconds: { type: Number, default: 60 },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const workoutTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["STRENGTH", "CARDIO", "HIIT", "YOGA", "FLEXIBILITY", "CUSTOM"],
      default: "STRENGTH",
    },
    difficulty: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      default: "INTERMEDIATE",
    },
    estimatedMinutes: { type: Number, default: 45 },
    image: { type: String, default: null },
    exercises: [templateExerciseSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPublic: { type: Boolean, default: true },
    usedCount: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

workoutTemplateSchema.index({ category: 1, difficulty: 1 });

export default mongoose.model("WorkoutTemplate", workoutTemplateSchema);
