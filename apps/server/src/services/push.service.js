import User from '../models/User.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification to a single user
 */
export const sendPushToUser = async (userId, { title, body, data = {} }) => {
  try {
    const user = await User.findById(userId).select('expoPushToken');
    if (!user?.expoPushToken) return false;

    return await sendPushNotification({
      to: user.expoPushToken,
      title,
      body,
      data,
    });
  } catch (e) {
    console.error('sendPushToUser error:', e.message);
    return false;
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushToUsers = async (userIds, { title, body, data = {} }) => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      expoPushToken: { $exists: true, $ne: null },
    }).select('expoPushToken');

    if (users.length === 0) return;

    const messages = users.map(user => ({
      to: user.expoPushToken,
      title,
      body,
      data,
      sound: 'default',
    }));

    // Expo accepts batches of up to 100
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      });
    }

    console.log(`Push sent to ${users.length} users`);
  } catch (e) {
    console.error('sendPushToUsers error:', e.message);
  }
};

/**
 * Send a single push notification via Expo Push API
 */
const sendPushNotification = async ({ to, title, body, data = {} }) => {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await response.json();
    if (result.data?.[0]?.status === 'error') {
      console.error('Push error:', result.data[0].message);
      // If device not registered, clean up token
      if (result.data[0].details?.error === 'DeviceNotRegistered') {
        await User.findOneAndUpdate({ expoPushToken: to }, { expoPushToken: null });
        console.log('Removed invalid push token');
      }
      return false;
    }

    return true;
  } catch (e) {
    console.error('Push notification error:', e.message);
    return false;
  }
};

// ─── Notification Helpers ────────────────────────────────────────────

export const notifyLike = (postOwnerId, likerName) =>
  sendPushToUser(postOwnerId, {
    title: '❤️ New Like',
    body: `${likerName} liked your post`,
    data: { type: 'SOCIAL_LIKE' },
  });

export const notifyComment = (postOwnerId, commenterName, preview) =>
  sendPushToUser(postOwnerId, {
    title: '💬 New Comment',
    body: `${commenterName}: ${preview.substring(0, 80)}`,
    data: { type: 'SOCIAL_COMMENT' },
  });

export const notifyFollow = (followedId, followerName) =>
  sendPushToUser(followedId, {
    title: '👋 New Follower',
    body: `${followerName} started following you`,
    data: { type: 'NEW_FOLLOWER' },
  });

export const notifyWorkoutReminder = (userId) =>
  sendPushToUser(userId, {
    title: '💪 Time to Train!',
    body: "Don't break your streak! Start a workout today.",
    data: { type: 'WORKOUT_REMINDER' },
  });

export const notifyStreakAlert = (userId, streakCount) =>
  sendPushToUser(userId, {
    title: '🔥 Streak Alert',
    body: `You're on a ${streakCount} day streak! Keep it going!`,
    data: { type: 'STREAK_ALERT' },
  });

export const notifyChallengeUpdate = (userId, challengeName, message) =>
  sendPushToUser(userId, {
    title: `🏆 ${challengeName}`,
    body: message,
    data: { type: 'CHALLENGE_UPDATE' },
  });
