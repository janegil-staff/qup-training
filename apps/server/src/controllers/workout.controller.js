import WorkoutTemplate from '../models/WorkoutTemplate.js';
import WorkoutLog from '../models/WorkoutLog.js';
import User from '../models/User.js';

// ─── Templates ───────────────────────────────────────────────────────
export const getTemplates = async (req, res) => {
  try {
    const { category, difficulty, search, limit = 20, page = 1 } = req.query;
    const filter = { isPublic: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [templates, total] = await Promise.all([
      WorkoutTemplate.find(filter)
        .populate('exercises.exerciseId', 'name category equipment')
        .sort({ usedCount: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WorkoutTemplate.countDocuments(filter),
    ]);

    res.status(200).json({
      templates,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('GetTemplates error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await WorkoutTemplate.findById(req.params.id)
      .populate('exercises.exerciseId');
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await WorkoutTemplate.create({ ...req.body, createdBy: req.userId });
    res.status(201).json(template);
  } catch (error) {
    console.error('CreateTemplate error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Workout Logs ────────────────────────────────────────────────────
export const getLogs = async (req, res) => {
  try {
    const { limit = 20, page = 1, startDate, endDate } = req.query;
    const filter = { userId: req.userId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      WorkoutLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      WorkoutLog.countDocuments(filter),
    ]);

    res.status(200).json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('GetLogs error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLogById = async (req, res) => {
  try {
    const log = await WorkoutLog.findOne({ _id: req.params.id, userId: req.userId })
      .populate('exercises.exerciseId', 'name category instructions');
    if (!log) return res.status(404).json({ error: 'Workout log not found' });
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLog = async (req, res) => {
  try {
    const { name, startTime, endTime, durationMinutes, caloriesBurned, mood, notes, exercises, templateId, isPublic } = req.body;

    if (!name || !startTime || !exercises?.length) {
      return res.status(400).json({ error: 'Name, startTime, and exercises are required' });
    }

    const log = await WorkoutLog.create({
      userId: req.userId,
      templateId,
      name,
      startTime,
      endTime: endTime || new Date(),
      durationMinutes: durationMinutes || 0,
      caloriesBurned: caloriesBurned || 0,
      mood,
      notes,
      exercises,
      isPublic: isPublic || false,
    });

    // Update template used count
    if (templateId) {
      await WorkoutTemplate.findByIdAndUpdate(templateId, { $inc: { usedCount: 1 } });
    }

    // Update user streak
    const user = await User.findById(req.userId);
    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastWorkout = user.lastWorkoutDate ? new Date(user.lastWorkoutDate) : null;

      if (lastWorkout) {
        lastWorkout.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - lastWorkout) / 86400000);
        if (diffDays === 1) {
          user.streakCount += 1;
        } else if (diffDays > 1) {
          user.streakCount = 1;
        }
        // Same day = no change
      } else {
        user.streakCount = 1;
      }

      user.lastWorkoutDate = new Date();
      await user.save();
    }

    res.status(201).json(log);
  } catch (error) {
    console.error('CreateLog error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Stats ───────────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [weeklyLogs, monthlyLogs, totalLogs] = await Promise.all([
      WorkoutLog.find({ userId: req.userId, createdAt: { $gte: startOfWeek } }),
      WorkoutLog.find({ userId: req.userId, createdAt: { $gte: startOfMonth } }),
      WorkoutLog.countDocuments({ userId: req.userId }),
    ]);

    const weeklyWorkouts = weeklyLogs.length;
    const weeklyMinutes = weeklyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const weeklyCalories = weeklyLogs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);

    const monthlyWorkouts = monthlyLogs.length;
    const monthlyMinutes = monthlyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const monthlyCalories = monthlyLogs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);

    // Favorite category this month
    const categoryCounts = {};
    monthlyLogs.forEach(log => {
      log.exercises.forEach(ex => {
        const cat = ex.category || 'OTHER';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });
    const favoriteCategory = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a])[0] || null;

    res.status(200).json({
      weeklyWorkouts,
      weeklyMinutes,
      weeklyCalories,
      monthlyWorkouts,
      monthlyMinutes,
      monthlyCalories,
      totalWorkouts: totalLogs,
      favoriteCategory,
    });
  } catch (error) {
    console.error('GetStats error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
