import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ─── Register Push Token ─────────────────────────────────────────────
export const registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    await User.findByIdAndUpdate(req.userId, { expoPushToken: token });
    res.status(200).json({ message: 'Push token registered' });
  } catch (error) {
    console.error('RegisterPushToken error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Get All ─────────────────────────────────────────────────────────
export const getAll = async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('GetNotifications error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Mark All Read ───────────────────────────────────────────────────
export const readAll = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.status(200).json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Mark Single Read ────────────────────────────────────────────────
export const readOne = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
    );
    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Delete ──────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
