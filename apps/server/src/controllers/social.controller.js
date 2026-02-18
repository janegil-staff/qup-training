import SocialPost from "../models/SocialPost.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {
  notifyLike,
  notifyComment,
  notifyFollow,
} from "../services/push.service.js";

// ─── Feed ────────────────────────────────────────────────────────────
export const getFeed = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      SocialPost.find({})
        .populate("userId", "firstName lastName avatar")
        .populate("comments.userId", "firstName lastName")
        .populate(
          "workoutLogId",
          "name durationMinutes caloriesBurned exercises",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SocialPost.countDocuments({}),
    ]);

    res
      .status(200)
      .json({
        posts,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      });
  } catch (error) {
    console.error("GetFeed error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Create Post ─────────────────────────────────────────────────────
export const createPost = async (req, res) => {
  try {
    const { type, content, image, workoutLogId, challengeId } = req.body;
    if (!content && !image && !workoutLogId) {
      return res
        .status(400)
        .json({ error: "Post must have content, image, or linked workout" });
    }

    const post = await SocialPost.create({
      userId: req.userId,
      type: type || "TEXT",
      content,
      image,
      workoutLogId,
      challengeId,
    });

    const populated = await SocialPost.findById(post._id)
      .populate("userId", "firstName lastName avatar")
      .populate(
        "workoutLogId",
        "name durationMinutes caloriesBurned exercises",
      );

    // 🔴 Real-time: broadcast new post to everyone
    const io = req.app.get("io");
    if (io) io.except(`user:${req.userId}`).emit('post:new', populated);

    res.status(201).json(populated);
  } catch (error) {
    console.error("CreatePost error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Like / Unlike ───────────────────────────────────────────────────
export const likePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const idx = post.likes.indexOf(req.userId);
    const liked = idx === -1;

    if (liked) {
      post.likes.push(req.userId);
      if (post.userId.toString() !== req.userId) {
        const liker = await User.findById(req.userId, "firstName");
        await Notification.create({
          userId: post.userId,
          type: "LIKE",
          title: `${liker.firstName} liked your post`,
          data: { postId: post._id },
        });
        notifyLike(post.userId, liker.firstName);

        // 🔴 Real-time: notify post owner
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${post.userId}`).emit("notification:new", {
            type: "LIKE",
            title: `${liker.firstName} liked your post`,
          });
        }
      }
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();

    // 🔴 Real-time: broadcast like update to everyone
    const io = req.app.get("io");
    if (io)
      io.emit("post:liked", {
        postId: post._id,
        likes: post.likes.length,
        userId: req.userId,
        liked,
      });

    res.status(200).json({ likes: post.likes.length, liked });
  } catch (error) {
    console.error("LikePost error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Comment ─────────────────────────────────────────────────────────
export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ error: "Comment text required" });

    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ userId: req.userId, text: text.trim() });
    await post.save();

    if (post.userId.toString() !== req.userId) {
      const commenter = await User.findById(req.userId, "firstName");
      await Notification.create({
        userId: post.userId,
        type: "COMMENT",
        title: `${commenter.firstName} commented on your post`,
        body: text.trim().slice(0, 100),
        data: { postId: post._id },
      });
      notifyComment(post.userId, commenter.firstName, text.trim());

      // 🔴 Real-time: notify post owner
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${post.userId}`).emit("notification:new", {
          type: "COMMENT",
          title: `${commenter.firstName} commented on your post`,
        });
      }
    }

    const updated = await SocialPost.findById(post._id).populate(
      "comments.userId",
      "firstName lastName",
    );

    // 🔴 Real-time: broadcast new comment
    const io = req.app.get("io");
    if (io)
      io.emit("post:commented", {
        postId: post._id,
        comments: updated.comments,
      });

    res.status(200).json(updated.comments);
  } catch (error) {
    console.error("CommentPost error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Delete Post ─────────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!post)
      return res.status(404).json({ error: "Post not found or not yours" });

    // 🔴 Real-time: broadcast deletion
    const io = req.app.get("io");
    if (io) io.emit("post:deleted", { postId: req.params.id });

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Follow / Unfollow ───────────────────────────────────────────────
export const followUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId)
      return res.status(400).json({ error: "Cannot follow yourself" });

    const [user, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);
    if (!target) return res.status(404).json({ error: "User not found" });

    const isFollowing = user.following.includes(targetId);
    if (isFollowing) {
      user.following.pull(targetId);
      target.followers.pull(req.userId);
    } else {
      user.following.push(targetId);
      target.followers.push(req.userId);
      await Notification.create({
        userId: targetId,
        type: "FOLLOW",
        title: `${user.firstName} started following you`,
        data: { userId: req.userId },
      });
      notifyFollow(targetId, user.firstName);

      // 🔴 Real-time: notify followed user
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${targetId}`).emit("notification:new", {
          type: "FOLLOW",
          title: `${user.firstName} started following you`,
        });
      }
    }

    await Promise.all([user.save(), target.save()]);
    res
      .status(200)
      .json({
        following: !isFollowing,
        followerCount: target.followers.length,
      });
  } catch (error) {
    console.error("FollowUser error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── User Profile ────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken -stripeCustomerId",
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await SocialPost.find({ userId: req.params.id })
      .populate("userId", "firstName lastName avatar")
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
    res.status(500).json({ error: "Internal server error" });
  }
};
