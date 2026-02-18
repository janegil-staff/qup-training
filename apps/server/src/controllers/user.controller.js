import User from '../models/User.js';

// ─── Update Profile ──────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'bio', 'dateOfBirth', 'gender', 'height', 'weight', 'fitnessLevel', 'goals', 'avatar'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json(user.toPublic());
  } catch (error) {
    console.error('UpdateProfile error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Change Password ─────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (error) {
    console.error('ChangePassword error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Search Users ────────────────────────────────────────────────────
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.status(200).json([]);

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('firstName lastName avatar fitnessLevel followers')
      .limit(parseInt(limit));

    const enriched = users.map(u => ({
      ...u.toObject(),
      isFollowing: u.followers.includes(req.userId),
      followerCount: u.followers.length,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Delete Account ─────────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to delete account' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    // Delete all user data
    const mongoose = (await import('mongoose')).default;
    await Promise.all([
      mongoose.model('SocialPost').deleteMany({ userId: req.userId }),
      mongoose.model('WorkoutLog').deleteMany({ userId: req.userId }),
      mongoose.model('NutritionLog').deleteMany({ userId: req.userId }),
      mongoose.model('BodyStats').deleteMany({ userId: req.userId }),
      mongoose.model('Notification').deleteMany({ userId: req.userId }),
      // Remove from other users' followers/following
      User.updateMany({ followers: req.userId }, { $pull: { followers: req.userId } }),
      User.updateMany({ following: req.userId }, { $pull: { following: req.userId } }),
    ]);

    // Delete the user
    await User.findByIdAndDelete(req.userId);

    console.log(`🗑️ Account deleted: ${user.email}`);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('DeleteAccount error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
