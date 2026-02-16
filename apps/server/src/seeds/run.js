import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Exercise from '../models/Exercise.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';

const exercises = [
  // ─── CHEST ─────────────────────────────────────────────────────────
  { name: 'Barbell Bench Press', category: 'CHEST', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Chest', 'Triceps', 'Front Deltoids'], instructions: 'Lie flat on bench, grip bar slightly wider than shoulder width. Lower to mid-chest, press back up to lockout.' },
  { name: 'Incline Dumbbell Press', category: 'CHEST', equipment: 'DUMBBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Upper Chest', 'Triceps', 'Front Deltoids'], instructions: 'Set bench to 30-45 degrees. Press dumbbells from shoulder level to full extension above upper chest.' },
  { name: 'Cable Flyes', category: 'CHEST', equipment: 'CABLE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Chest', 'Front Deltoids'], instructions: 'Stand between cable stations, slight bend in elbows. Bring handles together in front of chest in a hugging motion.' },
  { name: 'Push-Ups', category: 'CHEST', equipment: 'BODYWEIGHT', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Chest', 'Triceps', 'Core'], instructions: 'Hands shoulder-width apart, body straight. Lower chest to floor, push back up.' },
  { name: 'Dumbbell Flyes', category: 'CHEST', equipment: 'DUMBBELL', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Chest'], instructions: 'Lie flat, arms extended above chest with slight elbow bend. Open arms wide, then squeeze back together.' },

  // ─── BACK ──────────────────────────────────────────────────────────
  { name: 'Barbell Deadlift', category: 'BACK', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'ADVANCED', muscleGroups: ['Lower Back', 'Hamstrings', 'Glutes', 'Traps'], instructions: 'Feet hip-width, grip bar outside knees. Drive through heels, keep back flat, stand tall.' },
  { name: 'Pull-Ups', category: 'BACK', equipment: 'BODYWEIGHT', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Lats', 'Biceps', 'Rear Deltoids'], instructions: 'Hang from bar with overhand grip. Pull chin above bar, lower with control.' },
  { name: 'Barbell Bent-Over Row', category: 'BACK', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Lats', 'Rhomboids', 'Biceps'], instructions: 'Hinge forward 45 degrees, pull bar to lower chest. Squeeze shoulder blades together at top.' },
  { name: 'Lat Pulldown', category: 'BACK', equipment: 'CABLE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Lats', 'Biceps'], instructions: 'Sit at lat pulldown machine, grip bar wider than shoulders. Pull to upper chest, control the return.' },
  { name: 'Seated Cable Row', category: 'BACK', equipment: 'CABLE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Lats', 'Rhomboids', 'Biceps'], instructions: 'Sit upright, pull handle to lower ribcage. Squeeze shoulder blades, return slowly.' },

  // ─── SHOULDERS ─────────────────────────────────────────────────────
  { name: 'Overhead Press', category: 'SHOULDERS', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Front Deltoids', 'Side Deltoids', 'Triceps'], instructions: 'Stand with bar at shoulder height, press overhead to lockout. Keep core tight.' },
  { name: 'Lateral Raises', category: 'SHOULDERS', equipment: 'DUMBBELL', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Side Deltoids'], instructions: 'Stand with dumbbells at sides, raise arms to shoulder level with slight elbow bend. Lower slowly.' },
  { name: 'Face Pulls', category: 'SHOULDERS', equipment: 'CABLE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Rear Deltoids', 'Traps', 'Rotator Cuff'], instructions: 'Set cable at face height, pull rope toward forehead with elbows high. Squeeze rear delts.' },
  { name: 'Dumbbell Shoulder Press', category: 'SHOULDERS', equipment: 'DUMBBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Front Deltoids', 'Side Deltoids', 'Triceps'], instructions: 'Seated or standing, press dumbbells from shoulder level to full extension overhead.' },

  // ─── ARMS ──────────────────────────────────────────────────────────
  { name: 'Barbell Curl', category: 'ARMS', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Biceps'], instructions: 'Stand with barbell, curl to shoulder height keeping elbows at sides. Lower with control.' },
  { name: 'Tricep Pushdown', category: 'ARMS', equipment: 'CABLE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Triceps'], instructions: 'Stand at cable station, push handle down until arms are straight. Keep elbows pinned.' },
  { name: 'Hammer Curls', category: 'ARMS', equipment: 'DUMBBELL', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Biceps', 'Brachialis'], instructions: 'Hold dumbbells with neutral grip, curl to shoulder level. Lower slowly.' },
  { name: 'Skull Crushers', category: 'ARMS', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Triceps'], instructions: 'Lie flat, hold bar above forehead. Lower to forehead by bending elbows, extend back up.' },
  { name: 'Dips', category: 'ARMS', equipment: 'BODYWEIGHT', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Triceps', 'Chest', 'Front Deltoids'], instructions: 'Support body on parallel bars, lower until upper arms are parallel to floor. Push back up.' },

  // ─── LEGS ──────────────────────────────────────────────────────────
  { name: 'Barbell Back Squat', category: 'LEGS', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'], instructions: 'Bar on upper back, feet shoulder-width. Squat to parallel or below, drive up through heels.' },
  { name: 'Romanian Deadlift', category: 'LEGS', equipment: 'BARBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'], instructions: 'Hold bar at hips, hinge forward keeping legs slightly bent. Lower until hamstring stretch, return.' },
  { name: 'Leg Press', category: 'LEGS', equipment: 'MACHINE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Quadriceps', 'Glutes'], instructions: 'Sit in leg press, feet shoulder-width on platform. Lower until 90 degrees, press back up.' },
  { name: 'Bulgarian Split Squat', category: 'LEGS', equipment: 'DUMBBELL', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], instructions: 'Rear foot on bench, lower front knee to 90 degrees. Push through front heel to stand.' },
  { name: 'Leg Curl', category: 'LEGS', equipment: 'MACHINE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Hamstrings'], instructions: 'Lie face down on leg curl machine, curl pad toward glutes. Lower slowly.' },
  { name: 'Calf Raises', category: 'LEGS', equipment: 'MACHINE', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Calves'], instructions: 'Stand on edge of platform, raise heels as high as possible. Lower below platform level.' },

  // ─── CORE ──────────────────────────────────────────────────────────
  { name: 'Plank', category: 'CORE', equipment: 'BODYWEIGHT', type: 'STRENGTH', difficulty: 'BEGINNER', muscleGroups: ['Core', 'Shoulders'], instructions: 'Forearms and toes on floor, body straight. Hold position keeping core engaged.' },
  { name: 'Hanging Leg Raises', category: 'CORE', equipment: 'BODYWEIGHT', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Lower Abs', 'Hip Flexors'], instructions: 'Hang from bar, raise legs to parallel or higher. Lower with control.' },
  { name: 'Cable Woodchop', category: 'CORE', equipment: 'CABLE', type: 'STRENGTH', difficulty: 'INTERMEDIATE', muscleGroups: ['Obliques', 'Core'], instructions: 'Set cable high, pull diagonally across body rotating torso. Control the return.' },
  { name: 'Ab Wheel Rollout', category: 'CORE', equipment: 'BODYWEIGHT', type: 'STRENGTH', difficulty: 'ADVANCED', muscleGroups: ['Core', 'Lats'], instructions: 'Kneel with ab wheel, roll forward keeping core tight. Pull back to start.' },

  // ─── CARDIO ────────────────────────────────────────────────────────
  { name: 'Treadmill Run', category: 'CARDIO', equipment: 'MACHINE', type: 'CARDIO', difficulty: 'BEGINNER', muscleGroups: ['Legs', 'Cardiovascular'], instructions: 'Set desired speed and incline. Maintain steady pace with proper running form.' },
  { name: 'Rowing Machine', category: 'CARDIO', equipment: 'MACHINE', type: 'CARDIO', difficulty: 'BEGINNER', muscleGroups: ['Full Body', 'Cardiovascular'], instructions: 'Drive with legs, lean back slightly, pull handle to chest. Return in reverse order.' },
  { name: 'Jump Rope', category: 'CARDIO', equipment: 'NONE', type: 'CARDIO', difficulty: 'BEGINNER', muscleGroups: ['Calves', 'Shoulders', 'Cardiovascular'], instructions: 'Jump with both feet, land softly on balls of feet. Keep arms close to body.' },
  { name: 'Burpees', category: 'CARDIO', equipment: 'BODYWEIGHT', type: 'CARDIO', difficulty: 'INTERMEDIATE', muscleGroups: ['Full Body', 'Cardiovascular'], instructions: 'Drop to push-up, perform push-up, jump feet to hands, jump up with arms overhead.' },
  { name: 'Mountain Climbers', category: 'CARDIO', equipment: 'BODYWEIGHT', type: 'CARDIO', difficulty: 'BEGINNER', muscleGroups: ['Core', 'Shoulders', 'Cardiovascular'], instructions: 'Push-up position, alternate driving knees to chest rapidly.' },
  { name: 'Cycling', category: 'CARDIO', equipment: 'MACHINE', type: 'CARDIO', difficulty: 'BEGINNER', muscleGroups: ['Legs', 'Cardiovascular'], instructions: 'Adjust seat height. Pedal at steady cadence maintaining target heart rate.' },

  // ─── FLEXIBILITY ───────────────────────────────────────────────────
  { name: 'Downward Dog', category: 'FLEXIBILITY', equipment: 'BODYWEIGHT', type: 'FLEXIBILITY', difficulty: 'BEGINNER', muscleGroups: ['Hamstrings', 'Calves', 'Shoulders'], instructions: 'Hands and feet on floor, push hips up forming inverted V. Press heels toward floor.' },
  { name: 'Pigeon Pose', category: 'FLEXIBILITY', equipment: 'BODYWEIGHT', type: 'FLEXIBILITY', difficulty: 'BEGINNER', muscleGroups: ['Hip Flexors', 'Glutes'], instructions: 'From push-up, bring one knee forward behind wrist. Extend other leg back. Hold and breathe.' },
  { name: 'Cat-Cow Stretch', category: 'FLEXIBILITY', equipment: 'BODYWEIGHT', type: 'FLEXIBILITY', difficulty: 'BEGINNER', muscleGroups: ['Spine', 'Core'], instructions: 'On all fours, alternate between arching back up (cat) and dropping belly down (cow).' },
  { name: 'Seated Forward Fold', category: 'FLEXIBILITY', equipment: 'BODYWEIGHT', type: 'FLEXIBILITY', difficulty: 'BEGINNER', muscleGroups: ['Hamstrings', 'Lower Back'], instructions: 'Sit with legs extended, reach forward toward toes keeping back flat. Hold the stretch.' },
];

const createTemplates = async (exerciseMap) => {
  const e = (name) => exerciseMap[name];

  const templates = [
    {
      name: 'Push Day',
      description: 'Chest, shoulders, and triceps. Classic push-pull-legs split.',
      category: 'STRENGTH',
      difficulty: 'INTERMEDIATE',
      estimatedMinutes: 55,
      tags: ['PPL', 'Chest', 'Shoulders', 'Triceps'],
      exercises: [
        { exerciseId: e('Barbell Bench Press'), sets: 4, reps: 8, restSeconds: 120, order: 1 },
        { exerciseId: e('Incline Dumbbell Press'), sets: 3, reps: 10, restSeconds: 90, order: 2 },
        { exerciseId: e('Dumbbell Shoulder Press'), sets: 3, reps: 10, restSeconds: 90, order: 3 },
        { exerciseId: e('Lateral Raises'), sets: 3, reps: 15, restSeconds: 60, order: 4 },
        { exerciseId: e('Tricep Pushdown'), sets: 3, reps: 12, restSeconds: 60, order: 5 },
        { exerciseId: e('Cable Flyes'), sets: 3, reps: 12, restSeconds: 60, order: 6 },
      ],
    },
    {
      name: 'Pull Day',
      description: 'Back and biceps. Builds a strong V-taper.',
      category: 'STRENGTH',
      difficulty: 'INTERMEDIATE',
      estimatedMinutes: 50,
      tags: ['PPL', 'Back', 'Biceps'],
      exercises: [
        { exerciseId: e('Barbell Deadlift'), sets: 3, reps: 5, restSeconds: 180, order: 1 },
        { exerciseId: e('Pull-Ups'), sets: 4, reps: 8, restSeconds: 120, order: 2 },
        { exerciseId: e('Barbell Bent-Over Row'), sets: 3, reps: 10, restSeconds: 90, order: 3 },
        { exerciseId: e('Seated Cable Row'), sets: 3, reps: 12, restSeconds: 90, order: 4 },
        { exerciseId: e('Face Pulls'), sets: 3, reps: 15, restSeconds: 60, order: 5 },
        { exerciseId: e('Barbell Curl'), sets: 3, reps: 10, restSeconds: 60, order: 6 },
      ],
    },
    {
      name: 'Leg Day',
      description: 'Quads, hamstrings, glutes, and calves.',
      category: 'STRENGTH',
      difficulty: 'INTERMEDIATE',
      estimatedMinutes: 60,
      tags: ['PPL', 'Legs', 'Glutes'],
      exercises: [
        { exerciseId: e('Barbell Back Squat'), sets: 4, reps: 8, restSeconds: 150, order: 1 },
        { exerciseId: e('Romanian Deadlift'), sets: 3, reps: 10, restSeconds: 120, order: 2 },
        { exerciseId: e('Leg Press'), sets: 3, reps: 12, restSeconds: 90, order: 3 },
        { exerciseId: e('Bulgarian Split Squat'), sets: 3, reps: 10, restSeconds: 90, order: 4 },
        { exerciseId: e('Leg Curl'), sets: 3, reps: 12, restSeconds: 60, order: 5 },
        { exerciseId: e('Calf Raises'), sets: 4, reps: 15, restSeconds: 60, order: 6 },
      ],
    },
    {
      name: 'Full Body Beginner',
      description: 'Perfect starting point. Covers all major muscle groups.',
      category: 'STRENGTH',
      difficulty: 'BEGINNER',
      estimatedMinutes: 40,
      tags: ['Beginner', 'Full Body'],
      exercises: [
        { exerciseId: e('Barbell Back Squat'), sets: 3, reps: 10, restSeconds: 120, order: 1 },
        { exerciseId: e('Barbell Bench Press'), sets: 3, reps: 10, restSeconds: 120, order: 2 },
        { exerciseId: e('Lat Pulldown'), sets: 3, reps: 10, restSeconds: 90, order: 3 },
        { exerciseId: e('Overhead Press'), sets: 3, reps: 10, restSeconds: 90, order: 4 },
        { exerciseId: e('Plank'), sets: 3, reps: 0, duration: 45, restSeconds: 60, order: 5 },
      ],
    },
    {
      name: 'HIIT Cardio Blast',
      description: '20-minute high intensity interval training. No equipment needed.',
      category: 'HIIT',
      difficulty: 'INTERMEDIATE',
      estimatedMinutes: 20,
      tags: ['HIIT', 'Cardio', 'No Equipment'],
      exercises: [
        { exerciseId: e('Burpees'), sets: 4, reps: 10, restSeconds: 30, order: 1 },
        { exerciseId: e('Mountain Climbers'), sets: 4, reps: 0, duration: 30, restSeconds: 15, order: 2 },
        { exerciseId: e('Jump Rope'), sets: 4, reps: 0, duration: 60, restSeconds: 30, order: 3 },
        { exerciseId: e('Push-Ups'), sets: 4, reps: 15, restSeconds: 30, order: 4 },
        { exerciseId: e('Plank'), sets: 3, reps: 0, duration: 45, restSeconds: 30, order: 5 },
      ],
    },
    {
      name: 'Flexibility & Recovery',
      description: 'Stretching and mobility work for rest days.',
      category: 'FLEXIBILITY',
      difficulty: 'BEGINNER',
      estimatedMinutes: 25,
      tags: ['Flexibility', 'Recovery', 'Yoga'],
      exercises: [
        { exerciseId: e('Cat-Cow Stretch'), sets: 1, reps: 0, duration: 60, restSeconds: 15, order: 1 },
        { exerciseId: e('Downward Dog'), sets: 1, reps: 0, duration: 45, restSeconds: 15, order: 2 },
        { exerciseId: e('Pigeon Pose'), sets: 1, reps: 0, duration: 45, restSeconds: 15, order: 3 },
        { exerciseId: e('Seated Forward Fold'), sets: 1, reps: 0, duration: 45, restSeconds: 15, order: 4 },
      ],
    },
    {
      name: 'Upper/Lower - Upper A',
      description: 'Heavy compound upper body. Part of upper/lower split.',
      category: 'STRENGTH',
      difficulty: 'ADVANCED',
      estimatedMinutes: 65,
      tags: ['Upper Lower', 'Advanced'],
      exercises: [
        { exerciseId: e('Barbell Bench Press'), sets: 5, reps: 5, restSeconds: 180, order: 1 },
        { exerciseId: e('Barbell Bent-Over Row'), sets: 4, reps: 6, restSeconds: 150, order: 2 },
        { exerciseId: e('Overhead Press'), sets: 4, reps: 6, restSeconds: 120, order: 3 },
        { exerciseId: e('Pull-Ups'), sets: 4, reps: 8, restSeconds: 120, order: 4 },
        { exerciseId: e('Dips'), sets: 3, reps: 10, restSeconds: 90, order: 5 },
        { exerciseId: e('Hammer Curls'), sets: 3, reps: 12, restSeconds: 60, order: 6 },
        { exerciseId: e('Skull Crushers'), sets: 3, reps: 12, restSeconds: 60, order: 7 },
      ],
    },
  ];

  return templates;
};

// ─── Run Seed ────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding exercises...');
  await Exercise.deleteMany({ createdBy: null }); // Only remove system exercises
  const insertedExercises = await Exercise.insertMany(exercises);
  console.log(`   ✅ ${insertedExercises.length} exercises created`);

  // Build name -> ID map
  const exerciseMap = {};
  insertedExercises.forEach(ex => { exerciseMap[ex.name] = ex._id; });

  console.log('🌱 Seeding workout templates...');
  await WorkoutTemplate.deleteMany({ createdBy: null });
  const templateData = await createTemplates(exerciseMap);
  const insertedTemplates = await WorkoutTemplate.insertMany(templateData);
  console.log(`   ✅ ${insertedTemplates.length} templates created`);

  console.log('\n🎉 Seed complete!');
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
