import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Adjust these imports to match your project structure
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qup-training';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // ─── Create Review Account ─────────────────────────────────────
    const email = 'review@quptraining.com';
    const password = 'ReviewTest2026!';

    let reviewer = await User.findOne({ email });

    if (reviewer) {
      console.log('Review account already exists, updating password...');
      reviewer.password = await bcrypt.hash(password, 12);
      await reviewer.save();
    } else {
      reviewer = await User.create({
        firstName: 'Apple',
        lastName: 'Reviewer',
        email,
        password: await bcrypt.hash(password, 12),
      });
      console.log('Review account created');
    }

    // ─── Create Sample Challenges ──────────────────────────────────
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const challenges = [
      {
        name: '30-Day Push-Up Challenge',
        description: 'Complete 1000 push-ups in 30 days. Consistency is key!',
        type: 'WORKOUT_COUNT',
        target: 1000,
        unit: 'push-ups',
        startDate: now,
        endDate: in30Days,
        createdBy: reviewer._id,
        isPublic: true,
        participants: [
          { userId: reviewer._id, progress: 150 },
        ],
      },
      {
        name: 'Run 50K',
        description: 'Log 50 kilometers of running in two weeks. Any pace counts.',
        type: 'DISTANCE',
        target: 50,
        unit: 'km',
        startDate: now,
        endDate: in14Days,
        createdBy: reviewer._id,
        isPublic: true,
        participants: [
          { userId: reviewer._id, progress: 12 },
        ],
      },
      {
        name: '15 Gym Sessions',
        description: 'Hit the gym 15 times this month. No excuses.',
        type: 'WORKOUT_COUNT',
        target: 15,
        unit: 'sessions',
        startDate: now,
        endDate: in30Days,
        createdBy: reviewer._id,
        isPublic: true,
        participants: [
          { userId: reviewer._id, progress: 4 },
        ],
      },
    ];

    for (const data of challenges) {
      const exists = await Challenge.findOne({
        name: data.name,
        createdBy: reviewer._id,
      });

      if (!exists) {
        await Challenge.create(data);
        console.log(`Created challenge: ${data.name}`);
      } else {
        console.log(`Challenge already exists: ${data.name}`);
      }
    }

    console.log('\nSeed complete!');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
