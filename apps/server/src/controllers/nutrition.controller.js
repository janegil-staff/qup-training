import NutritionLog from '../models/NutritionLog.js';

// ─── Get by Date ─────────────────────────────────────────────────────
export const getByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    let log = await NutritionLog.findOne({ userId: req.userId, date });
    if (!log) {
      // Return empty structure for today
      log = { userId: req.userId, date, meals: [], waterMl: 0, dailyCalorieGoal: 2000, dailyProteinGoal: 150 };
    }

    res.status(200).json(log);
  } catch (error) {
    console.error('GetNutrition error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Log Meal ────────────────────────────────────────────────────────
export const logMeal = async (req, res) => {
  try {
    const { date, meal } = req.body;
    if (!meal?.name || !meal?.type) {
      return res.status(400).json({ error: 'Meal name and type are required' });
    }

    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);

    let log = await NutritionLog.findOne({ userId: req.userId, date: d });
    if (!log) {
      log = await NutritionLog.create({ userId: req.userId, date: d, meals: [meal] });
    } else {
      log.meals.push(meal);
      await log.save();
    }

    res.status(201).json(log);
  } catch (error) {
    console.error('LogMeal error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Update (water, goals, etc.) ─────────────────────────────────────
export const update = async (req, res) => {
  try {
    const { waterMl, dailyCalorieGoal, dailyProteinGoal } = req.body;

    const log = await NutritionLog.findOne({ _id: req.params.id, userId: req.userId });
    if (!log) return res.status(404).json({ error: 'Nutrition log not found' });

    if (waterMl !== undefined) log.waterMl = waterMl;
    if (dailyCalorieGoal !== undefined) log.dailyCalorieGoal = dailyCalorieGoal;
    if (dailyProteinGoal !== undefined) log.dailyProteinGoal = dailyProteinGoal;
    await log.save();

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Delete Meal ─────────────────────────────────────────────────────
export const deleteMeal = async (req, res) => {
  try {
    const log = await NutritionLog.findOne({ _id: req.params.id, userId: req.userId });
    if (!log) return res.status(404).json({ error: 'Nutrition log not found' });

    const mealIndex = parseInt(req.params.mealIndex);
    if (mealIndex < 0 || mealIndex >= log.meals.length) {
      return res.status(400).json({ error: 'Invalid meal index' });
    }

    log.meals.splice(mealIndex, 1);
    await log.save();

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Weekly Stats ────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const logs = await NutritionLog.find({
      userId: req.userId,
      date: { $gte: startOfWeek },
    }).sort({ date: 1 });

    const dailyData = logs.map(log => {
      const totals = log.meals.reduce((acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      return { date: log.date, ...totals, waterMl: log.waterMl, mealCount: log.meals.length };
    });

    const avgCalories = dailyData.length > 0
      ? Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / dailyData.length)
      : 0;
    const avgProtein = dailyData.length > 0
      ? Math.round(dailyData.reduce((s, d) => s + d.protein, 0) / dailyData.length)
      : 0;

    res.status(200).json({ dailyData, avgCalories, avgProtein, daysTracked: dailyData.length });
  } catch (error) {
    console.error('NutritionStats error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
