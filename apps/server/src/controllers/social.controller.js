import SocialPost from '../models/SocialPost.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// ─── Feed ────────────────────────────────────────────────────────────
export const getFeed = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const user = await User.findById(req.userId);
    const followingIds = [...(user?.following || []), req.userId];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      SocialPost.find({ $or: [{ userId: { $in: followingIds } }, { isPublic: true }] })
        .populate('userId', 'firstName lastName avatar')
        .populate('comments.userId', 'firstName lastName')
        .populate('workoutLogId', 'name durationMinutes caloriesBurned exercises')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SocialPost.countDocuments({ $or: [{ userId: { $in: followingIds } }, { isPublic: true }] }),
    ]);

    res.status(200).json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('GetFeed error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Create Post ─────────────────────────────────────────────────────
export const createPost = async (req, res) => {
  try {
    const { type, content, image, workoutLogId, challengeId } = req.body;
    if (!content && !image && !workoutLogId) {
      return res.status(400).json({ error: 'Post must have content, image, or linked workout' });
    }

    const post = await SocialPost.create({
      userId: req.userId, type: type || 'TEXT', content, image, workoutLogId, challengeId,
    });

    const populated = await SocialPost.findById(post._id)
      .populate('userId', 'firstName lastName avatar')
      .populate('workoutLogId', 'name durationMinutes caloriesBurned exercises');

    res.status(201).json(populated);
  } catch (error) {
    console.error('CreatePost error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Like / Unlike ───────────────────────────────────────────────────
export const likePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const idx = post.likes.indexOf(req.userId);
    if (idx > -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(req.userId);
      // Notify post owner
      if (post.userId.toString() !== req.userId) {
        const liker = await User.findById(req.userId, 'firstName');
        await Notification.create({
          userId: post.userId, type: 'LIKE',
          title: `${liker.firstName} liked your post`,
          data: { postId: post._id },
        });
      }
    }
    await post.save();

    res.status(200).json({ likes: post.likes.length, liked: idx === -1 });
  } catch (error) {
    console.error('LikePost error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Comment ─────────────────────────────────────────────────────────
export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });

    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ userId: req.userId, text: text.trim() });
    await post.save();

    // Notify post owner
    if (post.userId.toString() !== req.userId) {
      const commenter = await User.findById(req.userId, 'firstName');
      await Notification.create({
        userId: post.userId, type: 'COMMENT',
        title: `${commenter.firstName} commented on your post`,
        body: text.trim().slice(0, 100),
        data: { postId: post._id },
      });
    }

    const updated = await SocialPost.findById(post._id)
      .populate('comments.userId', 'firstName lastName');

    res.status(200).json(updated.comments);
  } catch (error) {
    console.error('CommentPost error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Delete Post ─────────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!post) return res.status(404).json({ error: 'Post not found or not yours' });
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Follow / Unfollow ───────────────────────────────────────────────
export const followUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) return res.status(400).json({ error: 'Cannot follow yourself' });

    const [user, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const isFollowing = user.following.includes(targetId);
    if (isFollowing) {
      user.following.pull(targetId);
      target.followers.pull(req.userId);
    } else {
      user.following.push(targetId);
      target.followers.push(req.userId);
      await Notification.create({
        userId: targetId, type: 'FOLLOW',
        title: `${user.firstName} started following you`,
        data: { userId: req.userId },
      });
    }

    await Promise.all([user.save(), target.save()]);

    res.status(200).json({ following: !isFollowing, followerCount: target.followers.length });
  } catch (error) {
    console.error('FollowUser error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── User Profile ────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -stripeCustomerId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const posts = await SocialPost.find({ userId: req.params.id })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const isFollowing = user.followers.includes(req.userId);

    res.status(200).json({
      user: user.toObject(),
      posts,
      isFollowing,
      followerCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
