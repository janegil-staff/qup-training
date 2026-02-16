import BodyStats from '../models/BodyStats.js';

// ─── Get All (history) ───────────────────────────────────────────────
export const getAll = async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const stats = await BodyStats.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(parseInt(limit));
    res.status(200).json(stats);
  } catch (error) {
    console.error('GetBodyStats error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Get Latest ──────────────────────────────────────────────────────
export const getLatest = async (req, res) => {
  try {
    const latest = await BodyStats.findOne({ userId: req.userId }).sort({ date: -1 });
    if (!latest) return res.status(200).json(null);
    res.status(200).json(latest);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Create ──────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const { date, weight, bodyFat, measurements, progressPhoto, notes } = req.body;

    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);

    // Upsert — one entry per day
    const existing = await BodyStats.findOne({ userId: req.userId, date: d });
    if (existing) {
      if (weight !== undefined) existing.weight = weight;
      if (bodyFat !== undefined) existing.bodyFat = bodyFat;
      if (measurements) existing.measurements = { ...existing.measurements?.toObject?.() || {}, ...measurements };
      if (progressPhoto) existing.progressPhoto = { ...existing.progressPhoto?.toObject?.() || {}, ...progressPhoto };
      if (notes !== undefined) existing.notes = notes;
      await existing.save();
      return res.status(200).json(existing);
    }

    const stat = await BodyStats.create({
      userId: req.userId, date: d, weight, bodyFat, measurements, progressPhoto, notes,
    });

    // Update user weight if provided
    if (weight) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(req.userId, { 'weight.value': weight });
    }

    res.status(201).json(stat);
  } catch (error) {
    console.error('CreateBodyStats error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Delete ──────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const stat = await BodyStats.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!stat) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
