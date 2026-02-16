import Exercise from '../models/Exercise.js';

export const getAll = async (req, res) => {
  try {
    const { category, equipment, difficulty, type, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (equipment) filter.equipment = equipment;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [exercises, total] = await Promise.all([
      Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Exercise.countDocuments(filter),
    ]);

    res.status(200).json({
      exercises,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('GetExercises error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.status(200).json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const create = async (req, res) => {
  try {
    const exercise = await Exercise.create({ ...req.body, createdBy: req.userId });
    res.status(201).json(exercise);
  } catch (error) {
    console.error('CreateExercise error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
